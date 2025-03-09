<script lang="ts">
import { createEventDispatcher } from 'svelte';
import type { ContributionYear } from '../config/types';

export let contributionData: ContributionYear | null = null;
export let currentPosition: { week: number; day: number } | null = null;
export let theme: 'light' | 'dark' | 'custom' = 'light';

const dispatch = createEventDispatcher();

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

function isActiveCell(week: number, day: number): boolean {
  return currentPosition?.week === week && currentPosition?.day === day;
}
</script>

<div class="contribution-graph">
{#if !contributionData}
<div class="empty-graph">
<p>Enter a GitHub username to see their contribution graph</p>
</div>
{:else}
<div class="graph-container">
<div class="weekday-labels">
<div>Mon</div>
<div>Wed</div>
<div>Fri</div>
<div>Sun</div>
</div>

<div class="weeks-container">
{#each contributionData.weeks as week, weekIndex}
<div class="week">
{#each week.days as day, dayIndex}
<div
class="day-cell"
style="background-color: {getContributionColor(day.count)}; 
opacity: {isActiveCell(weekIndex, dayIndex) ? '0.7' : '1'}; 
transform: {isActiveCell(weekIndex, dayIndex) ? 'scale(1.2)' : 'scale(1)'}"
data-count={day.count}
data-date={day.date}
></div>
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
padding: 1rem 0;
}

.empty-graph {
display: flex;
         justify-content: center;
         align-items: center;
height: 10rem;
        background-color: #f6f8fa;
        border-radius: 6px;
color: #586069;
}

.graph-container {
display: flex;
         align-items: stretch;
}

.weekday-labels {
display: flex;
         flex-direction: column;
         justify-content: space-between;
         padding-right: 0.5rem;
         font-size: 0.75rem;
color: #586069;
}

.weeks-container {
display: flex;
gap: 2px;
}

.week {
display: flex;
         flex-direction: column;
gap: 2px;
}

.day-cell {
width: 10px;
height: 10px;
        border-radius: 2px;
position: relative;
transition: transform 0.1s ease-in-out;
}

.day-cell:hover {
transform: scale(1.2);
}

.day-cell:hover {
transform: scale(1.2);
}
</style>
