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
  <div class="control-section
