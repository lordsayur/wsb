<script setup lang="ts">
import { HOME_SLIDE_COOKIE, homeSlidePath, resolveHomeSlide } from '~/utils/homeSlides'

// specs/web/spec.md — `/` opens the slide the reader last had open; the
// summary is the default. Older links keep working: `/?view=month` and a bare
// `/?month=…` open the monthly table, `/?view=day` opens the daily slide, and
// the district rides along in every case.
function firstText(value: unknown): string | undefined {
  const text = Array.isArray(value) ? value[0] : value
  return typeof text === 'string' ? text : undefined
}

definePageMeta({
  layout: false,
  middleware: [
    (to) => {
      const district = firstText(to.query.district)
      const query: Record<string, string> = {}
      if (district) query.district = district

      const month = firstText(to.query.month)
      const view = firstText(to.query.view)
      // A bare `month` used to imply the month table, so honour it too.
      if (view === 'month' || (month && view !== 'day')) {
        if (month) query.month = month
        return navigateTo({ path: '/prayer-times', query }, { replace: true })
      }
      if (view === 'day') {
        return navigateTo({ path: '/today', query }, { replace: true })
      }

      const saved = useCookie<string | null>(HOME_SLIDE_COOKIE)
      return navigateTo(
        { path: homeSlidePath(resolveHomeSlide(saved.value)), query },
        { replace: true },
      )
    },
  ],
})
</script>

<template>
  <div />
</template>
