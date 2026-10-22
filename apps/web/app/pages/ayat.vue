<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { JUZ_COUNT, QURAN_TOTAL, formatNumber } from '@wsb/core'
import { QURAN_ATTRIBUTION } from '@wsb/data/quran'
import AyahReader from '~/components/organisms/AyahReader.vue'
import AyahSetup from '~/components/organisms/AyahSetup.vue'
import RevealChip from '~/components/molecules/RevealChip.vue'
import { useQuran } from '~/composables/useQuran'
import { surahDisplay } from '~/utils/quran'

// specs/quran/spec.md — /ayat: pick one ayah in a chosen range, reveal its
// identity one step at a time. All rules live in core; this page renders.
const { t, locale } = useI18n()

const {
  index,
  phase,
  draft,
  current,
  hints,
  texts,
  loading,
  failed,
  count,
  rangeEmpty,
  sura,
  start,
  next,
  reveal,
  changeFilter,
  retry,
  newAyah,
} = useQuran()

const atEnd = computed(() => {
  const ref = current.value
  if (!ref) return false
  return hints.value.next > 0 && texts.value.length <= hints.value.next
})

const revealedJuz = computed(() =>
  current.value ? formatNumber(current.value.juz, locale.value) : '',
)
const revealedSurah = computed(() =>
  sura.value ? surahDisplay(sura.value, locale.value) : '',
)
const revealedAyah = computed(() =>
  current.value ? formatNumber(current.value.ayah, locale.value) : '',
)

const countLabel = computed(() =>
  t('ayat.count', {
    count: formatNumber(count.value, locale.value),
    total: formatNumber(QURAN_TOTAL, locale.value),
  }),
)

useSeoMeta({
  title: () => t('ayat.title'),
  description: () => t('ayat.intro'),
})
</script>

<template>
  <div class="page">
    <main class="content">
      <NuxtLink class="back" to="/">
        <Icon name="lucide:arrow-left" aria-hidden="true" />
        {{ t('ayat.back') }}
      </NuxtLink>

      <AyahSetup
        v-if="phase === 'setup'"
        :title="t('ayat.title')"
        :intro="t('ayat.intro')"
        :scope-label="t('ayat.scope')"
        :all-label="t('ayat.whole')"
        :juz-label="t('ayat.juz')"
        :from-label="t('ayat.from')"
        :to-label="t('ayat.to')"
        :surah-label="t('ayat.surah')"
        :search-placeholder="t('ayat.search')"
        :start-label="t('ayat.start')"
        :empty-label="t('ayat.searchEmpty')"
        :empty-reason="t('ayat.empty')"
        :count-label="countLabel"
        :attribution-label="t('ayat.attribution')"
        :attribution-name="QURAN_ATTRIBUTION.source"
        :attribution-url="QURAN_ATTRIBUTION.url"
        :disabled="rangeEmpty"
        :locale="locale"
        :index="index"
        :scope="draft"
        :juz-max-value="JUZ_COUNT"
        @select-scope="draft = $event"
        @start="start"
      />

      <template v-else>
        <AyahReader
          :texts="texts"
          :revealed="hints"
          :juz-label="t('ayat.revealedJuz', { juz: revealedJuz })"
          :surah-label="t('ayat.revealedSurah', { surah: revealedSurah })"
          :ayah-number-label="t('ayat.revealedAyah', { ayah: revealedAyah })"
          :passage-label="t('ayat.passage')"
          :ayah-label="t('ayat.ayahLabel')"
          :next-label="t('ayat.next')"
          :new-ayah-label="t('ayat.new')"
          :change-filter-label="t('ayat.changeFilter')"
          :end-label="t('ayat.end')"
          :unavailable-label="t('state.unavailable')"
          :retry-label="t('action.retry')"
          :loading="loading"
          :unavailable="failed"
          :at-end="atEnd"
          @next="next"
          @new-ayah="newAyah"
          @change-filter="changeFilter"
          @retry="retry"
        />

        <div class="reveals" role="group" :aria-label="t('ayat.reveals')">
          <RevealChip
            :label="t('ayat.revealJuz')"
            :value="t('ayat.revealedJuz', { juz: revealedJuz })"
            icon="lucide:layers"
            :revealed="hints.juz"
            :disabled="loading || failed"
            @reveal="reveal('juz')"
          />
          <RevealChip
            :label="t('ayat.revealSurah')"
            :value="t('ayat.revealedSurah', { surah: revealedSurah })"
            icon="lucide:book-open"
            :revealed="hints.surah"
            :disabled="loading || failed"
            @reveal="reveal('surah')"
          />
          <RevealChip
            :label="t('ayat.revealAyah')"
            :value="t('ayat.revealedAyah', { ayah: revealedAyah })"
            icon="lucide:hash"
            :revealed="hints.ayah"
            :disabled="loading || failed"
            @reveal="reveal('ayah')"
          />
        </div>

        <p class="attribution">
          {{ t('ayat.attribution') }}:
          <a :href="QURAN_ATTRIBUTION.url" target="_blank" rel="noopener noreferrer">
            {{ QURAN_ATTRIBUTION.source }}
          </a>
        </p>
      </template>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  padding: 1rem;
}
.content {
  width: 100%;
  max-width: 42rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 2rem;
}
.back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}
.reveals {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.attribution {
  margin: 0;
  font-size: 0.7rem;
  opacity: 0.55;
  text-align: center;
}
</style>
