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

const parseLevel = (level: string): number => {
  // Convert the level string to a number (0-4) representing the actual contribution level
  // Level 0 = no contributions, Level 4 = highest contribution count
  return parseInt(level, 10) || 0;
};

export function parseContributions(html: string): ContributionYear {
  try {
    let $;
    try {
      $ = cheerio.load(html);
      console.log('cheerio loaded successfully');
    } catch (error: any) {
      console.error('Failed to load HTML with cheerio:', error.message);
      throw new Error('Failed to parse HTML content');
    }

    const table = $('table.ContributionCalendar-grid');
    console.log('Contribution table found:', {
      found: table.length > 0,
      classes: table.attr('class'),
      html: table.html()?.substring(0, 100)
    });

    if (!table.length) {
      console.error('HTML structure:', {
        tables: $('table').length,
        bodyContent: $('body').html()?.substring(0, 200)
      });
      throw new Error('Contribution table not found in HTML');
    }

    const tbody = table.find('tbody');
  if (!tbody.length) {
    console.error('No tbody found in table');
    console.log('Table HTML:', table.html());
    throw new Error('Table structure is invalid - no tbody found');
  }

  const rows = tbody.find('tr');
  console.log('Contribution rows found:', {
    count: rows.length,
    firstRowHtml: rows.first().html()?.substring(0, 100),
    rowClasses: rows.first().attr('class')
  });

  if (rows.length !== 7) {
    console.error('Unexpected row count:', {
      found: rows.length,
      tableHtml: table.html()?.substring(0, 300),
      tbodyHtml: tbody.html()?.substring(0, 300)
    });
    throw new Error(`Expected 7 rows, found ${rows.length}`);
  }

  const numWeeks = rows.first().find('td.ContributionCalendar-day').length;
  console.log('Number of weeks found:', numWeeks);

  const weeks: ContributionWeek[] = Array(numWeeks).fill(null).map(() => ({ days: [] }));
  console.log('Initialized weeks array');

  for (let weekIndex = 0; weekIndex < numWeeks; weekIndex++) {
    const week: Contribution[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      try {
        const dayCell = rows.eq(dayIndex).find('td.ContributionCalendar-day').eq(weekIndex);
        if (!dayCell.length) {
          console.log('No day cell found for:', { weekIndex, dayIndex });
          continue;
        }

        const date = dayCell.attr('data-date');
        if (date) {
          const level = parseLevel(dayCell.attr('data-level') || '0');
          week.push({ date, level });
          console.log('Processed contribution:', { date, level });
        } else {
          console.log('No date found for cell:', { weekIndex, dayIndex, html: dayCell.html() });
        }
      } catch (cellError: any) {
        console.error('Error processing day cell:', {
          weekIndex,
          dayIndex,
          error: cellError.message
        });
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
