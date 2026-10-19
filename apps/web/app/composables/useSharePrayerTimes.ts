import { onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DEFAULT_TIME_FORMAT, type PrayerEntry, type TimeFormat } from '@wsb/core'
import { buildShareText, type ShareFormat } from '~/utils/share'

// specs/web/spec.md — share copies a Brunei & Muara summary plus the live URL.
export function useSharePrayerTimes(
  entries: () => readonly PrayerEntry[],
  date: () => string,
  hijri: () => string,
  locale: () => string,
  timeFormat: () => TimeFormat = () => DEFAULT_TIME_FORMAT,
) {
  const { t } = useI18n()
  const copied = ref(false)
  const lastFormat = ref<ShareFormat>('formatted')
  let timer: ReturnType<typeof setTimeout> | undefined

  async function share(format: ShareFormat = 'formatted') {
    const text = buildShareText({
      entries: entries(),
      date: date(),
      hijri: hijri(),
      locale: locale(),
      timeFormat: timeFormat(),
      url: window.location.origin,
      format,
      t,
    })
    await copy(text)
    lastFormat.value = format
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 2_500)
  }

  onUnmounted(() => clearTimeout(timer))

  return { copied, lastFormat, share }
}

async function copy(text: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.append(area)
  area.select()
  document.execCommand('copy')
  area.remove()
}
