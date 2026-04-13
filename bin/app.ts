#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppSyncTodoStack } from '../lib/appsync-stack';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = new cdk.App();

// Check if we're running with LocalStack
const isLocalStack = process.env.USE_LOCALSTACK === 'true';

const stackProps: cdk.StackProps = {
  env: {
    account: isLocalStack ? '000000000000' : process.env.CDK_DEFAULT_ACCOUNT,
    region: isLocalStack ? 'us-east-1' : (process.env.CDK_DEFAULT_REGION || 'us-east-1')
  }
};

new AppSyncTodoStack(app, 'AppSyncTodoStack', stackProps);
