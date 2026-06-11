import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "@/lib/prompt";
import { loadTopic, loadPersona } from "@/lib/content";
import { initialLessonState } from "@/lib/lesson-state";

const topic = loadTopic("math-jss1-fractions");
const persona = loadPersona("mr-tobi");

describe("buildSystemPrompt", () => {
  const { stable, volatile } = buildSystemPrompt(persona, topic, {
    ...initialLessonState(),
    currentSegment: 2,
    struggles: ["denominator"],
  });

  it("puts persona, curriculum, assets, rules, and format in the stable block", () => {
    expect(stable).toContain("Mr. Tobi");
    expect(stable).toContain("Fractions");
    expect(stable).toContain("math-jss1-fractions-pie-01");
    expect(stable).toContain("<speech>");
    expect(stable).toContain("<visual>");
    expect(stable).toContain("<state>");
    expect(stable).toContain("draw_circle");
  });

  it("puts only lesson state in the volatile block", () => {
    expect(volatile).toContain('"current_segment": 2');
    expect(volatile).toContain("denominator");
    expect(volatile).not.toContain("Mr. Tobi");
  });

  it("is byte-stable across calls with the same inputs (cache safety)", () => {
    const again = buildSystemPrompt(persona, topic, { ...initialLessonState(), currentSegment: 2, struggles: ["denominator"] });
    expect(again.stable).toBe(stable);
  });
});
