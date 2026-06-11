import { describe, it, expect } from "vitest";
import { SSEDecoder } from "@/lib/sse-decoder";

describe("SSEDecoder", () => {
  it("decodes complete frames", () => {
    const d = new SSEDecoder();
    const events = d.push('event: teacher.transcript\ndata: {"text_chunk":"Hi","seq":0}\n\n');
    expect(events).toEqual([{ event: "teacher.transcript", data: { text_chunk: "Hi", seq: 0 } }]);
  });

  it("buffers frames split across chunks", () => {
    const d = new SSEDecoder();
    expect(d.push("event: lesson.state\nda")).toEqual([]);
    const events = d.push('ta: {"segment":2}\n\nevent: turn.metrics\ndata: {"total_ms":900}\n\n');
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ event: "lesson.state", data: { segment: 2 } });
    expect(events[1]).toEqual({ event: "turn.metrics", data: { total_ms: 900 } });
  });

  it("skips malformed frames without throwing", () => {
    const d = new SSEDecoder();
    expect(d.push("event: x\ndata: {bad\n\n")).toEqual([]);
  });
});
