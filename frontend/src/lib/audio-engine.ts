import { getAvailableScales, getHarmonyByName } from './harmonies';
import type { ContributionYear, MusicScale, PlaybackSettings } from '../config/types';
import * as Tone from 'tone';

class AudioEngine {
  private isInitialized = false;
  private samplesLoaded = false;
  private activeNotes: string[] = [];
  private sampler: Tone.Sampler | null = null;
  private reverb: Tone.Reverb | null = null;
  private initPromise: Promise<void> | null = null;
  private startTime: number | null = null;
  private lastHarmonyIndex: number = -1;
  private isPreloading = false;
  
  private async initAudio(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = new Promise<void>(async (resolve, reject) => {
      if (typeof window === 'undefined' || this.isInitialized) {
        resolve();
        return;
      }
      
      try {
        console.log('Initializing Tone.js audio engine');
        if (Tone.getContext().state !== 'running') {
          await Tone.start();
        }

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
            this.samplesLoaded = true;
            if (this.reverb) {
              this.sampler?.connect(this.reverb);
              console.log('Sampler connected to Reverb');
            } else {
              console.warn('Reverb not initialized, connecting sampler directly to destination');
              this.sampler?.toDestination();
            }
            resolve();
          },
        });

        this.reverb = new Tone.Reverb({
          decay: 1.5,
          wet: 0.5
        }).toDestination();

        this.isInitialized = true;

        setTimeout(() => {
          if (!this.samplesLoaded) {
            console.warn('Sample loading timed out, continuing anyway');
            this.samplesLoaded = true;
            resolve();
          }
        }, 5000);
      } catch (error) {
        console.error('Failed to initialize Tone.js:', error);
        this.initPromise = null;
        reject(new Error(`Audio initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
    
    return this.initPromise;
  }
  
  public getAvailableScales(harmonyEnabled: boolean = false): MusicScale[] {
    return getAvailableScales(harmonyEnabled);
  }
  
  public async playContributionWeek(
    week: number,
    contributionData: ContributionYear,
    settings: PlaybackSettings,
    onComplete: () => void
  ) {
    try {
      if (week === 0) {
        this.lastHarmonyIndex = -1;
      }
      
      await this.initAudio();
      this.stopSound();
      
      if (week >= contributionData.weeks.length) {
        onComplete();
        return;
      }
      
      if (Tone.getContext().state !== 'running') {
        try {
          await Tone.start();
        } catch (error) {
          console.error('Error starting Tone.js context:', error);
          throw new Error('Failed to start audio context');
        }
      }
      
      if (!this.sampler || !this.samplesLoaded) {
        throw new Error('Audio samples not loaded yet');
      }
      
      const weekData = contributionData.weeks[week];
      let activeScale = settings.scale;
      const notesToPlay: string[] = [];
      const isHarmonizedMode = settings.harmony.enabled;
      
      if (isHarmonizedMode) {
        const harmony = getHarmonyByName(settings.harmony.name);
        const FIXED_INTERVAL = 8;
        
        const currentHarmonyIndex = Math.floor(week / FIXED_INTERVAL) % harmony.chords.length;
        const chord = harmony.chords[currentHarmonyIndex];
        
        if (currentHarmonyIndex !== this.lastHarmonyIndex) {
          chord.notes.forEach(note => {
            notesToPlay.push(note);
            this.activeNotes.push(note);
          });
          
          this.lastHarmonyIndex = currentHarmonyIndex;
        }
        
        if (chord.scale && chord.scale.length > 0) {
          activeScale = {
            name: settings.scale.name,
            notes: chord.scale
          };
        }
      }
      
      const hasContributions = weekData.days.some(day => day.level > 0);
      if (hasContributions) {
        weekData.days.forEach((day, dayIndex) => {
          if (day.level > 0) {
            const noteSet = activeScale.notes[dayIndex % activeScale.notes.length];
            
            let noteIndex = 0;
            if (day.level >= 3) {
              noteIndex = 2;
            } else if (day.level >= 2) {
              noteIndex = 1;
            }
            
            const note = noteSet[noteIndex];
            notesToPlay.push(note);
            this.activeNotes.push(note);
          }
        });
      }
      
      if (notesToPlay.length > 0) {
        this.startTime = Tone.now();
        notesToPlay.forEach(note => {
          this.sampler?.triggerAttackRelease(note, '1n', Tone.now());
        });
      }
      
      const duration = (240 / settings.speed) + 100;
      
      setTimeout(() => {
        this.stopSound();
        onComplete();
      }, duration);

      this.updatePlaybackProgress(duration);
    } catch (error) {
      console.error('Error in playContributionWeek:', error);
      this.stopSound();
      onComplete();
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
      this.activeNotes.forEach(note => {
        this.sampler?.triggerRelease(note);
      });
      this.activeNotes = [];
    }
    this.startTime = null;
  }
  
  /**
   * Preload all necessary audio samples and initialize the audio engine
   * without starting audio playback. This should be called during component mount
   * to reduce the delay when the user clicks play.
   * @returns Promise that resolves when preloading is complete
   */
  public preloadSounds(): Promise<void> {
    if (this.isPreloading || this.samplesLoaded) {
      return this.initPromise || Promise.resolve();
    }
    
    this.isPreloading = true;
    console.log('Preloading Tone.js resources and audio samples');
    
    return this.initAudio()
      .then(() => {
        console.log('Tone.js resources and samples preloaded successfully');
        this.isPreloading = false;
      })
      .catch(err => {
        console.error('Failed to preload audio resources:', err);
        this.isPreloading = false;
      });
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

export const audioEngine = new AudioEngine();