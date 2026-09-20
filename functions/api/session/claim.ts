import { adminClient, json, requireUser } from "./_shared";

type Env = { SUPABASE_URL: string; SUPABASE_SECRET_KEY?: string; SUPABASE_SERVICE_ROLE_KEY?: string };
type PagesContext = { request: Request; env: Env };

async function readSessionId(request: Request) {
  const body = await request.json().catch(() => ({}));
  return typeof body.session_id === "string" ? body.session_id.trim() : "";
}

export async function onRequest(context: PagesContext) {
  try {
    const client = adminClient(context.env);
    const auth = await requireUser(context, client);
    if (auth.error) return auth.error;
    const sessionId = await readSessionId(context.request);
    if (!sessionId) return json({ error: "A device session id is required." }, 400);
    const { error } = await client.from("user_device_sessions").upsert({
      user_id: auth.user.id,
      session_id: sessionId,
      user_agent: context.request.headers.get("user-agent"),
      last_seen_at: new Date().toISOString(),
      revoked_at: null,
    }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return json({ active: true });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Could not claim device session." }, 500);
  }
}
