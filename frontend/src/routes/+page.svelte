<script lang="ts">
import { onMount } from 'svelte';
import ContributionGraph from '../components/ContributionGraph.svelte';
import PlaybackControls from '../components/PlaybackControls.svelte';
import { audioEngine } from '../lib/audio-engine';
import type { AppState, ContributionYear, PlaybackSettings } from '../config/types';

let username = '';
let contributionData: ContributionYear | null = null;
let isPlaying = false;
let currentPosition: { week: number; day: number } | null = null;
let playbackSettings: PlaybackSettings = {
 speed: 1.0,
 volume: 0.5,
 scale: audioEngine.getAvailableScales()[0]
};
let theme: 'light' | 'dark' | 'custom' = 'light';
const fnUrl = import.meta.env.VITE_FN_URL || '';
console.log('Frontend FN URL:', fnUrl);

function handleSubmit() {
  if (username) {
    fetchContributions();
  }
}

async function fetchContributions() {
  try {
    const response = await fetch(`${fnUrl}/contributions?username=${encodeURIComponent(username)}`);
    console.log('contributions fetched:', response)
      if (!response.ok) {
        throw new Error('Failed to fetch contributions');
      }
    const html = await response.text();
    console.log('contributions html', html)
      contributionData = parseContributions(html);
    console.log('contributions data', contributionData)
      currentPosition = null;
    stopPlayback();
  } catch (error) {
    console.error('Error fetching contributions:', error);
  }
}

function parseContributions(html: string): ContributionYear {
  // Parse the HTML into a DOM document
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find the contribution calendar table body
  const tbody = doc.querySelector('.ContributionCalendar-grid tbody');
  if (!tbody) {
    console.error('Could not find contribution calendar tbody');
    return { weeks: [], year: new Date().getFullYear() };
  }

  // Get all rows (one per day of the week)
  const rows = Array.from(tbody.querySelectorAll('tr'));

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

  // Extract the year from the first date in the first week if available
  const year = weeks.length > 0 && weeks[0].days.length > 0
    ? new Date(weeks[0].days[0].date).getFullYear()
    : new Date().getFullYear();

  return {
    weeks,
      year
  };
}

function togglePlay() {
  if (isPlaying) {
    stopPlayback();
  } else {
    startPlayback();
  }
}

function startPlayback() {
  if (!contributionData) return;
  isPlaying = true;
  currentPosition = { week: 0, day: 0 };
  playWeek(0);
}

function stopPlayback() {
  isPlaying = false;
  audioEngine.stopSound();
}

function playWeek(week: number) {
  if (!isPlaying || !contributionData) return;

  currentPosition = { week, day: 0 };

  audioEngine.playContributionWeek(
      week,
      contributionData,
      playbackSettings,
      () => {
      if (isPlaying && contributionData && week < contributionData.weeks.length - 1) {
      playWeek(week + 1);
      } else {
      stopPlayback();
      }
      }
      );
}

function updateSettings(event: CustomEvent) {
  playbackSettings = event.detail;
}

function toggleTheme() {
  theme = theme === 'light' ? 'dark' : 'light';
}

function generateShareLink(): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}?user=${encodeURIComponent(username)}`;
}

onMount(() => {
    // Check for username in URL params
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    if (userParam) {
    username = userParam;
    fetchContributions();
    }
    });
</script>

<main class="container mx-auto px-4 py-8">
<h1 class="text-3xl font-bold text-center mb-4">GitHub Contributions Music Generator</h1>

<div class="max-w-lg mx-auto mb-8">
<form on:submit|preventDefault={handleSubmit} class="flex gap-2">
<input
type="text"
bind:value={username}
placeholder="Enter GitHub username"
class="flex-grow p-2 border rounded"
/>
<button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">
Generate Music
</button>
</form>
</div>

{#if contributionData}
<div class="mb-8">
<div class="flex justify-between items-center mb-4">
<h2 class="text-xl font-bold">Contributions for @{username}</h2>
<button on:click={toggleTheme} class="px-3 py-1 rounded bg-gray-200">
{theme === 'light' ? '🌙' : '☀️'}
</button>
</div>

<ContributionGraph
{contributionData}
{currentPosition}
{theme}
on:cellClick={(e) => {
     currentPosition = e.detail;
     // Play specific cell if needed
   }}
/>
</div>

<div class="max-w-lg mx-auto mb-8">
<PlaybackControls
{isPlaying}
settings={playbackSettings}
availableScales={audioEngine.getAvailableScales()}
on:togglePlay={togglePlay}
on:updateSettings={updateSettings}
/>
</div>

<div class="max-w-lg mx-auto">
<h3 class="text-lg font-bold mb-2">Share Your Music</h3>
<div class="flex gap-2">
<input
type="text"
readonly
value={generateShareLink()}
class="flex-grow p-2 border rounded"
/>
<button
on:click={() => navigator.clipboard.writeText(generateShareLink())}
class="bg-green-500 text-white px-4 py-2 rounded"
>
Copy Link
</button>
</div>

<div class="flex gap-2 mt-4 justify-center">
<a
href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out the music of my GitHub contributions! ${generateShareLink()}`)}`}
target="_blank"
class="bg-blue-400 text-white px-4 py-2 rounded"
>
Share on Twitter
</a>
<a
href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generateShareLink())}`}
target="_blank"
class="bg-blue-600 text-white px-4 py-2 rounded"
>
Share on Facebook
</a>
</div>
</div>
{/if}
</main>
