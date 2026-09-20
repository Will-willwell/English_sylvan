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
  if (!supabase) throw new Error("Supabase ?????????");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("??????????????");
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as AdminResponse;
  if (!response.ok) throw new Error(payload.error || "????????");
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
