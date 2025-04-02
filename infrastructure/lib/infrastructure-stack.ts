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
  aws_cloudwatch as cloudwatch,
  aws_certificatemanager as acm,
  aws_s3_deployment as s3deploy,
  aws_route53_targets as targets,
  aws_cloudfront_origins as origins,
  aws_lambda_nodejs as nodejs_lambda,
  aws_apigatewayv2_integrations as apigw_integrations,
} from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const namingPrefix = 'ghtune';
    const domainName = 'githubtune.com';
    const backendFnsPath = '../../backend/functions';
    const frontendBuildPath = '../../frontend/build';

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', { domainName });

    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName,
      subjectAlternativeNames: [`*.${domainName}`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    const websiteBucket = new s3.Bucket(this, `${namingPrefix}-srcbkt`, {
      bucketName: `${namingPrefix}-srcbkt`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const contributionFetcherFn = new nodejs_lambda.NodejsFunction(this, `${namingPrefix}-fetcher`, {
      functionName: `${namingPrefix}-contributionFetcher`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      memorySize: 2048,
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

    new cloudwatch.Dashboard(this, `${namingPrefix}-dashboard`, {
      dashboardName: `${namingPrefix}-monitoring`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Invocations',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Invocations',
                dimensionsMap: { FunctionName: contributionFetcherFn.functionName },
                statistic: 'Sum',
              }),
            ],
          }),
        ],
      ],
    });

    const httpApi = new apigwv2.HttpApi(this, `${namingPrefix}-httpApi`, {
      apiName: `${namingPrefix}-httpApi`,
      corsPreflight: {
        allowHeaders: ['Content-Type'],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowOrigins: [`https://${domainName}`, 'http://localhost:5173'],
        maxAge: Duration.days(10),
      },
    });

    const lambdaIntegration = new apigw_integrations.HttpLambdaIntegration(
      `${namingPrefix}-lambdaIntegration`,
      contributionFetcherFn
    );

    httpApi.addRoutes({
      path: '/api/{proxy+}',
      methods: [apigwv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    const apiDomain = `${httpApi.apiId}.execute-api.${this.region}.amazonaws.com`;

    const apiOrigin = new origins.HttpOrigin(apiDomain);

    const distribution = new cloudfront.Distribution(this, `${namingPrefix}-distribution`, {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity: new cloudfront.OriginAccessIdentity(this, `${namingPrefix}-oai`),
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        'api/*': {
          origin: apiOrigin,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      domainNames: [domainName],
      certificate,
      logBucket: new s3.Bucket(this, `${namingPrefix}-cloudfront-logs`, {
        bucketName: `${namingPrefix}-cloudfront-logs`,
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      }),
    });

    new route53.ARecord(this, `AliasRecord`, {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    new s3deploy.BucketDeployment(this, `${namingPrefix}-websiteDeployment`, {
      sources: [s3deploy.Source.asset(path.join(__dirname, frontendBuildPath))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
      prune: false,
    });

    new CfnOutput(this, 'SiteURL', {
      value: `https://${domainName}`,
    });

    new CfnOutput(this, 'FetcherApiUrl', {
      value: `https://${domainName}/api`,
    });
  }
}
