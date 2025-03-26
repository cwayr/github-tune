<script lang="ts">
  import { onMount } from 'svelte';
  import Tip from './Tip.svelte';
  
  export let isPlaying: boolean = false;
  export let harmony: { enabled: boolean; name: string } = { enabled: false, name: 'joyful' };
  
  let soundTipShown = false;
  let harmonyTipShown = false;
  let showSoundTip = false;
  let showHarmonyTip = false;
  
  onMount(() => {
    console.log('TipManager mounted, isPlaying:', isPlaying, 'harmony:', harmony);
    
    if (!isPlaying && !soundTipShown) {
      setTimeout(() => {
        console.log('Showing sound tip');
        showSoundTip = true;
      }, 3000);
    }
    
    setTimeout(() => {
      if (!harmony.enabled && !harmonyTipShown && !showSoundTip) {
        console.log('Showing harmony tip');
        showHarmonyTip = true;
      }
    }, 8000);
  });
  
  $: if (isPlaying && !soundTipShown) {
    soundTipShown = true;
    showSoundTip = false;
  }
  
  $: if (harmony.enabled && !harmonyTipShown) {
    harmonyTipShown = true;
    showHarmonyTip = false;
  }
  
  function handleSoundTipClose() {
    showSoundTip = false;
    soundTipShown = true;
    
    if (!harmony.enabled && !harmonyTipShown) {
      setTimeout(() => {
        showHarmonyTip = true;
      }, 2000);
    }
  }
  
  function handleHarmonyTipClose() {
    showHarmonyTip = false;
    harmonyTipShown = true;
  }
</script>

{#if showSoundTip}
  <Tip 
    message="Turn on your device sound to hear the melody of your contributions!" 
    icon="🔊" 
    on:close={handleSoundTipClose} 
  />
{/if}

{#if showHarmonyTip}
  <Tip 
    message="Try 'Harmonized Mode' for a richer musical experience with chord progressions!" 
    icon="🎵" 
    on:close={handleHarmonyTipClose} 
  />
{/if}
