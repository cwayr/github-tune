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
    const targetYear = year || new Date().getFullYear();
    const profileUrl = `https://github.com/users/${encodeURIComponent(username)}/contributions?to=${targetYear}-12-31`;

    const response = await fetch(profileUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const tbody = doc.querySelector('.ContributionCalendar-grid tbody');
    if (!tbody) {
      throw new Error('Could not find contribution calendar tbody');
    }

    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length !== 7) {
      throw new Error(`Expected 7 rows for days of the week, found ${rows.length}`);
    }

    const maxWeeks = Math.max(
      ...rows.map(row => row.querySelectorAll('td.ContributionCalendar-day').length)
    );

    const weeks: ContributionWeek[] = [];

    for (let weekIndex = 0; weekIndex < maxWeeks; weekIndex++) {
      const days: Contribution[] = [];

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const row = rows[dayIndex];
        const dayElements = row.querySelectorAll('td.ContributionCalendar-day');

        if (weekIndex < dayElements.length) {
          const dayElement = dayElements[weekIndex];
          const date = dayElement.getAttribute('data-date');

          if (date) {
            const title = dayElement.getAttribute('title') || '';
            const match = title.match(/(\d+) contribution(s)?/);
            const count = match ? parseInt(match[1], 10) : 0;

            days.push({ date, count });
          }
        }
      }

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
