import type { AllContributions } from '../../config/types';

/**
 * Fetches GitHub contribution data for a specified username and year
 * @param username GitHub username to fetch contributions for
 * @param year Optional year to fetch contributions for (default is past year)
 * @returns Promise resolving to contribution data
 * @throws Error if the fetch or parsing fails
 */
export async function fetchContributions(username: string, year?: string): Promise<AllContributions> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api/';

  let url = `${apiUrl}contributions?username=${encodeURIComponent(username)}`;
  
  if (year && year !== 'pastYear') {
    url += `&year=${year}`;
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`GitHub username not found.`);
    }
    throw new Error(`Failed to fetch contributions: ${response.status} ${response.statusText}`);
  }
  
  const jsonText = await response.text();
  
  try {
    return JSON.parse(jsonText);
  } catch (parseError) {
    console.error('Error parsing JSON:', parseError);
    console.error('Invalid JSON content:', jsonText);
    throw new Error('Invalid response format from server');
  }
}
