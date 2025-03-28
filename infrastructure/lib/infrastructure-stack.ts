import {
  Stack,
  Duration,
  CfnOutput,
  StackProps,
  aws_s3 as s3,
  RemovalPolicy,
  aws_logs as logs,
  aws_lambda as lambda,
  aws_cloudfront as cloudfront,
  aws_s3_deployment as s3deploy,
  aws_cloudfront_origins as origins,
  aws_lambda_nodejs as nodejs_lambda,
} from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as path from 'path';
import { Construct } from 'constructs';

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const namingPrefix = 'ghtune'
    const rootDomain = 'githubtune.com'
    const backendFnsPath = '../../backend/functions';
    const frontendBuildPath = '../../frontend/build';

    const environment = this.node.tryGetContext('environment') || 'dev';
    console.log(`Deploying to ${environment} environment`);
    const domainName = environment === 'prod' ? rootDomain : `${environment}.${rootDomain}`;

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: rootDomain,
    });

    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: rootDomain,
      subjectAlternativeNames: [`*.${rootDomain}`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    const websiteBucket = new s3.Bucket(this, `${namingPrefix}-srcBkt-${environment}`, {
      bucketName: `${namingPrefix}-srcBkt-${environment}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const apiFunction = new nodejs_lambda.NodejsFunction(this, `${namingPrefix}-fetcher-${environment}`, {
      functionName: `${namingPrefix}-contributionFetcher-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      memorySize: 1024,
      entry: path.join(__dirname, `${backendFnsPath}/contributionFetcher/index.ts`),
      timeout: Duration.seconds(15),
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: [],
        nodeModules: ['cheerio'],
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    const functionUrl = apiFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.GET],
        allowedHeaders: ['content-type'],
      },
    });

    const distribution = new cloudfront.Distribution(this, `${namingPrefix}-distribution-${environment}`, {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity: new cloudfront.OriginAccessIdentity(this, `${namingPrefix}-oai-${environment}`),
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
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
      certificate: certificate,
    });

    new route53.ARecord(this, `AliasRecord-${environment}`, {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    });

    const configFile = new s3deploy.BucketDeployment(this, `${namingPrefix}-configDeployment`, {
      sources: [
        s3deploy.Source.data('config.js', `window.ENV = { VITE_FN_URL: "${functionUrl.url}" };`),
      ],
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

    new CfnOutput(this, 'FetcherLambdaURL', {
      value: functionUrl.url,
    });
  }
}
