import { loadPersona, loadTopic, toClientTopic } from "@/lib/content";
import { createSession } from "@/lib/session-store";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const topic = loadTopic("math-jss1-fractions");
  const persona = loadPersona("mr-tobi");
  const session = createSession(topic, persona);
  return Response.json({
    session_id: session.id,
    topic: toClientTopic(topic),
    persona,
  });
}
