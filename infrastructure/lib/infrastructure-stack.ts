import {
  Stack,
  Duration,
  CfnOutput,
  StackProps,
  aws_s3 as s3,
  RemovalPolicy,
  aws_lambda as lambda,
  aws_cloudfront as cloudfront,
  aws_s3_deployment as s3deploy,
  aws_cloudfront_origins as origins,
  aws_lambda_nodejs as nodejs_lambda,
} from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const backendFnsPath = '../../backend/functions'
    const frontendBuildPath = '../../frontend/.svelte-kit/output/client'

    const environment = this.node.tryGetContext('environment') || 'dev';
    console.log(`Deploying to ${environment} environment`);
    // const isProd = environment === 'prod';

    const apiFunction = new nodejs_lambda.NodejsFunction(this, 'ct-fetcher', {
      functionName: 'contribution-tune-fetcher',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      memorySize: 512,
      entry: path.join(
        __dirname, 
        `${backendFnsPath}/contributionFetcher/index.ts`
      ),
      timeout: Duration.seconds(15),
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: [],
        nodeModules: ['cheerio']
      },
    });

    const functionUrl = apiFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ['*'],
      },
    });

    const websiteBucket = new s3.Bucket(this, 'ct-srcBucket', {
      bucketName: 'contribution-tune-src',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, 'ct-distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: 
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Generate a simple config.js file with the function URL
    const configFile = new s3deploy.BucketDeployment(this, 'ct-configDeployment', {
      sources: [
        s3deploy.Source.data(
          'config.js', 
          `window.ENV = { VITE_FN_URL: "${functionUrl.url}" };`
        ),
      ],
      destinationBucket: websiteBucket,
    });

    const websiteDeployment = new s3deploy.BucketDeployment(this, 'ct-websiteDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, frontendBuildPath))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
      prune: false, // Ensure the config.js isn't removed
    });

    // Make sure config is deployed before the website
    websiteDeployment.node.addDependency(configFile);

    new CfnOutput(this, 'SiteURL', {
      value: `https://${distribution.distributionDomainName}`,
    });

    new CfnOutput(this, 'FetcherLambdaURL', {
      value: functionUrl.url,
    });
  }
}
