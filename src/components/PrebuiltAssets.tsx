"use client";

import { Stage, Layer, Circle, Line, Wedge, Text, Group, Rect } from "react-konva";

interface PrebuiltAssetProps {
  assetId: string;
}

interface PieProps {
  parts?: number;
  shaded?: number;
}

interface FractionLabelProps {
  numerator: string;
  denominator: string;
}

function PieVisualization({ parts = 8, shaded = 1 }: PieProps) {
  const cx = 300;
  const cy = 200;
  const radius = 80;
  const anglePer = 360 / parts;

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
              fill="#f59e0b"
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

function FractionLabel({ numerator, denominator }: FractionLabelProps) {
  const cx = 300;
  const cy = 150;

  return (
    <Stage width={600} height={400} className="mx-auto">
      <Layer>
        <Group>
          {/* Large fraction display */}
          <Text x={cx - 80} y={cy - 40} width={160} align="center" text={numerator} fontSize={60} fill="#1f2937" fontStyle="bold" />
          <Line points={[cx - 70, cy + 20, cx + 70, cy + 20]} stroke="#1f2937" strokeWidth={3} />
          <Text x={cx - 80} y={cy + 40} width={160} align="center" text={denominator} fontSize={60} fill="#1f2937" fontStyle="bold" />

          {/* Labels with arrows */}
          <Line points={[cx - 80, cy - 50, cx - 100, cy - 70]} stroke="#dc2626" strokeWidth={2} />
          <Text x={cx - 140} y={cy - 80} text="numerator" fontSize={14} fill="#dc2626" />

          <Line points={[cx + 80, cy + 50, cx + 100, cy + 70]} stroke="#0ea5e9" strokeWidth={2} />
          <Text x={cx + 60} y={cy + 75} text="denominator" fontSize={14} fill="#0ea5e9" />
        </Group>
      </Layer>
    </Stage>
  );
}

function TypesChart(): JSX.Element {
  const w = 600;
  const h = 400;
  const cols = [
    { title: "Proper", example: "2/5", color: "#059669" },
    { title: "Improper", example: "7/4", color: "#dc2626" },
    { title: "Mixed", example: "1 3/4", color: "#2563eb" },
  ];
  const colWidth = w / 3;

  return (
    <Stage width={w} height={h} className="mx-auto">
      <Layer>
        <Group>
          {cols.map((col, i) => (
            <Group key={i}>
              {/* Column background */}
              <Rect x={i * colWidth + 10} y={30} width={colWidth - 20} height={h - 60} fill={col.color} opacity={0.1} stroke={col.color} strokeWidth={2} />
              {/* Title */}
              <Text x={i * colWidth + 10} y={50} width={colWidth - 20} align="center" text={col.title} fontSize={18} fill={col.color} fontStyle="bold" />
              {/* Example */}
              <Text x={i * colWidth + 10} y={200} width={colWidth - 20} align="center" text={col.example} fontSize={40} fill="#1f2937" fontStyle="bold" />
            </Group>
          ))}
        </Group>
      </Layer>
    </Stage>
  );
}

export default function PrebuiltAssets({ assetId }: PrebuiltAssetProps) {
  switch (assetId) {
    case "math-jss1-fractions-pie-01":
      return <PieVisualization parts={8} shaded={3} />;
    case "math-jss1-fractions-labels-01":
      return <FractionLabel numerator="5" denominator="12" />;
    case "math-jss1-fractions-types-01":
      return <TypesChart />;
    default:
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-amber-400 bg-amber-50 p-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">Prebuilt asset</span>
          <span className="font-mono text-sm text-gray-700">{assetId}</span>
        </div>
      );
  }
}
