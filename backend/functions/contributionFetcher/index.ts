import { parseContributions } from './parseContributions';
import { parseRequestParams } from '../../lib/validation';
import { handleError } from '../../lib/errors';
import { FetcherLambdaParams } from '../../types';
import { ContributionYear } from './parseContributions';

interface LambdaEvent {
  queryStringParameters: FetcherLambdaParams
}

interface AllContributions {
  lastYear: ContributionYear;
  [year: string]: ContributionYear;
}

async function fetchContributionsForUrl(username: string, url: string): Promise<ContributionYear | null> {
  console.log('Fetching contributions with url:', url);
  
  const headers = {
    'x-requested-with': 'XMLHttpRequest'
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  console.log('Received HTML length:', html.length);
  
  if (!html.includes('ContributionCalendar-grid')) {
    console.log('HTML does not contain expected contribution grid for:', url);
    return null;
  }

  const contributions = parseContributions(html);
  console.log('Successfully parsed contributions:', {
    numWeeks: contributions.weeks.length,
    totalDays: contributions.weeks.reduce((acc, week) => acc + week.days.length, 0)
  });

  return contributions;
}

export async function handler(event: LambdaEvent) {
  try {
    const { username } = parseRequestParams(event.queryStringParameters);
    const allContributions: AllContributions = {} as AllContributions;
    
    const lastYearUrl = `https://github.com/${encodeURIComponent(username)}?tab=contributions`;
    const lastYearContributions = await fetchContributionsForUrl(username, lastYearUrl);
    
    if (!lastYearContributions) {
      throw new Error('Could not fetch default contributions for user');
    }
    
    allContributions.lastYear = lastYearContributions;
    
    const currentYear = new Date().getFullYear();
    let year = currentYear;
    let hasContributions = true;
    
    while (hasContributions && year >= 2008) {
      const yearUrl = `https://github.com/${encodeURIComponent(username)}?tab=contributions&from=${year}-01-01&to=${year}-12-31`;
      const yearContributions = await fetchContributionsForUrl(username, yearUrl);
      
      if (yearContributions) {
        const hasNonZeroContributions = yearContributions.weeks.some(week => 
          week.days.some(day => day.level > 0)
        );
        
        if (hasNonZeroContributions) {
          allContributions[year.toString()] = yearContributions;
        } else {
          hasContributions = false;
        }
      } else {
        hasContributions = false;
      }
      
      year--;
    }

    return {
      statusCode: 200,
      body: JSON.stringify(allContributions),
    };
  } catch (error: unknown) {
    const errorResponse = handleError(error, 'contributionFetcher/handler');
    return {
      statusCode: errorResponse.statusCode,
      body: JSON.stringify(errorResponse),
    };
  }
}

handler({
  queryStringParameters: {
    username: 'cwayr'
  }
})