import * as Tone from 'tone';

// Define types for SFZ regions (simplified for this example)
interface SFZRegion {
  sample: string; // Path to the sample file (e.g., "A0.flac")
  lokey: number;  // Lowest MIDI note for this region
  hikey: number;  // Highest MIDI note for this region
  pitch_keycenter: number;
}

// Define a mapping for Tone.js Sampler
interface SamplerMapping {
  [note: string]: Tone.ToneAudioBuffer;
}

// Define the main class for the Salamander Piano
class SalamanderPiano {
  private sfzUrl: string = 'https://archive.org/download/SalamanderGrandPianoV3/SalamanderGrandPianoV3.sfz';
  private baseSampleUrl: string = 'https://archive.org/download/SalamanderGrandPianoV3/';
  private sampler: Tone.Sampler | null = null;
  private isInitialized: boolean = false;
  private regions: SFZRegion[] = [];

  constructor() {}

  // Initialize the piano: fetch SFZ, parse it, and load samples
  public async initialize(): Promise<void> {
    try {
      await Tone.start();
      console.log('Audio context started');
      await this.fetchAndParseSFZ();
      await this.loadSamples();

      this.isInitialized = true;
      console.log('SalamanderPiano initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SalamanderPiano:', error);
      throw error;
    }
  }

  // Fetch and parse the SFZ file using inline parsing
  private async fetchAndParseSFZ(): Promise<void> {
    const response = await fetch(this.sfzUrl);
    if (!response.ok) throw new Error(`SFZ fetch failed: ${response.status}`);
    
    const sfzText = await response.text();
    const parsed = parseSFZ(sfzText);
    
    this.regions = parsed.regions.filter(r => 
      r.sample && !isNaN(r.lokey) && !isNaN(r.hikey)
    );
  }

  // Load samples and configure the Tone.js Sampler
  private async loadSamples(): Promise<void> {
    const urls = this.regions.reduce((acc, r) => {
      const url = `${this.baseSampleUrl}${encodeURI(r.sample)}`;
      return acc.includes(url) ? acc : [...acc, url];
    }, [] as string[]);

    const buffers = await Promise.all(
      urls.map(url => 
        Tone.Buffer.fromUrl(url).catch(() => {
          console.error(`Failed to load sample: ${url}`);
          return null;
        })
      )
    );

    const validBuffers = buffers.filter(Boolean) as Tone.ToneAudioBuffer[];
    const noteMap = this.regions.reduce((acc, r) => {
      const buffer = validBuffers.find(b => b.name.includes(r.sample));
      if (!buffer) return acc;

      const baseNote = r.pitch_keycenter;
      const note = Tone.Frequency(baseNote, 'midi').toNote();
      return { ...acc, [note]: buffer };
    }, {} as SamplerMapping);

    this.sampler = new Tone.Sampler({
      urls: noteMap,
      release: 1,
      baseUrl: this.baseSampleUrl
    }).toDestination();
  }

  // Check if the piano is initialized
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.sampler) {
      throw new Error('SalamanderPiano is not initialized. Call initialize() first.');
    }
  }

  // Play a single note
  public playNote(note: string, velocity: number = 0.8, duration: string = '4n'): void {
    this.ensureInitialized();
    const normalizedVelocity = Math.max(0, Math.min(1, velocity)); // Normalize velocity to 0-1
    this.sampler!.triggerAttackRelease(note, duration, undefined, normalizedVelocity);
  }

  // Play multiple notes (e.g., a chord)
  public playChord(notes: string[], velocity: number = 0.8, duration: string = '4n'): void {
    this.ensureInitialized();
    const normalizedVelocity = Math.max(0, Math.min(1, velocity));
    this.sampler!.triggerAttackRelease(notes, duration, undefined, normalizedVelocity);
  }

  // Stop a specific note
  public stopNote(note: string): void {
    this.ensureInitialized();
    this.sampler!.triggerRelease(note);
  }

  // Stop multiple notes
  public stopNotes(notes: string[]): void {
    this.ensureInitialized();
    this.sampler!.triggerRelease(notes);
  }

  // Stop all notes
  public stopAll(): void {
    this.ensureInitialized();
    this.sampler!.releaseAll();
  }

  // Get initialization status
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

// Inline SFZ parsing function
const parseSFZ = (text: string): { regions: SFZRegion[] } => {
  const regions: SFZRegion[] = [];
  const lines = text.split('\n');
  
  let currentRegion: Partial<SFZRegion> = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('<region>')) {
      if (currentRegion.sample) {
        regions.push({
          sample: currentRegion.sample,
          lokey: currentRegion.lokey || 0,
          hikey: currentRegion.hikey || 127,
          pitch_keycenter: currentRegion.pitch_keycenter || 60
        });
      }
      currentRegion = {};
    } else {
      const [key, value] = trimmed.split('=');
      if (key && value) {
        switch(key.toLowerCase()) {
          case 'sample': currentRegion.sample = value; break;
          case 'lokey': currentRegion.lokey = Number(value); break;
          case 'hikey': currentRegion.hikey = Number(value); break;
          case 'pitch_keycenter': currentRegion.pitch_keycenter = Number(value); break;
        }
      }
    }
  }
  
  return { regions };
};

// Export a singleton instance or allow instantiation as needed
export const piano = new SalamanderPiano();
