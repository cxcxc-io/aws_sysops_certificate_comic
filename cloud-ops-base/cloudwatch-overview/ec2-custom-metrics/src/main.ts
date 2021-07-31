import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import { App, Construct, Stack, StackProps, CfnOutput, CfnParameter } from '@aws-cdk/core';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const vpc = new CfnParameter(this, 'vpcId', {
      description: 'Please Input your default Vpc Id in this region',
    });
    const subnetId = new CfnParameter(this, 'subnetId', {
      description: 'Please Input your default VPC Public Subnet in this region',
    });
    const defVpc = ec2.Vpc.fromLookup(this, 'defVpc', {
      isDefault: true,
    });
    const securityGroup = new ec2.SecurityGroup(this, 'instanceSG', {
      vpc: defVpc,
    });
    const userData = ec2.UserData.forLinux();
    userData.addCommands('mkdir -p $(dirname \'/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json\') && wget https://raw.githubusercontent.com/cxcxc-io/aws_sysops_certificate_comic/master/cloud-ops-base/cloudwatch-overview/amazon-cloudwatch-agent.json --directory-prefix=/opt/aws/amazon-cloudwatch-agent/etc && yum install -y amazon-cloudwatch-agent && systemctl start amazon-cloudwatch-agent && systemctl enable amazon-cloudwatch-agent');
    const demoServer = new ec2.Instance(this, 'DemoServer', {
      instanceType: new ec2.InstanceType('t2.micro'),
      instanceName: 'DemoServer',
      machineImage: ec2.MachineImage.latestAmazonLinux({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
      vpc: defVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      userData,
      securityGroup,
    });
    demoServer.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    demoServer.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'));
    demoServer.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'));
    const demos = demoServer.node.tryFindChild('Resource') as ec2.CfnInstance;
    const cfnsecurityGroup = securityGroup.node.defaultChild as ec2.CfnSecurityGroup;
    demos.addPropertyDeletionOverride('AvailabilityZone');
    demos.addOverride('Properties.SubnetId', subnetId.value.toString());
    cfnsecurityGroup.addOverride('Properties.VpcId', vpc.value.toString());
    new CfnOutput(this, 'demoServer', {
      value: demoServer.instanceId,
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'demo-stack', { env: devEnv });

app.synth();