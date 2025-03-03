/// <reference path="./.sst/platform/config.d.ts" />

const frontendPath = "../frontend"
const functionsPath = "../backend/functions"

export default $config({
  app(input) {
    return {
      name: "infrastructure",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const site = new sst.aws.StaticSite("ContributionMedleySite", {
      path: frontendPath
    })

    const contributionFetcher = new sst.aws.Function("contributionFetcher", {
      handler: `${functionsPath}/contributionFetcher.handler`,
      url: true,
    })

    return {
      VITE_FETCHER_URL: contributionFetcher.url,
      siteUrl: site.url,
      functionUrl: contributionFetcher.url
    }
  },
});
