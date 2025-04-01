# GitHub Tune Backend

This directory contains the serverless backend functions for the GitHub Tune application. The backend is built using TypeScript and designed to run as AWS Lambda functions.

## Overview

The backend is responsible for fetching GitHub contribution data and transforming it into a structured format that can be used by the frontend to generate musical melodies. It consists of the following components:

- **Lambda Functions**: Serverless functions that handle API requests
- **Utility Libraries**: Shared code for error handling, validation, and data parsing
- **Type Definitions**: TypeScript interfaces for data structures

## Project Structure

```
backend/
├── functions/              # Lambda function implementations
│   └── contributionFetcher/    # GitHub contribution data scraper
│       ├── index.ts            # Main handler function
│       └── parseContributions.ts  # HTML parsing logic
├── lib/                    # Shared utilities
│   ├── errors.ts           # Error handling utilities
│   └── validation.ts       # Request validation
├── types/                  # TypeScript type definitions
│   └── index.ts            # Shared type interfaces
└── dist/                   # Compiled JavaScript output
```

## Functions

### contributionFetcher

Scrapes GitHub's contribution graph HTML and returns structured contribution data.

**Features**:
- Extracts contribution activity levels (0-4) from GitHub's contribution graph
- Handles rate limiting with staggered requests
- Supports fetching multiple years of contribution data
- Returns data in a consistent format for frontend processing

**Endpoint**: `/api/{username}`

**Query Parameters**:
- `username` (required): GitHub username to fetch contributions for

**Response Format**:
```typescript
{
  "pastYear": {
    "weeks": [
      {
        "days": [
          {
            "date": "YYYY-MM-DD",
            "level": 0-4  // Contribution level (0=none, 4=highest)
          }
          // ... more days
        ]
      }
      // ... more weeks
    ]
  },
  // Optional year-specific data
  "2023": { /* same structure as pastYear */ },
  "2022": { /* same structure as pastYear */ }
  // ... more years if available
}
```

## Technical Details

### HTML Parsing

The backend uses [Cheerio](https://cheerio.js.org/) to parse GitHub's HTML and extract contribution data. The parsing logic handles GitHub's specific DOM structure to extract:

- Contribution dates
- Contribution levels (0-4 scale)
- Year navigation links

### Error Handling

The backend implements a consistent error handling pattern:
- Structured error responses with context
- Detailed logging for troubleshooting
- HTTP status codes appropriate to the error type

### Optimization Techniques

- **Concurrent Requests**: Processes multiple year fetches in parallel (limited to 5 concurrent requests)
- **Rate Limiting**: Implements delay between batches to avoid GitHub API rate limits
- **Response Filtering**: Only returns years with actual contributions

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) package manager

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Build TypeScript files
pnpm run build

# Clean build artifacts
pnpm run clean
```

### Deployment

The backend is deployed as part of the AWS CDK stack defined in the `/infrastructure` directory. See the infrastructure README for deployment instructions.

## API Integration

The backend is designed to be called from the frontend via AWS API Gateway. The typical request flow is:

1. Frontend sends request to CloudFront distribution
2. CloudFront routes `/api/*` requests to API Gateway
3. API Gateway invokes the Lambda function
4. Lambda function fetches and processes GitHub data
5. Response flows back through API Gateway and CloudFront to the frontend

## Contribution Guidelines

When modifying the backend code:

1. Maintain TypeScript type safety throughout the codebase
2. Follow error handling patterns established in `lib/errors.ts`
3. Keep functions small and focused on a single responsibility
4. Be mindful of GitHub's HTML structure changes that might break parsing
5. Add appropriate logging for production troubleshooting
6. Test changes with various GitHub profiles (new accounts, old accounts, etc.)

## Troubleshooting

### Common Issues

- **Rate Limiting**: GitHub may rate limit requests if too many are made in succession
- **HTML Structure Changes**: GitHub occasionally updates their DOM structure
- **Memory Usage**: Processing large contribution histories may require memory optimization

### Debugging

Lambda logs are available in CloudWatch Logs. Key log patterns to look for:

- `[ERROR]` entries indicate failures
- `contributionFetcher: XXXms` timing entries show function performance
- Rate limiting warnings appear as `Rate limited when fetching URL`
