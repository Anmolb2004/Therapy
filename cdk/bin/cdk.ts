import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SimulationEngineStack } from '../lib/cdk-stack';

const app = new cdk.App();
new SimulationEngineStack(app, 'SimulationEngineStack', {
});