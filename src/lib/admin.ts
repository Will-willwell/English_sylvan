import { supabase } from "./supabase";

export type AdminUser = {
  username: string;
  display_name: string;
  is_active: boolean;
  is_admin: boolean;
  user_id: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
};

type AdminResponse = { users?: AdminUser[]; user?: { username: string; user_id: string }; ok?: boolean; error?: string };

async function adminRequest(path: string, init: RequestInit = {}) {
  if (!supabase) throw new Error("Supabase is not configured in this build.");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session has expired. Sign in again.");

  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as AdminResponse;
  if (!response.ok) {
    const detail = payload.error || `HTTP ${response.status}`;
    if (response.status === 404) throw new Error(`Admin API was not deployed at ${path}. Push the latest code and wait for Cloudflare to finish deploying.`);
    if (response.status === 403) throw new Error("This account is not an administrator. Set profiles.is_admin = true in Supabase.");
    if (response.status >= 500) throw new Error(`Admin API configuration error: ${detail}. Check SUPABASE_URL and SUPABASE_SECRET_KEY in Cloudflare Pages.`);
    throw new Error(detail);
  }
  return payload;
}

export async function listAdminUsers() {
  const payload = await adminRequest("/api/admin/users");
  return payload.users ?? [];
}

export async function createAdminUser(input: { username: string; password: string; display_name: string; is_admin: boolean }) {
  return adminRequest("/api/admin/users", { method: "POST", body: JSON.stringify(input) });
}

export async function updateAdminUser(input: { username: string; password?: string; display_name?: string; is_active?: boolean; is_admin?: boolean }) {
  return adminRequest("/api/admin/users", { method: "PATCH", body: JSON.stringify(input) });
}


export async function deleteAdminUser(username: string) {
  return adminRequest("/api/admin/users", { method: "DELETE", body: JSON.stringify({ username }) });
}
