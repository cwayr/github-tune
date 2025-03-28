import type { MusicScale } from '../config/types';

type ScaleOptions = [string, string, string][];

export interface Chord {
  notes: string[];
  scale: ScaleOptions;
}

export interface Harmony {
  name: string;
  chords: Chord[];
}

export const simpleScales: Record<string, MusicScale> = {
  bright: {
    name: 'Bright',
    notes: [
      ['C2', 'F2', 'F2'], 
      ['G3', 'C4', 'D4'],
      ['D4', 'E4', 'G4'],
      ['G4', 'B4', 'D5'],
      ['C5', 'E5', 'F5'],
      ['E5', 'G5', 'B5'],
      ['G5', 'B5', 'D6'],
    ]
  },
  melancholy: {
    name: 'Melancholy',
    notes: [
      ['A2', 'D2', 'E2'], 
      ['E3', 'A3', 'D4'],
      ['A3', 'B3', 'C4'],
      ['C4', 'G4', 'A4'],
      ['G4', 'A4', 'B4'],
      ['B4', 'C5', 'D5'],
      ['E5', 'G5', 'A5'],
    ]
  }
}

export const harmonizedScales: Record<string, MusicScale> = {
  i: {
    name: 'C Major',
    notes: [
      ['C4', 'D4', 'E4'], 
      ['E4', 'G4', 'C5'],
      ['G4', 'B4', 'D5'],
      ['B4', 'C5', 'D5'],
      ['D5', 'E5', 'G5'],
      ['E5', 'G5', 'C6'],
      ['C6', 'B5', 'D6'],
    ]
  },
  ii: {
    name: 'D Minor',
    notes: [
      ['D4', 'E4', 'F4'], 
      ['F4', 'A4', 'C5'],
      ['A4', 'C5', 'D5'],
      ['C5', 'D5', 'E5'],
      ['D5', 'E5', 'F5'],
      ['F5', 'G5', 'A5'],
      ['D6', 'C6', 'E6'],
    ]
  },
  iii: {
    name: 'E Minor',
    notes: [
      ['B3', 'D4', 'E4'], 
      ['E4', 'G4', 'A4'],
      ['G4', 'B4', 'D5'],
      ['B4', 'D5', 'E5'],
      ['D5', 'E5', 'G5'],
      ['G5', 'A5', 'B5'],
      ['B5', 'E6', 'G6'],
    ]
  },
  iv: {
    name: 'F Major',
    notes: [
      ['C4', 'E4', 'F4'], 
      ['F4', 'G4', 'A4'],
      ['A4', 'C5', 'E5'],
      ['C5', 'E5', 'F5'],
      ['E5', 'F5', 'G5'],
      ['G5', 'A5', 'C6'],
      ['A5', 'C6', 'E6'],
    ]
  },
  v: {
    name: 'G Major',
    notes: [
      ['D4', 'G4', 'A4'], 
      ['G4', 'A4', 'B4'],
      ['A4', 'B4', 'D5'],
      ['D5', 'G5', 'A5'],
      ['G5', 'A5', 'B5'],
      ['B5', 'D6', 'G6'],
      ['D6', 'G6', 'A6'],
    ]
  },
  vi: {
    name: 'A Minor',
    notes: [
      ['C4', 'D4', 'E4'], 
      ['E4', 'G4', 'A4'],
      ['G4', 'A4', 'C5'],
      ['B4', 'C5', 'E5'],
      ['E5', 'G5', 'A5'],
      ['A5', 'B5', 'C6'],
      ['C6', 'B5', 'D6'],
    ]
  }
}

// Collection of available harmony progressions
export const harmonies: Record<string, Harmony> = {
  dreamy: {
    name: 'Dreamy',
    chords: [
      { notes: ['D2', 'F3'], scale: harmonizedScales.iv.notes as ScaleOptions },
      { notes: ['G2', 'B3'], scale: harmonizedScales.i.notes as ScaleOptions },
      { notes: ['C2', 'E3'], scale: harmonizedScales.v.notes as ScaleOptions },
      { notes: ['F2', 'A3'], scale: harmonizedScales.vi.notes as ScaleOptions },
    ]
  },
  melancholy: {
    name: 'Melancholy',
    chords: [
      { notes: ['A2', 'C4'], scale: harmonizedScales.vi.notes as ScaleOptions },
      { notes: ['E2', 'G3'], scale: harmonizedScales.iii.notes as ScaleOptions },
      { notes: ['F2', 'A3'], scale: harmonizedScales.iv.notes as ScaleOptions },
      { notes: ['G2', 'B3'], scale: harmonizedScales.v.notes as ScaleOptions },
      { notes: ['A2', 'C4'], scale: harmonizedScales.vi.notes as ScaleOptions },
      { notes: ['E2', 'G3'], scale: harmonizedScales.iii.notes as ScaleOptions },
      { notes: ['A2', 'C4'], scale: harmonizedScales.vi.notes as ScaleOptions },
    ]
  },
  interstellar: {
    name: 'Interstellar',
    chords: [
      { notes: ['F2', 'E4'], scale: harmonizedScales.iv.notes as ScaleOptions },
      { notes: ['G2', 'E4'], scale: harmonizedScales.iii.notes as ScaleOptions },
      { notes: ['A2', 'E4'], scale: harmonizedScales.vi.notes as ScaleOptions },
      { notes: ['G2', 'E4'], scale: harmonizedScales.iii.notes as ScaleOptions }
    ]
  },
  inception: {
    name: 'Inception',
    chords: [
      { notes: ['D3', 'F3'], scale: harmonizedScales.ii.notes as ScaleOptions },
      { notes: ['A2', 'C4'], scale: harmonizedScales.vi.notes as ScaleOptions },
      { notes: ['C3', 'E3'], scale: harmonizedScales.i.notes as ScaleOptions },
      { notes: ['G2', 'B3'], scale: harmonizedScales.v.notes as ScaleOptions },
      { notes: ['D3', 'F3'], scale: harmonizedScales.ii.notes as ScaleOptions },
      { notes: ['F2', 'E4'], scale: harmonizedScales.iv.notes as ScaleOptions },
      { notes: ['C3', 'E3'], scale: harmonizedScales.i.notes as ScaleOptions }
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
    interval = 1;
  }
  
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
