import { App, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { AuroraServerlessTemporalDatastore, TemporalCluster, TemporalVersion } from 'temporalio-cluster-cdk';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { PrivateDnsNamespace } from 'aws-cdk-lib/aws-servicediscovery';
import { AuroraMysqlEngineVersion, DatabaseClusterEngine } from 'aws-cdk-lib/aws-rds';
import { Cluster } from 'aws-cdk-lib/aws-ecs';
import { aws_ec2 } from 'aws-cdk-lib';
import { aws_ecs } from 'aws-cdk-lib';
import { Construct } from 'constructs';

const app = new App();

const stack = new Stack(app, 'MyTemporalClusterStack', {
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
    },
});

// const vpc = new Vpc(stack, 'Vpc', {
//     maxAzs: 2,
//     natGateways: 1,
// });

// const vpc = aws_ec2.Vpc.fromVpcAttributes(stack, "vpc-07f674e20fb1fbca6", {})
const vpc = aws_ec2.Vpc.fromLookup(stack, "vpc-07f674e20fb1fbca6", {vpcId: "vpc-07f674e20fb1fbca6"})
console.log(vpc.publicSubnets)
console.log(vpc.isolatedSubnets)
console.log(vpc.privateSubnets)
// const sg1 = aws_ec2.Subnet.fromSubnetId(stack, "subnet-0f4a584ee207fa930", "subnet-0f4a584ee207fa930")
// const sg2 = aws_ec2.Subnet.fromSubnetId(stack, "subnet-0df4a6a90d4330946", "subnet-0df4a6a90d4330946")

const cloudMapNamespace = new PrivateDnsNamespace(stack, 'CloudMapNamespace', {
    name: 'privatesvc',
    vpc: vpc,
});

const datastore = new AuroraServerlessTemporalDatastore(stack, 'Datastore', {
    engine: DatabaseClusterEngine.auroraMysql({ version: AuroraMysqlEngineVersion.VER_2_10_1 }),
    vpc,
    removalPolicy: RemovalPolicy.DESTROY,
});

// const ecsCluster = new Cluster(stack, 'EcsCluster', {
//     vpc: vpc,
//     enableFargateCapacityProviders: true,
//     containerInsights: true,
// });

const ecsCluster = aws_ecs.Cluster.fromClusterAttributes(stack, "amalada275-produa70a0", {
    clusterName: "amalada275-produa70a0",
    vpc: vpc,
    securityGroups: []
})

new TemporalCluster(stack, 'TemporalCluster', {
    vpc,
    datastore,
    ecsCluster,
    temporalVersion: TemporalVersion.V1_15_2,
    cloudMapRegistration: {
        namespace: cloudMapNamespace,
        serviceName: 'temporal',
    },
    removalPolicy: RemovalPolicy.DESTROY,
});

app.synth();
