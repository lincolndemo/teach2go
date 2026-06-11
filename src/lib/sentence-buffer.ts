// Accumulates streamed text chunks and emits complete sentences for TTS.
export class SentenceBuffer {
  private pending = "";

  push(text: string): string[] {
    this.pending += text;
    const parts = this.pending.split(/(?<=[.!?])\s+/);
    this.pending = parts.pop() ?? "";
    return parts.map((p) => p.trim()).filter((p) => p.length > 0);
  }

  flush(): string[] {
    const p = this.pending.trim();
    this.pending = "";
    return p ? [p] : [];
  }
}
