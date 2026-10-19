// Manual monthly import of MORA prayer times into Supabase.
// One record per prayer time. Runtime shells never read MORA: they read the
// Supabase copy, offline first. Run this once per month.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-mora.ts
//   node scripts/import-mora.ts --month 2026-11          a specific month
//   node scripts/import-mora.ts --dry-run                fetch + normalize only
//   node scripts/import-mora.ts --sql > seed.sql         print SQL instead
//
// Source: https://www.mora.gov.bn/SitePages/WaktuSembahyang.aspx
import {
  bruneiYearMonth,
  fetchMoraItems,
  moraMonthRange,
  normalizeMoraItems,
  toSql,
} from '../packages/data/src/mora.ts'

/** `--month YYYY-MM`, else the current Brunei month. */
function targetMonth(): { year: number; month: number } {
  const index = process.argv.indexOf('--month')
  const value = index === -1 ? undefined : process.argv[index + 1]
  if (!value) return bruneiYearMonth()
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) throw new Error(`Invalid --month value: ${value}`)
  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) throw new Error(`Invalid --month value: ${value}`)
  return { year, month }
}

async function upsert(
  url: string,
  key: string,
  records: PrayerTimeRecord[],
): Promise<void> {
  const response = await fetch(`${url}/rest/v1/prayer_times`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(
      records.map((record) => ({
        prayer_date: record.prayerDate,
        district: record.district,
        prayer: record.prayer,
        time: record.time,
        hijri_date: record.hijriDate,
        source_url: record.sourceUrl,
      })),
    ),
  })
  if (!response.ok) {
    throw new Error(
      `Supabase upsert failed: ${response.status} ${await response.text()}`,
    )
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const sql = process.argv.includes('--sql')
  const { year, month } = targetMonth()
  const range = moraMonthRange(year, month)
  const log = sql ? console.error : console.log

  log(`MORA ${year}-${String(month).padStart(2, '0')} (one month)`)
  const items = await fetchMoraItems(range)
  const records = normalizeMoraItems(items)
  log(`${items.length} days -> ${records.length} prayer-time records`)

  if (sql) {
    process.stdout.write(toSql(records))
    return
  }

  if (dryRun) {
    console.log(JSON.stringify(records.slice(0, 8), null, 2))
    return
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }

  for (let index = 0; index < records.length; index += 500) {
    await upsert(url, key, records.slice(index, index + 500))
  }
  console.log(`saved ${records.length} records to ${url}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
