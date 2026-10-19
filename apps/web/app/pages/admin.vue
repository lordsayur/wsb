<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAdmin } from '~/composables/useAdmin'

// specs/data/spec.md — admin import/edit page. Only the shell comes from here;
// the Edge Function decides authorization and writes.
const { t } = useI18n()
const {
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
  saveRecord,
} = useAdmin()

const drafts = ref<Record<string, string>>({})

function key(record: { prayerDate: string; district: string; prayer: string }) {
  return `${record.prayerDate}:${record.district}:${record.prayer}`
}

function time(record: {
  prayerDate: string
  district: string
  prayer: string
  time: string
}) {
  return drafts.value[key(record)] ?? record.time.slice(0, 5)
}

function save(record: (typeof records.value)[number]) {
  const next = drafts.value[key(record)]
  if (next === undefined) return
  const [h, m] = next.split(':')
  void saveRecord({ ...record, time: `${h}:${m}:00` })
}

useSeoMeta({ title: () => t('admin.title'), robots: 'noindex' })
</script>

<template>
  <div class="page">
    <main class="content">
      <h1 class="title">{{ t('admin.title') }}</h1>

      <p v-if="state === 'loading'" class="status">{{ t('state.loading') }}</p>

      <section v-else-if="state === 'signed-out'" class="panel">
        <p>{{ t('admin.signInHint') }}</p>
        <button type="button" class="primary" @click="signIn">
          {{ t('admin.signIn') }}
        </button>
      </section>

      <section v-else-if="state === 'forbidden'" class="panel">
        <p>{{ t('admin.forbidden') }}</p>
        <p class="muted">{{ email }}</p>
        <button type="button" @click="signOut">{{ t('admin.signOut') }}</button>
      </section>

      <template v-else>
        <section class="panel row">
          <label class="field">
            <span>{{ t('admin.email') }}</span>
            <strong>{{ email }}</strong>
          </label>
          <button type="button" @click="signOut">{{ t('admin.signOut') }}</button>
        </section>

        <section class="panel row">
          <label class="field">
            <span>{{ t('admin.month') }}</span>
            <input v-model="month" type="month" :disabled="busy" />
          </label>
          <button type="button" class="primary" :disabled="busy" @click="importMonth">
            {{ busy ? t('admin.importing') : t('admin.import') }}
          </button>
        </section>

        <p
          v-if="message"
          class="status"
          :class="{ error: failed }"
          role="status"
          aria-live="polite"
        >
          {{ message }}
        </p>

        <section class="panel">
          <h2 class="subtitle">{{ t('admin.records') }}</h2>
          <p v-if="records.length === 0" class="muted">{{ t('admin.empty') }}</p>
          <table v-else class="records">
            <thead>
              <tr>
                <th scope="col">{{ t('admin.date') }}</th>
                <th scope="col">{{ t('admin.district') }}</th>
                <th scope="col">{{ t('admin.prayer') }}</th>
                <th scope="col">{{ t('admin.time') }}</th>
                <th scope="col">
                  <span class="sr-only">{{ t('admin.save') }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in records" :key="key(record)">
                <td>{{ record.prayerDate }}</td>
                <td>{{ t(`district.${record.district}`) }}</td>
                <td>{{ t(`admin.prayers.${record.prayer}`) }}</td>
                <td>
                  <input
                    type="time"
                    :value="time(record)"
                    :disabled="busy"
                    @input="
                      drafts[key(record)] = ($event.target as HTMLInputElement).value
                    "
                  />
                </td>
                <td>
                  <button
                    type="button"
                    :disabled="busy || drafts[key(record)] === undefined"
                    @click="save(record)"
                  >
                    {{ t('admin.save') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </template>

      <NuxtLink class="back" to="/">{{ t('admin.back') }}</NuxtLink>
    </main>
  </div>
</template>

<style scoped>
.page {
  height: 100vh;
  height: 100dvh;
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
  overflow-y: auto;
}
.content {
  width: 100%;
  max-width: 48rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.title {
  margin: 0;
  font-size: 1.5rem;
}
.subtitle {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}
.panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
.row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9rem;
}
input,
button {
  font: inherit;
  min-height: var(--control-h);
  padding: 0 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--fg);
}
button {
  cursor: pointer;
}
button.primary {
  background: var(--primary);
  color: var(--primary-fg);
  border-color: transparent;
  font-weight: 700;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
.records {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.records th,
.records td {
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--border);
  text-align: start;
}
.records input {
  min-height: 2rem;
}
.status {
  margin: 0;
}
.status.error {
  color: #f87171;
}
.muted {
  margin: 0;
  opacity: 0.7;
  font-size: 0.85rem;
}
.back {
  align-self: flex-start;
  font-size: 0.9rem;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
