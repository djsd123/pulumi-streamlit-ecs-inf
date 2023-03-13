import { cloudwatch } from '@pulumi/aws'

import { commonTags, config } from './variables'

export const logGroup = new cloudwatch.LogGroup('log-group', {
    name: `/aws/ecs/${config.appName}`,
    retentionInDays: config.logRetentionDays,
    tags: commonTags,
})
