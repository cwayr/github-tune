import * as cheerio from 'cheerio';
import { handleError } from '../../lib/errors';

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

export function parseContributions(html: string, year: number): ContributionYear {
  try {
    console.log('in parse contributions');
    console.log('html content:', html.substring(0, 200) + '...'); // Log first 200 chars of HTML

    let $;
    try {
      $ = cheerio.load(html);
      console.log('cheerio loaded successfully');
    } catch (error: any) {
      console.error('Failed to load HTML with cheerio:', error.message);
      throw new Error('Failed to parse HTML content');
    }

    // Log all tables and their classes to help debug
    const allTables = $('table');
    console.log('Found tables:', allTables.length);
    allTables.each((i, el) => {
      console.log(`Table ${i} classes:`, $(el).attr('class'));
    });

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

    // First check if tbody exists
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
        const level = dayCell.attr('data-level') || '0';
        if (date) {
          const count = levelToCount(level);
          week.push({ date, count });
          console.log('Processed contribution:', { date, level, count });
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

  return { weeks, year };
  } catch (error: unknown) {
    const errorResponse = handleError(error, 'parseContributions');
    throw new Error(`Contribution parsing failed: ${errorResponse.message}`);
  }
}
