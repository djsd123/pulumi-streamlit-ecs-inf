import { ec2 } from '@pulumi/aws'

import { commonTags, config } from './variables'
import { vpc } from './vpc'

const anyLocationCidr = '0.0.0.0/0'

export const loadBalancerSecurityGroupId = new ec2.SecurityGroup('loadbalancer-security-group', {
    name: `loadbalancer-${config.appName}`,
    description: 'Loadbalancer internet access',
    vpcId: vpc.vpcId,
    tags: commonTags,
}).id

new ec2.SecurityGroupRule('https', {
    type: 'ingress',
    fromPort: 443,
    toPort: 443,
    protocol: 'tcp',
    cidrBlocks: [anyLocationCidr],
    securityGroupId: loadBalancerSecurityGroupId,
    description: 'Inbound internet TLS access'
})

new ec2.SecurityGroupRule('http', {
    type: 'ingress',
    fromPort: 80,
    toPort: 80,
    protocol: 'tcp',
    cidrBlocks: [anyLocationCidr],
    securityGroupId: loadBalancerSecurityGroupId,
    description: 'Inbound internet http access',
})

new ec2.SecurityGroupRule('loadbalancer-egress', {
    type: 'egress',
    fromPort: 0,
    toPort: 65535,
    protocol: '-1',
    cidrBlocks: [anyLocationCidr],
    securityGroupId: loadBalancerSecurityGroupId,
    description: 'Egress for loadbalancer security group',
})

export const ecsSecurityGroupId = new ec2.SecurityGroup('ecs-security-group', {
    name: `ecs-${config.appName}`,
    description: 'ECS network access',
    vpcId: vpc.vpcId,
    tags: commonTags,
}).id

new ec2.SecurityGroupRule('streamlit-8501', {
    type: 'ingress',
    fromPort: 8501,
    toPort: 8501,
    protocol: 'tcp',
    sourceSecurityGroupId: loadBalancerSecurityGroupId,
    securityGroupId: ecsSecurityGroupId,
    description: 'Inbound from loadbalancer security group',
})

new ec2.SecurityGroupRule('ecs-egress', {
    type: 'egress',
    fromPort: 0,
    toPort: 65535,
    protocol: '-1',
    cidrBlocks: [anyLocationCidr],
    securityGroupId: ecsSecurityGroupId,
    description: 'Egress for ECS security group',
})
