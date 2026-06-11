"use client";

import type { TurnMetrics } from "@/hooks/useTurnStream";

export default function LatencyHud({ metrics }: { metrics: TurnMetrics | null }) {
  if (!metrics) return null;
  const row = (label: string, v: number | null, budget?: number) => (
    <div className="flex justify-between gap-4">
      <span>{label}</span>
      <span className={v !== null && budget !== undefined && v > budget ? "text-red-400" : "text-emerald-400"}>
        {v === null ? "—" : `${v} ms`}
      </span>
    </div>
  );
  return (
    <div className="fixed bottom-3 right-3 z-50 rounded bg-black/80 px-3 py-2 font-mono text-xs text-white">
      {row("server first token", metrics.serverFirstTokenMs, 1200)}
      {row("first caption", metrics.firstCaptionMs, 2000)}
      {row("first directive", metrics.firstDirectiveMs)}
      {row("turn total", metrics.totalMs)}
    </div>
  );
}
