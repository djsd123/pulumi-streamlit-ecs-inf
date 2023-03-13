import { iam } from '@pulumi/aws'

import { config } from './variables'

// See: https://docs.aws.amazon.com/AmazonECS/latest/userguide/using-service-linked-roles.html
// When using ServiceLinkedRole, you must omit iamRole in ECS service.
const ecsServiceLinkedRoleName: string = 'AWSServiceRoleForECS'

/*
    "InvalidInput: Service role name AWSServiceRoleForECS has been taken in this account, please try a different suffix"

    The "iam.ServiceLinkedRole" resource isn't fully idempotent and will error if it has been deployed at least once
    before to the same AWS account (even after resource destruction in IaC). It occupies the name "AWSServiceRoleFor..."

    There is a "customSuffix" arg but to avoid the following error, I'm using "iam.getRoles" to check for it's existence
*/

iam.getRoles({ nameRegex: ecsServiceLinkedRoleName }).then((roles) => {
    if ( roles.names.length < 1 ) {
        new iam.ServiceLinkedRole('ecs-service-linked-role', {
            awsServiceName: 'ecs.amazonaws.com',
            description: 'Required in this case to allow ECS to make calls to loadbalancer when using "awsvpc" networking mode'
        })
    }
})

// See: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html
export const ecsTaskExecutionRole = new iam.Role('ecs-task-execution-role', {
    namePrefix: `${config.appName}-`,
    description: 'Allow ECS task to use awslogs log driver and pull images from ECR',
    assumeRolePolicy: iam.assumeRolePolicyForPrincipal({ Service: 'ecs-tasks.amazonaws.com' }),
})

new iam.RolePolicyAttachment('ecs-task-execution-role-policy-attachment', {
    role: ecsTaskExecutionRole.id,
    policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
})
