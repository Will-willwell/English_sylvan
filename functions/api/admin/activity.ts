import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

type Env = { SUPABASE_URL: string; SUPABASE_SECRET_KEY?: string; SUPABASE_SERVICE_ROLE_KEY?: string };
type PagesContext = { request: Request; env: Env };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

function adminClient(env: Env) {
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.SUPABASE_URL || !key) throw new Error("Admin API is not configured");
  return createClient(env.SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function requireAdmin(context: PagesContext, client: SupabaseClient) {
  const authorization = context.request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return { error: json({ error: "Your session has expired. Sign in again." }, 401) };
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) return { error: json({ error: "Your session has expired. Sign in again." }, 401) };
  const { data: profile, error: profileError } = await client.from("profiles").select("is_admin").eq("id", authData.user.id).maybeSingle();
  if (profileError || !profile?.is_admin) return { error: json({ error: "Administrator access is required." }, 403) };
  return { user: authData.user };
}

export async function onRequest(context: PagesContext) {
  try {
    const client = adminClient(context.env);
    const auth = await requireAdmin(context, client);
    if (auth.error) return auth.error;

    const url = new URL(context.request.url);
    const username = (url.searchParams.get("username") || "").trim().toLowerCase();
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100), 1), 500);

    const [{ data: allowlist, error: allowlistError }, { data: profiles, error: profilesError }, { data: users, error: usersError }, activityResult, { data: progress, error: progressError }] = await Promise.all([
      client.from("allowed_usernames").select("username, display_name, is_active").order("username"),
      client.from("profiles").select("id, username, display_name, is_admin"),
      client.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      client.from("user_activity").select("id, user_id, unit_id, activity_type, metadata, created_at").order("created_at", { ascending: false }).limit(limit),
      client.from("user_progress").select("user_id, unit_id, progress"),
    ]);
    if (allowlistError) throw new Error(allowlistError.message);
    if (profilesError) throw new Error(profilesError.message);
    if (usersError) throw new Error(usersError.message);
    if (activityResult.error) throw new Error(activityResult.error.message);
    if (progressError) throw new Error(progressError.message);

    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const userById = new Map((users?.users ?? []).map((user: User) => [user.id, user]));
    const allowlistedUsers = allowlist ?? [];
    const selectedProfile = username ? (profiles ?? []).find((profile) => profile.username === username) : null;
    const selectedUserId = selectedProfile?.id ?? (users?.users ?? []).find((user: User) => user.email?.toLowerCase() === `${username}@english-sylvan.local`)?.id;
    const filteredActivities = (activityResult.data ?? []).filter((activity) => !selectedUserId || activity.user_id === selectedUserId).map((activity) => {
      const profile = profileById.get(activity.user_id);
      const authUser = userById.get(activity.user_id);
      return { ...activity, username: profile?.username ?? authUser?.email?.split("@")[0] ?? "unknown", display_name: profile?.display_name ?? "" };
    });

    const completedUnits = (progress ?? []).filter((row) => row.progress >= 100).length;
    const activeUserIds = new Set((activityResult.data ?? []).map((activity) => activity.user_id));
    return json({
      users: allowlistedUsers,
      activities: filteredActivities,
      stats: {
        total_users: allowlist?.length ?? 0,
        enabled_users: (allowlist ?? []).filter((entry) => entry.is_active).length,
        active_users: activeUserIds.size,
        completed_units: completedUnits,
        activity_count: activityResult.data?.length ?? 0,
      },
    });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Activity API failed" }, 500);
  }
}
