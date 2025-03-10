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
    major: {
      name: 'Major',
      notes: ['C4', 'E4', 'G4', 'B4', 'C5', 'D5', 'E5', 'G5']
    },
    minor: {
      name: 'Minor',
      notes: ['C4', 'Eb4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5', 'G5']
    },
    pentatonic: {
      name: 'Pentatonic',
      notes: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5']
    },
    dorian: {
      name: 'Dorian',
      notes: ['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5']
    },
    lydian: {
      name: 'Lydian',
      notes: ['F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5']
    }
  };
  
  constructor() {
    // Don't initialize audio in constructor to avoid autoplay restrictions
    // Will initialize on first user interaction instead
  }
  
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
            attack: 0.015, // Quick but gentle attack
            decay: 0.4,
            sustain: 0.5,
            release: 1.2 // Longer release for beautiful trails
          }
        });
        
        // Create effects for more beautiful sound
        this.reverb = new Tone.Reverb({
          decay: 2.5,
          wet: 0.3
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
    const notesToPlay: { note: string; velocity: number }[] = [];
    
    if (hasContributions) {
      // Map contribution days to notes and velocities
      weekData.days.forEach((day, dayIndex) => {
        if (day.count > 0) {
          // Map day index to a note in the selected scale
          const note = scale.notes[dayIndex % scale.notes.length];
          
          // Map contribution count to velocity (intensity)
          // Normalize between 0.1 and 0.9
          const maxContribution = 10; // Assuming 10 is a high daily contribution count
          const velocity = Math.min(0.3 + (day.count / maxContribution) * 0.6, 0.9);
          
          notesToPlay.push({ note, velocity });
          this.activeNotes.push(note);
        }
      });
    } else {
      // For weeks with no contributions, play a soft ambient note
      // Use a lower octave note with low velocity for subtle sound
      const ambientNote = scale.notes[0]; // Use first note of scale
      notesToPlay.push({ note: ambientNote, velocity: 0.1 });
      this.activeNotes.push(ambientNote);
    }
    
    // Spread the chord slightly for a more natural arpeggiated sound
    let timeOffset = 0;
    const attackSpread = 0.04; // Slight time spread between notes for a beautiful arpeggio effect
    
    // Play notes with beautiful articulation
    if (this.polySynth) {
      notesToPlay.forEach(({ note, velocity }) => {
        // Volume scaling with master volume control
        const adjustedVelocity = velocity * settings.volume;
        
        // Play note with slight timing offset
        this.polySynth?.triggerAttackRelease(
          note,
          '2n', // Half note duration
          Tone.now() + timeOffset,
          adjustedVelocity
        );
        
        timeOffset += attackSpread;
      });
    }
    
    // Calculate playback duration based on speed setting
    // Base duration is 800ms but with proper release tail for beautiful sound
    const duration = (200 / settings.speed) + 200; // Add 200ms for natural decay
    
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
