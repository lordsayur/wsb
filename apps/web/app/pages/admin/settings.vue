<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AdminGate from '~/components/organisms/AdminGate.vue'
import LanguageControls from '~/components/molecules/LanguageControls.vue'
import ThemeControls from '~/components/molecules/ThemeControls.vue'
import TimeFormatControls from '~/components/molecules/TimeFormatControls.vue'
import { useAdminAuth } from '~/composables/useAdminAuth'
import { useSettings } from '~/composables/useSettings'
import { useTheme } from '~/composables/useTheme'
import { PALETTES, type PaletteId, type ThemeMode } from '~/utils/theme'

// specs/web/spec.md — admin preferences: the reader's own theme, time format
// and language, behind the same sign-in gate as the other admin pages.
definePageMeta({ layout: 'admin' })

const { t, locale, locales, setLocale } = useI18n()
const { state, email, signIn, signOut } = useAdminAuth()
const { theme, setMode, setPalette, setCustom } = useTheme()
const { timeFormat, setTimeFormat } = useSettings()

const timeFormatOptions = computed(() => [
  { value: '24h' as const, label: t('settings.timeFormat.h24') },
  { value: '12h' as const, label: t('settings.timeFormat.h12') },
])

const themeModes = computed(() => [
  { value: 'dark' as ThemeMode, label: t('theme.dark') },
  { value: 'light' as ThemeMode, label: t('theme.light') },
])

const paletteOptions = computed(() =>
  PALETTES.map((palette) => ({
    id: palette.id as PaletteId,
    color: palette.color,
    label: t(`theme.palette.${palette.id}`),
  })),
)

const languageOptions = computed(() =>
  locales.value.map((l) =>
    typeof l === 'string'
      ? { code: l, name: l }
      : { code: l.code, name: l.name ?? l.code },
  ),
)

function chooseLocale(code: string) {
  setLocale(code as typeof locale.value)
}

useSeoMeta({ title: () => t('admin.settings.title'), robots: 'noindex' })
</script>

<template>
  <div class="page">
    <header class="head">
      <h1 class="title">{{ t('admin.settings.title') }}</h1>
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
        <ThemeControls
          :mode-label="t('theme.mode')"
          :mode="theme.mode"
          :modes="themeModes"
          :palette-label="t('theme.palette.label')"
          :palette="theme.palette"
          :palette-options="paletteOptions"
          :custom="theme.custom"
          :custom-label="t('theme.palette.custom')"
          @update:mode="setMode"
          @update:palette="setPalette"
          @update:custom="setCustom"
        />
        <hr class="divider" />
        <TimeFormatControls
          :label="t('settings.timeFormat.label')"
          :format="timeFormat"
          :options="timeFormatOptions"
          @update:format="setTimeFormat"
        />
        <hr class="divider" />
        <LanguageControls
          :label="t('settings.language')"
          :locale="locale"
          :options="languageOptions"
          @update:locale="chooseLocale"
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
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
.divider {
  margin: 0;
  border: 0;
  border-top: 1px solid var(--border);
}
</style>
