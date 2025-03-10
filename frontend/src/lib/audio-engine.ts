import type { ContributionYear, MusicScale, PlaybackSettings } from '../config/types';

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gainNodes: GainNode[] = [];
  private isInitialized = false;
  
  // Predefined musical scales
  private scales: Record<string, MusicScale> = {
    major: {
      name: 'Major',
      notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']
    },
    minor: {
      name: 'Minor',
      notes: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4']
    },
    pentatonic: {
      name: 'Pentatonic',
      notes: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5']
    }
  };
  
  // Frequency mapping for musical notes
  private noteToFrequency: Record<string, number> = {
    'C4': 261.63, 'C#4': 277.18, 'Db4': 277.18, 'D4': 293.66,
    'D#4': 311.13, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'Gb4': 369.99, 'G4': 392.00, 'G#4': 415.30,
    'Ab4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'Bb4': 466.16,
    'B4': 493.88, 'C5': 523.25, 'D5': 587.33
  };
  
  constructor() {
    this.initAudioContext();
  }
  
  private initAudioContext() {
    if (typeof window !== 'undefined' && !this.isInitialized) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
    }
  }
  
  public getAvailableScales(): MusicScale[] {
    return Object.values(this.scales);
  }
  
  public playContributionWeek(
    week: number,
    contributionData: ContributionYear,
    settings: PlaybackSettings,
    onComplete: () => void
  ) {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    
    if (!this.audioContext) {
      console.error('AudioContext not available');
      return;
    }
    
    // Stop any playing sound
    this.stopSound();
    
    if (week >= contributionData.weeks.length) {
      onComplete();
      return;
    }
    
    const weekData = contributionData.weeks[week];
    const scale = settings.scale || this.scales.pentatonic;
    
    // Create oscillators for each day that has contributions
    weekData.days.forEach((day, dayIndex) => {
      if (day.count > 0) {
        // Map day index to a note in the selected scale
        const note = scale.notes[dayIndex % scale.notes.length];
        const frequency = this.noteToFrequency[note];
        
        if (!frequency || !this.audioContext) return;
        
        // Create oscillator and gain node for volume control
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Map contribution count to volume (intensity)
        // Normalize between 0.1 and 1.0
        const maxContribution = 10; // Assuming 10 is a high daily contribution count
        const intensity = Math.min(0.1 + (day.count / maxContribution) * 0.9, 1.0);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gainNode.gain.value = intensity * settings.volume;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        this.oscillators.push(oscillator);
        this.gainNodes.push(gainNode);
        
        oscillator.start();
      }
    });
    
    // Stop sound after a duration based on playback speed
    // Base duration is now 400ms instead of 1000ms to make default playback faster
    const duration = 400 / settings.speed;
    setTimeout(() => {
      this.stopSound();
      onComplete();
    }, duration);
  }
  
  public stopSound() {
    const currentTime = this.audioContext?.currentTime || 0;
    
    // Gently stop oscillators with a small fade out
    this.gainNodes.forEach(gain => {
      if (this.audioContext) {
        gain.gain.linearRampToValueAtTime(0, currentTime + 0.02);
      }
    });
    
    setTimeout(() => {
      this.oscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          // Oscillator may already be stopped
        }
      });
      
      this.gainNodes.forEach(gain => {
        gain.disconnect();
      });
      
      this.oscillators = [];
      this.gainNodes = [];
    }, 30); // Small delay to allow fade out
  }
  
  public exportAudio(contributionData: ContributionYear, settings: PlaybackSettings): Promise<Blob> {
    // This is a placeholder for the audio export feature
    // Would require a more complex implementation with OfflineAudioContext
    return Promise.reject(new Error('Audio export not implemented yet'));
  }
}

// Export a singleton instance
export const audioEngine = new AudioEngine();
