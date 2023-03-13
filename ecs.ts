import * as pulumi from '@pulumi/pulumi'
import { ecs } from '@pulumi/aws'

import { logGroup } from './cloudwatch'
import { image } from './ecr'
import { ecsTaskExecutionRole } from './iam'
import { loadbalancer, targetGroup } from './lb'
import { loggingBucket } from './s3'
import { ecsSecurityGroupId } from './security-groups'
import { commonTags, config } from './variables'
import { vpc } from './vpc';

const cluster = new ecs.Cluster('cluster', {
    name: config.appName,

    settings: [
        {
            name: 'containerInsights',
            value: 'enabled',
        }
    ],

    configuration: {
        executeCommandConfiguration: {
            logging: 'OVERRIDE',
            logConfiguration: {
                cloudWatchEncryptionEnabled: true,
                cloudWatchLogGroupName: logGroup.name,
                s3BucketEncryptionEnabled: true,
                s3BucketName: loggingBucket.id,
                s3KeyPrefix: `${config.appName}-`,
            },
        }
    }
})

new ecs.ClusterCapacityProviders('cluster-capacity-provider', {
    clusterName: cluster.name,
    capacityProviders: ['FARGATE'],
    defaultCapacityProviderStrategies: [
        {
            base: 1,
            weight: 100,
            capacityProvider: 'FARGATE',
        }
    ]
})

pulumi.all([image]).apply(([image])=> {

    // See: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html
    const taskDefinition = new ecs.TaskDefinition('task-definition', {
        family: config.appName,
        networkMode: 'awsvpc',
        executionRoleArn: ecsTaskExecutionRole.arn,
        requiresCompatibilities: ['FARGATE'],

        runtimePlatform: {
            cpuArchitecture: 'X86_64',
            operatingSystemFamily: 'LINUX',
        },

        // Because launch type is Fargate
        cpu: '1 vCPU',
        memory: '2 GB',
        // Because launch type is Fargate

        containerDefinitions: JSON.stringify([
            {
                name: config.appName,
                image: image.repositoryUrl,
                cpu: 1024,
                memory: 2048,
                memoryReservation: 512,
                essential: true,

                logConfiguration: {
                    logDriver: 'awslogs',
                    options: {
                        'awslogs-group': `/aws/ecs/${config.appName}`,
                        'awslogs-region': config.region,
                        'awslogs-stream-prefix': 'ecs',
                    },
                },

                PortMappings: [
                    {
                        name: config.appName,
                        containerPort: config.streamlitPort,
                        hostPort: config.streamlitPort,
                        appProtocol: 'http',
                    }
                ],

                environment: [
                    { name: 'Name', value: config.appName },
                    { name: 'Domain', value: config.domainName }
                ],
            }
        ])
    })

    new ecs.Service('service', {
        cluster: cluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: config.desiredInstances,

        deploymentController: {
            type: 'ECS',
        },

        loadBalancers: [
            {
                containerName: config.appName,
                containerPort: config.streamlitPort,
                targetGroupArn: targetGroup.arn,
            },
        ],

        networkConfiguration: {
            subnets: vpc.privateSubnetIds,
            assignPublicIp: false,
            securityGroups: [ecsSecurityGroupId],
        },

        // Because launch type is Fargate
        // See: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/platform-linux-fargate.html
        platformVersion: '1.4.0', // As of February 2023 '1.4.0' == 'LATEST'
        // Because launch type is Fargate

        deploymentMinimumHealthyPercent: 50,
        deploymentMaximumPercent: 100,
        enableEcsManagedTags: true,
        forceNewDeployment: true,
        healthCheckGracePeriodSeconds: 180,
        propagateTags: 'SERVICE',
        schedulingStrategy: 'REPLICA',
        tags: commonTags,

    }, { dependsOn: loadbalancer })
})
