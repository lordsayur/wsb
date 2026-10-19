// specs/extension/spec.md — build-time Supabase config. Injected by
// scripts/build.mjs from WSB_SUPABASE_URL / WSB_SUPABASE_ANON_KEY.
// The anon key is public (RLS read-only), same as the web shell's.

declare const __WSB_SUPABASE_URL__: string
declare const __WSB_SUPABASE_ANON_KEY__: string

export interface SupabaseConfig {
  url: string
  anonKey: string
}

export function supabaseConfig(): SupabaseConfig | null {
  const url = __WSB_SUPABASE_URL__
  const anonKey = __WSB_SUPABASE_ANON_KEY__
  return url && anonKey ? { url, anonKey } : null
}
