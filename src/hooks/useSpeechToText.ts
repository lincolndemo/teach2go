"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Browsers' built-in SpeechRecognition is avoided here: Edge gates it behind a
// combined camera+microphone permission prompt and its results are unreliable.
// Recording audio ourselves with an explicit { audio: true } constraint only
// ever asks for the microphone, and transcription runs server-side via Whisper.
export function useSpeechToText(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [supported, setSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia,
    );
  }, []);

  const start = useCallback(async () => {
    if (listening || transcribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setListening(false);
        setTranscribing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const form = new FormData();
          form.append("audio", blob, "speech.webm");
          const res = await fetch("/api/stt", { method: "POST", body: form });
          if (!res.ok) throw new Error(`stt request failed: ${res.status}`);
          const data = (await res.json()) as { text: string };
          if (data.text?.trim()) onResultRef.current(data.text.trim());
        } catch (err) {
          console.error("Speech-to-text error:", err);
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setListening(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      setListening(false);
    }
  }, [listening, transcribing]);

  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  return { supported, listening, transcribing, start, stop };
}
