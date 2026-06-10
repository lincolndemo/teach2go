import type { AnimationStep, VisualDirective } from "@/lib/types";

function isPoint(v: unknown): v is [number, number] {
  return Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === "number");
}

function validStep(raw: unknown): AnimationStep | null {
  if (typeof raw !== "object" || raw === null) return null;
  const s = raw as Record<string, unknown>;
  switch (s.action) {
    case "draw_circle":
      return isPoint(s.at) ? (s as unknown as AnimationStep) : null;
    case "split":
    case "shade":
      return typeof s.target === "string" && typeof s.parts === "number" ? (s as unknown as AnimationStep) : null;
    case "annotate":
    case "write_text":
      return typeof s.text === "string" && isPoint(s.at) ? (s as unknown as AnimationStep) : null;
    case "arrow":
      return isPoint(s.from) && isPoint(s.to) ? (s as unknown as AnimationStep) : null;
    default:
      return null;
  }
}

export function normalizeDirective(raw: unknown): VisualDirective {
  if (typeof raw !== "object" || raw === null) return { visual_mode: "none" };
  const d = raw as Record<string, unknown>;

  if (d.visual_mode === "prebuilt" && typeof d.asset_id === "string") {
    return { visual_mode: "prebuilt", asset_id: d.asset_id };
  }

  if (d.visual_mode === "live" && typeof d.animation === "object" && d.animation !== null) {
    const anim = d.animation as Record<string, unknown>;
    const rawSteps = Array.isArray(anim.steps) ? anim.steps : [];
    const steps = rawSteps.map(validStep).filter((s): s is AnimationStep => s !== null);
    if (steps.length > 0) {
      return {
        visual_mode: "live",
        animation: { type: "canvas_scene", steps, sync: anim.sync === "immediate" ? "immediate" : "narration" },
      };
    }
  }

  return { visual_mode: "none" };
}
