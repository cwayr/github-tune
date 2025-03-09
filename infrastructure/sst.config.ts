/// <reference path="./.sst/platform/config.d.ts" />

const frontendPath = "../frontend"
const functionsPath = "../backend/functions"

export default $config({
  app(input) {
    return {
      name: "ContributionMedley",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const contributionFetcher = new sst.aws.Function("cm-ContributionFetcher", {
      handler: `${functionsPath}/contributionHandler/index.handler`,
      // url: {
      //   cors: {
      //     allowOrigins: ['*'],
      //     allowMethods: ['*'],
      //     allowHeaders: ['*'],
      //   }
      // },
      nodejs: {
        install: ["cheerio"]
      }
    })

    const api = new sst.aws.ApiGatewayV2('cm-API', {
      cors: {
        allowOrigins: ['*'],
        allowMethods: ['*'],
        allowHeaders: ['*'],
      }
    });

    api.route(
      'GET /contributions',
      `${functionsPath}/contributionHandler/index.handler`,
    )

    const invokeUrl = api.url || '';
    console.log('Invoke URL:', invokeUrl)
    
    const site = new sst.aws.StaticSite("cm-ContributionMedleySite", {
      path: frontendPath,
      environment: {
        VITE_FETCHER_URL: invokeUrl
      }
    })

    return {
      siteUrl: site.url,
      invokeUrl: invokeUrl
    }
  },
});
