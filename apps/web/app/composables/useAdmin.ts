// specs/web/spec.md — admin prayer-times page glue: Google sign-in + the
// `admin` function. Authorization is decided server-side; this only reflects
// the result. Cell edits are staged and written by one explicit save.
import { useI18n } from 'vue-i18n'
import {
  adminEditKey,
  adminMonthDays,
  adminPendingRecords,
  applyAdminEdits,
  type AdminDay,
  type AdminRecord,
  type StoredPrayer,
} from '@wsb/data/admin'
import { supabaseClient } from '~/utils/supabase'
import { callAdmin, useAdminAuth } from './useAdminAuth'

export function useAdmin() {
  const { t } = useI18n()
  const client = supabaseClient()
  const auth = useAdminAuth()
  const month = ref(new Date().toISOString().slice(0, 7))
  const records = ref<AdminRecord[]>([])
  const edits = ref<Record<string, string>>({})
  const busy = ref(false)
  const message = ref('')
  const failed = ref(false)

  const stored = computed<AdminDay[]>(() => adminMonthDays(records.value))
  const days = computed<AdminDay[]>(() => applyAdminEdits(stored.value, edits.value))
  const dirty = computed(() => Object.keys(edits.value).length)

  function report(text: string, ok: boolean) {
    message.value = text
    failed.value = !ok
  }

  function edit(value: {
    prayerDate: string
    prayer: StoredPrayer
    time: string
  }) {
    const key = adminEditKey(value.prayerDate, value.prayer)
    if (!value.time) {
      const next = { ...edits.value }
      delete next[key]
      edits.value = next
      return
    }
    edits.value = { ...edits.value, [key]: value.time }
  }

  function discard() {
    edits.value = {}
    report('', true)
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
      edits.value = {}
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
    records.value = (result.records ?? []) as AdminRecord[]
  }

  async function saveEdits() {
    if (!client || dirty.value === 0) return
    busy.value = true
    try {
      const pending = adminPendingRecords(days.value, edits.value)
      const result = await callAdmin(client, {
        action: 'update',
        records: pending,
      })
      if (result.error) {
        report(t('admin.failed'), false)
        return
      }
      edits.value = {}
      report(t('admin.saved', { count: pending.length }), true)
      await listMonth()
    } catch (error) {
      report(error instanceof Error ? error.message : t('admin.failed'), false)
    } finally {
      busy.value = false
    }
  }

  // The auth state is shared across pages, so it may already be ready when
  // this page mounts (returning from another admin page).
  watch(
    auth.state,
    (value) => {
      if (value === 'ready') void listMonth()
    },
    { immediate: true },
  )

  watch(month, () => {
    edits.value = {}
    if (auth.state.value === 'ready') void listMonth()
  })

  return {
    state: auth.state,
    email: auth.email,
    signIn: auth.signIn,
    signOut: auth.signOut,
    month,
    records,
    days,
    edits,
    dirty,
    busy,
    message,
    failed,
    edit,
    discard,
    saveEdits,
    importMonth,
    listMonth,
  }
}
