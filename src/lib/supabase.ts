import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawPublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

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

export const isSupabaseConfigured = validSupabaseUrl(supabaseConfig.url) && (supabaseBrowserKey.startsWith("sb_publishable_") || supabaseBrowserKey.startsWith("eyJ"));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseConfig.url, supabaseBrowserKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
