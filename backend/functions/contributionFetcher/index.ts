import { parseContributions } from './parseContributions.ts'

export async function handler(event: any) {
  const username = event.queryStringParameters?.username;
  const year = event.queryStringParameters?.year;
  
  try {
    console.log('entering handler')
    const response = await fetch(
      `https://github.com/users/${encodeURIComponent(username)}/contributions?to=${year}-12-31`
    );

    console.log('handler response', response)
    
    const html = await response.text();
    console.log('handler html', html)
    const contributions = parseContributions(html)
    console.log('handler contributions', contributions)
    
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: contributions,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
}
