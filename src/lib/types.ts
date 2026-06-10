// Animation step vocabulary interpreted by the canvas engine (spec §3.2)
export type AnimationStep =
  | { action: "draw_circle"; at: [number, number]; radius?: number; label?: string; id?: string }
  | { action: "split"; target: string; parts: number }
  | { action: "shade"; target: string; parts: number; color?: string }
  | { action: "annotate"; text: string; at: [number, number] }
  | { action: "write_text"; text: string; at: [number, number]; size?: number }
  | { action: "arrow"; from: [number, number]; to: [number, number]; label?: string };

export interface CanvasAnimation {
  type: "canvas_scene";
  steps: AnimationStep[];
  sync: "narration" | "immediate";
}

export type VisualDirective =
  | { visual_mode: "live"; animation: CanvasAnimation }
  | { visual_mode: "prebuilt"; asset_id: string }
  | { visual_mode: "none" };

export interface LessonState {
  currentSegment: number; // 1-based segment sequence
  segmentsCompleted: number[];
  struggles: string[];
}

export type TurnInput =
  | { type: "advance" }
  | { type: "question"; text: string }
  | { type: "check_answer"; text: string };

export interface TurnEvent {
  event:
    | "teacher.transcript"
    | "visual.directive"
    | "lesson.state"
    | "check.result"
    | "turn.metrics"
    | "session.error";
  data: unknown;
}

// Curriculum schema — mirrors PRD §7.2 JSON exactly
export interface CheckQuestion {
  q: string;
  answer: string;
  wrong_answer_hints?: Record<string, string>;
}

export interface SegmentContent {
  teaching_outline: string;
  key_terms: string[];
  examples: string[];
  misconceptions: string[];
  check_question: CheckQuestion;
  visual_plan: { prebuilt_assets: string[]; live_animation_example: string };
}

export interface Segment {
  sequence: number;
  title: string;
  content: SegmentContent;
}

export interface AssetInfo {
  id: string;
  type: string;
  description: string;
}

export interface Topic {
  subject: string;
  class_level: string;
  title: string;
  sequence: number;
  objectives: string[];
  segments: Segment[];
  asset_library: AssetInfo[];
}

export interface Persona {
  subject_code: string;
  persona_name: string;
  persona_config: { appearance: string; traits: string };
}

// Topic as sent to the browser — check answers stripped so devtools can't cheat
export type ClientSegment = Omit<Segment, "content"> & {
  content: Omit<SegmentContent, "check_question"> & { check_question: { q: string } };
};
export type ClientTopic = Omit<Topic, "segments"> & { segments: ClientSegment[] };

export interface Msg {
  role: "user" | "assistant";
  content: string;
}
