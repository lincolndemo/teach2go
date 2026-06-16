export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.HEYGEN_API_KEY;
  const body = (await req.json()) as { session_id: string; text: string };

  if (!apiKey) {
    return Response.json({ error: "HEYGEN_API_KEY not configured" }, { status: 500 });
  }

  if (!body.session_id || !body.text) {
    return Response.json({ error: "Missing session_id or text" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.heygen.com/v1/streaming.submit_text", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_id: body.session_id,
        text: body.text,
        generate_subtitle: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("HeyGen stream failed:", error);
      return Response.json({ error: "Failed to stream to HeyGen" }, { status: response.status });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("HeyGen stream error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
