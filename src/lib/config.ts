import Constants from 'expo-constants';

/**
 * Centralized runtime config. Public values come from EXPO_PUBLIC_* env vars
 * (inlined at build time) with a fallback to app.json `extra` for the API URL.
 *
 * When Supabase keys are absent we fall back to harmless placeholders so the
 * app still boots (createClient throws on an empty URL). `isConfigured` reflects
 * the real state so the UI can prompt the user to add their keys.
 */

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const rawSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(rawSupabaseUrl && rawSupabaseAnonKey);

if (!isConfigured) {
  console.warn(
    '[config] Supabase keys missing. Set EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env (see .env.example).',
  );
}

export const config = {
  supabaseUrl: rawSupabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey: rawSupabaseAnonKey || 'placeholder-anon-key',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:8787',
};
