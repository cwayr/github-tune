<script lang="ts">
import { onMount } from 'svelte';
import ContributionGraph from '../components/ContributionGraph.svelte';
import PlaybackControls from '../components/PlaybackControls.svelte';
import { audioEngine } from '../lib/audio-engine';
import type { ContributionYear, PlaybackSettings } from '../config/types';

let username = '';
let contributionData: ContributionYear | null = null;
let isPlaying = false;
let currentPosition: { week: number; day: number } | null = null;
let playbackSettings: PlaybackSettings = {
  speed: 1.0,
  scale: audioEngine.getAvailableScales()[0],
  harmony: {
    enabled: false,
    name: 'joyful'
  }
};
let theme: 'light' | 'dark' = 'light';
let loading = false;
let errorMessage = '';
let showIntro = true;
let visualizerMode = false;

const fnUrl = import.meta.env.VITE_FN_URL || 'https://mbmavarqr6s4kqsvpv7g57zqca0gzhtp.lambda-url.us-east-1.on.aws/';
console.log('Frontend FN URL:', fnUrl);

function handleSubmit() {
  if (username) {
    fetchContributions();
    showIntro = false;
  }
}

async function fetchContributions() {
  try {
    loading = true;
    errorMessage = '';
    console.log('Fetching contributions for:', username);
    const response = await fetch(`${fnUrl}contributions?username=${encodeURIComponent(username)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch contributions: ${response.status} ${response.statusText}`);
    }
    
    const jsonText = await response.text();
    
    try {
      contributionData = JSON.parse(jsonText);
      
      currentPosition = null;
      stopPlayback();
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.error('Invalid JSON content:', jsonText);
      throw new Error('Invalid response format from server');
    }
  } catch (err) {
    console.error('Error fetching contributions:', err);
    errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
  } finally {
    loading = false;
  }
}

async function togglePlay() {
  if (isPlaying) {
    stopPlayback();
  } else {
    // Explicitly start Tone.js context on user interaction to comply with browser autoplay policies
    try {
      // Import Tone dynamically to avoid SSR issues
      const Tone = await import('tone');
      await Tone.start();
      console.log('Tone.js context started on user interaction');
      startPlayback();
    } catch (err) {
      console.error('Failed to start Tone.js:', err);
      errorMessage = 'Failed to start audio. Please try again.';
    }
  }
}

function startPlayback() {
  if (!contributionData) return;
  isPlaying = true;
  visualizerMode = true;
  currentPosition = { week: 0, day: 0 };
  playWeek(0);
}

function stopPlayback() {
  isPlaying = false;
  visualizerMode = false;
  audioEngine.stopSound();
  currentPosition = null;
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

function updateSettings(event: CustomEvent | { detail: any }) {
  playbackSettings = event.detail;
}

function toggleTheme() {
  theme = theme === 'light' ? 'dark' : 'light';
  document.body.classList.toggle('dark-mode');
}

function generateShareLink(): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}?user=${encodeURIComponent(username)}`;
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(generateShareLink());
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}

// Check for username in URL params on component mount
onMount(() => {
  const params = new URLSearchParams(window.location.search);
  const userParam = params.get('user');
  if (userParam) {
    username = userParam;
    fetchContributions();
    showIntro = false;
  }
});
</script>

<div class="visualizer-container" class:active={visualizerMode}>
  <div class="visualizer"></div>
</div>

<main class="app-container {theme}">

  <div class="hero-section {contributionData ? 'compact' : ''}">
    <div class="container">
      <div class="hero-content animate-fadeIn">
        <h1 class="site-title">
          <span class="gradient-text">GitHub</span> Tune
        </h1>
        
        {#if showIntro && !contributionData}
          <p class="intro-text animate-slideInUp delay-100">
            Transform your GitHub contributions into music. Enter your username to hear your personalized melody.
          </p>
        {/if}
        
        <div class="search-container animate-slideInUp {showIntro ? 'delay-200' : ''}">
          <form on:submit|preventDefault={handleSubmit} class="search-form">
            <div class="input-wrapper">
              <input
                type="text"
                bind:value={username}
                placeholder="Enter GitHub username"
                class="search-input"
                disabled={loading}
                aria-label="GitHub username"
              />
              <button type="submit" class="btn search-button" disabled={loading || !username}>
                {#if loading}
                  <span class="loading-spinner"></span>
                {:else}
                  <span class="search-icon">🎵</span>
                  <span class="search-text">Generate</span>
                {/if}
              </button>
            </div>
          </form>
          
          {#if errorMessage}
            <div class="error-message">
              <span class="error-icon">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  {#if contributionData}
    <div class="dashboard-container container">
      <div class="controls">
        <button class="btn play-button" on:click={togglePlay} aria-label="Play or pause">
          {#if isPlaying}
            <span class="icon">⏸️</span> Pause
          {:else}
            <span class="icon">▶️</span> Play
          {/if}
        </button>
        
        <button class="btn theme-toggle" on:click={toggleTheme} aria-label="Toggle theme">
          {#if theme === 'light'}
            <span class="icon">🌙</span>
          {:else}
            <span class="icon">☀️</span>
          {/if}
        </button>
        
        <div class="share-button">
          <button class="btn" on:click={copyShareLink} aria-label="Copy share link">
            <span class="icon">🔗</span> Share
          </button>
        </div>
      </div>
      
      <div class="content-grid">
        <div class="graph-panel card">
          <ContributionGraph 
            {contributionData} 
            {currentPosition} 
            {theme} 
            {isPlaying} 
          />
        </div>
        
        <div class="playback-panel card">
          <PlaybackControls 
            on:settingsUpdate={updateSettings} 
            settings={playbackSettings} 
            availableScales={audioEngine.getAvailableScales()}
          />
        </div>
      </div>
    </div>
  {/if}

  <footer class="app-footer">
    <div class="container">
      <p>Created with Tone.js and Svelte</p>
      <p class="footer-note">Piano samples from <a href="https://archive.org/details/SalamanderGrandPianoV3" target="_blank" rel="noopener noreferrer">Salamander Grand Piano</a></p>
    </div>
  </footer>
</main>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  .hero-section {
    padding: 4rem 0;
    text-align: center;
    transition: padding 0.3s ease;
    background-color: var(--light);
  }
  
  .hero-section.compact {
    padding: 2rem 0;
  }
  
  :global(body.dark-mode) .hero-section {
    background-color: var(--dark);
  }
  
  .site-title {
    font-size: 3rem;
    margin-bottom: 1rem;
    letter-spacing: -0.02em;
  }
  
  .intro-text {
    max-width: 640px;
    margin: 0 auto 2rem;
    font-size: 1.125rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
  
  .search-container {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .search-form {
    margin-bottom: 1rem;
  }
  
  .input-wrapper {
    display: flex;
    box-shadow: var(--shadow-md);
    border-radius: var(--radius-md);
    overflow: hidden;
    transition: box-shadow 0.2s ease;
  }
  
  .input-wrapper:focus-within {
    box-shadow: var(--shadow-lg);
  }
  
  :global(body.dark-mode) .input-wrapper {
    box-shadow: var(--shadow-dark-md);
  }
  
  :global(body.dark-mode) .input-wrapper:focus-within {
    box-shadow: var(--shadow-dark-lg);
  }
  
  .search-input {
    flex-grow: 1;
    padding: 0.75rem 1rem;
    border: none;
    background-color: white;
    font-size: 1rem;
    outline: none;
  }
  
  :global(body.dark-mode) .search-input {
    background-color: var(--surface-dark);
    color: var(--light);
  }
  
  .search-button {
    border-radius: 0;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }
  
  .search-icon {
    margin-right: 0.5rem;
  }
  
  .error-message {
    display: flex;
    align-items: center;
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: rgba(239, 68, 68, 0.1);
    border-radius: var(--radius-md);
  }
  
  .error-icon {
    margin-right: 0.5rem;
  }
  
  .dashboard-container {
    flex: 1;
    margin-top: 1rem;
    margin-bottom: 2rem;
  }
  
  .controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  
  .play-button {
    display: flex;
    box-shadow: var(--shadow-md);
    border-radius: var(--radius-md);
    align-items: center;
    overflow: hidden;
    transition: box-shadow 0.2s ease;
    gap: 0.5rem;
  }
  
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .theme-toggle {
    padding: 0.65rem;
    aspect-ratio: 1/1;
    box-shadow: var(--shadow-md);
    border-radius: var(--radius-md);
    align-items: center;
    overflow: hidden;
    transition: box-shadow 0.2s ease;
    gap: 0.5rem;
  }
  
  .share-button {
    margin-left: auto;
    box-shadow: var(--shadow-md);
    border-radius: var(--radius-md);
    align-items: center;
    overflow: hidden;
    transition: box-shadow 0.2s ease;
  }
  
  .content-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  @media (min-width: 768px) {
    .content-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  
  .graph-panel, .playback-panel {
    height: 100%;
  }
  
  .app-footer {
    margin-top: auto;
    padding: 1.5rem 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-align: center;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  :global(body.dark-mode) .app-footer {
    border-color: rgba(255, 255, 255, 0.05);
  }
  
  .footer-note {
    margin-top: 0.5rem;
    font-size: 0.75rem;
  }
  
  .footer-note a {
    color: var(--primary);
    text-decoration: none;
  }
  
  .footer-note a:hover {
    text-decoration: underline;
  }
  
  .loading-spinner {
    display: inline-block;
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
  }
  
  .visualizer-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
  }
  
  .visualizer-container.active {
    z-index: 0;
    opacity: 1;
  }
  
  .visualizer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.7) 100%);
    backdrop-filter: blur(8px);
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.8s ease-out;
  }
  
  .animate-slideInUp {
    animation: slideInUp 0.5s ease-out;
  }
  
  .delay-100 {
    animation-delay: 100ms;
  }
  
  .delay-200 {
    animation-delay: 200ms;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
