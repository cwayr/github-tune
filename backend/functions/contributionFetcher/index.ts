import { parseContributions } from './parseContributions';
import { parseRequestParams } from '../../lib/validation';
import { handleError } from '../../lib/errors';
import { FetcherLambdaParams } from '../../types/index';
import { ContributionYear } from './parseContributions';
import * as cheerio from 'cheerio';

interface LambdaEvent {
  queryStringParameters: FetcherLambdaParams
}

interface AllContributions {
  pastYear: ContributionYear;
  [year: string]: ContributionYear;
}

interface YearLink {
  year: number;
  url: string;
}

interface YearFetchResult {
  year: number;
  contributions: ContributionYear | null;
}

const MAX_CONCURRENT_REQUESTS = 5;
const RATE_LIMIT_DELAY_MS = 50;

const corsHeaders = {
  'Access-Control-Allow-Origin': ['http://localhost:5173', '.githubtune.com'],
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Extract year links from GitHub profile page HTML
 */
function extractYearLinks(html: string): YearLink[] {
  try {
    const $ = cheerio.load(html);
    const yearLinks: YearLink[] = [];
    
    $('.js-profile-timeline-year-list ul.filter-list li a.js-year-link').each((_, element) => {
      const yearText = $(element).text().trim();
      const year = parseInt(yearText, 10);
      const href = $(element).attr('href');
      
      if (!isNaN(year) && href) {
        const url = `https://github.com${href.replace('tab=overview', 'tab=contributions')}`;
        yearLinks.push({ year, url });
      }
    });
    
    if (yearLinks.length === 0) {
      $('action-list a.js-year-link').each((_, element) => {
        const yearText = $(element).text().trim();
        const year = parseInt(yearText, 10);
        const href = $(element).attr('href');
        
        if (!isNaN(year) && href) {
          const url = `https://github.com${href.replace('tab=overview', 'tab=contributions')}`;
          yearLinks.push({ year, url });
        }
      });
    }
    
    console.log(`Found ${yearLinks.length} year links:`, yearLinks.map(y => y.year).join(', '));
    return yearLinks.sort((a, b) => b.year - a.year); // Sort newest first
  } catch (error) {
    console.error('Error extracting year links:', error);
    return [];
  }
}

/**
 * Fetch contribution data for a specific GitHub URL
 */
async function fetchContributionsForUrl(url: string): Promise<ContributionYear | null> {
  const headers = {
    'x-requested-with': 'XMLHttpRequest'
  };

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited - could implement retry logic here
        console.warn(`Rate limited when fetching ${url}`);
      }
      throw new Error(`GitHub returned ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    if (!html.includes('ContributionCalendar-grid')) {
      console.warn(`No contribution calendar found at ${url}`);
      return null;
    }

    return parseContributions(html);
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

/**
 * Process a batch of year links in parallel
 */
async function processBatch(yearLinks: YearLink[]): Promise<YearFetchResult[]> {
  const fetchPromises = yearLinks.map(link => {
    return fetchContributionsForUrl(link.url)
      .then(contributions => ({ year: link.year, contributions }));
  });

  return Promise.all(fetchPromises);
}

export async function handler(event: LambdaEvent) {
  try {
    console.time('contributionFetcher');
    const { username } = parseRequestParams(event.queryStringParameters);
    const allContributions: AllContributions = {} as AllContributions;
    
    // First fetch the main contributions page
    const mainUrl = `https://github.com/${encodeURIComponent(username)}?tab=contributions`;
    console.log(`Fetching main contributions page from: ${mainUrl}`);
    
    const initialResponse = await fetch(mainUrl, { 
      headers: { 'x-requested-with': 'XMLHttpRequest' }
    });
    
    if (!initialResponse.ok) {
      throw new Error(`GitHub returned ${initialResponse.status}: ${initialResponse.statusText}`);
    }
    
    const initialHtml = await initialResponse.text();
    
    // Extract and parse the current year's contributions
    const currentYearContributions = parseContributions(initialHtml);
    if (!currentYearContributions) {
      throw new Error(`Could not parse contribution data for user ${username}`);
    }
    
    allContributions.pastYear = currentYearContributions;
    
    // Extract the year links from the HTML
    const yearLinks = extractYearLinks(initialHtml);
    
    if (yearLinks.length === 0) {
      console.warn(`No year links found for user ${username}. Only returning current year.`);
      
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      allContributions[currentYear.toString()] = currentYearContributions;
      
      console.timeEnd('contributionFetcher');
      return {
        statusCode: 200,
        body: JSON.stringify(allContributions),
      };
    }
    
    // Find the current year link and add its data
    const currentYearLink = yearLinks[0]; // Assuming first link is current year (sorted newest first)
    allContributions[currentYearLink.year.toString()] = currentYearContributions;
    console.log(`Added current year ${currentYearLink.year} contributions`);
    
    // Remove the current year from links to fetch (we already have it)
    const yearLinksToFetch = yearLinks.slice(1); // Skip the first (current year) link
    
    // cess thethe remaining rs in batches to
    let batchResults: YearFetchResult[] = [];
    for (let i = 0; i < yearLinksToFetch.length; i += MAX_CONCURRENT_REQUESTS) {
      const batchLinks = yearLinksToFetch.slice(i, i + MAX_CONCURRENT_REQUESTS);
      console.log(`Processing batch for years: ${batchLinks.map(link => link.year).join(', ')}`);
      
      const results = await processBatch(batchLinks);
      batchResults = [...batchResults, ...results];
      
      // Small delay between batches to avoid rate limiting
      if (i + MAX_CONCURRENT_REQUESTS < yearLinksToFetch.length) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
      }
    }
    
    // Process results and add to output
    for (const result of batchResults) {
      if (result.contributions) {
        const hasNonZeroContributions = result.contributions.weeks.some(week => 
          week.days.some(day => day.level > 0)
        );
        
        if (hasNonZeroContributions) {
          allContributions[result.year.toString()] = result.contributions;
          console.log(`Added contributions for year ${result.year}`);
        } else {
          console.log(`No contributions found for year ${result.year}`);
        }
      } else {
        console.warn(`Failed to fetch contributions for year ${result.year}`);
      }
    }

    console.timeEnd('contributionFetcher');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(allContributions),
    };
  } catch (error: unknown) {
    console.timeEnd('contributionFetcher');
    const errorResponse = handleError(error, 'contributionFetcher/handler');
    return {
      statusCode: errorResponse.statusCode,
      headers: corsHeaders,
      body: JSON.stringify(errorResponse),
    };
  }
}
