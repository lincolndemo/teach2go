export const runtime = "nodejs";

interface AvatarResponse {
  data: { preview_url: string } | null;
  message: string;
}

// Avatar metadata is free (no session credits consumed), so this works even
// when the LiveAvatar account has no credits for live sessions.
export async function GET(): Promise<Response> {
  const apiKey = process.env.LIVEAVATAR_API_KEY;
  const avatarId = process.env.LIVEAVATAR_AVATAR_ID;
  if (!apiKey || !avatarId) {
    return Response.json({ error: "LiveAvatar not configured" }, { status: 500 });
  }

  const res = await fetch(`https://api.liveavatar.com/v1/avatars/${avatarId}`, {
    headers: { "X-API-KEY": apiKey },
  });

  if (!res.ok) {
    return Response.json({ error: "Failed to fetch avatar metadata" }, { status: res.status });
  }

  const body = (await res.json()) as AvatarResponse;
  return Response.json({ preview_url: body.data?.preview_url ?? null });
}
