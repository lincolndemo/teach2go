import { describe, it, expect } from "vitest";
import { normalizeDirective } from "@/lib/directive";

describe("normalizeDirective", () => {
  it("accepts a valid live animation and keeps known steps", () => {
    const d = normalizeDirective({
      visual_mode: "live",
      animation: {
        type: "canvas_scene",
        sync: "narration",
        steps: [
          { action: "draw_circle", at: [200, 150] },
          { action: "split", target: "circle_1", parts: 8 },
          { action: "shade", target: "circle_1", parts: 3 },
          { action: "annotate", text: "3/8", at: [200, 280] },
          { action: "explode", target: "circle_1" },
        ],
      },
    });
    expect(d.visual_mode).toBe("live");
    if (d.visual_mode === "live") {
      expect(d.animation.steps).toHaveLength(4); // unknown "explode" dropped
      expect(d.animation.sync).toBe("narration");
    }
  });

  it("accepts a prebuilt directive with an asset id", () => {
    const d = normalizeDirective({ visual_mode: "prebuilt", asset_id: "math-jss1-fractions-pie-01" });
    expect(d).toEqual({ visual_mode: "prebuilt", asset_id: "math-jss1-fractions-pie-01" });
  });

  it("returns none for garbage, null, or missing fields", () => {
    expect(normalizeDirective(null).visual_mode).toBe("none");
    expect(normalizeDirective("nope").visual_mode).toBe("none");
    expect(normalizeDirective({ visual_mode: "prebuilt" }).visual_mode).toBe("none");
    expect(normalizeDirective({ visual_mode: "live" }).visual_mode).toBe("none");
  });

  it("drops steps with missing required fields", () => {
    const d = normalizeDirective({
      visual_mode: "live",
      animation: { type: "canvas_scene", sync: "narration", steps: [{ action: "annotate" }, { action: "write_text", text: "x", at: [1, 2] }] },
    });
    if (d.visual_mode === "live") expect(d.animation.steps).toHaveLength(1);
  });
});
