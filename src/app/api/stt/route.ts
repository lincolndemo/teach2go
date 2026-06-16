export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  const incoming = await req.formData();
  const audio = incoming.get("audio");
  if (!(audio instanceof Blob)) {
    return Response.json({ error: "Missing audio" }, { status: 400 });
  }

  const form = new FormData();
  form.append("file", audio, "speech.webm");
  form.append("model", "whisper-1");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Whisper transcription failed:", res.status, text);
    return Response.json({ error: "Transcription failed" }, { status: res.status });
  }

  const body = (await res.json()) as { text: string };
  return Response.json({ text: body.text });
}
