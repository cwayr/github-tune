import type { ContributionYear, Contribution, ContributionWeek } from '../config/types';

/**
 * Fetches GitHub contribution data for a given username without using the GitHub API
 * by scraping the public profile page.
 */
export async function fetchGitHubContributions(username: string, year?: number): Promise<ContributionYear | null> {
  try {
    const profileUrl = `https://github.com/users/${encodeURIComponent(username)}/contributions?to=${year || new Date().getFullYear()}-12-31`;
    
    // Fetch the HTML content from GitHub
    const response = await fetch(profileUrl);
    const html = await response.text();
    
    // Create a DOM parser to parse the contribution graph
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract contribution data
    const weeks: ContributionWeek[] = [];
    const calendar = doc.querySelector('.js-calendar-graph');
    
    if (!calendar) {
      throw new Error('Could not find contribution calendar');
    }
    
    // Extract contribution squares
    const contributionDays = Array.from(calendar.querySelectorAll('.ContributionCalendar-day'));
    
    // Group contributions by week
    let currentWeek: Contribution[] = [];
    let weekCounter = 0;
    
    contributionDays.forEach((day) => {
      const date = day.getAttribute('data-date');
      const count = parseInt(day.getAttribute('data-count') || '0', 10);
      
      if (!date) return;
      
      currentWeek.push({ date, count });
      
      // Each week has 7 days
      if (currentWeek.length === 7) {
        weeks.push({ days: [...currentWeek] });
        currentWeek = [];
        weekCounter++;
      }
    });
    
    // Add the last week if it's not complete
    if (currentWeek.length > 0) {
      weeks.push({ days: [...currentWeek] });
    }
    
    return {
      weeks,
      year: year || new Date().getFullYear()
    };
  } catch (error) {
    console.error('Error fetching GitHub contributions:', error);
    return null;
  }
}
