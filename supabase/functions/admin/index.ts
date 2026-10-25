// specs/data/spec.md — admin import and correction surface.
// Google sign-in happens in the web shell; this function trusts only the
// caller's Supabase JWT and re-checks the allowlist server-side. The
// service-role key lives here as a function secret, never in a shell.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { MORA_PAGE_URL, fetchMoraItems, moraMonthRange, normalizeMoraItems } from '@wsb/data/mora.ts'
import { isMonth, validateRecordEdit, type AdminRecord } from '@wsb/data/admin.ts'

interface AdminRow {
  prayer_date: string
  prayer: string
  time: string
  hijri_date: string
}

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: corsHeaders })

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Missing Supabase secrets')
  return createClient(url, key, { auth: { persistSession: false } })
}

/** The signed-in email, or null when the token is missing/invalid. */
async function callerEmail(req: Request): Promise<string | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const anon = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { auth: { persistSession: false } },
  )
  const { data, error } = await anon.auth.getUser(token)
  return error ? null : (data.user?.email?.toLowerCase() ?? null)
}

async function isAllowed(email: string): Promise<boolean> {
  const { data, error } = await adminClient()
    .from('admin_allowlist')
    .select('email')
    .eq('email', email)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return Boolean(data)
}

async function importMonth(month: string): Promise<number> {
  const [year, mon] = month.split('-').map(Number) as [number, number]
  const items = await fetchMoraItems(moraMonthRange(year, mon))
  const records = normalizeMoraItems(items).map((record) => ({
    prayer_date: record.prayerDate,
    prayer: record.prayer,
    time: record.time,
    hijri_date: record.hijriDate,
    source_url: record.sourceUrl,
  }))
  if (records.length === 0) throw new Error('MORA returned no records')
  const { error } = await adminClient()
    .from('prayer_times')
    .upsert(records, { onConflict: 'prayer_date,prayer' })
  if (error) throw new Error(error.message)
  return records.length
}

async function listMonth(month: string): Promise<AdminRecord[]> {
  const [year, mon] = month.split('-').map(Number) as [number, number]
  const from = `${month}-01`
  const to = new Date(Date.UTC(year, mon, 1)).toISOString().slice(0, 10)
  const { data, error } = await adminClient()
    .from('prayer_times')
    .select('prayer_date,prayer,time,hijri_date')
    .gte('prayer_date', from)
    .lt('prayer_date', to)
    .order('prayer_date')
    .order('prayer')
  if (error) throw new Error(error.message)
  return ((data ?? []) as AdminRow[]).map((row) => ({
    prayerDate: row.prayer_date,
    prayer: row.prayer as AdminRecord['prayer'],
    time: row.time,
    hijriDate: row.hijri_date,
  }))
}

async function updateRecords(records: readonly AdminRecord[]): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await adminClient()
    .from('prayer_times')
    .upsert(
      records.map((record) => ({
        prayer_date: record.prayerDate,
        prayer: record.prayer,
        time: record.time,
        hijri_date: record.hijriDate,
        source_url: MORA_PAGE_URL,
        updated_at: now,
      })),
      { onConflict: 'prayer_date,prayer' },
    )
  if (error) throw new Error(error.message)
}

export default {
  fetch: async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405)
    }

    const email = await callerEmail(req)
    if (!email) return json({ error: 'Unauthorized' }, 401)
    if (!(await isAllowed(email))) return json({ error: 'Forbidden' }, 403)

    try {
      const body = (await req.json().catch(() => ({}))) as {
        action?: unknown
        month?: unknown
        records?: unknown
        record?: unknown
      }

      if (body.action === 'me') {
        return json({ email })
      }

      if (body.action === 'import') {
        const month = isMonth(body.month) ? body.month : undefined
        const target =
          month ??
          new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Brunei' })
            .format(new Date())
            .slice(0, 7)
        return json({ imported: await importMonth(target), month: target })
      }

      if (body.action === 'list') {
        if (!isMonth(body.month)) return json({ error: 'Invalid month' }, 400)
        return json({ records: await listMonth(body.month) })
      }

      if (body.action === 'update') {
        const input = Array.isArray(body.records)
          ? body.records
          : body.record === undefined
            ? []
            : [body.record]
        if (input.length === 0) return json({ error: 'No records' }, 400)
        const validated = input.map(validateRecordEdit)
        const invalid = validated.find((result) => !result.ok)
        if (invalid && !invalid.ok) return json({ error: invalid.error }, 400)
        const records = validated.flatMap((result) =>
          result.ok ? [result.value] : [],
        )
        await updateRecords(records)
        return json({ records })
      }

      return json({ error: 'Unknown action' }, 400)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed'
      return json({ error: message }, 500)
    }
  },
}
