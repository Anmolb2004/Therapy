// infrastructure/lib/infrastructure-stack.ts

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// --- THESE IMPORT LINES ARE NOW CORRECTED FOR CDK v2 ---
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
// --- END OF CORRECTION ---
import { readFileSync } from 'fs';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'SimulationEngineVPC', {
      maxAzs: 2,
      subnetConfiguration: [{
        cidrMask: 24,
        name: 'Public',
        subnetType: ec2.SubnetType.PUBLIC,
      }],
    });

    const securityGroup = new ec2.SecurityGroup(this, 'SimulationEngineSG', {
      vpc,
      description: 'Allow HTTP, HTTPS, and SSH access',
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');

    const role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    
    // Grant permission to read the secret from Secrets Manager
    const secret = cdk.aws_secretsmanager.Secret.fromSecretNameV2(this, 'ImportedSecret', 'SimulationEngineAPIKeys');
    secret.grantRead(role);

    const instance = new ec2.Instance(this, 'SimulationEngineInstance', {
      vpc,
      instanceType: new ec2.InstanceType('t2.micro'),
      // The CDK is smart enough to find the latest Amazon Linux 2023 image
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup,
      role,
      keyName: 'sim-engine-key',
    });

    const userDataScript = readFileSync('./user-data.sh', 'utf8');
    instance.addUserData(userDataScript);

    new cdk.CfnOutput(this, 'PublicIpAddress', {
      value: instance.instancePublicIp,
      description: 'The public IP address of the EC2 instance',
    });
  }
}