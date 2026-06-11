import type { CheckQuestion, LessonState, Topic } from "@/lib/types";

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\w\s/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function initialLessonState(): LessonState {
  return { currentSegment: 1, segmentsCompleted: [], struggles: [] };
}

export function matchCheckAnswer(cq: CheckQuestion, answer: string): { correct: boolean; hint?: string } {
  const a = norm(answer);
  const parts = cq.answer.split(",").map(norm);
  if (parts.every((p) => a.includes(p))) return { correct: true };
  for (const [wrong, hint] of Object.entries(cq.wrong_answer_hints ?? {})) {
    if (a.includes(norm(wrong))) return { correct: false, hint };
  }
  return { correct: false };
}

export function applyCheckResult(state: LessonState, topic: Topic, correct: boolean): LessonState {
  if (!correct) return state;
  const completed = state.segmentsCompleted.includes(state.currentSegment)
    ? state.segmentsCompleted
    : [...state.segmentsCompleted, state.currentSegment];
  return {
    ...state,
    segmentsCompleted: completed,
    currentSegment: Math.min(state.currentSegment + 1, topic.segments.length),
  };
}

export function mergeStruggles(state: LessonState, incoming: unknown): LessonState {
  if (!Array.isArray(incoming)) return state;
  const merged = [...state.struggles];
  for (const s of incoming) {
    if (typeof s === "string" && !merged.includes(s)) merged.push(s);
  }
  return { ...state, struggles: merged };
}

export function progressPct(state: LessonState, topic: Topic): number {
  return Math.round((state.segmentsCompleted.length / topic.segments.length) * 100);
}
