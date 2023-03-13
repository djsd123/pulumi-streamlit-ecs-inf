import './ecs'
import './lb'
import { record } from './route53'


export const appUrl = record.name.apply((recordName) => `https://${recordName}`)
