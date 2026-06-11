"use client";

import { Stage, Layer, Circle, Line, Wedge, Text, Arrow, Group } from "react-konva";
import { buildScene, stepsVisible, CANVAS_W, CANVAS_H, type Shape } from "@/lib/scene";
import type { VisualDirective } from "@/lib/types";
import PrebuiltAssets from "@/components/PrebuiltAssets";

function ShapeView({ shape }: { shape: Shape }) {
  if (shape.kind === "circle") {
    const [cx, cy] = shape.at;
    const anglePer = 360 / shape.parts;
    return (
      <Group>
        {Array.from({ length: shape.shaded }, (_, k) => (
          <Wedge key={`w${k}`} x={cx} y={cy} radius={shape.radius} angle={anglePer} rotation={k * anglePer - 90} fill={shape.color} opacity={0.65} />
        ))}
        <Circle x={cx} y={cy} radius={shape.radius} stroke="#1f2937" strokeWidth={2.5} />
        {shape.parts > 1 &&
          Array.from({ length: shape.parts }, (_, k) => {
            const a = ((k * anglePer - 90) * Math.PI) / 180;
            return <Line key={`l${k}`} points={[cx, cy, cx + shape.radius * Math.cos(a), cy + shape.radius * Math.sin(a)]} stroke="#1f2937" strokeWidth={1.5} />;
          })}
        {shape.label && <Text x={cx - shape.radius} y={cy + shape.radius + 8} width={shape.radius * 2} align="center" text={shape.label} fontSize={18} fill="#1f2937" />}
      </Group>
    );
  }
  if (shape.kind === "text") {
    return <Text x={shape.at[0] - 100} y={shape.at[1] - shape.size / 2} width={200} align="center" text={shape.text} fontSize={shape.size} fontStyle="bold" fill="#1f2937" />;
  }
  return (
    <Group>
      <Arrow points={[shape.from[0], shape.from[1], shape.to[0], shape.to[1]]} stroke="#dc2626" fill="#dc2626" strokeWidth={2.5} pointerLength={10} pointerWidth={10} />
      {shape.label && <Text x={(shape.from[0] + shape.to[0]) / 2} y={(shape.from[1] + shape.to[1]) / 2 - 22} text={shape.label} fontSize={15} fill="#dc2626" />}
    </Group>
  );
}

export default function CanvasStage({ directive, progress }: { directive: VisualDirective | null; progress: number }) {
  if (!directive || directive.visual_mode === "none") {
    return <div className="flex h-full items-center justify-center text-gray-400">Visuals appear here</div>;
  }

  if (directive.visual_mode === "prebuilt") {
    return <PrebuiltAssets assetId={directive.asset_id} />;
  }

  const steps = directive.animation.steps;
  const visible = directive.animation.sync === "immediate" ? steps.length : stepsVisible(steps.length, progress);
  const scene = buildScene(steps, visible);

  return (
    <Stage width={CANVAS_W} height={CANVAS_H} className="mx-auto">
      <Layer>
        {scene.map((shape, i) => (
          <ShapeView key={i} shape={shape} />
        ))}
      </Layer>
    </Stage>
  );
}
