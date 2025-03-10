<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PlaybackSettings, MusicScale } from '../config/types';
  
  export let isPlaying: boolean = false;
  export let settings: PlaybackSettings;
  export let availableScales: MusicScale[] = [];
  
  const dispatch = createEventDispatcher();
  
  function togglePlay() {
    dispatch('togglePlay');
  }
  
  function updateSpeed(event: Event) {
    const target = event.target as HTMLInputElement;
    dispatch('updateSettings', { 
      ...settings, 
      speed: parseFloat(target.value) 
    });
  }
  
  function updateVolume(event: Event) {
    const target = event.target as HTMLInputElement;
    dispatch('updateSettings', { 
      ...settings, 
      volume: parseFloat(target.value) 
    });
  }
  
  function selectScale(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedScale = availableScales.find(s => s.name === target.value);
    if (selectedScale) {
      dispatch('updateSettings', { 
        ...settings, 
        scale: selectedScale 
      });
    }
  }
</script>

<div class="playback-controls">
  <div class="control-section">
    <button 
      on:click={togglePlay} 
      class="play-button bg-blue-500 text-white px-4 py-2 rounded"
    >
      {isPlaying ? 'Stop' : 'Play'}
    </button>
  </div>

  <div class="control-section">
    <label for="speed">
      Speed: {settings.speed.toFixed(1)}x
    </label>
    <input 
      id="speed" 
      type="range" 
      min="0.5" 
      max="3" 
      step="0.1" 
      value={settings.speed} 
      on:input={updateSpeed} 
      class="w-full"
    />
  </div>

  <div class="control-section">
    <label for="volume">
      Volume: {Math.round(settings.volume * 100)}%
    </label>
    <input 
      id="volume" 
      type="range" 
      min="0" 
      max="1" 
      step="0.01" 
      value={settings.volume} 
      on:input={updateVolume} 
      class="w-full"
    />
  </div>

  <div class="control-section">
    <label for="scale">Musical Scale:</label>
    <select 
      id="scale" 
      on:change={selectScale} 
      class="w-full p-2 border rounded"
    >
      {#each availableScales as scale}
        <option value={scale.name} selected={settings.scale.name === scale.name}>
          {scale.name}
        </option>
      {/each}
    </select>
  </div>
</div>

<style>
  .playback-controls {
    background-color: #f6f8fa;
    border-radius: 6px;
    padding: 1rem;
  }

  .control-section {
    margin-bottom: 1rem;
  }

  .control-section:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  input[type="range"] {
    width: 100%;
  }
</style>
