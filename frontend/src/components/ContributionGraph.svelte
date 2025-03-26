<script lang="ts">
import type { ContributionYear } from '../config/types';

export let contributionData: ContributionYear | null = null;
export let currentPosition: { week: number; day: number } | null = null;
export let theme: 'light' | 'dark' | 'custom' = 'light';
export let isPlaying: boolean = false;

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

$: if (currentPosition && weeksContainer && contributionData) {
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
      
      if (contributionData.weeks[currentPosition.week]?.days[0]) {
        const firstDayDate = new Date(contributionData.weeks[currentPosition.week].days[0].date);
        const monthName = firstDayDate.toLocaleString('en-US', { month: 'long' });
        currentMonth = monthName;
      }
    }
  }
}

function getContributionColor(count: number): string {
  if (theme === 'dark') {
    if (count === 0) return '#161b22';
    else if (count <= 3) return '#0e4429';
    else if (count <= 6) return '#006d32';
    else if (count <= 9) return '#26a641';
    else return '#39d353';
  } else {
    if (count === 0) return '#ebedf0';
    else if (count <= 3) return '#9be9a8';
    else if (count <= 6) return '#40c463';
    else if (count <= 9) return '#30a14e';
    else return '#216e39';
  }
}

function isActiveWeek(week: number): boolean {
  return currentPosition?.week === week;
}

function isCurrentDayOrPassed(weekIndex: number, dayIndex: number): boolean {
  if (!currentPosition || !isPlaying) return false;
  if (weekIndex !== currentPosition.week) return false;
  return dayIndex <= currentPosition.day;
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
          <div class="legend-color" style="background-color: {getContributionColor(2)}"></div>
          <div class="legend-color" style="background-color: {getContributionColor(5)}"></div>
          <div class="legend-color" style="background-color: {getContributionColor(8)}"></div>
          <div class="legend-color" style="background-color: {getContributionColor(12)}"></div>
        </div>
        <span class="legend-label">More</span>
      </div>
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
        {#each contributionData.weeks as week, weekIndex}
          <div class="week {isActiveWeek(weekIndex) ? 'active-week-container' : ''}">
            {#each week.days as day, dayIndex}
              <div
                class="day-cell {isActiveWeek(weekIndex) ? 'active-week' : ''} 
                       {isActiveWeek(weekIndex) && day.count > 0 ? 'contribution-flash' : ''}
                       {isCurrentDay(weekIndex, dayIndex) ? 'current-day' : ''}
                       {isActiveWeek(weekIndex) && day.count === 0 ? 'progress-day' : ''}"
                style="background-color: {getContributionColor(day.count)};"
                data-count={day.count}
                data-date={day.date}
              >
                <div class="tooltip">
                  <strong>{day.count} contribution{day.count !== 1 ? 's' : ''}</strong>
                  <span>{day.date}</span>
                </div>
              </div>
            {/each}
          </div>
        {/each}
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
    align-items: baseline;
    gap: 1rem;
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
    margin: 0.75rem 0;
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

  .day-cell .tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
    background-color: var(--surface-dark);
    color: white;
    padding: 0.5rem;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    white-space: nowrap;
    box-shadow: var(--shadow-md);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
    pointer-events: none;
    z-index: 100;
    display: flex;
    flex-direction: column;
  }

  .day-cell .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: var(--surface-dark) transparent transparent transparent;
  }

  .day-cell:hover .tooltip {
    opacity: 1;
    visibility: visible;
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
