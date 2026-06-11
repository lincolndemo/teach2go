"use client";

import { Stage, Layer, Circle, Line, Wedge, Text, Group } from "react-konva";

interface PrebuiltAssetProps {
  assetId: string;
}

interface PieProps {
  parts?: number;
  shaded?: number;
}

function PieVisualization({ parts = 8, shaded = 1 }: PieProps) {
  const cx = 300;
  const cy = 200;
  const radius = 80;
  const anglePer = 360 / parts;
  const colors = ["#f59e0b", "#fbbf24"];

  return (
    <Stage width={600} height={400} className="mx-auto">
      <Layer>
        <Group>
          {/* Shaded wedges */}
          {Array.from({ length: shaded }, (_, k) => (
            <Wedge
              key={`s${k}`}
              x={cx}
              y={cy}
              radius={radius}
              angle={anglePer}
              rotation={k * anglePer - 90}
              fill={colors[0]}
              opacity={0.7}
            />
          ))}
          {/* Circle outline */}
          <Circle x={cx} y={cy} radius={radius} stroke="#1f2937" strokeWidth={2.5} />
          {/* Division lines */}
          {Array.from({ length: parts }, (_, k) => {
            const a = ((k * anglePer - 90) * Math.PI) / 180;
            return (
              <Line
                key={`l${k}`}
                points={[cx, cy, cx + radius * Math.cos(a), cy + radius * Math.sin(a)]}
                stroke="#1f2937"
                strokeWidth={1.5}
              />
            );
          })}
          {/* Label */}
          <Text
            x={cx - 40}
            y={cy + radius + 20}
            width={80}
            align="center"
            text={`${shaded}/${parts}`}
            fontSize={20}
            fill="#1f2937"
            fontStyle="bold"
          />
        </Group>
      </Layer>
    </Stage>
  );
}

export default function PrebuiltAssets({ assetId }: PrebuiltAssetProps) {
  switch (assetId) {
    case "math-jss1-fractions-pie-01":
      return <PieVisualization parts={8} shaded={3} />;
    default:
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-amber-400 bg-amber-50 p-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">Prebuilt asset</span>
          <span className="font-mono text-sm text-gray-700">{assetId}</span>
        </div>
      );
  }
}
