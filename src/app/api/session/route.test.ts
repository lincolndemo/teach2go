import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/session/route";

describe("POST /api/session", () => {
  it("creates a session and returns client-safe topic data", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      session_id: string;
      topic: { title: string; segments: Array<{ content: { check_question: Record<string, unknown> } }> };
      persona: { persona_name: string };
    };
    expect(body.session_id).toBeTruthy();
    expect(body.topic.title).toBe("Fractions");
    expect(body.persona.persona_name).toBe("Mrs. Joy");
    expect(body.topic.segments[0].content.check_question.answer).toBeUndefined();
  });
});
