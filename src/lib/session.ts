import { supabase } from "./supabase";

const DEVICE_SESSION_KEY = "lingodesk-device-session-v1";

export type DeviceSessionStatus = "active" | "offline" | "revoked" | "error";

function getDeviceSessionId() {
  const existing = localStorage.getItem(DEVICE_SESSION_KEY);
  if (existing) return existing;
  const next = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(DEVICE_SESSION_KEY, next);
  return next;
}

async function request(path: string, method: "POST" | "GET") {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Session is missing.");
  const response = await fetch(path, {
    method,
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    ...(method === "POST" ? { body: JSON.stringify({ session_id: getDeviceSessionId() }) } : {}),
  });
  const payload = await response.json().catch(() => ({})) as { active?: boolean; error?: string };
  if (!response.ok) throw new Error(payload.error || `Session API returned ${response.status}.`);
  return payload;
}

export async function claimDeviceSession() {
  return request("/api/session/claim", "POST");
}

export async function checkDeviceSession() {
  return request(`/api/session/check?session_id=${encodeURIComponent(getDeviceSessionId())}`, "GET");
}

export async function releaseDeviceSession() {
  try { await request("/api/session/release", "POST"); } catch { /* best effort during sign-out */ }
}
