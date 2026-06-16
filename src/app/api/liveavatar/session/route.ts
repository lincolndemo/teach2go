export const runtime = "nodejs";

const LIVEAVATAR_API = "https://api.liveavatar.com";

interface TokenResponse {
  data: { session_id: string; session_token: string } | null;
  message: string;
}

interface StartResponse {
  data: {
    session_id: string;
    livekit_url: string;
    livekit_client_token: string;
  } | null;
  message: string;
}

export async function POST(): Promise<Response> {
  const apiKey = process.env.LIVEAVATAR_API_KEY;
  const avatarId = process.env.LIVEAVATAR_AVATAR_ID;

  if (!apiKey || !avatarId) {
    return Response.json({ error: "LIVEAVATAR_API_KEY or LIVEAVATAR_AVATAR_ID not configured" }, { status: 500 });
  }

  const tokenRes = await fetch(`${LIVEAVATAR_API}/v1/sessions/token`, {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "LITE", avatar_id: avatarId }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error("LiveAvatar token creation failed:", tokenRes.status, text);
    return Response.json({ error: "Failed to create LiveAvatar session token" }, { status: tokenRes.status });
  }

  const tokenBody = (await tokenRes.json()) as TokenResponse;
  if (!tokenBody.data) {
    console.error("LiveAvatar token response missing data:", tokenBody.message);
    return Response.json({ error: tokenBody.message || "No session token returned" }, { status: 502 });
  }

  const startRes = await fetch(`${LIVEAVATAR_API}/v1/sessions/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenBody.data.session_token}`, "Content-Type": "application/json" },
  });

  if (!startRes.ok) {
    const text = await startRes.text();
    console.error("LiveAvatar session start failed:", startRes.status, text);
    return Response.json({ error: "Failed to start LiveAvatar session" }, { status: startRes.status });
  }

  const startBody = (await startRes.json()) as StartResponse;
  if (!startBody.data) {
    console.error("LiveAvatar start response missing data:", startBody.message);
    return Response.json({ error: startBody.message || "No session data returned" }, { status: 502 });
  }

  return Response.json({
    session_id: startBody.data.session_id,
    livekit_url: startBody.data.livekit_url,
    livekit_client_token: startBody.data.livekit_client_token,
  });
}
