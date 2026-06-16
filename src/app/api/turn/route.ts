import { loadPersona, loadTopic } from "@/lib/content";
import { initialLessonState } from "@/lib/lesson-state";
import { runTurn } from "@/lib/tutor";
import { claudeStream } from "@/lib/llm";
import type { Session } from "@/lib/session-store";
import type { LessonState, Msg, TurnInput } from "@/lib/types";

export const runtime = "nodejs";

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

interface TurnRequestBody {
  input?: TurnInput;
  lessonState?: LessonState;
  history?: Msg[];
}

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as TurnRequestBody;
  if (!body.input) {
    return Response.json({ error: "missing input" }, { status: 400 });
  }

  // Stateless by design: the client round-trips lessonState/history with every
  // turn instead of the server keying off a session_id. Serverless deployments
  // don't guarantee the request that created a session lands on the same
  // instance as a later turn request, so an in-memory server-side store 404s
  // intermittently in production.
  const session: Session = {
    id: "stateless",
    topic: loadTopic("math-jss1-fractions"),
    persona: loadPersona("mrs-joy"),
    lessonState: body.lessonState ?? initialLessonState(),
    history: body.history ?? [],
    createdAt: Date.now(),
  };
  const input = body.input;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const ev of runTurn(session, input, claudeStream)) {
          controller.enqueue(encoder.encode(sse(ev.event, ev.data)));
        }
        controller.enqueue(
          encoder.encode(sse("session.sync", { lessonState: session.lessonState, history: session.history })),
        );
      } catch (err) {
        console.error("turn failed:", err);
        controller.enqueue(encoder.encode(sse("session.error", { message: err instanceof Error ? err.message : "turn failed" })));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
