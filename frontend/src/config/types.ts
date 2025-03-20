export interface Contribution {
  date: string;
  count: number;
}

export interface ContributionWeek {
  days: Contribution[];
}

export interface ContributionYear {
  weeks: ContributionWeek[];
  year: number;
}

export interface MusicScale {
  name: string;
  notes: string[];
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

export interface AppState {
  username: string;
  contributionData: ContributionYear | null;
  isPlaying: boolean;
  playbackSettings: PlaybackSettings;
  currentPosition: { week: number; day: number } | null;
  theme: Theme;
}
