import { Construct } from 'constructs';
import { aws_wafv2 as wafv2, CfnOutput } from 'aws-cdk-lib';

const DEV_ACCESS_HEADER_NAME = 'X-Dev-Access';

export interface DevWafConstructProps {
  namingPrefix: string;
  devAccessHeaderValue: string;
}

export class DevWafConstruct extends Construct {
  public readonly webAclArn: string;

  constructor(scope: Construct, id: string, props: DevWafConstructProps) {
    super(scope, id);

    const { namingPrefix, devAccessHeaderValue } = props;

    const devWebAcl = new wafv2.CfnWebACL(this, 'DevWebACLResource', {
      defaultAction: { block: {} },
      scope: 'CLOUDFRONT',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${namingPrefix}-devWebAclMetric`,
        sampledRequestsEnabled: true,
      },
      name: `${namingPrefix}-dev-access-acl`,
      rules: [
        {
          name: 'RateLimitRule',
          priority: 0,
          action: { count: {} },
          statement: {
            rateBasedStatement: {
              limit: 100,
              aggregateKeyType: 'IP'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `${namingPrefix}-rateLimitMetric`,
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'DevAccessHeaderRule',
          priority: 1,
          action: { allow: {} },
          statement: {
            byteMatchStatement: {
              searchString: devAccessHeaderValue,
              fieldToMatch: {
                singleHeader: {
                  Name: DEV_ACCESS_HEADER_NAME,
                },
              },
              textTransformations: [
                {
                  priority: 0,
                  type: 'NONE',
                },
              ],
              positionalConstraint: 'EXACTLY',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `${namingPrefix}-devAccessHeaderMetric`,
            sampledRequestsEnabled: true,
          },
        }
      ],
    });
    this.webAclArn = devWebAcl.attrArn;

    new CfnOutput(this, 'DevAccessHeaderNameOutput', {
      value: DEV_ACCESS_HEADER_NAME,
      description: 'Required header name for accessing the dev environment.',
    });
    new CfnOutput(this, 'DevAccessHeaderValueHintOutput', {
      value: 'See GitHub secret DEV_ACCESS_SECRET for the required header value.',
      description: 'Hint for the required header value (comes from context/secrets).',
    });
  }
}
