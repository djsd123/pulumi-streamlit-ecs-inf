import * as pulumi from '@pulumi/pulumi'
import { route53 } from '@pulumi/aws'

import { loadbalancer } from './lb'
import { config } from './variables'

export const record = pulumi.output(route53.getZone({
    name: config.domainName, }).then((zone) => {
        return new route53.Record('record', {
            name: `${config.appName}.${config.domainName}`,
            type: 'CNAME',
            zoneId: zone.zoneId,
            ttl: 300,
            records: [loadbalancer.dnsName]
        })
}))
