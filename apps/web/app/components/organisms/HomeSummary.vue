<template>
  <section ref="rootEl" class="dashboard" :class="{ 'is-wall': background === 'wall' }">
    <SummaryBackdrop :style="background" />

    <!-- The wall is client-only and sits over the CSS bands above, so the text
         and the day paint first and the scene arrives without blocking them. -->
    <ClientOnly>
      <div
        v-if="background === 'wall' && canRenderWall && !reducedMotion"
        class="wall"
      >
        <WallScene
          :aspect="aspect"
          :reduced-motion="reducedMotion"
          :hour="hour"
        />
      </div>
    </ClientOnly>

    <!-- The card is the whole screen, so it carries the deck's top chrome
         itself: the basmalah, then the page dots just as the other slides.
         Chrome and text share the cement band; the tiles stay a picture. -->
    <div class="band">
      <div class="chrome">
        <BasmalahText class="basmalah" />
        <PageIndicator
          class="pages"
          :label="pagesLabel"
          :pages="pages"
          :model-value="current"
          @update:model-value="emit('select', $event)"
        />
      </div>

      <div class="content">
        <header class="hero">
          <p class="weekday">{{ weekday }}</p>
          <DateDisplay :masihi="dates.masihi" :hijri="dates.hijri" />
          <DayStatus :text="status" :busy="busy" />
        </header>

        <div v-if="currentName" class="current" :class="{ soon: nextSoon }">
          <p class="current-label">{{ currentLabel }}</p>
          <p class="current-name">{{ currentName }}</p>
          <p class="current-meta">
            <TimeText v-if="currentTime" class="current-time" :text="currentTime" />
            <span v-if="passedNote" class="current-note">{{ passedNote }}</span>
          </p>
        </div>

        <div class="next" :class="{ soon: nextSoon }">
          <span class="next-label">{{ nextLabel }}</span>
          <span class="next-name">{{ nextName }}</span>
          <TimeText class="next-time" :text="nextTime || pendingTime" />
          <span v-if="nextNote" class="next-note">{{ nextNote }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// specs/web/spec.md — organism: the summary slide. It always fills the screen:
// the card is the whole viewport, and its own top chrome carries the basmalah
// and the page dots, so the deck's dots are not repeated above it. Over the
// wall, the text rides the top cement band (60%) while the glazed tiles keep
// the bottom (40%). The running entry is the focus; the next entry and how long
// is left sit under it in a quieter size. The backdrop is decorative.
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import BasmalahText from '../atoms/BasmalahText.vue'
import DateDisplay from '../molecules/DateDisplay.vue'
import DayStatus from '../molecules/DayStatus.vue'
import PageIndicator from '../molecules/PageIndicator.vue'
import TimeText from '../atoms/TimeText.vue'
import SummaryBackdrop from './SummaryBackdrop.vue'
import type { BackgroundStyle } from '~/utils/background'

// specs/web/spec.md — the 3D scene is its own chunk: a reader on the aurora (or
// without WebGL) never downloads three.js, and the wall arrives after paint.
const WallScene = defineAsyncComponent(() => import('./WallScene.vue'))

const props = withDefaults(
  defineProps<{
    weekday: string
    dates: { masihi: string; hijri: string }
    status?: string
    busy?: boolean
    /** The running entry's name; empty before the day's first entry. */
    currentName?: string
    /** The running entry's time, display-ready. */
    currentTime?: string
    currentLabel: string
    nextLabel: string
    nextName: string
    nextTime: string
    /** Countdown to the next entry. */
    countdown?: string
    /** Elapsed-duration note while the passed-entry window is open. */
    passedNote?: string
    nextSoon?: boolean
    pendingTime?: string
    /** Which decorative backdrop the reader chose. */
    background?: BackgroundStyle
    /**
     * Fixed hour of day for the wall's light. Absent, the wall follows the
     * reader's clock; stories pin it so the morning and night looks hold still.
     */
    hour?: number
    /** The deck's slides, for the dots the card carries at its own top. */
    pages?: { id: string; label: string }[]
    /** Which slide the dots mark as current. */
    current?: string
    /** Accessible name for the dots. */
    pagesLabel?: string
  }>(),
  {
    status: '',
    busy: false,
    currentName: '',
    currentTime: '',
    countdown: '',
    passedNote: '',
    nextSoon: false,
    pendingTime: '--:--',
    background: 'wall',
    pages: () => [],
    current: 'summary',
    pagesLabel: 'Pages',
  },
)

const emit = defineEmits<{ select: [id: string] }>()

// While the passed-entry window is open, the note sits with the running entry
// and replaces the countdown, so the two never appear at once.
const nextNote = computed(() => (props.passedNote ? '' : props.countdown))

// The wall lays its bands out from the card's own aspect, so it must know the
// box before the first frame and whenever it changes.
const rootEl = ref<HTMLElement | null>(null)
const aspect = ref(1)
let observer: ResizeObserver | null = null

function measure() {
  const el = rootEl.value
  if (!el) return
  const { width, height } = el.getBoundingClientRect()
  if (height > 0 && width > 0) aspect.value = width / height
}

// A reader who asks for less motion gets the flat bands and no WebGL at all.
const reducedMotion = ref(false)
let motionQuery: MediaQueryList | null = null

function onMotionChange(event: MediaQueryListEvent) {
  reducedMotion.value = event.matches
}

/** No WebGL means no scene: the CSS bands are the whole backdrop then. */
function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const context =
      canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    return context != null
  } catch {
    return false
  }
}

const canRenderWall = ref(false)

onMounted(() => {
  measure()
  canRenderWall.value = supportsWebGL()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    if (rootEl.value) observer.observe(rootEl.value)
  }
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = motionQuery.matches
  motionQuery.addEventListener('change', onMotionChange)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  motionQuery?.removeEventListener('change', onMotionChange)
})
</script>

<style scoped>
.dashboard {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  border-radius: 0;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  /* Text tokens: the aurora keeps the theme's own colours. */
  --summary-fg: var(--fg);
  --summary-strong: var(--fg);
  --summary-muted: var(--muted);
  --summary-accent: var(--primary);
  --summary-chip: color-mix(in srgb, var(--surface) 62%, transparent);
  --summary-chip-border: var(--border);
  --summary-shadow: none;
  background:
    radial-gradient(
      130% 110% at 50% -10%,
      color-mix(in srgb, var(--primary) 16%, transparent),
      transparent 62%
    ),
    color-mix(in srgb, var(--surface) 55%, var(--bg));
}

/* Over the light cement, the text turns dark so it stays legible in both
   themes; the accent darkens to keep the "soon" note readable there. */
.dashboard.is-wall {
  --summary-fg: #3a2a1e;
  --summary-strong: #2f2116;
  --summary-muted: rgb(58 42 30 / 62%);
  --summary-accent: #8a4413;
  --summary-chip: rgb(255 246 236 / 46%);
  --summary-chip-border: rgb(58 42 30 / 18%);
  --summary-shadow: 0 1px 0 rgb(255 255 255 / 28%);
}

/* The 3D wall fills the card, above the CSS bands, below the text. */
.wall {
  position: absolute;
  inset: 0;
  z-index: -1;
}

/* Chrome and text share the card's top band, so the wall's cement keeps them
   both legible; the tiles below are just a picture. */
.band {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
/* The wall's cement band is the top 60% of the card. */
.dashboard.is-wall .band {
  flex: 0 0 60%;
}

/* The card's own top chrome: the basmalah, then the page dots, matching the
   order the other slides get from the deck. */
.chrome {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding-block-start: clamp(0.75rem, 2.6vh, 1.35rem);
  padding-inline: 1rem;
  color: var(--summary-muted);
  text-shadow: var(--summary-shadow);
}
/* On the wall the dots need the darker accent to read over cement. */
.chrome .pages {
  --dot-color: var(--summary-accent);
}

.content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(0.75rem, 3vh, 1.7rem);
  padding: clamp(0.5rem, 2vh, 1rem) 1rem clamp(1rem, 3vh, 1.6rem);
  text-align: center;
  color: var(--summary-fg);
  text-shadow: var(--summary-shadow);
}
/* The cement band is the top 60% of the card, so the text keeps its room
   under the chrome and never crosses the rail. */
.dashboard.is-wall .content {
  padding-block-end: 0.75rem;
}

/* The basmalah heads the card, in the chrome block above the dots. */
.basmalah {
  text-align: center;
  color: var(--summary-muted);
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}
.weekday {
  margin: 0;
  font-size: clamp(1.05rem, 3.4vh, 1.35rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--summary-muted);
}

/* The running entry: the loudest thing on the screen. */
.current {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}
.current-label {
  margin: 0;
  font-size: clamp(0.62rem, 1.7vh, 0.78rem);
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--summary-muted);
}
.current-name {
  margin: 0;
  font-size: clamp(2.4rem, 10vh, 4.4rem);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -0.02em;
  color: var(--summary-strong);
  text-wrap: balance;
}
.current-time {
  font-size: clamp(1.1rem, 3.6vh, 1.6rem);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--summary-fg);
}
.current-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 0.4rem 0.7rem;
  margin: 0;
}
.current-note {
  font-size: clamp(0.8rem, 2.2vh, 1rem);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--summary-accent);
  white-space: nowrap;
}
/* The next entry is close: warm the hero up. */
.current.soon .current-name {
  color: var(--summary-accent);
}

/* The next entry and its countdown: deliberately quieter. */
.next {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 0.4rem 0.6rem;
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  border: 1px solid var(--summary-chip-border);
  background: var(--summary-chip);
  backdrop-filter: blur(8px);
  font-size: clamp(0.9rem, 2.6vh, 1.15rem);
}
.next-label {
  font-size: 0.72em;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--summary-muted);
}
.next-name {
  font-weight: 700;
}
.next-time {
  font-variant-numeric: tabular-nums;
  color: var(--summary-fg);
}
.next-note {
  font-size: 0.82em;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--summary-muted);
  white-space: nowrap;
}
.next.soon {
  border-color: color-mix(in srgb, var(--summary-accent) 55%, transparent);
}
.next.soon .next-note {
  color: var(--summary-accent);
}

/* The aurora keeps the look it had before the wall: a little more air between
   the blocks and the hero's palette-tinted gradient rather than a flat colour. */
.dashboard:not(.is-wall) .content {
  gap: clamp(1rem, 4vh, 2.2rem);
}
.dashboard:not(.is-wall) .current-name {
  font-size: clamp(2.6rem, 11vh, 4.6rem);
  background: linear-gradient(
    160deg,
    var(--fg),
    color-mix(in srgb, var(--primary) 55%, var(--fg))
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.dashboard:not(.is-wall) .current.soon .current-name {
  background: linear-gradient(160deg, var(--primary), var(--fg));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

@media (max-height: 520px) {
  .content {
    gap: 0.6rem;
    padding-block: 0.75rem;
  }
  .current-label {
    display: none;
  }
  .current-name {
    font-size: clamp(1.8rem, 10vh, 2.6rem);
  }
}
</style>
