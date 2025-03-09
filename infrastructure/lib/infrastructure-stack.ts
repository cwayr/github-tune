import {
  Stack,
  CfnOutput,
  StackProps,
  aws_s3 as s3,
  RemovalPolicy,
  aws_lambda as lambda,
  aws_cloudfront as cloudfront,
  aws_s3_deployment as s3deploy,
  aws_cloudfront_origins as origins,
} from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/functions/contributionFetcher')),
    });

    const functionUrl = apiFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ['*'],
      },
    });

    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
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
    });

    // Generate a simple config.js file with the function URL
    const configFile = new s3deploy.BucketDeployment(this, 'ConfigDeployment', {
      sources: [
        s3deploy.Source.data('config.js', `window.ENV = { VITE_API_URL: "${functionUrl.url}" };`),
      ],
      destinationBucket: websiteBucket,
    });

    // Deploy the built Svelte app to S3
    // This assumes you've already built your Svelte app before deploying
    const websiteDeployment = new s3deploy.BucketDeployment(this, 'WebsiteDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend/.svelte-kit/output'))], // Path to SvelteKit build output
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
      prune: false, // Ensure the config.js isn't removed
    });

    // Make sure config is deployed before the website
    websiteDeployment.node.addDependency(configFile);

    // Output the CloudFront URL and Function URL
    new CfnOutput(this, 'WebsiteURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Website URL',
    });

    new CfnOutput(this, 'LambdaFunctionURL', {
      value: functionUrl.url,
      description: 'Lambda Function URL',
    });
  }
}
