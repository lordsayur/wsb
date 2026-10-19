// specs/web/spec.md — PWA: surface a reload prompt when a new build is waiting.
import { computed } from 'vue'

export function usePwaUpdate() {
  const { $pwa } = useNuxtApp()
  const needRefresh = computed(() => $pwa?.needRefresh ?? false)

  async function reload() {
    await $pwa?.updateServiceWorker(true)
  }

  async function dismiss() {
    await $pwa?.cancelPrompt()
  }

  return { needRefresh, reload, dismiss }
}
