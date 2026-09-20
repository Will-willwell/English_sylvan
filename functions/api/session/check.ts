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
    const sessionId = new URL(context.request.url).searchParams.get("session_id")?.trim() || "";
    if (!sessionId) return json({ error: "A device session id is required." }, 400);
    const { data, error } = await client.from("user_device_sessions").select("session_id, revoked_at").eq("user_id", auth.user.id).maybeSingle();
    if (error) throw new Error(error.message);
    const active = Boolean(data && data.revoked_at === null && data.session_id === sessionId);
    if (active) {
      await client.from("user_device_sessions").update({ last_seen_at: new Date().toISOString() }).eq("user_id", auth.user.id).eq("session_id", sessionId);
    }
    return json({ active });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Could not check device session." }, 500);
  }
}
