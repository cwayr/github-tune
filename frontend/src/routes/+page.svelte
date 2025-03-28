<script lang="ts">
import { onMount } from 'svelte';
import Music from '@lucide/svelte/icons/music';
import Play from '@lucide/svelte/icons/play';
import Square from '@lucide/svelte/icons/square';
import Moon from '@lucide/svelte/icons/moon';
import Sun from '@lucide/svelte/icons/sun';
import Share from '@lucide/svelte/icons/share';
import Volume2 from '@lucide/svelte/icons/volume-2';
import ContributionGraph from '../components/ContributionGraph.svelte';
import PlaybackControls from '../components/PlaybackControls.svelte';
import Tip from '../components/Tip.svelte';
import { audioEngine } from '../lib/audio-engine';
import { getAvailableHarmonies } from '../lib/harmonies';
import type { AllContributions, PlaybackSettings } from '../config/types';

let username = '';
let contributionData: AllContributions | null = null;
let selectedYear = 'lastYear';
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

let showSoundTip = false;
let showHarmonyTip = false;
let showCopiedTip = false;
let soundTipShown = false;
let harmonyTipShown = false;

let soundTipTimer: ReturnType<typeof setTimeout> | null = null;
let harmonyTipTimer: ReturnType<typeof setTimeout> | null = null;
let copiedTipTimer: ReturnType<typeof setTimeout> | null = null;

const tipDuration = 6000;

const fnUrl = import.meta.env.VITE_FN_URL || 'https://fbtkl3zagxhvs5yk7yenkry7xi0sexiq.lambda-url.us-east-1.on.aws/';
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
    
    let url = `${fnUrl}contributions?username=${encodeURIComponent(username)}`;
    if (selectedYear !== 'lastYear') {
      url += `&year=${selectedYear}`;
    }
    
    const response = await fetch(url);
    
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
    try {
      const Tone = await import('tone');
      await Tone.start();
      console.log('Tone.js context started on user interaction');
      startPlayback();
      
      showSoundTip = false;
      
      if (!soundTipShown) {
        soundTipShown = true;
        try {
          localStorage.setItem('soundTipShown', 'true');
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
      }
      
      if (!harmonyTipShown && !playbackSettings.harmony.enabled) {
        setTimeout(() => {
          if (!playbackSettings.harmony.enabled) {
            showHarmonyTip = true;
            
            harmonyTipTimer = setTimeout(() => {
              showHarmonyTip = false;
            }, tipDuration);
          }
        }, 5000);
      }
    } catch (err) {
      console.error('Failed to start Tone.js:', err);
      errorMessage = 'Failed to start audio. Please try again.';
    }
  }
}

function startPlayback() {
  if (!contributionData || !contributionData[selectedYear]) return;
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
  if (!isPlaying || !contributionData || !contributionData[selectedYear]) return;

  currentPosition = { week, day: 0 };
  
  audioEngine.playContributionWeek(
    week,
    contributionData[selectedYear],
    playbackSettings,
    () => {
      if (isPlaying && contributionData && contributionData[selectedYear] && week < contributionData[selectedYear].weeks.length - 1) {
        playWeek(week + 1);
      } else {
        stopPlayback();
      }
    }
  );
}

function updateSettings(event: CustomEvent | { detail: any }) {
  playbackSettings = event.detail;
  
  if (playbackSettings.harmony.enabled) {
    if (!harmonyTipShown) {
      harmonyTipShown = true;
      // Save to localStorage that harmony tip has been shown
      try {
        localStorage.setItem('harmonyTipShown', 'true');
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
    }
    
    showHarmonyTip = false;
    
    if (harmonyTipTimer) {
      clearTimeout(harmonyTipTimer);
      harmonyTipTimer = null;
    }
  }
}

function toggleTheme() {
  theme = theme === 'light' ? 'dark' : 'light';
  document.body.classList.toggle('dark-mode');
  
  // Save theme preference to local storage
  try {
    localStorage.setItem('theme', theme);
  } catch (e) {
    console.warn('Could not save theme preference to localStorage:', e);
  }
}

function generateShareLink(): string {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams();
  
  // Add username
  params.set('user', username);
  
  // Add selected year if it's not the default
  if (selectedYear !== 'lastYear') {
    params.set('year', selectedYear);
  }
  
  // Add playback settings
  params.set('speed', playbackSettings.speed.toString());
  params.set('harmony', playbackSettings.harmony.enabled ? '1' : '0');
  params.set('mood', playbackSettings.harmony.enabled ? 
    playbackSettings.harmony.name : 
    playbackSettings.scale.name);
  
  return `${baseUrl}?${params.toString()}`;
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(generateShareLink());
    
    showCopiedTip = true;
    
    if (copiedTipTimer) clearTimeout(copiedTipTimer);
    
    copiedTipTimer = setTimeout(() => {
      showCopiedTip = false;
    }, tipDuration);
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}

onMount(() => {
  // Check localStorage for previously shown tips and theme preference
  try {
    soundTipShown = localStorage.getItem('soundTipShown') === 'true';
    harmonyTipShown = localStorage.getItem('harmonyTipShown') === 'true';
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      theme = savedTheme;
      if (theme === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
  } catch (e) {
    console.warn('LocalStorage not available:', e);
  }

  const params = new URLSearchParams(window.location.search);
  const userParam = params.get('user');
  
  if (userParam) {
    username = userParam;
    
    const yearParam = params.get('year');
    if (yearParam) {
      selectedYear = yearParam;
    }
    
    const speedParam = params.get('speed');
    if (speedParam) {
      const speed = parseFloat(speedParam);
      if (!isNaN(speed) && speed >= 0.5 && speed <= 2.0) {
        playbackSettings.speed = speed;
      }
    }
    
    const harmonyParam = params.get('harmony');
    if (harmonyParam) {
      playbackSettings.harmony.enabled = harmonyParam === '1';
    }
    
    const moodParam = params.get('mood');
    if (moodParam) {
      if (playbackSettings.harmony.enabled) {
        const availableHarmonies = getAvailableHarmonies().map((h: { name: string }) => h.name.toLowerCase());
        if (availableHarmonies.includes(moodParam.toLowerCase())) {
          playbackSettings.harmony.name = moodParam.toLowerCase();
        }
      } else {
        const availableScales = audioEngine.getAvailableScales(false);
        const scale = availableScales.find(s => s.name.toLowerCase() === moodParam.toLowerCase());
        if (scale) {
          playbackSettings.scale = scale;
        }
      }
    }
    
    fetchContributions();
    showIntro = false;
  }
  
  setTimeout(() => {
    if (!isPlaying && !soundTipShown) {
      showSoundTip = true;
      soundTipTimer = setTimeout(() => {
        showSoundTip = false;
      }, tipDuration);
    }
  }, 3000);
});
</script>

<div class="visualizer-container" class:active={visualizerMode}>
  <div class="visualizer"></div>
</div>

{#if showSoundTip}
  <Tip 
    message="Make sure your device sound is on!" 
    icon={Volume2} 
    theme={theme} 
    tipType="sound-tip"
    duration={tipDuration}
    on:close={() => {
      showSoundTip = false;
      if (soundTipTimer) clearTimeout(soundTipTimer);
    }}
  />
{/if}

{#if showHarmonyTip}
  <Tip 
    message="Try 'Harmonized Mode' for preset chord progressions!" 
    icon={Music} 
    theme={theme} 
    tipType="harmony-tip"
    duration={tipDuration}
    on:close={() => {
      showHarmonyTip = false;
      if (harmonyTipTimer) clearTimeout(harmonyTipTimer);
    }}
  />
{/if}

{#if showCopiedTip}
  <Tip 
    message="Link copied to clipboard." 
    icon={Share} 
    theme={theme} 
    tipType="copied-tip"
    duration={tipDuration}
    on:close={() => {
      showCopiedTip = false;
      if (copiedTipTimer) clearTimeout(copiedTipTimer);
    }}
  />
{/if}

<main class="app-container {theme}">

  <div class="hero-section {contributionData ? 'compact' : ''}">
    <div class="container">
      <div class="hero-content animate-fadeIn">
        <h1 class="site-title">
          <span class="gradient-text">GitHub</span> Tune
        </h1>
        
        {#if showIntro && !contributionData}
          <p class="intro-text animate-slideInUp delay-100">
            Transform your GitHub contributions into music.
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
                  <Music size={16}/> Generate
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
            <Square size={16}/> Stop
          {:else}
            <Play size={16}/> Play tune
          {/if}
        </button>
        
        <div class="right-controls">
          <button class="btn share-button" on:click={copyShareLink} aria-label="Copy share link">
            <Share size={16}/> <span>Share</span>
          </button>
          
          <button class="btn theme-toggle" on:click={toggleTheme} aria-label="Toggle theme">
            {#if theme === 'light'}
              <Moon size={24}/>
            {:else}
              <Sun size={24}/>
            {/if}
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
            {selectedYear}
            onYearChange={(year) => {
              selectedYear = year;
              stopPlayback();
              currentPosition = null;
            }}
          />
        </div>
        
        <div class="playback-panel card">
          <PlaybackControls 
            on:settingsUpdate={updateSettings} 
            settings={playbackSettings} 
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
    gap: 0.5rem;
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
    margin-top: 0.75rem;
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
    background-color: var(--surface);
    box-shadow: var(--shadow-md);
    border-radius: var(--radius-md);
    align-items: center;
    overflow: hidden;
    transition: box-shadow 0.2s ease, background-color 0.3s ease;
    gap: 0.5rem;
  }
  
  :global(body.dark-mode) .play-button {
    background-color: var(--surface-dark);
    box-shadow: var(--shadow-dark-md);
  }
  
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .theme-toggle {
    background-color: var(--surface);
    box-shadow: var(--shadow-md);
    border-radius: var(--radius-md);
    align-items: center;
    overflow: hidden;
    transition: box-shadow 0.2s ease, background-color 0.3s ease;
    gap: 0.5rem;
  }
  
  :global(body.dark-mode) .theme-toggle {
    background-color: var(--surface-dark);
    box-shadow: var(--shadow-dark-md);
  }
  
  .right-controls {
    display: flex;
    margin-left: auto;
    gap: 0.75rem;
    align-items: center;
  }

  .share-button {
    background-color: var(--surface);
    box-shadow: var(--shadow-md);
    border-radius: var(--radius-md);
    align-items: center;
    overflow: hidden;
    transition: box-shadow 0.2s ease, background-color 0.3s ease;
    display: flex;
    gap: 0.5rem;
  }
  
  :global(body.dark-mode) .share-button {
    background-color: var(--surface-dark);
    box-shadow: var(--shadow-dark-md);
  }
  
  .content-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .content-grid {
      grid-template-columns: 2fr 1fr;
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
    border: 2px solid rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    border-top-color: black;
    animation: spin 1s ease-in-out infinite;
  }

  :global(body.dark-mode) .loading-spinner {
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
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
  
  @keyframes slide-in {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
