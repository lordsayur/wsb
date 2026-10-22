// specs/tui/spec.md — build-time and runtime Supabase config. The same public
// URL + anon key the other shells ship; env is checked first so a user can
// point a local build at their own Supabase without rebuilding.
declare const __WSB_SUPABASE_URL__: string
declare const __WSB_SUPABASE_ANON_KEY__: string
declare const __WSB_VERSION__: string

/** The package version baked in at build time; "0.0.0" when run from source. */
export const VERSION =
  typeof __WSB_VERSION__ === 'string' ? __WSB_VERSION__ : '0.0.0'

export interface SupabaseConfig {
  url: string
  anonKey: string
}

const bakedUrl =
  typeof __WSB_SUPABASE_URL__ === 'string' ? __WSB_SUPABASE_URL__ : ''
const bakedAnonKey =
  typeof __WSB_SUPABASE_ANON_KEY__ === 'string' ? __WSB_SUPABASE_ANON_KEY__ : ''

export function supabaseConfig(): SupabaseConfig | null {
  const url = process.env.WSB_SUPABASE_URL ?? process.env.NUXT_PUBLIC_SUPABASE_URL ?? bakedUrl
  const anonKey =
    process.env.WSB_SUPABASE_ANON_KEY ??
    process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ??
    bakedAnonKey
  return url && anonKey ? { url, anonKey } : null
}
