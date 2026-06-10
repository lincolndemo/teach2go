import { describe, it, expect } from "vitest";
import { loadTopic, loadPersona, toClientTopic } from "@/lib/content";

describe("content loader", () => {
  it("loads the fractions topic with 4 segments", () => {
    const topic = loadTopic("math-jss1-fractions");
    expect(topic.title).toBe("Fractions");
    expect(topic.segments).toHaveLength(4);
    expect(topic.asset_library.map((a) => a.id)).toContain("math-jss1-fractions-pie-01");
  });

  it("loads the Mr. Tobi persona", () => {
    const persona = loadPersona("mr-tobi");
    expect(persona.persona_name).toBe("Mr. Tobi");
  });

  it("strips answers from the client topic view", () => {
    const topic = loadTopic("math-jss1-fractions");
    const client = toClientTopic(topic);
    const cq = client.segments[0].content.check_question as Record<string, unknown>;
    expect(cq.q).toBeTruthy();
    expect(cq.answer).toBeUndefined();
    expect(cq.wrong_answer_hints).toBeUndefined();
  });
});
