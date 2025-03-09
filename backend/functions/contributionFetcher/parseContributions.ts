import * as cheerio from 'cheerio';

export interface Contribution {
  date: string;
  count: number;
}

export interface ContributionWeek {
  days: Contribution[];
}

export interface ContributionYear {
  weeks: ContributionWeek[];
  year: number;
}

const levelToCount = (level: string): number => {
  switch (level) {
    case '0': return 0;
    case '1': return 2;
    case '2': return 5;
    case '3': return 8;
    case '4': return 12;
    default: return 0;
  }
};

export function parseContributions(html: string, year: number = 2025): ContributionYear {
  const $ = cheerio.load(html);
  const table = $('table.ContributionCalendar-grid');
  if (!table.length) {
    throw new Error('Contribution table not found');
  }

  const rows = table.find('tbody tr');
  if (rows.length !== 7) {
    throw new Error(`Expected 7 rows, found ${rows.length}`);
  }

  const numWeeks = rows.first().find('td.ContributionCalendar-day').length;

  const weeks: ContributionWeek[] = Array(numWeeks).fill(null).map(() => ({ days: [] }));

  for (let weekIndex = 0; weekIndex < numWeeks; weekIndex++) {
    const week: Contribution[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayCell = rows.eq(dayIndex).find('td.ContributionCalendar-day').eq(weekIndex);
      const date = dayCell.attr('data-date');
      const level = dayCell.attr('data-level') || '0';
      if (date) {
        const count = levelToCount(level);
        week.push({ date, count });
      }
    }
    weeks[weekIndex].days = week;
  }

  return { weeks, year };
}
