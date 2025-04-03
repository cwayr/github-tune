import type { AllContributions } from '../../config/types';

/**
 * Fetches GitHub contribution data for a specified username
 * @param username GitHub username to fetch contributions for
 * @returns Promise resolving to contribution data containing all available years
 * @throws Error if the fetch or parsing fails
 */
export async function fetchContributions(username: string, year?: string): Promise<AllContributions> {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://githubtune.com/api/';

  let url = `${apiUrl}contributions?username=${encodeURIComponent(username)}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
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
