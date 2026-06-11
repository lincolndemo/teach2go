import { describe, it, expect } from "vitest";
import { createSession, getSession } from "@/lib/session-store";
import { loadTopic, loadPersona } from "@/lib/content";

describe("session store", () => {
  it("creates and retrieves a session with initial lesson state", () => {
    const s = createSession(loadTopic("math-jss1-fractions"), loadPersona("mr-tobi"));
    expect(s.id).toBeTruthy();
    expect(s.lessonState.currentSegment).toBe(1);
    expect(s.history).toEqual([]);
    expect(getSession(s.id)).toBe(s);
  });

  it("returns undefined for unknown ids", () => {
    expect(getSession("nope")).toBeUndefined();
  });
});
