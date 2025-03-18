import { parseContributions } from './parseContributions';
import { parseRequestParams } from '../../lib/validation';
import { handleError, type CustomErrorResponse } from '../../lib/errors';
import { FetcherLambdaParams } from '../../types'

interface LambdaEvent {
  queryStringParameters: FetcherLambdaParams
}

export async function handler(event: LambdaEvent) {
  try {
    const { username } = parseRequestParams(event.queryStringParameters);

    const url = `https://github.com/users/${encodeURIComponent(username)}/contributions`
    console.log('Fetching contributions with url:', url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('Received HTML length:', html.length);
    
    if (!html.includes('ContributionCalendar-grid')) {
      console.error('HTML does not contain expected contribution grid:', html.substring(0, 500));
      throw new Error('GitHub response does not contain contribution data');
    }

    const contributions = parseContributions(html);
    console.log('Successfully parsed contributions:', {
      numWeeks: contributions.weeks.length,
      totalDays: contributions.weeks.reduce((acc, week) => acc + week.days.length, 0)
    });

    return {
      statusCode: 200,
      body: JSON.stringify(contributions),
    };
  } catch (error: unknown) {
    const errorResponse = handleError(error, 'contributionFetcher/handler');
    return {
      statusCode: errorResponse.statusCode,
      body: JSON.stringify(errorResponse),
    };
  }
}
