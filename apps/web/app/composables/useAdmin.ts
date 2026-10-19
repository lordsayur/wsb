// specs/web/spec.md — admin page glue: Google sign-in + the `admin` function.
// Authorization is decided server-side; this only reflects the result.
import type { SupabaseClient } from '@supabase/supabase-js'
import { useI18n } from 'vue-i18n'
import type { AdminRecord } from '@wsb/data/admin'
import { supabaseClient } from '~/utils/supabase'

export type AdminState = 'loading' | 'signed-out' | 'forbidden' | 'ready'

interface AdminResponse {
  email?: string
  records?: AdminRecord[]
  imported?: number
  month?: string
  error?: string
}

async function callAdmin(
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

export function useAdmin() {
  const { t } = useI18n()
  const client = supabaseClient()
  const state = ref<AdminState>('loading')
  const email = ref('')
  const month = ref(new Date().toISOString().slice(0, 7))
  const records = ref<AdminRecord[]>([])
  const busy = ref(false)
  const message = ref('')
  const failed = ref(false)

  async function refreshSession() {
    if (!client) {
      state.value = 'signed-out'
      return
    }
    const { data } = await client.auth.getSession()
    if (!data.session) {
      state.value = 'signed-out'
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
      options: { redirectTo: `${window.location.origin}/admin` },
    })
  }

  async function signOut() {
    await client?.auth.signOut()
    state.value = 'signed-out'
    records.value = []
  }

  function report(text: string, ok: boolean) {
    message.value = text
    failed.value = !ok
  }

  async function importMonth() {
    if (!client) return
    busy.value = true
    try {
      const result = await callAdmin(client, {
        action: 'import',
        month: month.value,
      })
      if (result.error) report(t('admin.failed'), false)
      else report(t('admin.imported', { count: result.imported ?? 0 }), true)
      await listMonth()
    } catch (error) {
      report(error instanceof Error ? error.message : t('admin.failed'), false)
    } finally {
      busy.value = false
    }
  }

  async function listMonth() {
    if (!client) return
    const result = await callAdmin(client, {
      action: 'list',
      month: month.value,
    })
    if (result.error) {
      report(t('admin.failed'), false)
      return
    }
    records.value = result.records ?? []
  }

  async function saveRecord(record: AdminRecord) {
    if (!client) return
    busy.value = true
    try {
      const result = await callAdmin(client, {
        action: 'update',
        record,
      })
      report(result.error ? t('admin.failed') : t('admin.saved'), !result.error)
      if (!result.error) await listMonth()
    } catch (error) {
      report(error instanceof Error ? error.message : t('admin.failed'), false)
    } finally {
      busy.value = false
    }
  }

  onMounted(async () => {
    if (!client) {
      state.value = 'signed-out'
      return
    }
    await refreshSession()
    client.auth.onAuthStateChange(() => void refreshSession())
    if (state.value === 'ready') await listMonth()
  })

  watch(month, () => {
    if (state.value === 'ready') void listMonth()
  })

  return {
    state,
    email,
    month,
    records,
    busy,
    message,
    failed,
    signIn,
    signOut,
    importMonth,
    listMonth,
    saveRecord,
  }
}
