import type { ContributionYear, MusicScale, PlaybackSettings } from '../config/types';
import * as Tone from 'tone';

class AudioEngine {
  private isInitialized = false;
  private samplesLoaded = false;
  private activeNotes: string[] = [];
  private sampler: Tone.Sampler | null = null;
  private reverb: Tone.Reverb | null = null;
  private chorus: Tone.Chorus | null = null;
  private limiter: Tone.Limiter | null = null;
  private initPromise: Promise<void> | null = null;
  
  // Predefined musical scales with more expressive note ranges
  private scales: Record<string, MusicScale> = {
    joyful: {
      name: 'Joyful',
      notes: ['C4', 'E4', 'F4', 'G4', 'B5', 'C5', 'D5', 'E5']
    },
    melancholy: {
      name: 'Melancholy',
      notes: ['A2', 'C4', 'D4', 'E4', 'G4', 'B4', 'C5', 'G5']
    },
    // dreamy: {
    //   name: 'Dreamy',
    //   notes: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5']
    // },
    // mysterious: {
    //   name: 'Mysterious',
    //   notes: ['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5']
    // },
    // ethereal: {
    //   name: 'Ethereal',
    //   notes: ['F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5']
    // }
  };
  
  private async initAudio(): Promise<void> {
    // If already initialized or initialization is in progress, return the existing promise
    if (this.initPromise) {
      return this.initPromise;
    }
    
    // Create a new initialization promise
    this.initPromise = new Promise<void>(async (resolve, reject) => {
      if (typeof window === 'undefined' || this.isInitialized) {
        resolve();
        return;
      }
      
      try {
        console.log('Initializing Tone.js audio engine');
        
        // Ensure Tone.js context is started
        if (Tone.context.state !== 'running') {
          await Tone.start();
          console.log('Tone.js context started');
        }
        
        // Create sampler using static samples
        this.sampler = new Tone.Sampler({
          urls: {
            A2: 'A2v3.ogg',
            A4: 'A4v3.ogg',
            C4: 'C4v3.ogg',
            E4: 'E4v3.ogg',
            F4: 'F4v3.ogg',
            G4: 'G4v3.ogg',
            B4: 'B4v3.ogg',
            C5: 'C5v4.ogg',
            D5: 'D5v4.ogg',
            E5: 'E5v4.ogg',
          },
          baseUrl: '/piano_samples/',
          onload: () => {
            console.log('Piano samples loaded');
            this.samplesLoaded = true;
            resolve();
          }
        }).toDestination();
        
        // Create effects chain
        this.reverb = new Tone.Reverb({
          decay: 4.0,
          wet: 0.6
        }).toDestination();
        
        this.chorus = new Tone.Chorus({
          frequency: 1.5,
          depth: 0.2,
          wet: 0.2
        }).connect(this.reverb);
        
        this.limiter = new Tone.Limiter(-3).connect(this.chorus);
        
        this.isInitialized = true;
        console.log('Tone.js audio engine initialized');
        
        // If onload wasn't called after 5 seconds, resolve anyway to prevent hanging
        setTimeout(() => {
          if (!this.samplesLoaded) {
            console.warn('Sample loading timed out, continuing anyway');
            this.samplesLoaded = true;
            resolve();
          }
        }, 5000);
      } catch (error) {
        console.error('Failed to initialize Tone.js:', error);
        this.initPromise = null; // Reset promise so initialization can be attempted again
        reject(new Error(`Audio initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
    
    return this.initPromise;
  }
  
  public getAvailableScales(): MusicScale[] {
    return Object.values(this.scales);
  }
  
  public async playContributionWeek(
    week: number,
    contributionData: ContributionYear,
    settings: PlaybackSettings,
    onComplete: () => void
  ) {
    try {
      // Initialize audio and ensure samples are loaded
      await this.initAudio();
      
      // Stop any playing sound
      this.stopSound();
      
      if (week >= contributionData.weeks.length) {
        onComplete();
        return;
      }
      
      // Ensure Tone.js is started (required for user interaction)
      if (Tone.context.state !== 'running') {
        try {
          console.log('Starting Tone.js context');
          await Tone.start();
          console.log('Tone.js context state:', Tone.context.state);
        } catch (error) {
          console.error('Error starting Tone.js context:', error);
          throw new Error('Failed to start audio context');
        }
      }
      
      // Check if sampler is ready
      if (!this.sampler || !this.samplesLoaded) {
        throw new Error('Audio samples not loaded yet');
      }
      
      const weekData = contributionData.weeks[week];
      const scale = settings.scale;
      
      // Always play a sound, even if there are no contributions
      // This ensures every week is highlighted one by one
      const hasContributions = weekData.days.some(day => day.count > 0);
      
      // Gather all notes to play simultaneously as a chord
      const notesToPlay: string[] = [];
      
      if (hasContributions) {
        // Map contribution days to notes
        weekData.days.forEach((day, dayIndex) => {
          if (day.count > 0) {
            // Map day index to a note in the selected scale
            const note = scale.notes[dayIndex % scale.notes.length];
            notesToPlay.push(note);
            this.activeNotes.push(note);
          }
        });
      } else {
        // For weeks with no contributions, play an ambient note
        const ambientNote = scale.notes[0]; // Use first note of scale
        notesToPlay.push(ambientNote);
        this.activeNotes.push(ambientNote);
      }
      
      // Play all notes simultaneously as a chord
      if (notesToPlay.length > 0) {
        notesToPlay.forEach(note => {
          this.sampler?.triggerAttackRelease(note, '2n', Tone.now());
        });
      }
      
      // Calculate playback duration based on speed setting
      const duration = (240 / settings.speed) + 100;
      
      // Schedule completion callback
      setTimeout(() => {
        this.stopSound();
        onComplete();
      }, duration);
    } catch (error) {
      console.error('Error in playContributionWeek:', error);
      this.stopSound();
      onComplete(); // Ensure callback is called even on error
    }
  }
  
  public stopSound() {
    if (this.sampler && this.activeNotes.length > 0) {
      // Release all active notes with a gentle release
      this.activeNotes.forEach(note => {
        this.sampler?.triggerRelease(note);
      });
      this.activeNotes = [];
    }
  }
  
  /**
   * Export audio of the contribution melody (not implemented)
   * @param contributionData The contribution data to generate audio from
   * @param settings Playback settings to use for the audio
   * @returns Promise resolving to a Blob containing the audio file
   */
  public exportAudio(contributionData: ContributionYear, settings: PlaybackSettings): Promise<Blob> {
    return Promise.reject(new Error('Audio export not implemented yet'));
  }
}

// Export a singleton instance
export const audioEngine = new AudioEngine();
