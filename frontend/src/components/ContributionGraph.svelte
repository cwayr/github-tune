<script lang="ts">
import type { ContributionYear } from '../config/types';
// import { playbackTime, totalDuration } from '$lib/audio-engine';

export let contributionData: ContributionYear | null = null;
export let currentPosition: { week: number; day: number } | null = null;
export let theme: 'light' | 'dark' | 'custom' = 'light';

let weeksContainer: HTMLDivElement;

// Track when currentPosition changes
$: if (currentPosition && weeksContainer) {
  // Get all week elements
  const weekElements = weeksContainer.querySelectorAll('.week');
  if (weekElements.length > 0 && currentPosition.week < weekElements.length) {
    // Get the current active week element
    const activeWeekElement = weekElements[currentPosition.week];
    if (activeWeekElement) {
      // Calculate position to center the active week
      const weekLeft = (activeWeekElement as HTMLElement).offsetLeft;
      const scrollPosition = weekLeft - (weeksContainer.clientWidth / 2) + ((activeWeekElement as HTMLElement).offsetWidth / 2);
      
      // Scroll to position
      weeksContainer.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
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
</script>

<div class="contribution-graph">
  {#if !contributionData}
    <div class="empty-graph">
      <div class="empty-icon">📊</div>
      <p>Enter a GitHub username to see their contribution graph</p>
    </div>
  {:else}
    <div class="graph-header">
      <h3 class="graph-title">Contribution Activity</h3>
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
                class="day-cell {isActiveWeek(weekIndex) ? 'active-week' : ''}"
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
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  .graph-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
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
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }

  .legend-label {
    color: var(--text-secondary);
  }

  .empty-graph {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 15rem;
    background-color: var(--surface);
    border-radius: 0;
    color: var(--text-secondary);
    padding: 2rem;
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.6;
  }

  .graph-container {
    display: flex;
    align-items: stretch;
    padding: 1.5rem;
    background-color: var(--surface);
    margin: 10px 0;
  }

  .weekday-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 15px 0.75rem 15px 0;
    font-size: 0.7rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .weeks-container {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    padding: 15px 60px 15px 0;
    display: flex;
    gap: 3px;
    margin-top: 2px;
    max-height: fit-content;
  }

  .week {
    display: inline-flex;
    flex-direction: column;
    gap: 3px;
  }

  .day-cell {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    position: relative;
    transition: all 0.2s ease;
  }

  .day-cell:hover {
    transform: scale(1.3);
    z-index: 20;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  }
  
  .active-week {
    outline: 2px solid #4e89e8;
    z-index: 10;
  }

  .day-cell .tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 30;
    display: flex;
    flex-direction: column;
  }

  .day-cell:hover .tooltip {
    opacity: 1;
  }

  .active-week {
    opacity: 1;
    box-shadow: 0 0 8px 2px var(--primary-light);
    z-index: 15;
    transform: scale(1.2);
  }

  /* Active week container styles */
  .active-week-container {
    position: relative;
    z-index: 10;
    padding: 8px 0;
    margin: -8px 0;
  }

  .active-week-container::before {
    content: '';
    position: absolute;
    left: -3px;
    right: -3px;
    top: -8px;
    bottom: -8px;
    background: transparent;
    border-radius: 4px;
    pointer-events: none;
    z-index: 1;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      opacity: 0.3;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.05);
    }
    100% {
      opacity: 0.3;
      transform: scale(1);
    }
  }

  /* Dark mode adjustments */
  :global(body.dark-mode) .empty-graph {
    background-color: var(--surface-dark);
  }

  :global(body.dark-mode) .graph-container {
    background-color: var(--surface-dark);
  }

  :global(body.dark-mode) .graph-header {
    border-bottom-color: rgba(255, 255, 255, 0.05);
  }

</style>
