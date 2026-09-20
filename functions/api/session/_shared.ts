import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

type Env = { SUPABASE_URL: string; SUPABASE_SECRET_KEY?: string; SUPABASE_SERVICE_ROLE_KEY?: string };
type PagesContext = { request: Request; env: Env };

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

export function adminClient(env: Env) {
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.SUPABASE_URL || !key) throw new Error("Session API is not configured");
  return createClient(env.SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function requireUser(context: PagesContext, client: SupabaseClient) {
  const token = (context.request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: json({ error: "Your session has expired. Sign in again." }, 401) };
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { error: json({ error: "Your session has expired. Sign in again." }, 401) };
  return { user: data.user };
}

