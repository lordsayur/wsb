// specs/web/spec.md — shared admin auth for the prayer-times and analytics
// pages. Authorization is decided server-side; this only reflects the result.
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseClient } from '~/utils/supabase'

export type AdminState = 'loading' | 'signed-out' | 'forbidden' | 'ready'

export interface AdminResponse {
  email?: string
  records?: unknown[]
  imported?: number
  month?: string
  error?: string
}

export async function callAdmin(
  client: SupabaseClient,
  body: Record<string, unknown>,
): Promise<AdminResponse> {
  const { data, error } = await client.functions.invoke('admin', { body })
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status
    if (status === 403) return { error: 'forbidden' }
    if (status === 401) return { error: 'unauthorized' }
    throw error
  }
  return (data ?? {}) as AdminResponse
}

export function useAdminAuth() {
  const route = useRoute()
  const client = supabaseClient()
  // Shared across the admin pages, so switching pages keeps the session.
  const booted = useState<boolean>('admin-auth-booted', () => false)
  const state = useState<AdminState>('admin-auth-state', () => 'loading')
  const email = useState<string>('admin-auth-email', () => '')

  async function refresh() {
    if (!client) {
      state.value = 'signed-out'
      return
    }
    const { data } = await client.auth.getSession()
    if (!data.session) {
      state.value = 'signed-out'
      email.value = ''
      return
    }
    const result = await callAdmin(client, { action: 'me' })
    if (result.error === 'forbidden') {
      state.value = 'forbidden'
      email.value = data.session.user.email ?? ''
      return
    }
    email.value = result.email ?? data.session.user.email ?? ''
    state.value = 'ready'
  }

  async function signIn() {
    if (!client) return
    await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${route.path}` },
    })
  }

  async function signOut() {
    await client?.auth.signOut()
    state.value = 'signed-out'
    email.value = ''
  }

  onMounted(() => {
    // The layout and the page both use this composable, and the layout lives
    // for the whole admin session. Boot once and keep the listener for the
    // app's lifetime; tearing it down on page changes would drop auth events.
    if (booted.value) return
    booted.value = true
    void refresh()
    client?.auth.onAuthStateChange((event) => {
      // `refresh()` above already read the current session; the initial
      // replay would only repeat the `me` call.
      if (event === 'INITIAL_SESSION') return
      void refresh()
    })
  })

  return { state, email, refresh, signIn, signOut }
}
