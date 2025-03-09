import type { ContributionYear, Contribution, ContributionWeek } from '../config/types';

/**
 * Fetches GitHub contribution data for a given username without using the GitHub API
 * by scraping the public profile page.
 * @param username The GitHub username
 * @param year The year to fetch contributions for (defaults to current year)
 * @returns A ContributionYear object or null if an error occurs
 */
export async function fetchGitHubContributions(username: string, year?: number): Promise<ContributionYear | null> {
  try {
    // Determine the target year, defaulting to the current year
    const targetYear = year || new Date().getFullYear();
    const profileUrl = `https://github.com/users/${encodeURIComponent(username)}/contributions?to=${targetYear}-12-31`;

    // Fetch the HTML content from GitHub
    const response = await fetch(profileUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const html = await response.text();

    // Parse the HTML into a DOM document
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find the contribution calendar table body
    const tbody = doc.querySelector('.ContributionCalendar-grid tbody');
    if (!tbody) {
      throw new Error('Could not find contribution calendar tbody');
    }

    // Get all rows (one per day of the week)
    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length !== 7) {
      throw new Error(`Expected 7 rows for days of the week, found ${rows.length}`);
    }

    // Determine the maximum number of weeks based on the number of day elements in any row
    const maxWeeks = Math.max(
      ...rows.map(row => row.querySelectorAll('td.ContributionCalendar-day').length)
    );

    const weeks: ContributionWeek[] = [];

    // Iterate over each week index
    for (let weekIndex = 0; weekIndex < maxWeeks; weekIndex++) {
      const days: Contribution[] = [];

      // Iterate over each day of the week (Sunday = 0, ..., Saturday = 6)
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const row = rows[dayIndex];
        const dayElements = row.querySelectorAll('td.ContributionCalendar-day');

        // Check if the week index exists in this row
        if (weekIndex < dayElements.length) {
          const dayElement = dayElements[weekIndex];
          const date = dayElement.getAttribute('data-date');

          // Only include days with a valid date (skip placeholders)
          if (date) {
            // Extract the title attribute and parse the contribution count
            const title = dayElement.getAttribute('title') || '';
            const match = title.match(/(\d+) contribution(s)?/);
            const count = match ? parseInt(match[1], 10) : 0;

            days.push({ date, count });
          }
        }
      }

      // Add the week if it has any valid days
      if (days.length > 0) {
        weeks.push({ days });
      }
    }

    return {
      weeks,
      year: targetYear
    };
  } catch (error) {
    console.error('Error fetching GitHub contributions:', error);
    return null;
  }
}
