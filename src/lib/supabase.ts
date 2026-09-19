import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawPublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const USERNAME_EMAIL_DOMAIN = "english-sylvan.local";
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;

function validSupabaseUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith("supabase.co");
  } catch {
    return false;
  }
}

export const supabaseConfig = {
  url: rawUrl?.trim() ?? "",
  publishableKey: rawPublishableKey?.trim() ?? "",
  anonKey: rawAnonKey?.trim() ?? "",
};

export const supabaseBrowserKey = supabaseConfig.publishableKey || supabaseConfig.anonKey;

export const isSupabaseConfigured =
  validSupabaseUrl(supabaseConfig.url) &&
  (supabaseBrowserKey.startsWith("sb_publishable_") || supabaseBrowserKey.startsWith("eyJ"));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseConfig.url, supabaseBrowserKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}

/**
 * Usernames are deliberately converted to an internal, non-routable email
 * address so Supabase Auth can provide password hashing and session handling
 * without exposing a real email address in the UI.
 */
export function usernameToAuthEmail(username: string) {
  return `${normalizeUsername(username)}@${USERNAME_EMAIL_DOMAIN}`;
}

export function authEmailToUsername(email: string | undefined | null) {
  if (!email) return "";
  const normalizedEmail = email.trim().toLowerCase();
  const suffix = `@${USERNAME_EMAIL_DOMAIN}`;
  return normalizedEmail.endsWith(suffix) ? normalizedEmail.slice(0, -suffix.length) : normalizedEmail;
}

export function userToUsername(user: Pick<User, "email" | "user_metadata"> | null | undefined) {
  const metadataUsername = user?.user_metadata?.username;
  return typeof metadataUsername === "string" && isValidUsername(metadataUsername)
    ? normalizeUsername(metadataUsername)
    : authEmailToUsername(user?.email);
}
