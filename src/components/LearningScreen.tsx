"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LiveAvatarVideo from "@/components/LiveAvatarVideo";
import CaptionsBar from "@/components/CaptionsBar";
import LatencyHud from "@/components/LatencyHud";
import { useTurnStream } from "@/hooks/useTurnStream";
import { useLiveAvatar } from "@/hooks/useLiveAvatar";
import { BrowserSpeechEngine } from "@/lib/speech";
import { SentenceBuffer } from "@/lib/sentence-buffer";
import type { ClientTopic, Persona, VisualDirective } from "@/lib/types";
import type { SSEEvent } from "@/lib/sse-decoder";

const CanvasStage = dynamic(() => import("@/components/CanvasStage"), { ssr: false });

export default function LearningScreen() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [topic, setTopic] = useState<ClientTopic | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);

  const [captions, setCaptions] = useState("");
  const [directive, setDirective] = useState<VisualDirective | null>(null);
  const [progress, setProgress] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [segment, setSegment] = useState(1);
  const [progressPct, setProgressPct] = useState(0);
  const [checkFeedback, setCheckFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);

  const sentences = useRef(new SentenceBuffer());
  const speechHandlers = useMemo(
    () => ({ onProgress: setProgress, onSpeakingChange: setSpeaking }),
    [],
  );
  const liveAvatar = useLiveAvatar(speechHandlers);
  const fallbackEngine = useMemo(() => new BrowserSpeechEngine(speechHandlers), [speechHandlers]);
  const engine = liveAvatar.status === "ready" && liveAvatar.engine ? liveAvatar.engine : fallbackEngine;

  useEffect(() => {
    fetch("/api/session", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        setSessionId(d.session_id);
        setTopic(d.topic);
        setPersona(d.persona);
      })
      .catch(() => setError("Could not start a session. Is the dev server running?"));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleEvent = useCallback(
    (ev: SSEEvent) => {
      switch (ev.event) {
        case "teacher.transcript": {
          const chunk = (ev.data as { text_chunk: string }).text_chunk;
          setCaptions((c) => c + chunk);
          for (const s of sentences.current.push(chunk)) engine.speak(s);
          break;
        }
        case "visual.directive":
          setDirective(ev.data as VisualDirective);
          break;
        case "lesson.state": {
          const d = ev.data as { segment: number; progress_pct: number };
          setSegment(d.segment);
          setProgressPct(d.progress_pct);
          break;
        }
        case "check.result": {
          const d = ev.data as { correct: boolean; explanation: string | null };
          setCheckFeedback(d.correct ? "✓ Correct!" : `✗ Not quite.${d.explanation ? ` ${d.explanation}` : ""}`);
          break;
        }
        case "session.error":
          setError(`Mr. Tobi lost his chalk — try again. (${(ev.data as { message: string }).message})`);
          break;
      }
    },
    [engine],
  );

  const { sendTurn, repeat, busy, metrics, hasLastTurn } = useTurnStream(sessionId, handleEvent);

  const beginTurn = useCallback(
    (input: Parameters<typeof sendTurn>[0]) => {
      // Interrupt: cancel speech within the turn-submission tick (spec §3.4)
      engine.reset();
      sentences.current = new SentenceBuffer();
      setCaptions("");
      setDirective(null);
      setProgress(0);
      setCheckFeedback(null);
      setError(null);
      void sendTurn(input).then(() => {
        for (const s of sentences.current.flush()) engine.speak(s);
      });
    },
    [engine, sendTurn],
  );

  const currentSegment = topic?.segments.find((s) => s.sequence === segment);
  const effectiveProgress = engine.supported ? progress : 1;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-3 p-4">
      <header className="flex items-center justify-between rounded bg-slate-800 px-4 py-2 text-sm text-white">
        <span>Subject: Mathematics</span>
        <span>Topic: {topic?.title ?? "…"} — Segment {segment}{currentSegment ? `: ${currentSegment.title}` : ""}</span>
        <span>Progress {progressPct}% · ⏱ {Math.floor(elapsed / 60)}m {elapsed % 60}s</span>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
        <div className="min-h-[260px] rounded-lg bg-black overflow-hidden">
          <LiveAvatarVideo
            persona={persona}
            speaking={speaking}
            status={liveAvatar.status}
            error={liveAvatar.error}
            attachVideo={liveAvatar.attachVideo}
          />
        </div>
        <div className="min-h-[260px] rounded-lg border bg-white p-2">
          <CanvasStage directive={directive} progress={effectiveProgress} />
        </div>
      </div>

      <CaptionsBar text={captions} />
      {checkFeedback && <div className="rounded bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">{checkFeedback}</div>}
      {error && <div className="rounded bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex flex-col gap-2 rounded border bg-slate-50 p-3">
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            disabled={!sessionId || busy}
            onClick={() => { setStarted(true); setPaused(false); beginTurn({ type: "advance" }); }}
          >
            {started ? "Continue lesson" : "Start lesson"}
          </button>
          <button
            className="rounded border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
            disabled={!hasLastTurn() || busy}
            onClick={() => { engine.reset(); sentences.current = new SentenceBuffer(); setCaptions(""); setProgress(0); repeat(); }}
          >
            Repeat that
          </button>
          {speaking && (
            <>
              <button
                className="rounded border border-orange-400 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 disabled:opacity-40"
                onClick={() => { engine.cancel(); setPaused(true); }}
              >
                ⏸ Pause
              </button>
              <button
                className="rounded border border-red-400 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-40"
                onClick={() => { engine.cancel(); setPaused(false); setCaptions(""); setProgress(0); setDirective(null); }}
              >
                ⏹ Stop
              </button>
            </>
          )}
          {paused && (
            <button
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              onClick={() => { setPaused(false); repeat(); }}
            >
              ▶ Resume
            </button>
          )}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); if (questionText.trim()) { beginTurn({ type: "question", text: questionText.trim() }); setQuestionText(""); } }}
        >
          <input
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Type your question…"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            disabled={!sessionId}
          />
          <button className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40" disabled={busy || !questionText.trim()}>
            Ask ➤
          </button>
        </form>

        {currentSegment && started && (
          <form
            className="flex flex-col gap-2 rounded border border-amber-200 bg-amber-50 p-3"
            onSubmit={(e) => { e.preventDefault(); if (answerText.trim()) { beginTurn({ type: "check_answer", text: answerText.trim() }); setAnswerText(""); } }}
          >
            <span className="text-sm font-medium text-amber-900">Check question: {currentSegment.content.check_question.q}</span>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded border border-amber-300 px-3 py-2 text-sm"
                placeholder="Your answer…"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
              />
              <button className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40" disabled={busy || !answerText.trim()}>
                Answer
              </button>
            </div>
          </form>
        )}
      </div>

      <LatencyHud metrics={metrics} />
    </main>
  );
}
