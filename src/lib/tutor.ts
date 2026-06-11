import type { Msg, TurnEvent, TurnInput } from "@/lib/types";
import type { Session } from "@/lib/session-store";
import { buildSystemPrompt, type SystemBlocks } from "@/lib/prompt";
import { TaggedParser } from "@/lib/tagged-parser";
import { normalizeDirective } from "@/lib/directive";
import { applyCheckResult, matchCheckAnswer, mergeStruggles, progressPct } from "@/lib/lesson-state";

export type LlmStream = (args: { system: SystemBlocks; messages: Msg[] }) => AsyncIterable<string>;

const HISTORY_LIMIT = 12;

function userMessage(session: Session, input: TurnInput, check?: { correct: boolean; hint?: string }): string {
  const seg = session.topic.segments.find((s) => s.sequence === session.lessonState.currentSegment);
  switch (input.type) {
    case "advance":
      return session.history.length === 0
        ? `Start the lesson. Greet the student briefly and teach the first concept of segment ${seg?.sequence}: "${seg?.title}".`
        : `Continue the lesson. Teach the next concept of segment ${seg?.sequence}: "${seg?.title}".`;
    case "question":
      return `The student asks: "${input.text}"`;
    case "check_answer": {
      const verdict = check?.correct ? "CORRECT" : "INCORRECT";
      const hint = check?.hint ? ` A known misconception applies: ${check.hint}` : "";
      return `The student answered the check question with: "${input.text}". This answer is ${verdict}.${hint} ${
        check?.correct
          ? "Celebrate briefly and move on per the updated lesson state."
          : "Re-teach the misunderstood idea simply, then encourage another try."
      }`;
    }
  }
}

export async function* runTurn(
  session: Session,
  input: TurnInput,
  llm: LlmStream,
  now: () => number = Date.now,
): AsyncGenerator<TurnEvent> {
  let check: { correct: boolean; hint?: string } | undefined;

  if (input.type === "check_answer") {
    const seg = session.topic.segments.find((s) => s.sequence === session.lessonState.currentSegment);
    if (seg) {
      check = matchCheckAnswer(seg.content.check_question, input.text);
      yield { event: "check.result", data: { correct: check.correct, explanation: check.hint ?? null } };
      session.lessonState = applyCheckResult(session.lessonState, session.topic, check.correct);
    }
  }

  const userMsg = userMessage(session, input, check);
  const system = buildSystemPrompt(session.persona, session.topic, session.lessonState);
  const messages: Msg[] = [...session.history, { role: "user", content: userMsg }];

  const queue: TurnEvent[] = [];
  let seq = 0;
  let directiveParseFailed = false;

  const parser = new TaggedParser({
    onSpeechText: (text) => {
      queue.push({ event: "teacher.transcript", data: { text_chunk: text, seq: seq++ } });
    },
    onSection: (section, content) => {
      if (section === "visual") {
        try {
          queue.push({ event: "visual.directive", data: normalizeDirective(JSON.parse(content)) });
        } catch {
          directiveParseFailed = true;
          queue.push({ event: "visual.directive", data: { visual_mode: "none" } });
        }
      } else if (section === "state") {
        try {
          const s = JSON.parse(content) as { student_struggles?: unknown };
          session.lessonState = mergeStruggles(session.lessonState, s.student_struggles);
        } catch {
          // state is advisory; ignore malformed state JSON
        }
        queue.push({
          event: "lesson.state",
          data: {
            segment: session.lessonState.currentSegment,
            progress_pct: progressPct(session.lessonState, session.topic),
          },
        });
      }
    },
  });

  const t0 = now();
  let firstTokenMs: number | null = null;
  let raw = "";

  for await (const chunk of llm({ system, messages })) {
    if (firstTokenMs === null) firstTokenMs = now() - t0;
    raw += chunk;
    parser.push(chunk);
    while (queue.length > 0) yield queue.shift()!;
  }
  parser.end();
  while (queue.length > 0) yield queue.shift()!;

  const newHistory: Msg[] = [
    ...session.history,
    { role: "user" as const, content: userMsg },
    { role: "assistant" as const, content: raw },
  ];
  session.history = newHistory.slice(-HISTORY_LIMIT);

  yield {
    event: "turn.metrics",
    data: { first_token_ms: firstTokenMs ?? -1, total_ms: now() - t0, directive_parse_failed: directiveParseFailed },
  };
}
