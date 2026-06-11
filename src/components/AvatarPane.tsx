"use client";

import type { Persona } from "@/lib/types";

// HeyGen stream stub (spec §3.3): static persona card with a speaking indicator.
export default function AvatarPane({ persona, speaking }: { persona: Persona | null; speaking: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg bg-slate-800 p-6 text-white">
      <div className={`flex h-28 w-28 items-center justify-center rounded-full bg-slate-600 text-4xl font-bold ${speaking ? "ring-4 ring-emerald-400 animate-pulse" : ""}`}>
        {persona?.persona_name?.charAt(persona.persona_name.indexOf(".") + 2) ?? "T"}
      </div>
      <div className="text-lg font-semibold">{persona?.persona_name ?? "…"}</div>
      <div className="text-xs text-slate-300">{speaking ? "Speaking…" : "Listening"}</div>
    </div>
  );
}
