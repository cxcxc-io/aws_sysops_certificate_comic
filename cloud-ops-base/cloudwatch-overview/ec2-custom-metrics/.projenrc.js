const { AwsCdkTypeScriptApp } = require('projen');
const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.116.0',
  defaultReleaseBranch: 'main',
  name: 'ec2-custom-metrics',
  cdkDependencies: [
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-s3-assets',
  ],
  gitignore: ['cdk.context.json'],
});
project.synth();