// cdk/lib/cdk-stack.ts

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';

export class SimulationEngineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'SimEngineVPC', { 
    maxAzs: 2, 
    natGateways: 1, 
});

    const albSg = new ec2.SecurityGroup(this, 'AlbSg', { vpc, allowAllOutbound: true });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP from anywhere');

    const ecsSg = new ec2.SecurityGroup(this, 'EcsSg', { vpc, allowAllOutbound: true });
    ecsSg.connections.allowFrom(albSg, ec2.Port.tcp(8000), 'Allow traffic from ALB');

    const redisSg = new ec2.SecurityGroup(this, 'RedisSg', { vpc, allowAllOutbound: true });
    redisSg.connections.allowFrom(ecsSg, ec2.Port.tcp(6379), 'Allow traffic from ECS');

    const dbSg = new ec2.SecurityGroup(this, 'DbSg', { vpc, allowAllOutbound: true });
    dbSg.connections.allowFrom(ecsSg, ec2.Port.tcp(5432), 'Allow traffic from ECS');

    const cluster = new ecs.Cluster(this, 'SimEngineCluster', { vpc });

    const apiRepo = ecr.Repository.fromRepositoryName(this, 'ApiRepo', 'vectorialasync-api');

    const taskRole = new iam.Role(this, 'EcsTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    const apiSecrets = secretsmanager.Secret.fromSecretNameV2(this, 'ApiSecrets', 'SimulationEngineAPIKeys');
    apiSecrets.grantRead(taskRole);

    const dbCredentialsSecret = new secretsmanager.Secret(this, 'DBCredentialsSecret', {
        generateSecretString: {
            secretStringTemplate: JSON.stringify({
                username: 'sim_user',
                dbClusterIdentifier: 'simdb', 
                host: '', 
                port: 5432,
                dbname: 'simdb'
            }),
            generateStringKey: 'password',
            excludePunctuation: true,
            includeSpace: false,
        },
    });
    dbCredentialsSecret.grantRead(taskRole);

    const dbInstance = new rds.DatabaseInstance(this, 'PostgresDB', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_13 }),
      instanceType: new ec2.InstanceType('t3.micro'),
      vpc,
      databaseName: 'simdb',
      credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
      securityGroups: [dbSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
        description: 'Subnet group for Redis',
        subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
    });
    const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
        cacheNodeType: 'cache.t3.micro',
        engine: 'redis',
        numCacheNodes: 1,
        vpcSecurityGroupIds: [redisSg.securityGroupId],
        cacheSubnetGroupName: redisSubnetGroup.ref,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'SimEngineTaskDef', {
      memoryLimitMiB: 2048,
      cpu: 1024,
      taskRole,
    });
    const apiImage = ecs.ContainerImage.fromEcrRepository(apiRepo, "latest");
    
    const sharedEnvironment = {
        CELERY_BROKER_URL: `redis://${redisCluster.attrRedisEndpointAddress}:${redisCluster.attrRedisEndpointPort}/0`,
        CELERY_RESULT_BACKEND: `redis://${redisCluster.attrRedisEndpointAddress}:${redisCluster.attrRedisEndpointPort}/0`,
        DB_SECRET_ARN: dbCredentialsSecret.secretArn,
        DB_HOST: dbInstance.dbInstanceEndpointAddress,
        AWS_REGION: this.region,
    };

    taskDefinition.addContainer('ApiContainer', {
        image: apiImage,
        command: ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:8000"],
        logging: new ecs.AwsLogDriver({ streamPrefix: 'SimEngineApi', logRetention: logs.RetentionDays.ONE_WEEK }),
        environment: sharedEnvironment,
        secrets: {
            OPENAI_API_KEY: ecs.Secret.fromSecretsManager(apiSecrets, 'OPENAI_API_KEY'),
            ANTHROPIC_API_KEY: ecs.Secret.fromSecretsManager(apiSecrets, 'ANTHROPIC_API_KEY'),
        },
    }).addPortMappings({ containerPort: 8000 });

    taskDefinition.addContainer('WorkerContainer', {
        image: apiImage,
        command: ["celery", "-A", "worker.celery_app", "worker", "--loglevel=info"],
        logging: new ecs.AwsLogDriver({ streamPrefix: 'SimEngineWorker', logRetention: logs.RetentionDays.ONE_WEEK }),
        environment: sharedEnvironment,
        secrets: {
            OPENAI_API_KEY: ecs.Secret.fromSecretsManager(apiSecrets, 'OPENAI_API_KEY'),
            ANTHROPIC_API_KEY: ecs.Secret.fromSecretsManager(apiSecrets, 'ANTHROPIC_API_KEY'),
        },
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', { vpc, internetFacing: true, securityGroup: albSg });
    const listener = alb.addListener('Listener', { port: 80 });
    const apiService = new ecs.FargateService(this, 'ApiService', {
        cluster, taskDefinition, desiredCount: 1, securityGroups: [ecsSg], vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });
    listener.addTargets('ECSTarget', { port: 8000, targets: [apiService.loadBalancerTarget({ containerName: 'ApiContainer' })] });
    new ecs.FargateService(this, 'WorkerService', {
        cluster, taskDefinition, desiredCount: 1, securityGroups: [ecsSg], vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI');
    frontendBucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: { 
        origin: new origins.S3Origin(frontendBucket, { originAccessIdentity }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
    });
    new s3deploy.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3deploy.Source.asset('../frontend/dist')],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ALB_DNS_NAME', { value: alb.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'CloudFrontURL', { value: `https://${distribution.distributionDomainName}` });
    new cdk.CfnOutput(this, 'S3BucketName', { value: frontendBucket.bucketName });
    new cdk.CfnOutput(this, 'EcsClusterName', { value: cluster.clusterName });
    new cdk.CfnOutput(this, 'EcsApiServiceArn', { value: apiService.serviceArn });
  }
}