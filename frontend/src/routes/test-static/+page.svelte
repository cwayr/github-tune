<script>
  import { onMount } from 'svelte';
  
  let audioLoaded = false;
  let audioError = '';
  
  onMount(() => {
    const audio = new Audio('/piano_samples/A4v4.ogg');
    
    audio.addEventListener('canplaythrough', () => {
      audioLoaded = true;
      console.log('Audio loaded successfully');
    });
    
    audio.addEventListener('error', (e) => {
      audioError = `Error loading audio: ${e.target.error?.message || 'Unknown error'}`;
      console.error('Audio load error:', e);
    });
    
    // Force load attempt
    audio.load();
  });
</script>

<h1>Static Asset Test</h1>

<div>
  <p>Testing if static files are served correctly:</p>
  {#if audioLoaded}
    <p class="success">✅ Audio file loaded successfully!</p>
  {:else if audioError}
    <p class="error">❌ {audioError}</p>
  {:else}
    <p>Loading audio file...</p>
  {/if}
  
  <div class="links">
    <h2>Direct Links:</h2>
    <a href="/piano_samples/A4v4.ogg" target="_blank">Try direct link to A4v4.ogg</a>
  </div>
</div>

<style>
  .success { color: green; font-weight: bold; }
  .error { color: red; font-weight: bold; }
  .links { margin-top: 20px; }
</style>
