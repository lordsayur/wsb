<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AdminGate from '~/components/organisms/AdminGate.vue'
import AnalyticsPanel from '~/components/organisms/AnalyticsPanel.vue'
import { ANALYTICS_RANGES, useAnalytics } from '~/composables/useAnalytics'
import { useAdminAuth } from '~/composables/useAdminAuth'

// specs/web/spec.md — admin analytics dashboard, gated by the same allowlist.
definePageMeta({ layout: 'admin' })

const { t } = useI18n()
const { state, email, signIn, signOut } = useAdminAuth()

const {
  days,
  includeOther,
  stats,
  state: analyticsState,
  load,
  setDays,
  setIncludeOther,
} = useAnalytics()

// The auth state is shared across pages, so it may already be ready when this
// page mounts (returning from prayer times).
watch(
  state,
  (value) => {
    if (value === 'ready') void load()
  },
  { immediate: true },
)

const analyticsRanges = computed(() =>
  ANALYTICS_RANGES.map((value) => ({
    value,
    label: t(`admin.analytics.days.${value}`),
  })),
)

useSeoMeta({ title: () => t('admin.analytics.title'), robots: 'noindex' })
</script>

<template>
  <div class="page">
    <header class="head">
      <h1 class="title">{{ t('admin.analytics.title') }}</h1>
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
      <section class="panel">
        <AnalyticsPanel
          :title="t('admin.analytics.title')"
          :state="analyticsState"
          :stats="stats"
          :days="days"
          :include-other="includeOther"
          :ranges="analyticsRanges"
          :range-label="t('admin.analytics.range')"
          :include-other-label="t('admin.analytics.includeOther')"
          :views-label="t('admin.analytics.views')"
          :sessions-label="t('admin.analytics.sessions')"
          :daily-label="t('admin.analytics.daily')"
          :top-pages-label="t('admin.analytics.topPages')"
          :events-label="t('admin.analytics.events')"
          :locales-label="t('admin.analytics.locales')"
          :devices-label="t('admin.analytics.devices')"
          :referrers-label="t('admin.analytics.referrers')"
          :direct-label="t('admin.analytics.direct')"
          :loading-text="t('state.loading')"
          :empty-text="t('admin.analytics.empty')"
          :error-text="t('admin.analytics.failed')"
          :device-labels="{
            mobile: t('admin.analytics.device.mobile'),
            tablet: t('admin.analytics.device.tablet'),
            desktop: t('admin.analytics.device.desktop'),
          }"
          :event-labels="{ pageview: t('admin.analytics.event.pageview') }"
          :busy="analyticsState === 'loading'"
          @update:days="setDays"
          @update:include-other="setIncludeOther"
        />
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
.panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
</style>
