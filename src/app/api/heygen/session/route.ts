export const runtime = "nodejs";

interface HeyGenSessionResponse {
  data: {
    session_id: string;
  };
}

export async function POST(): Promise<Response> {
  const apiKey = process.env.HEYGEN_API_KEY;
  const avatarId = process.env.HEYGEN_AVATAR_ID || "default";

  if (!apiKey) {
    return Response.json({ error: "HEYGEN_API_KEY not configured" }, { status: 500 });
  }

  try {
    const response = await fetch("https://api.heygen.com/v1/streaming.create_session", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        avatar_id: avatarId,
        quality: "medium",
        avatar_config: {
          idle_gesture: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("HeyGen session creation failed:", error);
      return Response.json({ error: "Failed to create HeyGen session" }, { status: response.status });
    }

    const data = (await response.json()) as HeyGenSessionResponse;
    return Response.json({ session_id: data.data.session_id });
  } catch (error) {
    console.error("HeyGen session error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
