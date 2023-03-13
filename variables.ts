import * as pulumi from '@pulumi/pulumi'
import { Tags } from '@pulumi/aws';


const stackConfig = new pulumi.Config('streamlit-inf')
export const config = {
    appName: stackConfig.require('appName'),
    cidrBlock: stackConfig.require('cidrBlock'),
    desiredInstances: stackConfig.requireNumber('desiredInstances'),
    domainName: stackConfig.require('domainName'),
    ecrImageMaxDays: stackConfig.requireNumber('ecrImageMaxDays'),
    ecrImageMaxImages: stackConfig.requireNumber('ecrImageMaxImages'),
    logRetentionDays: stackConfig.requireNumber('logRetentionDays'),
    name: stackConfig.require('name'),
    region: stackConfig.require('region'),
    s3ForceDestroy: stackConfig.requireBoolean('s3ForceDestroy'),
    streamlitPort: stackConfig.requireNumber('streamlitPort'),
}

export const commonTags: pulumi.Input<Tags> = {
    Name: config.appName,
    AppName: config.appName,
    Project: pulumi.getProject(),
    Stack: pulumi.getStack()
}
