import { getSession } from "@/lib/session-store";
import { runTurn } from "@/lib/tutor";
import { claudeStream } from "@/lib/llm";
import type { TurnInput } from "@/lib/types";

export const runtime = "nodejs";

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as { session_id?: string; input?: TurnInput };
  const session = body.session_id ? getSession(body.session_id) : undefined;
  if (!session || !body.input) {
    return Response.json({ error: "unknown session or missing input" }, { status: 404 });
  }
  const input = body.input;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const ev of runTurn(session, input, claudeStream)) {
          controller.enqueue(encoder.encode(sse(ev.event, ev.data)));
        }
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
