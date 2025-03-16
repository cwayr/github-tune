<script lang="ts">
  import { onMount } from 'svelte';
  import * as Tone from 'tone';

  type PianoNote = string;
  
  // Available base samples across octaves
  const availableSamples = {
    'C3': 'C3v4.ogg',
    'D#3': 'Ds3v4.ogg',
    'F#3': 'Fs3v4.ogg',
    'A3': 'A3v4.ogg',
    'C4': 'C4v4.ogg',
    'D#4': 'Ds4v4.ogg',
    'F#4': 'Fs4v4.ogg',
    'A4': 'A4v4.ogg',
  };

  // Same pitch map implementation
  const pitchMap: Record<PianoNote, { baseNote: keyof typeof availableSamples; semitones: number }> = {
    // 3rd Octave mappings...
    'C3': { baseNote: 'C3', semitones: 0 },
    'C#3': { baseNote: 'C3', semitones: 1 },
    'D3': { baseNote: 'C3', semitones: 2 },
    'D#3': { baseNote: 'D#3', semitones: 0 },
    'E3': { baseNote: 'D#3', semitones: 1 },
    'F3': { baseNote: 'D#3', semitones: 2 },
    'F#3': { baseNote: 'F#3', semitones: 0 },
    'G3': { baseNote: 'F#3', semitones: 1 },
    'G#3': { baseNote: 'F#3', semitones: 2 },
    'A3': { baseNote: 'A3', semitones: 0 },
    'A#3': { baseNote: 'A3', semitones: 1 },
    'B3': { baseNote: 'A3', semitones: 2 },
    
    // 4th Octave mappings...
    'C4': { baseNote: 'C4', semitones: 0 },
    'C#4': { baseNote: 'C4', semitones: 1 },
    'D4': { baseNote: 'C4', semitones: 2 },
    'D#4': { baseNote: 'D#4', semitones: 0 },
    'E4': { baseNote: 'D#4', semitones: 1 },
    'F4': { baseNote: 'D#4', semitones: 2 },
    'F#4': { baseNote: 'F#4', semitones: 0 },
    'G4': { baseNote: 'F#4', semitones: 1 },
    'G#4': { baseNote: 'F#4', semitones: 2 },
    'A4': { baseNote: 'A4', semitones: 0 },
    'A#4': { baseNote: 'A4', semitones: 1 },
    'B4': { baseNote: 'A4', semitones: 2 }
  };

  const allNotes = Object.keys(pitchMap) as PianoNote[];

  let sampler: Tone.Sampler | null = null;
  let pitchShift: Tone.PitchShift | null = null;
  let isLoading = true;
  let loadError = '';
  let activeNotes: PianoNote[] = [];

  // Create individual pitch shifters for each semitone value
  const pitchShifters: Record<number, Tone.PitchShift> = {};

  onMount(async () => {
    try {
      await Tone.start();
      console.log('Audio context started');

      // Create a separate pitch shifter for each needed semitone value
      // This avoids constantly changing the pitch parameter
      for (let i = 0; i <= 11; i++) {
        pitchShifters[i] = new Tone.PitchShift({
          pitch: i,
          windowSize: 0.1,  // Larger window size for better quality
          delayTime: 0.1,    // Small delay helps the algorithm
          wet: 1             // Full wet signal
        }).toDestination();
      }
      
      // Default pitchShift for zero semitones
      pitchShift = pitchShifters[0];

      // Initialize sampler but don't connect yet
      sampler = new Tone.Sampler({
        urls: availableSamples,
        baseUrl: '/piano_samples/',
        onload: () => {
          console.log('Sampler loaded successfully');
          isLoading = false;
        },
        onerror: (error) => {
          console.error('Failed to load sampler:', error);
          loadError = error.message || 'Failed to load samples';
          isLoading = false;
        },
      });

    } catch (error) {
      console.error('Error initializing audio:', error);
      loadError = error instanceof Error ? error.message : 'Audio initialization failed';
      isLoading = false;
    }
  });

  async function playNote(note: PianoNote): Promise<void> {
    if (!sampler || !pitchShifters) return;
    
    const mapping = pitchMap[note];
    
    if (mapping.semitones === 0) {
      // For notes without pitch shifting, connect directly to destination
      sampler.disconnect();
      sampler.toDestination();
    } else {
      // For pitched notes, connect through the appropriate pitch shifter
      sampler.disconnect();
      sampler.connect(pitchShifters[mapping.semitones]);
    }
    
    // Play the note
    sampler.triggerAttack(mapping.baseNote, Tone.now());
    
    if (!activeNotes.includes(note)) {
      activeNotes = [...activeNotes, note];
    }
    console.log(`Playing ${note} using ${mapping.baseNote} (+${mapping.semitones} semitones)`);
  }

  function stopNote(note: PianoNote): void {
    if (!sampler) return;
    const mapping = pitchMap[note];
    sampler.triggerRelease(mapping.baseNote);
    activeNotes = activeNotes.filter(n => n !== note);
  }
</script>

<main>
  <h1>Piano Sample</h1>
  {#if isLoading}
    <p>Loading piano samples...</p>
  {:else if loadError}
    <p class="error">{loadError}</p>
  {:else if sampler}
    <div class="piano-container">
      {#each allNotes as note}
        <button
          on:mousedown={() => playNote(note)}
          on:mouseleave={() => stopNote(note)}
          class:white-key={!note.includes('#')}
          class:black-key={note.includes('#')}
          class:playing={activeNotes.includes(note)}
        >
          {note.replace(/\d/, '')}
        </button>
      {/each}
    </div>
  {:else}
    <p>Piano not initialized. Please refresh.</p>
  {/if}
</main>

<style>
  .piano-container {
    display: flex;
    flex-wrap: wrap;
    margin: 20px 0;
  }

  .white-key {
    background-color: #fff;
    border: 1px solid #000;
    margin: 5px;
    padding: 10px;
    transition: background-color 0.2s;
  }

  .white-key:hover {
    background-color: #f0f0f0;
  }

  .black-key {
    background-color: #000;
    color: #fff;
    border: 1px solid #000;
    margin: 5px;
    padding: 10px;
    transition: background-color 0.2s;
  }

  .black-key:hover {
    background-color: #333;
  }

  .playing {
    background-color: #aaa;
  }

  .error {
    color: #e53e3e;
    padding: 10px;
    border: 1px solid #e53e3e;
    border-radius: 4px;
    background-color: #fff5f5;
  }
</style>
