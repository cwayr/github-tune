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
    console.log('Fetching contributions for:', username);
    const response = await fetch(`${fnUrl}/contributions?username=${encodeURIComponent(username)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch contributions: ${response.status} ${response.statusText}`);
    }
    
    const jsonText = await response.text();
    console.log('Raw response:', jsonText);
    
    try {
      // Parse the JSON response and assign it to the contributionData variable
      contributionData = JSON.parse(jsonText);
      console.log('Parsed contributionData:', contributionData);
      
      // Reset the playback position
      currentPosition = null;
      stopPlayback();
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.error('Invalid JSON content:', jsonText);
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Error fetching contributions:', error);
    alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
  }
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
  // Clear the current position to remove highlighting
  currentPosition = null;
}

function playWeek(week: number) {
  if (!isPlaying || !contributionData) return;

  // Update current position to highlight the entire week
  currentPosition = { week, day: 0 };
  
  // Play the sound for this week
  audioEngine.playContributionWeek(
    week,
    contributionData,
    playbackSettings,
    () => {
      // Move to the next week if we're still playing and there are more weeks
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
Generate
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
Share on X
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
