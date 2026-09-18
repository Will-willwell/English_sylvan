import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
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
  anonKey: rawAnonKey?.trim() ?? "",
};

export const isSupabaseConfigured = validSupabaseUrl(supabaseConfig.url) && supabaseConfig.anonKey.length > 20;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
