"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocalAudioTrack, Room, RoomEvent, Track } from "livekit-client";
import { LiveAvatarSpeechEngine } from "@/lib/liveavatar-speech";
import type { SpeechEngineHandlers } from "@/lib/speech";

export type LiveAvatarStatus = "connecting" | "ready" | "error";

interface UseLiveAvatarResult {
  status: LiveAvatarStatus;
  error: string | null;
  engine: LiveAvatarSpeechEngine | null;
  previewImageUrl: string | null;
  attachVideo: (el: HTMLVideoElement | null) => void;
}

export function useLiveAvatar(handlers: SpeechEngineHandlers): UseLiveAvatarResult {
  const [status, setStatus] = useState<LiveAvatarStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<LiveAvatarSpeechEngine | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);

  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
    if (el) {
      if (!remoteStream.current) remoteStream.current = new MediaStream();
      if (el.srcObject !== remoteStream.current) el.srcObject = remoteStream.current;
      void el.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    let room: Room | null = null;
    let audioCtx: AudioContext | null = null;
    let cancelled = false;
    let sessionId: string | null = null;

    const connect = async () => {
      try {
        const res = await fetch("/api/liveavatar/session", { method: "POST" });
        if (!res.ok) throw new Error("Failed to start LiveAvatar session");
        const data = (await res.json()) as { session_id: string; livekit_url: string; livekit_client_token: string };
        sessionId = data.session_id;

        if (cancelled) {
          void fetch("/api/liveavatar/stop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          });
          return;
        }

        if (!remoteStream.current) remoteStream.current = new MediaStream();
        room = new Room();
        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
            remoteStream.current!.addTrack(track.mediaStreamTrack);
            if (videoElRef.current) void videoElRef.current.play().catch(() => {});
          }
        });
        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          remoteStream.current!.removeTrack(track.mediaStreamTrack);
        });

        await room.connect(data.livekit_url, data.livekit_client_token);
        if (cancelled) {
          room.disconnect();
          return;
        }

        audioCtx = new AudioContext();
        const destination = audioCtx.createMediaStreamDestination();
        const audioTrack = new LocalAudioTrack(destination.stream.getAudioTracks()[0]);
        await room.localParticipant.publishTrack(audioTrack);

        const liveEngine = new LiveAvatarSpeechEngine(audioCtx, destination, handlers);
        setEngine(liveEngine);
        setStatus("ready");
      } catch (err) {
        console.error("LiveAvatar connection error:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "LiveAvatar connection failed");
          setStatus("error");
        }
      }
    };

    void connect();

    fetch("/api/liveavatar/avatar")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { preview_url: string | null } | null) => {
        if (!cancelled && d?.preview_url) setPreviewImageUrl(d.preview_url);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      room?.disconnect();
      void audioCtx?.close();
      if (sessionId) {
        void fetch("/api/liveavatar/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
      }
    };
    // handlers identity is stable for the component's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, error, engine, previewImageUrl, attachVideo };
}
