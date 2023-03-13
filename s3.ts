import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'

import { commonTags, config } from './variables'

export const loggingBucket = new aws.s3.BucketV2('logging-bucket', {
    bucketPrefix: `${config.appName}-`,
    forceDestroy: config.s3ForceDestroy,
    tags: commonTags,
})

new aws.s3.BucketAclV2('logging-bucket-acl', {
    bucket: loggingBucket.id,
    acl: aws.s3.PrivateAcl,
})

new aws.s3.BucketOwnershipControls('logging-bucket-ownership-control', {
    bucket: loggingBucket.id,

    rule: {
        objectOwnership: 'BucketOwnerPreferred',
    },
})

new aws.s3.BucketPublicAccessBlock('logging-bucket-public-access-block', {
    bucket: loggingBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
})


const loadBalancerServiceAccountArn = aws.elb.getServiceAccount({}).then((serviceAccount) => serviceAccount.arn)
const accountId = aws.getCallerIdentity({}).then((current) => current.accountId)

pulumi.all(([loggingBucket.id, loggingBucket.arn, loadBalancerServiceAccountArn, accountId]))
    .apply(([loggingBucketId, loggingBucketArn, loadBalancerServiceAccountArn, accountId]) => {

        // See: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/enable-access-logging.html
        const loadBalancerAccessPolicyDocument: aws.iam.PolicyDocument = {
            Version: '2012-10-17',
            Id: 'loadBalancerAccessPolicyDocument',

            Statement: [
                {
                    Sid: 'AWSLogDeliveryWrite',
                    Effect: 'Allow',
                    Action: ['s3:PutObject'],

                    Principal: {
                        AWS: [loadBalancerServiceAccountArn],
                    },

                    Resource: [`${loggingBucketArn}/${config.appName}/AWSLogs/${accountId}/*`],

                    // See: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition_operators.html
                    Condition: {
                        'StringEquals': { 's3:x-amz-acl': 'bucket-owner-full-control' }
                    }
                },
                {
                    Sid: 'AWSLogDeliveryAclCheck',
                    Effect: 'Allow',
                    Action: ['s3:GetBucketAcl'],

                    Principal: {
                        AWS: [loadBalancerServiceAccountArn],
                    },

                    Resource: [loggingBucketArn],
                }
            ]
        }

        new aws.s3.BucketPolicy('logging-bucket-policy', {
            bucket: loggingBucketId,
            policy: loadBalancerAccessPolicyDocument
        })

        new aws.s3.BucketServerSideEncryptionConfigurationV2('logging-bucket-encryption', {
            bucket: loggingBucketId,
            expectedBucketOwner: accountId,

            rules: [
                {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'AES256',
                    },

                    bucketKeyEnabled: true,
                },
            ],
        })
    })
