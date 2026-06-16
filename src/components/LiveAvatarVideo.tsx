"use client";

import type { Persona } from "@/lib/types";
import type { LiveAvatarStatus } from "@/hooks/useLiveAvatar";

interface LiveAvatarVideoProps {
  persona: Persona | null;
  speaking: boolean;
  status: LiveAvatarStatus;
  error: string | null;
  attachVideo: (el: HTMLVideoElement | null) => void;
}

export default function LiveAvatarVideo({ persona, speaking, status, error, attachVideo }: LiveAvatarVideoProps) {
  if (status !== "ready") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg bg-slate-800 p-6 text-white">
        <div
          className={`flex h-28 w-28 items-center justify-center rounded-full bg-slate-600 text-4xl font-bold ${
            speaking ? "ring-4 ring-emerald-400 animate-pulse" : ""
          }`}
        >
          {persona?.persona_name?.charAt(0) ?? "J"}
        </div>
        <div className="text-lg font-semibold">{persona?.persona_name ?? "…"}</div>
        <div className="text-xs text-slate-300">
          {status === "connecting" ? "Connecting avatar…" : speaking ? "Speaking…" : "Listening"}
        </div>
        {error && <div className="text-xs text-red-400">{error}</div>}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg bg-black p-2">
      <video
        ref={attachVideo}
        autoPlay
        playsInline
        className="h-full w-full rounded object-cover"
        style={{ aspectRatio: "16/9" }}
      />
      <div className="text-xs text-white text-center">{persona?.persona_name ?? "Mrs. Joy"}</div>
    </div>
  );
}
