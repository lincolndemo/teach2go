export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.LIVEAVATAR_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "LIVEAVATAR_API_KEY not configured" }, { status: 500 });
  }

  const body = (await req.json()) as { session_id?: string };
  if (!body.session_id) {
    return Response.json({ error: "Missing session_id" }, { status: 400 });
  }

  const res = await fetch("https://api.liveavatar.com/v1/sessions/stop", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: body.session_id, reason: "USER_CLOSED" }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("LiveAvatar stop failed:", res.status, text);
  }

  return Response.json({ ok: res.ok });
}
