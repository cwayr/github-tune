/**
 * Harmonies for GitHub contribution melodies
 * Each harmony is a progression of chord notes that will play at specified intervals
 */

export interface Chord {
  notes: string[];
}

export interface Harmony {
  name: string;
  description: string;
  chords: Chord[];
}

// Collection of available harmony progressions
export const harmonies: Record<string, Harmony> = {
  simple: {
    name: 'Simple',
    description: 'Basic chord progression in C major',
    chords: [
      { notes: ['C2', 'E3'] },
      { notes: ['A1', 'C3'] },
      { notes: ['E2', 'C3'] },
      { notes: ['F2', 'A3'] } 
    ]
  },
  jazz: {
    name: 'Jazz',
    description: 'Jazz-inspired chord progression',
    chords: [
      { notes: ['D2', 'C3', 'F3'] },  // Dm7
      { notes: ['G2', 'F3', 'B3'] },  // G7
      { notes: ['C3', 'E3', 'B3'] },  // Cmaj7
      { notes: ['A2', 'G3', 'C4'] }   // Am7
    ]
  },
  dreamy: {
    name: 'Dreamy',
    description: 'Ethereal chord progression',
    chords: [
      { notes: ['F2', 'A3'] },  // F major
      { notes: ['C2', 'E3'] },  // Cmaj7
      { notes: ['G2', 'B3'] },  // G major
      { notes: ['A2', 'C3'] }   // A minor
    ]
  },
  melancholy: {
    name: 'Melancholy',
    description: 'Reflective minor chord progression',
    chords: [
      { notes: ['A2', 'C4'] },  // A minor
      { notes: ['E2', 'G3'] },  // E minor
      { notes: ['F2', 'A3'] },  // F major
      { notes: ['G2', 'B3'] }  // G7
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
 * Get a harmony by name
 * @param name - Name of the harmony to retrieve
 * @returns The requested harmony or the first harmony if not found
 */
export function getHarmonyByName(name: string): Harmony {
  return harmonies[name] || Object.values(harmonies)[0];
}
