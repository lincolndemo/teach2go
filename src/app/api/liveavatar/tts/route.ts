export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  const body = (await req.json()) as { text: string };
  if (!body.text?.trim()) {
    return Response.json({ error: "Missing text" }, { status: 400 });
  }

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "tts-1",
      voice: "shimmer",
      input: body.text,
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("OpenAI TTS failed:", res.status, text);
    return Response.json({ error: "TTS generation failed" }, { status: res.status });
  }

  return new Response(res.body, { headers: { "Content-Type": "audio/mpeg" } });
}
