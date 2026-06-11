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

export class BrowserSpeechEngine implements SpeechEngine {
  readonly supported: boolean;
  private totalChars = 0;
  private spokenChars = 0;
  private active = 0;

  constructor(private handlers: SpeechEngineHandlers = {}) {
    this.supported = typeof window !== "undefined" && "speechSynthesis" in window;
  }

  speak(sentence: string): void {
    if (!this.supported) return;
    const start = this.totalChars;
    this.totalChars += sentence.length;
    this.active += 1;

    const u = new SpeechSynthesisUtterance(sentence);
    u.rate = 1.0;
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
