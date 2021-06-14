import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apiv2 from '@aws-cdk/aws-apigatewayv2';
import * as apiv2ing from '@aws-cdk/aws-apigatewayv2-integrations';

export class DemoCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // s3 的部分宣導完成，先來部署看看。
    const mybucket = new s3.Bucket(this, 'mycdk-bucket', {
      bucketName: 'mycdk-bucket-20210614-demo',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 這樣我們的lambda function 就宣告完成了，再來我們來創建 apigateway 來做一個簡單的 api.
    const func = new lambda.Function(this, 'initFun', {
      code: lambda.InlineCode.fromInline(`
import os
bucket = os.getenv('S3_BUCKET')
def handler(event, context):
    return f'Hello initline Python Lambda, bucket name is {bucket}'`),
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.handler',
      environment: { S3_BUCKET: mybucket.bucketName },
    });
    new cdk.CfnOutput(this, 'bucketname', {
      value: mybucket.bucketName,
    });

    // 來創建我們的 api gateway 。
    // 先 new 一個 HTTP API。
    const httpApi = new apiv2.HttpApi(this, 'httpApi');

    // 再來增加 route , path 為 '/api'。
    httpApi.addRoutes({
      path: '/api',
      methods: [apiv2.HttpMethod.ANY],
      integration: new apiv2ing.LambdaProxyIntegration({ handler: func }),
    });

    new cdk.CfnOutput(this, 'api-url', {
      value: `curl ${httpApi.apiEndpoint}/api`,
    });
  }
}
