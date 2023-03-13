import * as pulumi from '@pulumi/pulumi'
import { ec2 } from '@pulumi/aws'
import { ec2 as ec2x } from '@pulumi/awsx'

import { loadBalancerSecurityGroupId } from './security-groups'
import { commonTags } from './variables'

export const vpc = new ec2x.Vpc('vpc', {
    cidrBlock: '10.0.0.0/16',
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: commonTags,
})

// ECS Privatelink: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/vpc-endpoints.html

new Map([
    ['ecs-agent', 'Interface'],
    ['ecs-telemetry', 'Interface'],
    ['ecs', 'Interface'],
    ['ec2messages', 'Interface'],
    ['ssm', 'Interface'],
    ['ssmmessages', 'Interface'],
    ['logs', 'Interface'],
    ['s3', 'Gateway'],
]).forEach((serviceType: string, serviceName: string) => {

    pulumi.output(ec2.getVpcEndpointService({
        service: serviceName,
        serviceType: serviceType,
    })).apply((service) => {
        new ec2.VpcEndpoint(`${serviceName}-endpoint`, {
            serviceName: service.serviceName,
            vpcId: vpc.vpcId,
            vpcEndpointType: serviceType,
            securityGroupIds: serviceType === 'Interface' ? [loadBalancerSecurityGroupId] : undefined,
            subnetIds: serviceType === 'Interface'
            || serviceType === 'GatewayLoadBalancer'
                ? vpc.privateSubnetIds : undefined
        })
    })
})
