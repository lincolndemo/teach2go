import { describe, it, expect } from "vitest";
import { runTurn, type LlmStream } from "@/lib/tutor";
import { createSession } from "@/lib/session-store";
import { loadTopic, loadPersona } from "@/lib/content";
import type { TurnEvent } from "@/lib/types";

const RESPONSE =
  "<speech>Well done! A fraction is part of a whole. </speech>" +
  '<visual>{"visual_mode":"live","animation":{"type":"canvas_scene","sync":"narration","steps":[{"action":"draw_circle","at":[200,150]}]}}</visual>' +
  '<state>{"current_segment":1,"segment_complete":false,"student_struggles":["equal parts"]}</state>';

function fakeLlm(text: string, chunkSize = 7): LlmStream {
  return async function* () {
    for (let i = 0; i < text.length; i += chunkSize) yield text.slice(i, i + chunkSize);
  };
}

function freshSession() {
  return createSession(loadTopic("math-jss1-fractions"), loadPersona("mr-tobi"));
}

async function drain(gen: AsyncGenerator<TurnEvent>): Promise<TurnEvent[]> {
  const out: TurnEvent[] = [];
  for await (const ev of gen) out.push(ev);
  return out;
}

describe("runTurn", () => {
  it("streams transcript, directive, state, and metrics for an advance turn", async () => {
    const session = freshSession();
    const events = await drain(runTurn(session, { type: "advance" }, fakeLlm(RESPONSE)));

    const names = events.map((e) => e.event);
    expect(names).toContain("teacher.transcript");
    expect(names).toContain("visual.directive");
    expect(names).toContain("lesson.state");
    expect(names[names.length - 1]).toBe("turn.metrics");

    const transcript = events
      .filter((e) => e.event === "teacher.transcript")
      .map((e) => (e.data as { text_chunk: string }).text_chunk)
      .join("");
    expect(transcript).toContain("fraction is part of a whole");

    const directive = events.find((e) => e.event === "visual.directive")!.data as { visual_mode: string };
    expect(directive.visual_mode).toBe("live");

    const metrics = events[events.length - 1].data as { first_token_ms: number };
    expect(metrics.first_token_ms).toBeGreaterThanOrEqual(0);
  });

  it("merges LLM struggles into session state", async () => {
    const session = freshSession();
    await drain(runTurn(session, { type: "advance" }, fakeLlm(RESPONSE)));
    expect(session.lessonState.struggles).toContain("equal parts");
  });

  it("appends user and assistant turns to history", async () => {
    const session = freshSession();
    await drain(runTurn(session, { type: "question", text: "What is a numerator?" }, fakeLlm(RESPONSE)));
    expect(session.history).toHaveLength(2);
    expect(session.history[0].role).toBe("user");
    expect(session.history[0].content).toContain("What is a numerator?");
    expect(session.history[1].role).toBe("assistant");
  });

  it("emits check.result first and advances state on a correct answer", async () => {
    const session = freshSession();
    const events = await drain(runTurn(session, { type: "check_answer", text: "3/8" }, fakeLlm(RESPONSE)));
    expect(events[0].event).toBe("check.result");
    expect(events[0].data).toMatchObject({ correct: true });
    expect(session.lessonState.segmentsCompleted).toEqual([1]);
    expect(session.lessonState.currentSegment).toBe(2);
  });

  it("emits a hint on a known wrong answer and does not advance", async () => {
    const session = freshSession();
    const events = await drain(runTurn(session, { type: "check_answer", text: "8/3" }, fakeLlm(RESPONSE)));
    expect(events[0].data).toMatchObject({ correct: false });
    expect((events[0].data as { explanation: string }).explanation).toContain("on top");
    expect(session.lessonState.currentSegment).toBe(1);
  });

  it("flags directive parse failure in metrics but still streams speech", async () => {
    const broken = "<speech>Hello.</speech><visual>{not json</visual><state>{}</state>";
    const session = freshSession();
    const events = await drain(runTurn(session, { type: "advance" }, fakeLlm(broken)));
    const metrics = events[events.length - 1].data as { directive_parse_failed: boolean };
    expect(metrics.directive_parse_failed).toBe(true);
    expect(events.some((e) => e.event === "teacher.transcript")).toBe(true);
  });
});
