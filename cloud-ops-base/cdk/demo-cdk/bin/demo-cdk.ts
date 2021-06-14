#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DemoCdkStack } from '../lib/demo-cdk-stack';

const app = new cdk.App();
// dev in ap-northeast-2
new DemoCdkStack(app, 'DemoCdkStack', {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'ap-northeast-2',
    }
});

// production in ap-northeast-1
// new DemoCdkStack(app, 'DemoCdkStackProd', {
//     env: {
//       account: process.env.CDK_DEFAULT_ACCOUNT,
//       region: 'ap-northeast-1',
//     }
// });
