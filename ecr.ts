import { ecr } from '@pulumi/aws'

import { config } from './variables'

export const image = ecr.getRepository({ name: config.appName })
