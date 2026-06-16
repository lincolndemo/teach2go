// SpeechEngine interface (spec §3.3) — BrowserSpeechEngine is the spike stub;
// an ElevenLabs streaming implementation replaces it later without touching callers.
export interface SpeechEngine {
  speak(sentence: string): void;
  cancel(): void;
  readonly supported: boolean;
}

export interface SpeechEngineHandlers {
  // progress: 0..1 fraction of all queued characters spoken so far
  onProgress?: (progress: number) => void;
  onSpeakingChange?: (speaking: boolean) => void;
}

// Known female-voice names across common TTS engines — browser "Female"/"Woman"
// labels are rare in practice (Windows/macOS/Android ship named voices instead).
const FEMALE_VOICE_HINTS = [
  "female",
  "woman",
  "zira",
  "samantha",
  "victoria",
  "allison",
  "ava",
  "susan",
  "karen",
  "moira",
  "tessa",
  "veena",
  "fiona",
  "kate",
  "serena",
  "joanna",
  "salli",
  "kimberly",
  "amy",
  "emma",
  "ivy",
  "shimmer",
  "nova",
  "aria",
  "jenny",
  "michelle",
  "linda",
  "heera",
];

function pickFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const pool = english.length > 0 ? english : voices;
  const byHint = pool.find((v) => FEMALE_VOICE_HINTS.some((hint) => v.name.toLowerCase().includes(hint)));
  if (byHint) return byHint;
  return english[0];
}

export class BrowserSpeechEngine implements SpeechEngine {
  readonly supported: boolean;
  private totalChars = 0;
  private spokenChars = 0;
  private active = 0;
  private voice: SpeechSynthesisVoice | null = null;
  private voicesReady = false;

  constructor(private handlers: SpeechEngineHandlers = {}) {
    this.supported = typeof window !== "undefined" && "speechSynthesis" in window;
    if (this.supported) {
      this.loadVoice();
      window.speechSynthesis.addEventListener("voiceschanged", () => this.loadVoice());
    }
  }

  // Voice list loads asynchronously on most browsers (esp. Windows/Chrome) — an
  // empty list at construction time means utterances fall back to the system
  // default voice, which is usually male. Retry via the voiceschanged event.
  private loadVoice(): void {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;
    this.voice = pickFemaleVoice(voices) ?? null;
    this.voicesReady = true;
  }

  speak(sentence: string): void {
    if (!this.supported) return;
    const start = this.totalChars;
    this.totalChars += sentence.length;
    this.active += 1;

    const u = new SpeechSynthesisUtterance(sentence);
    u.rate = 1.0;
    u.pitch = 1.2;

    if (!this.voicesReady) this.loadVoice();
    if (this.voice) u.voice = this.voice;

    u.onstart = () => this.handlers.onSpeakingChange?.(true);
    u.onboundary = (e) => {
      this.spokenChars = Math.max(this.spokenChars, start + e.charIndex);
      this.emitProgress();
    };
    u.onend = () => {
      this.spokenChars = Math.max(this.spokenChars, start + sentence.length);
      this.active -= 1;
      this.emitProgress();
      if (this.active === 0) this.handlers.onSpeakingChange?.(false);
    };
    window.speechSynthesis.speak(u);
  }

  cancel(): void {
    if (!this.supported) return;
    window.speechSynthesis.cancel();
    this.active = 0;
    this.handlers.onSpeakingChange?.(false);
  }

  // Call when a new turn begins so progress restarts from 0
  reset(): void {
    this.cancel();
    this.totalChars = 0;
    this.spokenChars = 0;
  }

  private emitProgress(): void {
    if (this.totalChars > 0) this.handlers.onProgress?.(this.spokenChars / this.totalChars);
  }
}
