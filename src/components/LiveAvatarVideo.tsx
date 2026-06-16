"use client";

import type { Persona } from "@/lib/types";
import type { LiveAvatarStatus } from "@/hooks/useLiveAvatar";

interface LiveAvatarVideoProps {
  persona: Persona | null;
  speaking: boolean;
  status: LiveAvatarStatus;
  error: string | null;
  previewImageUrl: string | null;
  attachVideo: (el: HTMLVideoElement | null) => void;
}

export default function LiveAvatarVideo({
  persona,
  speaking,
  status,
  error,
  previewImageUrl,
  attachVideo,
}: LiveAvatarVideoProps) {
  if (status !== "ready") {
    return (
      <div className="relative flex h-full flex-col items-center justify-center gap-3 overflow-hidden rounded-lg bg-slate-800 p-6 text-white">
        {previewImageUrl ? (
          <img
            src={previewImageUrl}
            alt={persona?.persona_name ?? "Avatar"}
            className={`h-full w-full rounded object-cover ${speaking ? "ring-4 ring-emerald-400" : ""}`}
          />
        ) : (
          <div
            className={`flex h-28 w-28 items-center justify-center rounded-full bg-slate-600 text-4xl font-bold ${
              speaking ? "ring-4 ring-emerald-400 animate-pulse" : ""
            }`}
          >
            {persona?.persona_name?.charAt(0) ?? "J"}
          </div>
        )}
        <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-1 bg-gradient-to-t from-black/70 to-transparent pt-6">
          <div className="text-lg font-semibold">{persona?.persona_name ?? "…"}</div>
          <div className="text-xs text-slate-200">
            {status === "connecting" ? "Connecting avatar…" : speaking ? "Speaking…" : "Listening"}
          </div>
          {error && <div className="text-xs text-red-300">{error}</div>}
        </div>
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
