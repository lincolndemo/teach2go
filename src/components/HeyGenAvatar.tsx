"use client";

import { useEffect, useRef, useState } from "react";
import type { Persona } from "@/lib/types";

interface HeyGenAvatarProps {
  persona: Persona | null;
  speaking: boolean;
  transcript: string;
}

export default function HeyGenAvatar({ persona, speaking, transcript }: HeyGenAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize HeyGen session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await fetch("/api/heygen/session", { method: "POST" });
        if (!response.ok) throw new Error("Failed to initialize HeyGen session");
        const data = (await response.json()) as { session_id: string };
        setSessionId(data.session_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "HeyGen initialization failed");
        console.error("HeyGen session init error:", err);
      }
    };
    initSession();
  }, []);

  // Stream audio/text to HeyGen when transcript updates
  useEffect(() => {
    if (!sessionId || !speaking || !transcript.trim()) return;

    const streamToHeyGen = async () => {
      try {
        const response = await fetch("/api/heygen/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            text: transcript,
          }),
        });
        if (!response.ok) throw new Error("Failed to stream to HeyGen");
      } catch (err) {
        console.error("HeyGen stream error:", err);
      }
    };

    streamToHeyGen();
  }, [sessionId, speaking, transcript]);

  // Fallback: show static avatar if HeyGen fails or not initialized
  if (error || !sessionId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg bg-slate-800 p-6 text-white">
        <div className={`flex h-28 w-28 items-center justify-center rounded-full bg-slate-600 text-4xl font-bold ${speaking ? "ring-4 ring-emerald-400 animate-pulse" : ""}`}>
          {persona?.persona_name?.charAt(persona.persona_name.indexOf(".") + 2) ?? "T"}
        </div>
        <div className="text-lg font-semibold">{persona?.persona_name ?? "…"}</div>
        <div className="text-xs text-slate-300">{speaking ? "Speaking…" : "Listening"}</div>
        {error && <div className="text-xs text-red-400">{error}</div>}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg bg-black p-2">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full rounded object-cover"
        style={{ aspectRatio: "16/9" }}
      />
      <div className="text-xs text-white text-center">{persona?.persona_name ?? "Mr. Tobi"}</div>
    </div>
  );
}
