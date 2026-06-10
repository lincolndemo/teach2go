import type { AnimationStep } from "@/lib/types";

export const CANVAS_W = 600;
export const CANVAS_H = 400;

export interface CircleShape {
  kind: "circle";
  id: string;
  at: [number, number];
  radius: number;
  parts: number;
  shaded: number;
  color: string;
  label?: string;
}
export interface TextShape {
  kind: "text";
  text: string;
  at: [number, number];
  size: number;
}
export interface ArrowShape {
  kind: "arrow";
  from: [number, number];
  to: [number, number];
  label?: string;
}
export type Shape = CircleShape | TextShape | ArrowShape;

const COLORS: Record<string, string> = { primary: "#f59e0b", secondary: "#0ea5e9" };

export function buildScene(steps: AnimationStep[], count: number): Shape[] {
  const shapes: Shape[] = [];
  let circles = 0;

  const findCircle = (target: string): CircleShape | undefined =>
    shapes.find((s): s is CircleShape => s.kind === "circle" && s.id === target);

  for (const step of steps.slice(0, count)) {
    switch (step.action) {
      case "draw_circle":
        circles += 1;
        shapes.push({
          kind: "circle",
          id: step.id ?? `circle_${circles}`,
          at: step.at,
          radius: step.radius ?? 70,
          parts: 1,
          shaded: 0,
          color: COLORS.primary,
          label: step.label,
        });
        break;
      case "split": {
        const c = findCircle(step.target);
        if (c) c.parts = Math.max(1, step.parts);
        break;
      }
      case "shade": {
        const c = findCircle(step.target);
        if (c) {
          c.shaded = Math.max(0, step.parts);
          c.color = COLORS[step.color ?? "primary"] ?? step.color ?? COLORS.primary;
        }
        break;
      }
      case "annotate":
        shapes.push({ kind: "text", text: step.text, at: step.at, size: 24 });
        break;
      case "write_text":
        shapes.push({ kind: "text", text: step.text, at: step.at, size: step.size ?? 28 });
        break;
      case "arrow":
        shapes.push({ kind: "arrow", from: step.from, to: step.to, label: step.label });
        break;
    }
  }
  return shapes;
}

// Step k of n fires when narration progress crosses k/n (spec §3.2)
export function stepsVisible(total: number, progress: number): number {
  if (!Number.isFinite(progress)) return total;
  return Math.max(0, Math.min(total, Math.floor(progress * total + 1e-9)));
}
