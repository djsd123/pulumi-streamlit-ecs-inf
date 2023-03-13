import { acm, lb } from '@pulumi/aws'

import { loggingBucket } from './s3'
import { loadBalancerSecurityGroupId } from './security-groups'
import { commonTags, config } from './variables'
import { vpc } from './vpc'


export const loadbalancer = new lb.LoadBalancer('loadbalancer', {
    namePrefix: `${config.appName.substring(0, 5)}-`, // "name_prefix" cannot be longer than 6 characters
    loadBalancerType: 'application',
    securityGroups: [loadBalancerSecurityGroupId],
    enableCrossZoneLoadBalancing: true,
    internal: false,
    subnets: vpc.publicSubnetIds,

    accessLogs: {
        bucket: loggingBucket.id,
        prefix: config.appName,
        enabled: true,
    },

    tags: commonTags,
})

export const targetGroup = new lb.TargetGroup('target-group', {
    targetType: 'ip', // Because ecs.TaskDefinition({ networkMode: 'awsvpc',})
    port: config.streamlitPort,
    protocol: 'HTTP',
    vpcId: vpc.vpcId,

    stickiness: {
        type: 'lb_cookie',
        enabled: true,
        cookieDuration: 86400,
    },

    healthCheck: {
        enabled: true,
        protocol: 'HTTP',
        path: '/',
        port: String(config.streamlitPort),
        interval: 30,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
    },

    tags: commonTags,
}, { dependsOn: loadbalancer })

new lb.Listener('listener-http', {
    loadBalancerArn: loadbalancer.arn,
    port: 80,
    protocol: 'HTTP',

    defaultActions: [
        {
            type: 'redirect',

            redirect: {
                port: '443',
                protocol: 'HTTPS',
                statusCode: 'HTTP_301',
            },
        },
    ],
})

acm.getCertificate({
    domain: `www.${config.domainName}`,
    mostRecent: true,
    statuses: ['ISSUED'],
}).then((acmCert) => {
    new lb.Listener('listener-https', {
        loadBalancerArn: loadbalancer.arn,
        port: 443,
        protocol: 'HTTPS',
        sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
        certificateArn: acmCert.arn,

        defaultActions: [
            {
                type: 'forward',
                targetGroupArn: targetGroup.arn,
            },
        ],
    })
})
