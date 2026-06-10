const SECTIONS = ["speech", "visual", "state"] as const;
export type Section = (typeof SECTIONS)[number];

export interface TaggedParserHandlers {
  onSpeechText?: (text: string) => void;
  onSection?: (section: Section, content: string) => void;
}

// Incremental parser for <speech>…</speech><visual>…</visual><state>…</state>.
// Speech content is emitted as it arrives (holding back enough characters that a
// closing tag split across chunks is never leaked as speech text).
export class TaggedParser {
  private buffer = "";
  private current: Section | null = null;
  private sectionContent = "";

  constructor(private handlers: TaggedParserHandlers) {}

  push(chunk: string): void {
    this.buffer += chunk;
    this.process(false);
  }

  end(): void {
    this.process(true);
  }

  private process(final: boolean): void {
    for (;;) {
      if (this.current === null) {
        let earliest: { section: Section; idx: number } | null = null;
        for (const s of SECTIONS) {
          const idx = this.buffer.indexOf(`<${s}>`);
          if (idx !== -1 && (earliest === null || idx < earliest.idx)) earliest = { section: s, idx };
        }
        if (!earliest) {
          // Keep only a tail that could still be a partial opening tag like "<spee"
          if (!final && this.buffer.length > 8) this.buffer = this.buffer.slice(-8);
          if (final) this.buffer = "";
          return;
        }
        this.buffer = this.buffer.slice(earliest.idx + earliest.section.length + 2);
        this.current = earliest.section;
        this.sectionContent = "";
      } else {
        const closeTag = `</${this.current}>`;
        const idx = this.buffer.indexOf(closeTag);
        if (idx === -1) {
          if (this.current === "speech" && !final) {
            const safeLen = this.buffer.length - (closeTag.length - 1);
            if (safeLen > 0) {
              const text = this.buffer.slice(0, safeLen);
              this.sectionContent += text;
              this.handlers.onSpeechText?.(text);
              this.buffer = this.buffer.slice(safeLen);
            }
          }
          if (final) {
            this.sectionContent += this.buffer;
            if (this.current === "speech" && this.buffer.length > 0) {
              this.handlers.onSpeechText?.(this.buffer);
            }
            this.handlers.onSection?.(this.current, this.sectionContent.trim());
            this.buffer = "";
            this.current = null;
          }
          return;
        }
        const rest = this.buffer.slice(0, idx);
        this.sectionContent += rest;
        if (this.current === "speech" && rest.length > 0) this.handlers.onSpeechText?.(rest);
        this.handlers.onSection?.(this.current, this.sectionContent.trim());
        this.buffer = this.buffer.slice(idx + closeTag.length);
        this.current = null;
      }
    }
  }
}
