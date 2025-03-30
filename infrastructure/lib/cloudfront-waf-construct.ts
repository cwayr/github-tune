import { Construct } from 'constructs';
import { aws_wafv2 as wafv2, CfnOutput } from 'aws-cdk-lib';

const DEV_ACCESS_HEADER_NAME = 'x-dev-access';

export interface CloudFrontWafConstructProps {
  namingPrefix: string;
  environment: string;
  devAccessHeaderValue?: string;
  allowApiRequests?: boolean;
}

export class CloudFrontWafConstruct extends Construct {
  public readonly webAclArn: string;

  constructor(scope: Construct, id: string, props: CloudFrontWafConstructProps) {
    super(scope, id);

    const { namingPrefix, environment, devAccessHeaderValue } = props;

    const rules: wafv2.CfnWebACL.RuleProperty[] = [
      {
        name: 'RateLimitRule',
        priority: 0,
        action: { block: {} },
        statement: {
          rateBasedStatement: {
            limit: 200, // 200 requests per 5 minutes per IP
            aggregateKeyType: 'IP',
          },
        },
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: `${namingPrefix}-rateLimitMetric-${environment}`,
          sampledRequestsEnabled: true,
        },
      },
    ];

    // Always add a rule to exempt API Gateway requests (highest priority)
    if (environment === 'dev') {
      rules.unshift({
        name: 'ExemptApiRequests',
        priority: 1,
        action: { allow: {} },
        statement: {
          byteMatchStatement: {
            searchString: '/api/',
            fieldToMatch: {
              uriPath: {}
            },
            textTransformations: [{ priority: 0, type: 'NONE' }],
            positionalConstraint: 'STARTS_WITH'
          }
        },
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: `${namingPrefix}-exemptApiMetric-${environment}`,
          sampledRequestsEnabled: true
        }
      });
    }

    if (environment === 'dev') {
      if (!devAccessHeaderValue) {
        throw new Error('devAccessHeaderValue is required for dev environment');
      }
      
      rules.push({
        name: 'DevAccessHeaderRule',
        priority: 2,
        action: { allow: {} },
        statement: {
          byteMatchStatement: {
            searchString: devAccessHeaderValue,
            fieldToMatch: {
              singleHeader: { Name: DEV_ACCESS_HEADER_NAME },
            },
            textTransformations: [{ priority: 0, type: 'NONE' }],
            positionalConstraint: 'EXACTLY',
          },
        },
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: `${namingPrefix}-devAccessHeaderMetric`,
          sampledRequestsEnabled: true,
        },
      });
    }

    const defaultAction = environment === 'dev' ? { block: {} } : { allow: {} };

    const webAcl = new wafv2.CfnWebACL(this, 'WebACLResource', {
      defaultAction,
      scope: 'CLOUDFRONT',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${namingPrefix}-webAclMetric-${environment}`,
        sampledRequestsEnabled: true,
      },
      name: `${namingPrefix}-cloudfront-waf-${environment}`,
      rules,
    });
    this.webAclArn = webAcl.attrArn;

    if (environment === 'dev') {
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
}
