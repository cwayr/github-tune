export interface Contribution {
  date: string;
  level: number;
}

export interface ContributionWeek {
  days: Contribution[];
}

export interface ContributionYear {
  weeks: ContributionWeek[];
}

export interface MusicScale {
  name: string;
  notes: [string, string, string][];
}

export interface HarmonySettings {
  enabled: boolean;
  name: string;
}

export interface PlaybackSettings {
  speed: number;
  scale: MusicScale;
  harmony: HarmonySettings;
}

export type Theme = 'light' | 'dark' | 'custom';

export interface AllContributions {
  lastYear: ContributionYear;
  [year: string]: ContributionYear;
}

export interface AppState {
  username: string;
  contributionData: AllContributions | null;
  selectedYear: string;
  isPlaying: boolean;
  playbackSettings: PlaybackSettings;
  currentPosition: { week: number; day: number } | null;
  theme: Theme;
}
