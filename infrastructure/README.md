# GitHub Tune Infrastructure

This directory contains the AWS Cloud Development Kit (CDK) code for provisioning and managing the cloud infrastructure for the GitHub Tune application. The infrastructure is defined as code using TypeScript and AWS CDK (v2.182.0).

## Architecture Overview

The GitHub Tune application is deployed on AWS with the following architecture:

- **Frontend**: Static website hosted in an S3 bucket and distributed via CloudFront CDN
- **Backend**: Serverless architecture using AWS Lambda functions
- **API**: API Gateway HTTP API for RESTful endpoints
- **DNS**: Route 53 for domain management with SSL/TLS certificate

### Resources Provisioned

The CDK stack provisions the following AWS resources:

- **S3 Buckets**:
  - Website static content bucket
  - CloudFront access logs bucket

- **Lambda Functions**:
  - Contribution Fetcher Lambda

- **API Gateway**:
  - HTTP API with CORS configuration
  - Routes for contribution data API

- **CloudFront**:
  - Distribution for website content delivery
  - Origin access identity for S3 access
  - Custom behaviors for API routing

- **DNS & SSL/TLS**:
  - Route 53 DNS records
  - ACM certificate for HTTPS

## Prerequisites

Before deploying this infrastructure, you need:

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured with credentials
3. Node.js (v18+) and npm/pnpm installed
4. Domain name registered in Route 53 (currently configured for `githubtune.com`)

## Environment Setup

```bash
# Install dependencies
pnpm install

# Build the CDK project
pnpm run build
```

## Deployment Instructions

```bash
# Synthesize CloudFormation template
pnpm cdk synth

# Deploy to AWS
pnpm cdk deploy
```

For a production deployment, consider using named environments:

```bash
pnpm cdk deploy --context env=prod
```

## Configuration

The infrastructure has several configurable parameters in the `infrastructure-stack.ts` file:

- `namingPrefix`: Prefix for resource names (currently 'ghtune')
- `domainName`: Domain name for the website (currently 'githubtune.com')
- `backendFnsPath`: Relative path to backend functions
- `frontendBuildPath`: Relative path to frontend build output

## Outputs

After deployment, the CDK stack outputs:

- `SiteURL`: The URL of the deployed website
- `FetcherApiUrl`: The API endpoint URL for the contribution fetcher

## Local Development

For local development and testing:

```bash
# Watch for changes and automatically rebuild
pnpm run watch

# Run unit tests
pnpm run test
```

## Common Issues & Troubleshooting

- **Deployment Failures**: Check CloudFormation console for error details
- **SSL Certificate Validation**: Ensure DNS validation records are properly created
- **API CORS Issues**: Verify CORS configuration in the stack matches your development environment
- **CloudFront Cache**: After deploying changes, you may need to invalidate the CloudFront cache

## Contributing

When making changes to the infrastructure:

1. Update the stack in `lib/infrastructure-stack.ts`
2. Run `pnpm cdk diff` to review changes before deployment
3. Update this README if your changes affect the architecture or deployment process

## Useful Commands

- `pnpm run build`: Compile TypeScript to JavaScript
- `pnpm run watch`: Watch for changes and compile
- `pnpm run test`: Perform Jest unit tests
- `pnpm cdk deploy`: Deploy the stack to your AWS account/region
- `pnpm cdk diff`: Compare deployed stack with current state
- `pnpm cdk synth`: Emit the synthesized CloudFormation template
- `pnpm cdk destroy`: Remove the stack from AWS (use with caution)
