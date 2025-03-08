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
    const site = new sst.aws.StaticSite("cm-ContributionMedleySite", {
      path: frontendPath
    })

    const contributionFetcher = new sst.aws.Function("cm-ContributionFetcher", {
      handler: `${functionsPath}/contributionFetcher.handler`,
      url: true,
    })

    const functionUrl = contributionFetcher.url || '';
    console.log('Function URL:', functionUrl)

    return {
      VITE_FETCHER_URL: functionUrl,
      siteUrl: site.url,
      functionUrl: functionUrl
    }
  },
});
