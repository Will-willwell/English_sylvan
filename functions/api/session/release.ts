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
    if (!sessionId) return json({ active: false });
    const { error } = await client.from("user_device_sessions").update({ revoked_at: new Date().toISOString(), last_seen_at: new Date().toISOString() }).eq("user_id", auth.user.id).eq("session_id", sessionId);
    if (error) throw new Error(error.message);
    return json({ active: false });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Could not release device session." }, 500);
  }
}
