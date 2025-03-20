<script lang="ts">
  import type { PlaybackSettings, MusicScale } from '../config/types';
  import { getAvailableHarmonies, type Harmony } from '../lib/harmonies';
  
  const { isPlaying = false, settings, availableScales = [], inflate } = $props<{
    isPlaying: boolean;
    settings: PlaybackSettings;
    availableScales: MusicScale[];
    inflate: (event: string, data?: any) => void;
  }>();
  
  // Get all available harmonies
  const availableHarmonies = getAvailableHarmonies();
  
  function togglePlay() {
    inflate('togglePlay');
  }
  
  function updateSpeed(event: Event) {
    const target = event.target as HTMLInputElement;
    inflate('updateSettings', { 
      ...settings, 
      speed: parseFloat(target.value) 
    });
  }
  

  
  function selectScale(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedScale = availableScales.find((s: MusicScale) => s.name === target.value);
    if (selectedScale) {
      inflate('updateSettings', { 
        ...settings, 
        scale: selectedScale 
      });
    }
  }
  
  function toggleHarmony() {
    inflate('updateSettings', {
      ...settings,
      harmony: {
        ...settings.harmony,
        enabled: !settings.harmony.enabled
      }
    });
  }
  
  function selectHarmony(event: Event) {
    const target = event.target as HTMLSelectElement;
    inflate('updateSettings', {
      ...settings,
      harmony: {
        ...settings.harmony,
        name: target.value
      }
    });
  }
  

</script>

<div class="playback-controls">
  <div class="control-header">
    <h3 class="control-title">Playback Settings</h3>
  </div>
  
  <div class="control-main">
    <div class="play-control">
      <button 
        onclick={togglePlay} 
        class="play-button {isPlaying ? 'playing' : ''}"
        aria-label={isPlaying ? 'Stop playback' : 'Start playback'}
      >
        <span class="play-icon">{isPlaying ? '❚❚' : '▶'}</span>
        <span class="play-text">{isPlaying ? 'Stop' : 'Play'}</span>
      </button>
    </div>
    
    <div class="controls-grid">
      <!-- Speed and Harmony in the first row -->
      <div class="control-section">
        <label for="speed" class="control-label">
          <span class="label-text">Speed</span>
          <span class="value-badge">{settings.speed.toFixed(1)}x</span>
        </label>
        <div class="slider-container">
          <input 
            id="speed" 
            type="range" 
            min="0.5" 
            max="2" 
            step="0.1" 
            value={settings.speed} 
            oninput={updateSpeed} 
            class="slider speed-slider"
          />
          <div class="slider-labels">
            <span>0.5x</span>
            <span>2x</span>
          </div>
        </div>
      </div>

      <!-- Harmony controls -->
      <div class="control-section harmony-section">
        <div class="harmony-header">
          <label for="harmony" class="control-label">Harmony</label>
          <label class="toggle-switch">
            <input 
              type="checkbox" 
              checked={settings.harmony.enabled}
              onchange={toggleHarmony}
            />
            <span class="toggle-slider"></span>
          </label>
        </div>
        
        <div class="harmony-controls" class:disabled={!settings.harmony.enabled}>
          <div class="select-container">
            <select 
              id="harmony" 
              onchange={selectHarmony} 
              class="harmony-select"
              disabled={!settings.harmony.enabled}
            >
              {#each availableHarmonies as harmony}
                <option value={harmony.name.toLowerCase()} selected={settings.harmony.name === harmony.name.toLowerCase()}>
                  {harmony.name}
                </option>
              {/each}
            </select>
            <span class="select-arrow">▼</span>
          </div>
          

        </div>
      </div>

      <!-- Mood in the second row -->
      <div class="control-section scale-section">
        <label for="scale" class="control-label">Mood</label>
        <div class="select-container">
          <select 
            id="scale" 
            onchange={selectScale} 
            class="scale-select"
          >
            {#each availableScales as scale}
              <option value={scale.name} selected={settings.scale.name === scale.name}>
                {scale.name}
              </option>
            {/each}
          </select>
          <span class="select-arrow">▼</span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .playback-controls {
    overflow: hidden;
  }
  
  .control-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .control-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }
  
  .control-main {
    padding: 1.5rem;
  }
  
  .play-control {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }
  
  .play-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: 3rem;
    padding: 0.75rem 2.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .play-button:hover {
    background-color: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
  
  .play-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .play-button.playing {
    background-color: #ef4444;
  }
  
  .play-button.playing:hover {
    background-color: #dc2626;
  }
  
  .play-icon {
    margin-right: 0.5rem;
    font-size: 1.2rem;
  }
  
  .controls-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  /* Harmony section styles are now handled in media queries */
  
  .harmony-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .harmony-controls {
    opacity: 1;
    transition: opacity 0.3s ease;
  }
  
  .harmony-controls.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
  
  
  /* Toggle switch styles */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
  }
  
  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
  }
  
  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
  }
  
  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  
  input:checked + .toggle-slider {
    background-color: var(--primary);
  }
  
  input:checked + .toggle-slider:before {
    transform: translateX(26px);
  }
  
  @media (min-width: 640px) {
    .controls-grid {
      grid-template-columns: 1fr 1fr;
    }
    
    .scale-section {
      grid-column: span 2;
    }
  }
  
  @media (max-width: 639px) {
    /* On mobile, stack the controls vertically */
    .harmony-section {
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      padding-top: 1.5rem;
      margin-top: 0.5rem;
    }
  }
  
  .control-section {
    margin-bottom: 0;
  }
  
  .control-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }
  
  .value-badge {
    background-color: var(--gray-light);
    padding: 0.25rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.8rem;
    font-weight: 700;
  }
  
  .slider-container {
    position: relative;
  }
  
  .slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: #e5e7eb;
    outline: none;
    transition: background 0.2s;
  }
  
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: all 0.2s;
  }
  
  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: all 0.2s;
    border: none;
  }
  
  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  }
  
  .slider::-moz-range-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  }
  
  .slider-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .scale-select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background-color: white;
    font-size: 1rem;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    cursor: pointer;
  }
  
  .select-container {
    position: relative;
  }
  
  .select-arrow {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  /* For dark mode compatibility */
  :global(body.dark-mode) .value-badge {
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }
  
  :global(body.dark-mode) .slider {
    background: rgba(255, 255, 255, 0.2);
  }
  
  :global(body.dark-mode) .scale-select {
    background-color: var(--surface-dark);
    border-color: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  :global(body.dark-mode) .select-arrow,
  :global(body.dark-mode) .slider-labels {
    color: rgba(255, 255, 255, 0.6);
  }
</style>
