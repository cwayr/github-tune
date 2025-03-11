import type { ContributionYear, MusicScale, PlaybackSettings } from '../config/types';
import * as Tone from 'tone';

class AudioEngine {
  private isInitialized = false;
  private activeNotes: string[] = [];
  private polySynth: Tone.PolySynth | null = null;
  private reverb: Tone.Reverb | null = null;
  private chorus: Tone.Chorus | null = null;
  private limiter: Tone.Limiter | null = null;
  
  // Predefined musical scales with more expressive note ranges
  private scales: Record<string, MusicScale> = {
    joyful: {
      name: 'Joyful',
      notes: ['C4', 'E4', 'G4', 'B4', 'C5', 'D5', 'E5', 'G5']
    },
    melancholy: {
      name: 'Melancholy',
      notes: ['C4', 'Eb4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5', 'G5']
    },
    dreamy: {
      name: 'Dreamy',
      notes: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5']
    },
    mysterious: {
      name: 'Mysterious',
      notes: ['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5']
    },
    ethereal: {
      name: 'Ethereal',
      notes: ['F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5']
    }
  };
  
  private async initAudio() {
    if (typeof window !== 'undefined' && !this.isInitialized) {
      try {
        console.log('Initializing Tone.js audio engine');
        
        // Create beautiful polyphonic synthesizer first
        // Using Tone.Synth for a richer sound than the basic oscillator
        this.polySynth = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: 'sine', // Using simpler oscillator type for better compatibility
            phase: 0,
          },
          envelope: {
            attack: 0.02, // Quick attack for plucky sound
            decay: 0.1,   // Short decay for quicker note release
            sustain: 0.1,  // Short sustain for plucky feel
            release: 0.3   // Quick release to allow notes to stop ringing
          }
        });
        
        // Create effects for more beautiful sound
        this.reverb = new Tone.Reverb({
          decay: 4.0,   // Increased decay for longer reverb
          wet: 0.6      // Increased wet level for more reverb effect
        }).toDestination();
        
        this.chorus = new Tone.Chorus({
          frequency: 1.5,
          depth: 0.2,
          wet: 0.2
        }).connect(this.reverb);
        
        this.limiter = new Tone.Limiter(-3).connect(this.chorus);
        
        // Connect synthesizer to effects chain
        this.polySynth.connect(this.limiter);
        
        this.isInitialized = true;
        console.log('Tone.js audio engine initialized');
      } catch (error) {
        console.error('Failed to initialize Tone.js:', error);
      }
    }
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
    if (!this.isInitialized) {
      await this.initAudio();
    }
    
    // Stop any playing sound
    this.stopSound();
    
    if (week >= contributionData.weeks.length) {
      onComplete();
      return;
    }
    
    // Ensure Tone.js is started (required for user interaction)
    try {
      if (Tone.context.state !== 'running') {
        console.log('Starting Tone.js context');
        await Tone.start();
      }
      console.log('Tone.js context state:', Tone.context.state);
    } catch (error) {
      console.error('Error starting Tone.js context:', error);
    }
    
    const weekData = contributionData.weeks[week];
    const scale = settings.scale || this.scales.pentatonic;
    
    // Always play a sound, even if there are no contributions
    // This ensures every week is highlighted one by one
    console.log(`Playing week ${week}, has contributions: ${weekData.days.some(day => day.count > 0)}`);
    
    // If no contributions, play a soft ambient sound
    const hasContributions = weekData.days.some(day => day.count > 0);
    
    // Gather all notes to play simultaneously as a beautiful chord
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
    if (this.polySynth && notesToPlay.length > 0) {
      this.polySynth.triggerAttackRelease(
        notesToPlay,
        '2n', // Half note duration
        Tone.now()
      );
    }
    
    // Calculate playback duration based on speed setting
    // Base duration is 300ms but with proper release tail for beautiful sound
    const duration = (300 / settings.speed) + 100;
    
    // Schedule completion callback
    setTimeout(() => {
      this.stopSound();
      onComplete();
    }, duration);
  }
  
  public stopSound() {
    if (this.polySynth && this.activeNotes.length > 0) {
      // Release all active notes with a gentle release
      this.polySynth.releaseAll();
      this.activeNotes = [];
    }
  }
  
  public exportAudio(contributionData: ContributionYear, settings: PlaybackSettings): Promise<Blob> {
    // This would require Tone.Offline to render audio
    // Implementation would be more complex with Tone.js
    // Placeholder for future implementation
    return Promise.reject(new Error('Audio export not implemented yet'));
  }
}

// Export a singleton instance
export const audioEngine = new AudioEngine();
