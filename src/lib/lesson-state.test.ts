import { describe, it, expect } from "vitest";
import {
  initialLessonState,
  matchCheckAnswer,
  applyCheckResult,
  mergeStruggles,
  progressPct,
} from "@/lib/lesson-state";
import { loadTopic } from "@/lib/content";

const topic = loadTopic("math-jss1-fractions");

describe("matchCheckAnswer", () => {
  const seg1 = topic.segments[0].content.check_question; // answer "3/8", hint for "8/3"

  it("accepts the exact answer and variants containing it", () => {
    expect(matchCheckAnswer(seg1, "3/8").correct).toBe(true);
    expect(matchCheckAnswer(seg1, "She ate 3/8 of it!").correct).toBe(true);
  });

  it("returns the matching wrong-answer hint", () => {
    const r = matchCheckAnswer(seg1, "8/3");
    expect(r.correct).toBe(false);
    expect(r.hint).toContain("pieces eaten go on top");
  });

  it("handles multi-part answers (all parts required)", () => {
    const cq = { q: "", answer: "teacher, board" };
    expect(matchCheckAnswer(cq, "The teacher and the board").correct).toBe(true);
    expect(matchCheckAnswer(cq, "the teacher").correct).toBe(false);
  });

  it("normalizes case and punctuation", () => {
    const cq = topic.segments[2].content.check_question; // "improper fraction"
    expect(matchCheckAnswer(cq, "An IMPROPER fraction.").correct).toBe(true);
  });
});

describe("lesson state", () => {
  it("starts at segment 1 with nothing complete", () => {
    expect(initialLessonState()).toEqual({ currentSegment: 1, segmentsCompleted: [], struggles: [] });
  });

  it("marks segment complete and advances on a correct answer", () => {
    const s = applyCheckResult(initialLessonState(), topic, true);
    expect(s.segmentsCompleted).toEqual([1]);
    expect(s.currentSegment).toBe(2);
  });

  it("does not advance past the last segment", () => {
    let s = initialLessonState();
    for (let i = 0; i < 4; i++) s = applyCheckResult(s, topic, true);
    expect(s.currentSegment).toBe(4);
    expect(s.segmentsCompleted).toEqual([1, 2, 3, 4]);
    expect(progressPct(s, topic)).toBe(100);
  });

  it("does not mark complete on a wrong answer", () => {
    const s = applyCheckResult(initialLessonState(), topic, false);
    expect(s.segmentsCompleted).toEqual([]);
    expect(s.currentSegment).toBe(1);
  });

  it("merges struggles without duplicates", () => {
    const s = mergeStruggles({ ...initialLessonState(), struggles: ["denominator"] }, ["denominator", "mixed numbers"]);
    expect(s.struggles).toEqual(["denominator", "mixed numbers"]);
  });
});
