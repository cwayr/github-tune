import {
  Stack,
  Duration,
  CfnOutput,
  StackProps,
  aws_s3 as s3,
  RemovalPolicy,
  aws_logs as logs,
  aws_lambda as lambda,
  aws_route53 as route53,
  aws_apigatewayv2 as apigwv2,
  aws_cloudfront as cloudfront,
  aws_certificatemanager as acm,
  aws_s3_deployment as s3deploy,
  aws_route53_targets as targets,
  aws_cloudfront_origins as origins,
  aws_lambda_nodejs as nodejs_lambda,
  aws_apigatewayv2_integrations as apigw_integrations,
} from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';

const DEV_ACCESS_HEADER_NAME = 'x-dev-access';

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const namingPrefix = 'ghtune';
    const rootDomain = 'githubtune.com';
    const backendFnsPath = '../../backend/functions';
    const frontendBuildPath = '../../frontend/build';

    const environment = this.node.tryGetContext('environment') || 'dev';
    console.log(`Deploying to ${environment} environment`);
    const domainName = environment === 'prod' ? rootDomain : `${environment}.${rootDomain}`;

    let devAccessHeaderValue: string | undefined = undefined;
    if (environment === 'dev') {
      devAccessHeaderValue = this.node.tryGetContext('devAccessHeaderValue');
      if (!devAccessHeaderValue) {
        throw new Error('Context variable "devAccessHeaderValue" must be provided for the "dev" environment.');
      }
    } else if (this.node.tryGetContext('devAccessHeaderValue')) {
      console.warn('Context variable "devAccessHeaderValue" was provided for a non-dev environment and will be ignored.');
    }

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: rootDomain,
    });

    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: rootDomain,
      subjectAlternativeNames: [`*.${rootDomain}`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    const websiteBucket = new s3.Bucket(this, `${namingPrefix}-srcbkt-${environment}`, {
      bucketName: `${namingPrefix}-srcbkt-${environment}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const contributionFetcherFn = new nodejs_lambda.NodejsFunction(this, `${namingPrefix}-fetcher-${environment}`, {
      functionName: `${namingPrefix}-contributionFetcher-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      memorySize: 1024,
      entry: path.join(__dirname, `${backendFnsPath}/contributionFetcher/index.ts`),
      timeout: Duration.seconds(30),
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: [],
        nodeModules: ['cheerio'],
      },
      logRetention: logs.RetentionDays.TWO_WEEKS,
    });

    const httpApi = new apigwv2.HttpApi(this, `${namingPrefix}-httpApi-${environment}`, {
      apiName: `${namingPrefix}-httpApi-${environment}`,
      corsPreflight: {
        allowHeaders: ['Content-Type', DEV_ACCESS_HEADER_NAME],
        allowMethods: [apigwv2.CorsHttpMethod.ANY], // Changed to ANY for flexibility
        allowOrigins: [`https://${domainName}`, 'http://localhost:5173'],
        maxAge: Duration.days(10),
      },
    });

    const lambdaIntegration = new apigw_integrations.HttpLambdaIntegration(
      `${namingPrefix}-lambdaIntegration-${environment}`,
      contributionFetcherFn
    );

    httpApi.addRoutes({
      path: '/api/{proxy+}',
      methods: [apigwv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    const apiDomain = `${httpApi.apiId}.execute-api.${this.region}.amazonaws.com`;

    const apiOrigin = new origins.HttpOrigin(apiDomain);

    const distribution = new cloudfront.Distribution(this, `${namingPrefix}-distribution-${environment}`, {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity: new cloudfront.OriginAccessIdentity(this, `${namingPrefix}-oai-${environment}`),
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: apiOrigin,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: new cloudfront.OriginRequestPolicy(this, `${namingPrefix}-api-orgreq-policy-${environment}`, {
            headerBehavior: cloudfront.OriginRequestHeaderBehavior.all(),
            queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
            cookieBehavior: cloudfront.OriginRequestCookieBehavior.none(),
          }),
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      domainNames: [domainName],
      certificate,
      logBucket: new s3.Bucket(this, `${namingPrefix}-cloudfront-logs-${environment}`, {
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      }),
    });

    new route53.ARecord(this, `AliasRecord-${environment}`, {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    const configFile = new s3deploy.BucketDeployment(this, `${namingPrefix}-configDeployment`, {
      sources: [s3deploy.Source.data('config.js', `window.ENV = { VITE_API_URL: "/api" };`)],
      destinationBucket: websiteBucket,
    });

    const websiteDeployment = new s3deploy.BucketDeployment(this, `${namingPrefix}-websiteDeployment`, {
      sources: [s3deploy.Source.asset(path.join(__dirname, frontendBuildPath))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
      prune: false,
    });

    websiteDeployment.node.addDependency(configFile);

    new CfnOutput(this, 'SiteURL', {
      value: `https://${distribution.distributionDomainName}`,
    });

    new CfnOutput(this, 'FetcherApiUrl', {
      value: `https://${domainName}/api`,
    });
  }
}
