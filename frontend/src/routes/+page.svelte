<script lang="ts">
import { onMount } from 'svelte';
import ContributionGraph from '../components/ContributionGraph.svelte';
import PlaybackControls from '../components/PlaybackControls.svelte';
import { audioEngine } from '../lib/audio-engine';
import type { ContributionYear, PlaybackSettings } from '../config/types';

// State variables
let username = '';
let contributionData: ContributionYear | null = null;
let isPlaying = false;
let currentPosition: { week: number; day: number } | null = null;
let playbackSettings: PlaybackSettings = {
  speed: 1.0,
  scale: audioEngine.getAvailableScales()[0],
  harmony: {
    enabled: true,
    name: 'simple'
  }
};
let theme: 'light' | 'dark' = 'light';
let loading = false;
let errorMessage = '';
let showIntro = true;
let visualizerMode = false;

// API URL
const fnUrl = import.meta.env.VITE_FN_URL || 'https://mbmavarqr6s4kqsvpv7g57zqca0gzhtp.lambda-url.us-east-1.on.aws/';
console.log('Frontend FN URL:', fnUrl);

// Handle form submission
function handleSubmit() {
  if (username) {
    fetchContributions();
    showIntro = false;
  }
}

// Fetch user's GitHub contributions
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
      // Parse the JSON response and assign it to the contributionData variable
      contributionData = JSON.parse(jsonText);
      
      // Reset the playback position
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

// Toggle playback state
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

// Start the playback
function startPlayback() {
  if (!contributionData) return;
  isPlaying = true;
  visualizerMode = true;
  currentPosition = { week: 0, day: 0 };
  playWeek(0);
}

// Stop the playback
function stopPlayback() {
  isPlaying = false;
  visualizerMode = false;
  audioEngine.stopSound();
  // Clear the current position to remove highlighting
  currentPosition = null;
}

// Play a specific week
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

// Update playback settings
function updateSettings(event: CustomEvent | { detail: any }) {
  playbackSettings = event.detail;
}

// Toggle between light and dark theme
function toggleTheme() {
  theme = theme === 'light' ? 'dark' : 'light';
  document.body.classList.toggle('dark-mode');
}

// Generate a shareable link
function generateShareLink(): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}?user=${encodeURIComponent(username)}`;
}

// Copy the share link to clipboard
async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(generateShareLink());
    // You could add a toast notification here
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
          <span class="gradient-text" data-text="GitHub">GitHub</span> Tune
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
                  <span class="search-text">Generate Music</span>
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
    <div class="content-section">
      <div class="container">
        <div class="header-row animate-fadeIn">
          <h2 class="section-title">
            <span class="username">@{username}'s</span> 
            <span class="text-gradient">GitHub Tune</span>
          </h2>
          <button on:click={toggleTheme} class="theme-toggle" aria-label="Toggle dark mode">
            <span class="toggle-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
          </button>
        </div>
        
        <div class="grid-layout">
          <div class="graph-container card animate-fadeIn">
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
          
          <div class="controls-container card animate-fadeIn delay-100">
            <PlaybackControls
              {isPlaying}
              settings={playbackSettings}
              availableScales={audioEngine.getAvailableScales()}
              inflate={(event, data) => {
                if (event === 'togglePlay') {
                  togglePlay();
                } else if (event === 'updateSettings' && data) {
                  updateSettings({ detail: data });
                }
              }}
            />
          </div>
        </div>
        
        <div class="share-container card animate-fadeIn delay-200">
          <div class="card-header">
            <h3 class="share-title">Share Your Musical Creation</h3>
          </div>
          
          <div class="card-body">

            <div class="social-share-container">
              <button
                on:click={copyShareLink}
                class="btn btn-secondary copy-button shadow-hover"
                aria-label="Copy link to clipboard"
              >
                <span class="copy-icon">📋</span>
                <span>Copy link</span>
              </button>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Listen to the melody of my GitHub contributions! ${generateShareLink()}`)}`}
                class="btn-social twitter shadow-hover"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on Twitter"
              >
                <span class="icon">𝕏</span>
                <span>Share on X</span>
              </a>
              
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generateShareLink())}`}
                class="btn-social facebook shadow-hover"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on Facebook"
              >
                <span class="icon">f</span>
                <span>Share on Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</main>

<footer class="app-footer">
  <div class="container">
    <p>Created with Tone.js and Svelte.</p>
    <p class="footer-note">Piano samples from Alexander Holm's <b><a href="https://archive.org/details/SalamanderGrandPianoV3" target="_blank" rel="noopener noreferrer">Salamander Grand Piano</a></b>.</p>
  </div>
</footer>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  .hero-section {
    background: linear-gradient(135deg, #0f172a 0%, #312e81 50%, #581c87 100%);
    color: white;
    padding: 6rem 1rem;
    text-align: center;
    transition: all 0.5s ease;
    position: relative;
    overflow: hidden;
  }
  
  .hero-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0,0 L100,0 L100,5 C75,15 25,15 0,5 Z" fill="rgba(255,255,255,0.2)" /></svg>');
    background-size: 100% 100%;
    pointer-events: none;
  }
  
  .hero-section::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at top right, rgba(79, 70, 229, 0.3) 0%, transparent 50%),
      radial-gradient(circle at bottom left, rgba(147, 51, 234, 0.2) 0%, transparent 50%);
    pointer-events: none;
  }
  
  .hero-section.compact {
    padding: 3rem 1rem;
  }
  
  .hero-content {
    position: relative;
    z-index: 2;
  }
  
  .site-title {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    letter-spacing: -0.05em;
    line-height: 1.1;
    text-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }
  
  .intro-text {
    font-size: 1.4rem;
    max-width: 650px;
    margin: 0 auto 3rem;
    opacity: 0.95;
    font-weight: 400;
    line-height: 1.6;
  }
  
  .search-container {
    max-width: 650px;
    margin: 0 auto;
  }
  
  .input-wrapper {
    display: flex;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: var(--radius-full);
    padding: 0.5rem;
    box-shadow: var(--shadow-lg);
    border: 1px solid rgba(255,255,255,0.2);
    overflow: hidden;
  }
  
  .search-form {
    width: 100%;
  }
  
  .search-input {
    flex-grow: 1;
    padding: 1rem 1.5rem;
    border: none;
    font-size: 1.1rem;
    outline: none;
    background: transparent;
    color: white;
    width: 100%;
  }
  
  .search-input::placeholder {
    color: rgba(255,255,255,0.7);
  }
  
  .search-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    color: var(--primary);
    border: none;
    border-radius: var(--radius-full);
    padding: 1rem 1.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  .search-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .search-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  
  .search-icon {
    margin-right: 0.5rem;
  }
  
  .error-message {
    margin-top: 1rem;
    padding: 1rem;
    background-color: rgba(239, 68, 68, 0.2);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border-radius: var(--radius-md);
    color: white;
    display: flex;
    align-items: center;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  
  .error-icon {
    margin-right: 0.75rem;
    font-size: 1.2rem;
  }
  
  .content-section {
    padding: 3rem 1rem;
    flex-grow: 1;
  }
  
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2.5rem;
  }
  
  .section-title {
    font-size: 2rem;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: baseline;
  }
  
  .section-title .username {
    font-weight: 400;
    color: var(--text-secondary);
  }
  
  .theme-toggle {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--surface);
    box-shadow: var(--shadow-md);
    transition: all 0.3s ease;
  }
  
  .theme-toggle:hover {
    transform: rotate(20deg) scale(1.1);
    box-shadow: var(--shadow-lg);
  }

  :global(body.dark-mode) .theme-toggle {
    background-color: var(--surface-dark);
  }
  
  .grid-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
  }
  
  @media (min-width: 1024px) {
    .grid-layout {
      grid-template-columns: 2fr 1fr;
    }
  }
  
  .graph-container {
    overflow: hidden;
  }
  
  .controls-container {
    overflow: hidden;
  }
  
  .share-container {
    overflow: hidden;
  }
  
  .share-title {
    font-size: 1.25rem;
    margin: 0;
  }
  
  .share-link-container {
    margin-bottom: 2rem;
  }
  
  .link-field {
    display: flex;
    border: 1px solid #e5e7eb;
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  
  .share-input {
    flex-grow: 1;
    padding: 0.75rem 1rem;
    border: none;
    font-size: 0.95rem;
    outline: none;
    color: var(--text-secondary);
    background-color: var(--surface);
  }
  
  .copy-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.25rem;
    border: none;
    background-color: var(--secondary);
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  .copy-icon {
    margin-right: 0.5rem;
  }
  
  .social-share-container {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .btn-social {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-md);
    color: white;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }
  
  .twitter {
    background-color: #000000;
  }
  
  .facebook {
    background-color: #4267B2;
  }
  
  .icon {
    margin-right: 0.75rem;
    font-weight: bold;
  }
  
  .app-footer {
    text-align: center;
    padding: 2rem 1rem;
    background-color: var(--dark);
    color: white;
  }
  
  .footer-note {
    font-size: 0.9rem;
    opacity: 0.7;
    margin-top: 0.5rem;
  }
  
  .heart {
    color: #ff4d4d;
    display: inline-block;
    animation: pulse 1.5s infinite;
  }
  
  .loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Visualizer styling */
  .visualizer-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0;
    z-index: -1;
    transition: opacity 0.5s ease;
  }
  
  .visualizer-container.active {
    opacity: 0.3;
    z-index: 0;
  }
  
  /* Responsive styling */
  @media (max-width: 768px) {
    .site-title {
      font-size: 2.75rem;
      margin-bottom: 1rem;
    }
    
    .intro-text {
      font-size: 1.1rem;
      margin-bottom: 2rem;
    }
    
    .hero-section {
      padding: 4rem 1rem;
    }
    
    .hero-section.compact {
      padding: 2rem 1rem;
    }
    
    .input-wrapper {
      flex-direction: column;
      border-radius: var(--radius-lg);
    }
    
    .search-input {
      padding: 0.75rem 1rem;
      width: 100%;
      text-align: center;
    }
    
    .search-button {
      width: 100%;
      margin-top: 0.5rem;
      border-radius: var(--radius-md);
    }
    
    .section-title {
      font-size: 1.5rem;
    }
    
    .share-link-container {
      flex-direction: column;
    }
    
    .social-share-container {
      justify-content: center;
    }
  }
  
  @media (max-width: 480px) {
    .site-title {
      font-size: 2rem;
    }
    
    .section-title {
      font-size: 1.5rem;
    }
  }
</style>
