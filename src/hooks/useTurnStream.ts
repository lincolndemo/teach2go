"use client";

import { useCallback, useRef, useState } from "react";
import { SSEDecoder, type SSEEvent } from "@/lib/sse-decoder";
import { initialLessonState } from "@/lib/lesson-state";
import type { LessonState, Msg, TurnInput } from "@/lib/types";

export interface TurnMetrics {
  firstCaptionMs: number | null;
  firstDirectiveMs: number | null;
  serverFirstTokenMs: number | null;
  totalMs: number | null;
}

interface CachedTurn {
  events: SSEEvent[];
}

export function useTurnStream(sessionId: string | null, onEvent: (ev: SSEEvent) => void) {
  const [busy, setBusy] = useState(false);
  const [metrics, setMetrics] = useState<TurnMetrics | null>(null);
  const lastTurn = useRef<CachedTurn | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const lessonState = useRef<LessonState>(initialLessonState());
  const history = useRef<Msg[]>([]);

  const sendTurn = useCallback(
    async (input: TurnInput) => {
      if (!sessionId || busy) return;
      setBusy(true);
      const sentAt = performance.now();
      const m: TurnMetrics = { firstCaptionMs: null, firstDirectiveMs: null, serverFirstTokenMs: null, totalMs: null };
      const cached: CachedTurn = { events: [] };

      try {
        const res = await fetch("/api/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input, lessonState: lessonState.current, history: history.current }),
        });
        if (!res.ok || !res.body) throw new Error(`turn request failed: ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const sse = new SSEDecoder();

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const ev of sse.push(decoder.decode(value, { stream: true }))) {
            if (ev.event === "session.sync") {
              const d = ev.data as { lessonState: LessonState; history: Msg[] };
              lessonState.current = d.lessonState;
              history.current = d.history;
              continue;
            }
            if (ev.event === "teacher.transcript" && m.firstCaptionMs === null) {
              m.firstCaptionMs = Math.round(performance.now() - sentAt);
            }
            if (ev.event === "visual.directive" && m.firstDirectiveMs === null) {
              m.firstDirectiveMs = Math.round(performance.now() - sentAt);
            }
            if (ev.event === "turn.metrics") {
              const d = ev.data as { first_token_ms: number; total_ms: number };
              m.serverFirstTokenMs = d.first_token_ms;
              m.totalMs = Math.round(performance.now() - sentAt);
            }
            cached.events.push(ev);
            onEventRef.current(ev);
          }
        }
        lastTurn.current = cached;
        setMetrics({ ...m });
      } catch (err) {
        onEventRef.current({ event: "session.error", data: { message: err instanceof Error ? err.message : "stream failed" } });
      } finally {
        setBusy(false);
      }
    },
    [sessionId, busy],
  );

  // "Repeat that" — replay the cached turn with no LLM call (spec §3.4)
  const repeat = useCallback(() => {
    if (!lastTurn.current) return;
    for (const ev of lastTurn.current.events) {
      if (ev.event !== "turn.metrics") onEventRef.current(ev);
    }
  }, []);

  return { sendTurn, repeat, busy, metrics, hasLastTurn: () => lastTurn.current !== null };
}
