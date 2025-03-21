import type { ContributionYear, MusicScale, PlaybackSettings } from '../config/types';
import { getAvailableScales, getHarmonyByName, getHarmonyChord } from './harmonies';
import * as Tone from 'tone';

class AudioEngine {
  private isInitialized = false;
  private samplesLoaded = false;
  private activeNotes: string[] = [];
  private sampler: Tone.Sampler | null = null;
  private initPromise: Promise<void> | null = null;
  private startTime: number | null = null;
  private lastHarmonyIndex: number = -1; // Track the last harmony index played
  
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
        if (Tone.getContext().state !== 'running') {
          await Tone.start();
          console.log('Tone.js context started');
        }
        
        // Create sampler using static samples
        this.sampler = new Tone.Sampler({
          urls: {
            C2: 'C2v3.ogg',
            A1: 'A1v3.ogg',
            A2: 'A2v3.ogg',
            A4: 'A4v3.ogg',
            C4: 'C4v3.ogg',
            E4: 'E4v3.ogg',
            F4: 'F4v3.ogg',
            G4: 'G4v3.ogg',
            B4: 'B4v3.ogg',
            C5: 'C5v3.ogg',
            D5: 'D5v3.ogg',
            E5: 'E5v3.ogg',
            F5: 'F5v3.ogg',
            G5: 'G5v3.ogg',
            A5: 'A5v3.ogg',
            C6: 'C6v3.ogg',
            E6: 'E6v3.ogg'
          },
          baseUrl: '/piano_samples/',
          onload: () => {
            console.log('Piano samples loaded');
            this.samplesLoaded = true;
            resolve();
          },
        }).toDestination();
        
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
    return getAvailableScales();
  }
  
  public async playContributionWeek(
    week: number,
    contributionData: ContributionYear,
    settings: PlaybackSettings,
    onComplete: () => void
  ) {
    try {
      // Reset the last harmony index when starting from week 0
      if (week === 0) {
        this.lastHarmonyIndex = -1;
      }
      
      // Initialize audio and ensure samples are loaded
      await this.initAudio();
      
      // Stop any playing sound
      this.stopSound();
      
      if (week >= contributionData.weeks.length) {
        onComplete();
        return;
      }
      
      // Ensure Tone.js is started (required for user interaction)
      if (Tone.getContext().state !== 'running') {
        try {
          console.log('Starting Tone.js context');
          await Tone.start();
          console.log('Tone.js context state:', Tone.getContext().state);
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
      let activeScale = settings.scale; // Default scale from settings
      
      // Gather all notes to play simultaneously as a chord
      const notesToPlay: string[] = [];
      
      // Determine mode - simple or harmonized
      const isHarmonizedMode = settings.harmony.enabled;
      
      // If in harmonized mode, we need to get the current harmony and its associated scale
      if (isHarmonizedMode) {
        const harmony = getHarmonyByName(settings.harmony.name);
        const FIXED_INTERVAL = 8; // Fixed 8-week interval for harmony changes
        
        // Calculate which chord in the progression to use based on weekIndex and fixed interval
        const currentHarmonyIndex = Math.floor(week / FIXED_INTERVAL) % harmony.chords.length;
        const chord = harmony.chords[currentHarmonyIndex];
        
        // Only play the chord if it has changed or it's the first one
        if (currentHarmonyIndex !== this.lastHarmonyIndex) {
          // Add all notes from the chord
          chord.notes.forEach(note => {
            notesToPlay.push(note);
            this.activeNotes.push(note);
          });
          
          // Update the last harmony index
          this.lastHarmonyIndex = currentHarmonyIndex;
          
          // Log which chord is playing
          console.log(`Playing harmony chord for week ${week}: ${chord.notes.join(', ')} (chord ${currentHarmonyIndex + 1} of ${harmony.chords.length})`);
        }
        
        // Use the scale associated with this chord if available
        if (chord.scale && chord.scale.length > 0) {
          activeScale = {
            name: settings.scale.name, // Keep the original scale name for UI consistency
            notes: chord.scale // But use the notes from the chord's associated scale
          };
        }
      }
      
      // Handle contributions (always play if they exist)
      const hasContributions = weekData.days.some(day => day.count > 0);
      if (hasContributions) {
        // Map contribution days to notes
        weekData.days.forEach((day, dayIndex) => {
          if (day.count > 0) {
            // Map day index to a note in the active scale
            const note = activeScale.notes[dayIndex % activeScale.notes.length];
            notesToPlay.push(note);
            this.activeNotes.push(note);
          }
        });
      }
      
      // Play all notes simultaneously as a chord
      if (notesToPlay.length > 0) {
        this.startTime = Tone.now();
        notesToPlay.forEach(note => {
          this.sampler?.triggerAttackRelease(note, '1n', Tone.now());
        });
      }
      
      // Calculate playback duration based on speed setting
      const duration = (240 / settings.speed) + 100;
      
      // Schedule completion callback
      setTimeout(() => {
        this.stopSound();
        onComplete();
      }, duration);
      
      // Update playback progress
      this.updatePlaybackProgress(duration);
    } catch (error) {
      console.error('Error in playContributionWeek:', error);
      this.stopSound();
      onComplete(); // Ensure callback is called even on error
    }
  }
  
  private updatePlaybackProgress(duration: number) {
    const intervalId = setInterval(() => {
      if (!this.startTime) return;
      const elapsed = Tone.now() - this.startTime;
      if (elapsed >= duration) {
        clearInterval(intervalId);
      }
    }, 100);
  }
  
  public stopSound() {
    if (this.sampler && this.activeNotes.length > 0) {
      // Release all active notes with a gentle release
      this.activeNotes.forEach(note => {
        this.sampler?.triggerRelease(note);
      });
      this.activeNotes = [];
    }
    this.startTime = null;
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
