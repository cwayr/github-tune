import * as cheerio from 'cheerio';
import { handleError } from '../../lib/errors';

export interface Contribution {
  date: string;
  level: number;
}

export interface ContributionWeek {
  days: Contribution[];
}

export interface ContributionYear {
  weeks: ContributionWeek[];
}

/**
 * Convert the GitHub contribution level string to a number (0-4)
 * Level 0 = no contributions, Level 4 = highest contribution count
 */
const parseLevel = (level: string): number => {
  return parseInt(level, 10) || 0;
};

/**
 * Parse HTML from GitHub to extract the contribution calendar data.
 * Optimized version with minimal logging for better performance.
 */
export function parseContributions(html: string): ContributionYear {
  try {
    const $ = cheerio.load(html);

    const table = $('table.ContributionCalendar-grid');
    if (!table.length) {
      throw new Error('Contribution table not found in HTML');
    }

    const tbody = table.find('tbody');
    if (!tbody.length) {
      throw new Error('Table structure is invalid - no tbody found');
    }

    const rows = tbody.find('tr');
    if (rows.length !== 7) {
      throw new Error(`Expected 7 rows, found ${rows.length}`);
    }

    const dayCells = rows.first().find('td.ContributionCalendar-day');
    const numWeeks = dayCells.length;

    const weeks: ContributionWeek[] = Array(numWeeks).fill(null).map(() => ({ days: [] }));
    
    for (let weekIndex = 0; weekIndex < numWeeks; weekIndex++) {
      const week: Contribution[] = [];
      
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayCell = rows.eq(dayIndex).find('td.ContributionCalendar-day').eq(weekIndex);
        if (!dayCell.length) continue;

        const date = dayCell.attr('data-date');
        if (date) {
          const level = parseLevel(dayCell.attr('data-level') || '0');
          week.push({ date, level });
        }
      }
      
      weeks[weekIndex].days = week;
    }

    return { weeks };
  } catch (error: unknown) {
    const errorResponse = handleError(error, 'parseContributions');
    throw new Error(`Contribution parsing failed: ${errorResponse.message}`);
  }
}
