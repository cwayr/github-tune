/**
 * Harmonies and scales for GitHub contribution melodies
 * Each harmony is a progression of chord notes that will play at specified intervals
 */
import type { MusicScale } from '../config/types';

export interface Chord {
  notes: string[];
  scale: string[];
}

export interface Harmony {
  name: string;
  chords: Chord[];
}

export const simpleScales: Record<string, MusicScale> = {
  joyful: {
    name: 'Joyful',
    notes: ['C4', 'E4', 'G4', 'B4', 'D5', 'E5', 'G5', 'E6']
  },
  melancholy: {
    name: 'Melancholy',
    notes: ['A2', 'C4', 'D4', 'E4', 'G4', 'B4', 'C5', 'G5']
  }
}

export const harmonizedScales: Record<string, MusicScale> = {
  i: {
    name: 'cmaj',
    notes: ['C4', 'E4', 'G4', 'C5', 'D5', 'E5', 'G5', 'E6']
  },
  ii: {
    name: 'dmin',
    notes: ['C4', 'F4', 'A4', 'C5', 'D5', 'E4', 'A5', 'C6']
  },
  iii: {
    name: 'emin',
    notes: ['B3', 'E4', 'G4', 'A4', 'B4', 'D5', 'G5', 'B5']
  },
  iv: {
    name: 'fmaj',
    notes: ['C4', 'F4', 'A4', 'C5', 'E5', 'G5', 'A5', 'C6']
  },
  v: {
    name: 'gmaj',
    notes: ['B3', 'D4', 'G4', 'B4', 'D4', 'G5', 'A5', 'B5']
  },
  vi: {
    name: 'amin',
    notes: ['C4', 'E4', 'G4', 'A4', 'C5', 'E5', 'B5', 'C6']
  }
}

// Collection of available harmony progressions
export const harmonies: Record<string, Harmony> = {
  simple: {
    name: 'Simple',
    chords: [
      { notes: ['C2', 'E3'], scale: harmonizedScales.i.notes },
      { notes: ['A1', 'C3'], scale: harmonizedScales.vi.notes },
      { notes: ['E2', 'C3'], scale: harmonizedScales.i.notes },
      { notes: ['F2', 'A3'], scale: harmonizedScales.iv.notes } 
    ]
  },
  jazz: {
    name: 'Jazz',
    chords: [
      { notes: ['D2', 'C3', 'F3'], scale: harmonizedScales.ii.notes },  // Dm7
      { notes: ['G2', 'F3', 'B3'], scale: harmonizedScales.v.notes },  // G7
      { notes: ['C3', 'E3', 'B3'], scale: harmonizedScales.i.notes },  // Cmaj7
      { notes: ['A2', 'G3', 'C4'], scale: harmonizedScales.vi.notes }   // Am7
    ]
  },
  dreamy: {
    name: 'Dreamy',
    chords: [
      { notes: ['F2', 'A3'], scale: harmonizedScales.iv.notes },  // F major
      { notes: ['C2', 'E3'], scale: harmonizedScales.i.notes },  // Cmaj7
      { notes: ['G2', 'B3'], scale: harmonizedScales.v.notes },  // G major
      { notes: ['A2', 'C3'], scale: harmonizedScales.vi.notes }   // A minor
    ]
  },
  melancholy: {
    name: 'Melancholy',
    chords: [
      { notes: ['A2', 'C4'], scale: harmonizedScales.vi.notes },  // A minor
      { notes: ['E2', 'G3'], scale: harmonizedScales.iii.notes },  // E minor
      { notes: ['F2', 'A3'], scale: harmonizedScales.iv.notes },  // F major
      { notes: ['G2', 'B3'], scale: harmonizedScales.v.notes }  // G7
    ]
  }
};

/**
 * Get a chord from the harmony progression based on the week index
 * @param harmony - The selected harmony
 * @param weekIndex - Current week index
 * @param interval - Number of weeks between harmony changes
 * @returns The chord to play for the current week
 */
export function getHarmonyChord(harmony: Harmony, weekIndex: number, interval: number): Chord {
  if (interval <= 0) {
    // If interval is invalid, default to 1
    interval = 1;
  }
  
  // Calculate which chord in the progression to use based on weekIndex and interval
  const progressionIndex = Math.floor(weekIndex / interval) % harmony.chords.length;
  return harmony.chords[progressionIndex];
}

/**
 * Get all available harmonies
 * @returns Array of all harmony objects
 */
export function getAvailableHarmonies(): Harmony[] {
  return Object.values(harmonies);
}

/**
 * Get all available scales
 * @returns Array of all scale objects
 */
export function getAvailableScales(): MusicScale[] {
  return Object.values(simpleScales);
}

/**
 * Get a harmony by name
 * @param name - Name of the harmony to retrieve
 * @returns The requested harmony or the first harmony if not found
 */
export function getHarmonyByName(name: string): Harmony {
  return harmonies[name] || Object.values(harmonies)[0];
}
