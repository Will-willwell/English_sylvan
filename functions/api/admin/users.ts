import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

type Env = {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

type PagesContext = { request: Request; env: Env };

type UserRecord = {
  username: string;
  display_name: string;
  is_active: boolean;
  is_admin: boolean;
  user_id: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
};

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;
const DOMAIN = "english-sylvan.local";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function adminClient(env: Env) {
  const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.SUPABASE_URL || !key) throw new Error("Admin API is not configured");
  return createClient(env.SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function usernameEmail(username: string) {
  return `${username}@${DOMAIN}`;
}

function normalizedUsername(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function requireAdmin(context: PagesContext, client: SupabaseClient) {
  const authorization = context.request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return { error: json({ error: "Your session has expired. Sign in again." }, 401) };

  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) return { error: json({ error: "Your session has expired. Sign in again." }, 401) };

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("is_admin")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (profileError || !profile?.is_admin) return { error: json({ error: "Administrator access is required." }, 403) };

  return { user: authData.user };
}

async function listAllUsers(client: SupabaseClient) {
  const users: User[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    users.push(...data.users);
    if (data.users.length < 1000) return users;
    page += 1;
  }
}

async function buildUserRecords(client: SupabaseClient) {
  const [{ data: allowlist, error: allowlistError }, { data: profiles, error: profilesError }, users] = await Promise.all([
    client.from("allowed_usernames").select("username, display_name, is_active, created_at").order("username"),
    client.from("profiles").select("id, username, display_name, is_admin"),
    listAllUsers(client),
  ]);
  if (allowlistError) throw new Error(allowlistError.message);
  if (profilesError) throw new Error(profilesError.message);

  const profileByUsername = new Map((profiles ?? []).map((profile) => [profile.username, profile]));
  const userByEmail = new Map(users.map((user) => [user.email?.toLowerCase() ?? "", user]));
  return (allowlist ?? []).map((entry) => {
    const profile = profileByUsername.get(entry.username);
    const authUser = userByEmail.get(usernameEmail(entry.username));
    return {
      username: entry.username,
      display_name: profile?.display_name || entry.display_name || entry.username,
      is_active: entry.is_active,
      is_admin: Boolean(profile?.is_admin),
      user_id: authUser?.id ?? profile?.id ?? null,
      created_at: authUser?.created_at ?? entry.created_at ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    } satisfies UserRecord;
  });
}

async function handleGet(context: PagesContext, client: SupabaseClient) {
  const auth = await requireAdmin(context, client);
  if (auth.error) return auth.error;
  return json({ users: await buildUserRecords(client) });
}

async function handlePost(context: PagesContext, client: SupabaseClient) {
  const auth = await requireAdmin(context, client);
  if (auth.error) return auth.error;
  const body = await context.request.json().catch(() => ({}));
  const username = normalizedUsername(body.username);
  const password = typeof body.password === "string" ? body.password : "";
  const displayName = typeof body.display_name === "string" ? body.display_name.trim() : username;
  const isAdmin = body.is_admin === true;

  if (!USERNAME_PATTERN.test(username)) return json({ error: "Username must be 3-32 characters and use lowercase letters, numbers, dot, underscore, or hyphen." }, 400);
  if (password.length < 6) return json({ error: "Password must be at least 6 characters." }, 400);

  const { error: allowlistError } = await client.from("allowed_usernames").upsert({
    username, display_name: displayName || username, is_active: true,
  }, { onConflict: "username" });
  if (allowlistError) return json({ error: allowlistError.message }, 400);

  const { data, error } = await client.auth.admin.createUser({
    email: usernameEmail(username), password, email_confirm: true,
    user_metadata: { username, display_name: displayName || username },
  });
  if (error) return json({ error: error.message }, 400);

  const { error: profileError } = await client.from("profiles").update({
    display_name: displayName || username, is_admin: isAdmin,
  }).eq("id", data.user.id);
  if (profileError) return json({ error: profileError.message }, 400);
  return json({ user: { username, user_id: data.user.id } }, 201);
}

async function handlePatch(context: PagesContext, client: SupabaseClient) {
  const auth = await requireAdmin(context, client);
  if (auth.error) return auth.error;
  const body = await context.request.json().catch(() => ({}));
  const username = normalizedUsername(body.username);
  if (!USERNAME_PATTERN.test(username)) return json({ error: "Invalid username." }, 400);
  if (username === normalizedUsername(auth.user.user_metadata?.username) && body.is_active === false) {
    return json({ error: "You cannot disable the administrator account you are currently using." }, 400);
  }

  const { data: users, error: listError } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) return json({ error: listError.message }, 400);
  const authUser = users.users.find((user) => user.email?.toLowerCase() === usernameEmail(username));
  if (!authUser) return json({ error: "The matching Auth user was not found." }, 404);

  const displayName = typeof body.display_name === "string" ? body.display_name.trim() : undefined;
  const password = typeof body.password === "string" ? body.password : undefined;
  const userMetadata = displayName === undefined ? undefined : { ...authUser.user_metadata, username, display_name: displayName || username };
  const authUpdate: Record<string, unknown> = {};
  if (password !== undefined) {
    if (password.length < 6) return json({ error: "Password must be at least 6 characters." }, 400);
    authUpdate.password = password;
  }
  if (userMetadata) authUpdate.user_metadata = userMetadata;
  if (body.is_active === false) authUpdate.ban_duration = "876000h";
  if (body.is_active === true) authUpdate.ban_duration = "none";

  if (Object.keys(authUpdate).length > 0) {
    const { error: updateError } = await client.auth.admin.updateUserById(authUser.id, authUpdate);
    if (updateError) return json({ error: updateError.message }, 400);
  }

  const allowlistUpdate: Record<string, unknown> = {};
  if (displayName !== undefined) allowlistUpdate.display_name = displayName || username;
  if (body.is_active !== undefined) allowlistUpdate.is_active = body.is_active === true;
  if (Object.keys(allowlistUpdate).length > 0) {
    const { error: allowlistError } = await client.from("allowed_usernames").update(allowlistUpdate).eq("username", username);
    if (allowlistError) return json({ error: allowlistError.message }, 400);
  }

  const profileUpdate: Record<string, unknown> = {};
  if (displayName !== undefined) profileUpdate.display_name = displayName || username;
  if (body.is_admin !== undefined) profileUpdate.is_admin = body.is_admin === true;
  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileError } = await client.from("profiles").update(profileUpdate).eq("id", authUser.id);
    if (profileError) return json({ error: profileError.message }, 400);
  }
  return json({ ok: true });
}

async function handleDelete(context: PagesContext, client: SupabaseClient) {
  const auth = await requireAdmin(context, client);
  if (auth.error) return auth.error;
  const body = await context.request.json().catch(() => ({}));
  const username = normalizedUsername(body.username);
  const metadataUsername = normalizedUsername(auth.user.user_metadata?.username);
  const emailUsername = normalizedUsername(auth.user.email?.split("@")[0]);
  const currentUsername = metadataUsername || emailUsername;

  if (!USERNAME_PATTERN.test(username)) return json({ error: "Invalid username." }, 400);
  if (username === currentUsername) return json({ error: "You cannot delete the administrator account you are currently using." }, 400);

  const { data: users, error: listError } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) return json({ error: listError.message }, 400);
  const authUser = users.users.find((user) => user.email?.toLowerCase() === usernameEmail(username));

  // Remove the Auth user first. Its profile and user_progress rows cascade by FK.
  if (authUser) {
    const { error: deleteAuthError } = await client.auth.admin.deleteUser(authUser.id);
    if (deleteAuthError) return json({ error: deleteAuthError.message }, 400);
  }

  const { error: deleteAllowlistError } = await client.from("allowed_usernames").delete().eq("username", username);
  if (deleteAllowlistError) return json({ error: deleteAllowlistError.message }, 400);

  return json({ ok: true, username });
}

export async function onRequest(context: PagesContext) {
  try {
    const client = adminClient(context.env);
    if (context.request.method === "GET") return await handleGet(context, client);
    if (context.request.method === "POST") return await handlePost(context, client);
    if (context.request.method === "PATCH") return await handlePatch(context, client);
    if (context.request.method === "DELETE") return await handleDelete(context, client);
    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Admin API failed" }, 500);
  }
}
