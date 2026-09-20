import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Env = { SUPABASE_URL: string; SUPABASE_SECRET_KEY?: string; SUPABASE_SERVICE_ROLE_KEY?: string };
type PagesContext = { request: Request; env: Env };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

function clientFor(env: Env) {
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.SUPABASE_URL || !key) throw new Error("Admin API is not configured");
  return createClient(env.SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function requireAdmin(context: PagesContext, client: SupabaseClient) {
  const token = (context.request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: json({ error: "Your session has expired. Sign in again." }, 401) };
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) return { error: json({ error: "Your session has expired. Sign in again." }, 401) };
  const { data: profile, error: profileError } = await client.from("profiles").select("is_admin").eq("id", authData.user.id).maybeSingle();
  if (profileError || !profile?.is_admin) return { error: json({ error: "Administrator access is required." }, 403) };
  return { user: authData.user };
}

export async function onRequest(context: PagesContext) {
  try {
    const client = clientFor(context.env);
    const auth = await requireAdmin(context, client);
    if (auth.error) return auth.error;
    const url = new URL(context.request.url);
    const username = (url.searchParams.get("username") || "").trim().toLowerCase();
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 200), 1), 500);
    let query = client.from("admin_audit_log").select("id, actor_user_id, action, target_username, metadata, created_at").order("created_at", { ascending: false }).limit(limit);
    if (username) query = query.eq("target_username", username);
    const [{ data: logs, error }, { data: profiles, error: profileError }] = await Promise.all([query, client.from("profiles").select("id, username, display_name")]);
    if (error) throw new Error(error.message);
    if (profileError) throw new Error(profileError.message);
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    return json({ logs: (logs ?? []).map((log) => ({
      ...log,
      actor_username: log.actor_user_id ? profileById.get(log.actor_user_id)?.username ?? "former-admin" : "former-admin",
      actor_display_name: log.actor_user_id ? profileById.get(log.actor_user_id)?.display_name ?? "" : "",
    })) });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Audit API failed" }, 500);
  }
}
