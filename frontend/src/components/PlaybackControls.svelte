<script lang="ts">
  import type { PlaybackSettings, MusicScale } from '../config/types';
  import { getAvailableHarmonies, audioEngine } from '$lib';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let settings: PlaybackSettings;
  
  const availableHarmonies = getAvailableHarmonies();
  
  function updateSettings(newSettings: PlaybackSettings) {
    dispatch('settingsUpdate', newSettings);
  }
  
  function updateSpeed(event: Event) {
    const target = event.target as HTMLInputElement;
    updateSettings({ 
      ...settings, 
      speed: parseFloat(target.value) 
    });
  }
  
  function selectMoodOrHarmony(event: Event) {
    const target = event.target as HTMLSelectElement;
    
    if (settings.harmony.enabled) {
      updateSettings({
        ...settings,
        harmony: {
          ...settings.harmony,
          name: target.value
        }
      });
    } else {
      const selectedScale = audioEngine.getAvailableScales(false).find((s: MusicScale) => s.name === target.value);
      if (selectedScale) {
        updateSettings({ 
          ...settings, 
          scale: selectedScale 
        });
      }
    }
  }
  
  function toggleHarmony() {
    updateSettings({
      ...settings,
      harmony: {
        ...settings.harmony,
        enabled: !settings.harmony.enabled
      }
    });
  }
</script>

<div class="playback-controls">
  <div class="control-header">
    <h3 class="control-title">Playback Settings</h3>
  </div>
  
  <div class="control-main">
    <div class="controls-grid">
      <div class="control-section">
        <div class="control-label-container">
          <label for="speed" class="control-label">Speed</label>
          <span class="value-badge">{settings.speed.toFixed(1)}x</span>
        </div>
        <div class="slider-container">
          <input 
            id="speed" 
            type="range" 
            min="0.5" 
            max="2" 
            step="0.1" 
            value={settings.speed} 
            on:input={updateSpeed} 
            class="slider speed-slider"
          />
          <div class="slider-labels">
            <span>0.5x</span>
            <span>2x</span>
          </div>
        </div>
      </div>

      <div class="control-section harmony-section">
        <div class="harmony-header">
          <label class="control-label">Mode</label>
          <div class="mode-toggle">
            <span class="mode-label">Simple</span>
            <label class="toggle-switch">
              <input 
                type="checkbox" 
                checked={settings.harmony.enabled}
                on:change={toggleHarmony}
              />
              <span class="toggle-slider"></span>
            </label>
            <span class="mode-label">Harmonized</span>
          </div>
        </div>
        <div class="harmony-description">
          <p class="mode-description">
            {settings.harmony.enabled ? 
              'Uses harmonizing chords and changing scales' : 
              'Only plays notes from days with contributions'}
          </p>
        </div>
      </div>

      <div class="control-section scale-section">
        <label for="mood-or-harmony" class="control-label">Mood</label>
        <div class="select-container">
          <select 
            id="mood-or-harmony" 
            on:change={selectMoodOrHarmony} 
            class="scale-select"
          >
            {#if settings.harmony.enabled}
              {#each availableHarmonies as harmony}
                <option value={harmony.name.toLowerCase()} selected={settings.harmony.name === harmony.name.toLowerCase()}>
                  {harmony.name}
                </option>
              {/each}
            {:else}
              {#each audioEngine.getAvailableScales(false) as scale}
                <option value={scale.name} selected={settings.scale.name === scale.name}>
                  {scale.name}
                </option>
              {/each}
            {/if}
          </select>
          <span class="select-arrow">▼</span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .playback-controls {
    width: 100%;
    height: 100%;
  }
  
  .control-header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  }
  
  .control-title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
  }
  
  .control-main {
    padding: 1.25rem;
  }
  
  .controls-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .control-section {
    width: 100%;
  }
  
  .control-label-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .control-label {
    font-weight: 500;
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
    display: block;
  }
  
  .value-badge {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  
  .slider-container {
    position: relative;
    width: 100%;
    margin: 0.25rem 0 0.5rem;
  }
  
  .slider {
    -webkit-appearance: none;
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: var(--primary-gradient-transparent);
    outline: none;
    transition: all 0.3s ease;
  }
  
  .slider:hover {
    background: var(--primary-gradient-transparent);
  }
  
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-sm);
  }
  
  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow: var(--shadow-md);
  }
  
  .slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-sm);
    border: none;
  }
  
  .slider::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow: var(--shadow-md);
  }
  
  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }
  
  .harmony-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .mode-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .mode-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 38px;
    height: 20px;
  }
  
  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--text-muted);
    transition: .3s;
    border-radius: 20px;
  }
  
  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .3s;
    border-radius: 50%;
  }
  
  input:checked + .toggle-slider {
    background-color: var(--primary);
  }
  
  input:focus + .toggle-slider {
    box-shadow: 0 0 1px var(--primary);
  }
  
  input:checked + .toggle-slider:before {
    transform: translateX(18px);
  }
  
  .harmony-description {
    margin-top: 0.25rem;
  }
  
  .mode-description {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.4;
  }
  
  .scale-section {
    margin-top: 0.25rem;
  }
  
  .select-container {
    position: relative;
    width: 100%;
  }
  
  .scale-select {
    width: 100%;
    padding: 0.6rem 0.75rem;
    font-size: 0.95rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: var(--radius-md);
    appearance: none;
    background-color: white;
    color: var(--text-primary);
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .scale-select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  .select-arrow {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    font-size: 0.6rem;
    color: var(--text-secondary);
  }
  
  :global(body.dark-mode) .scale-select {
    background-color: var(--surface-dark);
    border-color: rgba(255, 255, 255, 0.1);
    color: var(--light);
  }
  
  :global(body.dark-mode) .control-header {
    border-color: rgba(255, 255, 255, 0.03);
  }
</style>
