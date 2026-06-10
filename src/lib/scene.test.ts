import { describe, it, expect } from "vitest";
import { buildScene, stepsVisible } from "@/lib/scene";
import type { AnimationStep } from "@/lib/types";

const STEPS: AnimationStep[] = [
  { action: "draw_circle", at: [200, 150] },
  { action: "split", target: "circle_1", parts: 8 },
  { action: "shade", target: "circle_1", parts: 3, color: "primary" },
  { action: "annotate", text: "3/8", at: [200, 280] },
];

describe("buildScene", () => {
  it("builds the segment-1 fraction scene", () => {
    const scene = buildScene(STEPS, 4);
    expect(scene).toHaveLength(2);
    const circle = scene[0];
    expect(circle).toMatchObject({ kind: "circle", id: "circle_1", parts: 8, shaded: 3 });
    expect(scene[1]).toMatchObject({ kind: "text", text: "3/8" });
  });

  it("only applies the first N steps", () => {
    const scene = buildScene(STEPS, 2);
    expect(scene).toHaveLength(1);
    expect(scene[0]).toMatchObject({ kind: "circle", parts: 8, shaded: 0 });
  });

  it("auto-numbers circles and resolves targets", () => {
    const scene = buildScene(
      [
        { action: "draw_circle", at: [100, 100] },
        { action: "draw_circle", at: [300, 100] },
        { action: "shade", target: "circle_2", parts: 1 },
      ],
      3,
    );
    expect(scene[1]).toMatchObject({ id: "circle_2", shaded: 1 });
  });

  it("ignores steps targeting unknown shapes", () => {
    const scene = buildScene([{ action: "shade", target: "circle_9", parts: 1 }], 1);
    expect(scene).toHaveLength(0);
  });

  it("renders write_text and arrow shapes", () => {
    const scene = buildScene(
      [
        { action: "write_text", text: "13 / 5", at: [100, 60], size: 32 },
        { action: "arrow", from: [100, 80], to: [200, 120], label: "remainder" },
      ],
      2,
    );
    expect(scene[0]).toMatchObject({ kind: "text", text: "13 / 5", size: 32 });
    expect(scene[1]).toMatchObject({ kind: "arrow", label: "remainder" });
  });
});

describe("stepsVisible", () => {
  it("maps narration progress to step count", () => {
    expect(stepsVisible(4, 0)).toBe(0);
    expect(stepsVisible(4, 0.5)).toBe(2);
    expect(stepsVisible(4, 0.99)).toBe(3);
    expect(stepsVisible(4, 1)).toBe(4);
    expect(stepsVisible(4, 1.5)).toBe(4);
  });
});
