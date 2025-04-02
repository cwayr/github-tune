<script lang="ts">
import type { AllContributions } from '../config/types';

export let contributionData: AllContributions | null = null;
export let currentPosition: { week: number; day: number } | null = null;
export let theme: 'light' | 'dark' | 'custom' = 'light';
export let isPlaying: boolean = false;
export let selectedYear: string = 'pastYear';
export let onYearChange: (year: string) => void;

let weeksContainer: HTMLDivElement;
let currentMonth: string = '';
let previousPlayingState: boolean = false;

$: if (!isPlaying) {
  currentMonth = '';
  
  if (previousPlayingState && !isPlaying && weeksContainer) {
    scrollToBeginning();
  }
  
  previousPlayingState = isPlaying;
}

$: if (isPlaying) {
  previousPlayingState = true;
}

function scrollToBeginning() {
  if (weeksContainer) {
    weeksContainer.scrollTo({
      left: 0,
      behavior: 'smooth'
    });
  }
}

$: if (currentPosition && weeksContainer && contributionData && contributionData[selectedYear]) {
  const weekElements = weeksContainer.querySelectorAll('.week');
  if (weekElements.length > 0 && currentPosition.week < weekElements.length) {
    const activeWeekElement = weekElements[currentPosition.week];
    if (activeWeekElement) {
      const weekLeft = (activeWeekElement as HTMLElement).offsetLeft;
      const scrollPosition = weekLeft - (weeksContainer.clientWidth / 2) + ((activeWeekElement as HTMLElement).offsetWidth / 2);
      weeksContainer.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
      
      const currentYearData = contributionData[selectedYear];
      if (currentYearData.weeks[currentPosition.week]?.days[0]) {
        const firstDayDate = new Date(currentYearData.weeks[currentPosition.week].days[0].date);
        const monthName = firstDayDate.toLocaleString('en-US', { month: 'long' });
        currentMonth = monthName;
      }
    }
  }
}

function getContributionColor(level: number): string {
  if (theme === 'dark') {
    if (level === 0) return '#161b22';
    else if (level === 1) return '#0e4429';
    else if (level === 2) return '#006d32';
    else if (level === 3) return '#26a641';
    else return '#39d353';
  } else {
    if (level === 0) return '#ebedf0';
    else if (level === 1) return '#9be9a8';
    else if (level === 2) return '#40c463';
    else if (level === 3) return '#30a14e';
    else return '#216e39';
  }
}

function isActiveWeek(week: number): boolean {
  return currentPosition?.week === week;
}

function isCurrentDay(weekIndex: number, dayIndex: number): boolean {
  if (!currentPosition || !isPlaying) return false;
  return weekIndex === currentPosition.week && dayIndex === currentPosition.day;
}
</script>

<div class="contribution-graph">
  {#if !contributionData}
    <div class="empty-graph">
      <div class="empty-icon">📊</div>
      <p>Enter a GitHub username to see their contribution graph</p>
    </div>
  {:else}
    <div class="graph-header">
      <div class="title-section">
        <h3 class="graph-title">Contribution Activity</h3>
      </div>
      <div class="legend">
        <span class="legend-label">Less</span>
        <div class="legend-colors">
          <div class="legend-color" style="background-color: {getContributionColor(0)}"></div>
          <div class="legend-color" style="background-color: {getContributionColor(1)}"></div>
          <div class="legend-color" style="background-color: {getContributionColor(2)}"></div>
          <div class="legend-color" style="background-color: {getContributionColor(3)}"></div>
          <div class="legend-color" style="background-color: {getContributionColor(4)}"></div>
        </div>
        <span class="legend-label">More</span>
      </div>
    </div>

    <div class="year-selector-container">
      {#if contributionData}
        <div class="year-selector">
          <div class="select-container">
            <select 
              bind:value={selectedYear} 
              on:change={() => onYearChange(selectedYear)}
              class="year-select"
            >
            <option value="pastYear">Past Year</option>
            {#each Object.keys(contributionData).filter(key => key !== 'pastYear').sort((a, b) => parseInt(b) - parseInt(a)) as year}
              <option value={year}>{year}</option>
            {/each}
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>
      {/if}
    </div>

    <div class="month-container">
      {#if currentMonth}
        <div class="current-month">{currentMonth}</div>
      {:else}
        <div class="current-month-placeholder"></div>
      {/if}
    </div>

    <div class="graph-container">
      <div class="weekday-labels">
        <div>Mon</div>
        <div>Wed</div>
        <div>Fri</div>
        <div>Sun</div>
      </div>

      <div class="weeks-container" bind:this={weeksContainer}>
        {#if contributionData && contributionData[selectedYear]}
          {#each contributionData[selectedYear].weeks as week, weekIndex}
            <div class="week {isActiveWeek(weekIndex) ? 'active-week-container' : ''}">
              {#each week.days as day, dayIndex}
              <div
                class="day-cell {isActiveWeek(weekIndex) ? 'active-week' : ''} 
                       {isActiveWeek(weekIndex) && day.level > 0 ? 'contribution-flash' : ''}
                       {isCurrentDay(weekIndex, dayIndex) ? 'current-day' : ''}
                       {isActiveWeek(weekIndex) && day.level === 0 ? 'progress-day' : ''}"
                style="background-color: {getContributionColor(day.level)};"
                data-level={day.level}
                data-date={day.date}
              ></div>
              {/each}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .contribution-graph {
    width: 100%;
    overflow-x: auto;
    padding: 0;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .graph-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  }
  
  .title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .year-selector-container {
    display: flex;
    justify-content: flex-end;
    padding: 0 1.50rem;
    margin-top: 1rem;
    margin-bottom: -2rem;
  }

  .year-selector {
    position: relative;
    width: auto;
  }
  
  .year-select {
    padding: 0.3rem 0.5rem;
    font-size: 0.85rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: var(--radius-md);
    appearance: none;
    background-color: white;
    color: var(--text-primary);
    transition: all 0.2s ease;
    cursor: pointer;
    padding-right: 1.75rem;
  }
  
  .year-select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  .select-arrow {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    font-size: 0.5rem;
    color: var(--text-secondary);
  }
  
  :global(body.dark-mode) .year-select {
    background-color: var(--surface-dark);
    border-color: rgba(255, 255, 255, 0.1);
    color: var(--light);
  }

  .graph-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
  }
  
  .month-container {
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0rem 0 0.75rem;
    padding: 0 1.25rem;
  }

  .current-month {
    font-size: 0.95rem;
    color: var(--text-muted);
    font-weight: 500;
    transition: all 0.3s ease;
    animation: fade-in 0.5s ease-in-out;
  }
  
  .current-month-placeholder {
    height: 1rem;
  }

  .legend {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
  }

  .legend-colors {
    display: flex;
    gap: 2px;
  }

  .legend-color {
    width: 18px;
    height: 18px;
    border-radius: 3px;
  }

  .legend-label {
    color: var(--text-secondary);
  }

  .empty-graph {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 3rem 1rem;
    color: var(--text-secondary);
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.6;
  }

  .graph-container {
    display: flex;
    padding: 0 1.25rem 1rem;
  }

  .weekday-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-right: 8px;
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin: 12px 4px 12px 0;
  }

  .weeks-container {
    display: flex;
    overflow-x: auto;
    padding: 10px 0;
    scrollbar-width: none;
    gap: 5px;
    min-height: 120px;
    position: relative;
  }

  /* For webkit browsers like Chrome/Safari/Edge */
  .weeks-container::-webkit-scrollbar {
    height: 6px;
  }

  .weeks-container::-webkit-scrollbar-track {
    background: var(--gray-light);
    border-radius: 3px;
  }

  .weeks-container::-webkit-scrollbar-thumb {
    background-color: var(--text-muted);
    border-radius: 3px;
  }

  :global(body.dark-mode) .weeks-container::-webkit-scrollbar-track {
    background: var(--surface-dark);
  }

  .week {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .day-cell {
    width: 18px;
    height: 18px;
    border-radius: 3px;
    position: relative;
    cursor: pointer;
    transition: transform 0.1s ease;
  }

  .day-cell:hover {
    transform: scale(1.15);
  }
  
  .active-week-container {
    z-index: 5;
  }

  .active-week {
    z-index: 10;
    box-shadow: 0 0 0 1px var(--primary) !important;
  }



  :global(body.dark-mode) .graph-header {
    border-color: rgba(255, 255, 255, 0.03);
  }

  .contribution-flash {
    animation: contribution-flash-animation 1s ease-in-out;
    /* Ensure the box-shadow from active-week is still visible */
    box-shadow: 0 0 0 1px var(--primary), 0 0 8px 2px rgba(16, 185, 129, 0.5);
  }

  .progress-day {
    position: relative;
    overflow: hidden;
  }

  .progress-day::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 3px;
    animation: progress-pulse 2s ease-in-out infinite;
  }

  .current-day {
    box-shadow: 0 0 0 1px var(--primary) !important;
    z-index: 15;
  }

  :global(body.dark-mode) .progress-day::after {
    background: rgba(255, 255, 255, 0.05);
  }

  :global(body.dark-mode) .contribution-flash {
    animation: contribution-flash-animation-dark 1s ease-in-out;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes contribution-flash-animation {
    0% {
      filter: brightness(1.5);
      box-shadow: 0 0 0 1px var(--primary), 0 0 8px 2px rgba(16, 185, 129, 0.5);
    }
    100% {
      filter: brightness(1);
      box-shadow: 0 0 0 1px var(--primary);
    }
  }

  @keyframes contribution-flash-animation-dark {
    0% {
      filter: brightness(1.8);
      box-shadow: 0 0 0 1px var(--primary), 0 0 8px 2px rgba(76, 175, 80, 0.7);
    }
    100% {
      filter: brightness(1);
      box-shadow: 0 0 0 1px var(--primary);
    }
  }

  @keyframes progress-pulse {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 0.2;
    }
    100% {
      opacity: 0.6;
    }
  }
</style>
