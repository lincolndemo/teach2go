import type { SpeechEngine, SpeechEngineHandlers } from "@/lib/speech";

// Feeds decoded TTS buffers sentence-by-sentence into a persistent
// MediaStreamAudioDestinationNode that's already published as a LiveKit
// audio track, so the LiveAvatar bot lip-syncs the way a human mic would drive it.
export class LiveAvatarSpeechEngine implements SpeechEngine {
  readonly supported = true;
  private queue: string[] = [];
  private playing = false;
  private cancelled = false;
  private totalChars = 0;
  private spokenChars = 0;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor(
    private audioCtx: AudioContext,
    private destination: MediaStreamAudioDestinationNode,
    private handlers: SpeechEngineHandlers = {},
  ) {}

  speak(sentence: string): void {
    this.totalChars += sentence.length;
    this.queue.push(sentence);
    void this.drain();
  }

  private async drain(): Promise<void> {
    if (this.playing) return;
    this.playing = true;
    this.handlers.onSpeakingChange?.(true);

    while (this.queue.length > 0 && !this.cancelled) {
      const sentence = this.queue.shift()!;
      await this.playSentence(sentence);
    }

    this.playing = false;
    if (!this.cancelled) this.handlers.onSpeakingChange?.(false);
  }

  private async playSentence(sentence: string): Promise<void> {
    let buffer: AudioBuffer;
    try {
      const res = await fetch("/api/liveavatar/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sentence }),
      });
      if (!res.ok) throw new Error("tts request failed");
      const bytes = await res.arrayBuffer();
      buffer = await this.audioCtx.decodeAudioData(bytes);
    } catch (err) {
      console.error("LiveAvatar TTS playback error:", err);
      this.spokenChars += sentence.length;
      this.emitProgress();
      return;
    }

    if (this.cancelled) return;

    await new Promise<void>((resolve) => {
      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.destination);
      this.currentSource = source;
      source.onended = () => {
        this.currentSource = null;
        this.spokenChars += sentence.length;
        this.emitProgress();
        resolve();
      };
      source.start();
    });
  }

  cancel(): void {
    this.cancelled = true;
    this.queue = [];
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // already stopped
      }
      this.currentSource = null;
    }
    this.playing = false;
    this.handlers.onSpeakingChange?.(false);
    // Allow future speak() calls to resume draining
    this.cancelled = false;
  }

  reset(): void {
    this.cancel();
    this.totalChars = 0;
    this.spokenChars = 0;
  }

  private emitProgress(): void {
    if (this.totalChars > 0) this.handlers.onProgress?.(this.spokenChars / this.totalChars);
  }
}
