// specs/web/spec.md — Supabase browser client for the admin page only.
// The public URL + anon key ship; the service role never does.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function supabaseClient(): SupabaseClient | null {
  // Nothing Supabase is needed to render: every read happens after mount. The
  // client also wants a native WebSocket, which only exists in the browser, so
  // never build one while server-rendering.
  if (import.meta.server) return null
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const key = config.public.supabaseAnonKey
  if (!url || !key) return null
  client ??= createClient(url, key, {
    auth: { persistSession: true, detectSessionInUrl: true },
  })
  return client
}
