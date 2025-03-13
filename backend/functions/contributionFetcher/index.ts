import { parseContributions } from './parseContributions'

export async function handler(event: any) {
  const username = event.queryStringParameters?.username;
  const year = event.queryStringParameters?.year;

  try {
    // const url = `https://github.com/users/${encodeURIComponent(username)}/contributions?to=${year}-12-31`
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

    const contributions = parseContributions(html, parseInt(year));
    console.log('Successfully parsed contributions:', {
      numWeeks: contributions.weeks.length,
      totalDays: contributions.weeks.reduce((acc, week) => acc + week.days.length, 0)
    });

    return {
      statusCode: 200,
      body: JSON.stringify(contributions),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
