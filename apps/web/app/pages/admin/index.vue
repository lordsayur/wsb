<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AdminGate from '~/components/organisms/AdminGate.vue'
import AdminPrayerTable from '~/components/organisms/AdminPrayerTable.vue'
import { STORED_PRAYERS, type StoredPrayer } from '@wsb/data/admin'
import { useAdmin } from '~/composables/useAdmin'

// specs/web/spec.md — admin prayer times: one month, one row per day.
definePageMeta({ layout: 'admin' })

const { t } = useI18n()
const {
  state,
  email,
  month,
  days,
  edits,
  dirty,
  busy,
  message,
  failed,
  signIn,
  signOut,
  importMonth,
  edit,
  discard,
  saveEdits,
} = useAdmin()

const prayers = STORED_PRAYERS

const prayerLabels = computed(() =>
  Object.fromEntries(
    STORED_PRAYERS.map((prayer) => [prayer, t(`admin.prayers.${prayer}`)]),
  ) as Record<StoredPrayer, string>,
)

useSeoMeta({ title: () => t('admin.title'), robots: 'noindex' })
</script>

<template>
  <div class="page">
    <header class="head">
      <h1 class="title">{{ t('admin.times.title') }}</h1>
    </header>

    <AdminGate
      :state="state"
      :email="email"
      :loading-text="t('state.loading')"
      :sign-in-hint="t('admin.signInHint')"
      :sign-in-label="t('admin.signIn')"
      :forbidden-text="t('admin.forbidden')"
      :sign-out-label="t('admin.signOut')"
      @sign-in="signIn"
      @sign-out="signOut"
    >
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
        <div class="headline">
          <h2 class="subtitle">{{ t('admin.records') }}</h2>
          <p v-if="dirty" class="pending">
            {{ t('admin.pending', { count: dirty }) }}
          </p>
        </div>
        <AdminPrayerTable
          :days="days"
          :busy="busy"
          :edits="edits"
          :date-label="t('admin.date')"
          :hijri-label="t('admin.hijri')"
          :empty-text="t('admin.empty')"
          :prayers="prayers"
          :prayer-labels="prayerLabels"
          @edit="edit"
        />
        <div class="actions">
          <button
            type="button"
            :disabled="busy || dirty === 0"
            @click="discard"
          >
            {{ t('admin.discard') }}
          </button>
          <button
            type="button"
            class="primary"
            :disabled="busy || dirty === 0"
            @click="saveEdits"
          >
            {{ t('admin.save') }}
          </button>
        </div>
      </section>
    </AdminGate>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.head {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: baseline;
  justify-content: space-between;
}
.title {
  margin: 0;
  font-size: 1.5rem;
}
.subtitle {
  margin: 0;
  font-size: 1rem;
}
.headline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  align-items: baseline;
  justify-content: space-between;
}
.pending {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.75;
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
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
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
.status {
  margin: 0;
}
.status.error {
  color: #f87171;
}
</style>
