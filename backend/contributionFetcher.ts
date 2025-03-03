export async function handler(event: any) {
  const username = event.queryStringParameters?.username;
  const year = event.queryStringParameters?.year;
  
  try {
    const response = await fetch(
      `https://github.com/users/${encodeURIComponent(username)}/contributions?to=${year}-12-31`
    );
    
    const html = await response.text();
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: html,
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
