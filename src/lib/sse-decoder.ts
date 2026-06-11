export interface SSEEvent {
  event: string;
  data: unknown;
}

export class SSEDecoder {
  private buffer = "";

  push(chunk: string): SSEEvent[] {
    this.buffer += chunk;
    const events: SSEEvent[] = [];
    let idx: number;
    while ((idx = this.buffer.indexOf("\n\n")) !== -1) {
      const frame = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 2);
      let event = "message";
      let data = "";
      for (const line of frame.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7).trim();
        else if (line.startsWith("data: ")) data += line.slice(6);
      }
      try {
        events.push({ event, data: JSON.parse(data) });
      } catch {
        // malformed frame — skip
      }
    }
    return events;
  }
}
