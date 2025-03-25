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
    name: 'C Major',
    notes: ['C4', 'E4', 'G4', 'C5', 'D5', 'E5', 'G5', 'E6']
  },
  ii: {
    name: 'D Minor',
    notes: ['C4', 'F4', 'A4', 'C5', 'D5', 'E4', 'A5', 'C6']
  },
  iii: {
    name: 'E Minor',
    notes: ['B3', 'E4', 'G4', 'A4', 'B4', 'D5', 'G5', 'B5']
  },
  iv: {
    name: 'F Major',
    notes: ['C4', 'F4', 'A4', 'C5', 'E5', 'G5', 'A5', 'C6']
  },
  v: {
    name: 'G Major',
    notes: ['B3', 'D4', 'G4', 'B4', 'D4', 'G5', 'A5', 'B5']
  },
  vi: {
    name: 'A Minor',
    notes: ['C4', 'E4', 'G4', 'A4', 'C5', 'E5', 'B5', 'C6']
  }
}

// Collection of available harmony progressions
export const harmonies: Record<string, Harmony> = {
  positive: {
    name: 'Positive',
    chords: [
      { notes: ['C2', 'E3'], scale: harmonizedScales.i.notes },
      { notes: ['A1', 'C3'], scale: harmonizedScales.vi.notes },
      { notes: ['E2', 'C3'], scale: harmonizedScales.i.notes },
      { notes: ['F2', 'A3'], scale: harmonizedScales.iv.notes },
      { notes: ['D2', 'F3'], scale: harmonizedScales.ii.notes },
      { notes: ['G2', 'G3'], scale: harmonizedScales.v.notes },
      { notes: ['C2', 'E3'], scale: harmonizedScales.i.notes }
    ]
  },
  dreamy: {
    name: 'Dreamy',
    chords: [
      { notes: ['F2', 'A3'], scale: harmonizedScales.iv.notes },
      { notes: ['C2', 'E3'], scale: harmonizedScales.i.notes },
      { notes: ['G2', 'B3'], scale: harmonizedScales.v.notes },
      { notes: ['A2', 'C4'], scale: harmonizedScales.vi.notes }
    ]
  },
  melancholy: {
    name: 'Melancholy',
    chords: [
      { notes: ['A2', 'C4'], scale: harmonizedScales.vi.notes },
      { notes: ['E2', 'G3'], scale: harmonizedScales.iii.notes },
      { notes: ['F2', 'A3'], scale: harmonizedScales.iv.notes },
      { notes: ['G2', 'B3'], scale: harmonizedScales.v.notes }
    ]
  },
  interstellar: {
    name: 'Interstellar',
    chords: [
      { notes: ['F2', 'E4'], scale: harmonizedScales.iv.notes },
      { notes: ['G2', 'E4'], scale: harmonizedScales.iii.notes },
      { notes: ['A2', 'E4'], scale: harmonizedScales.vi.notes },
      { notes: ['G2', 'E4'], scale: harmonizedScales.iii.notes }
    ]
  },
  inception: {
    name: 'Inception',
    chords: [
      { notes: ['D3', 'F3'], scale: harmonizedScales.ii.notes },
      { notes: ['A2', 'C4'], scale: harmonizedScales.vi.notes },
      { notes: ['C3', 'E3'], scale: harmonizedScales.i.notes },
      { notes: ['G2', 'B3'], scale: harmonizedScales.v.notes },
      { notes: ['D3', 'F3'], scale: harmonizedScales.ii.notes },
      { notes: ['F2', 'E4'], scale: harmonizedScales.iv.notes },
      { notes: ['C3', 'E3'], scale: harmonizedScales.i.notes }
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
 * @param harmonyEnabled - Whether harmony mode is enabled
 * @returns Array of all scale objects
 */
export function getAvailableScales(harmonyEnabled: boolean = false): MusicScale[] {
  return harmonyEnabled ? Object.values(harmonizedScales) : Object.values(simpleScales);
}

/**
 * Get a harmony by name
 * @param name - Name of the harmony to retrieve
 * @returns The requested harmony or the first harmony if not found
 */
export function getHarmonyByName(name: string): Harmony {
  return harmonies[name] || Object.values(harmonies)[0];
}
