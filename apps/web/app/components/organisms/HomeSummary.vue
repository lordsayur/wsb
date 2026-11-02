<template>
  <section
    class="dashboard"
    :class="{ fullscreen }"
    :role="fullscreen ? 'dialog' : undefined"
    :aria-modal="fullscreen ? 'true' : undefined"
    :tabindex="fullscreen ? -1 : undefined"
  >
    <div class="aura" aria-hidden="true">
      <span class="gradient" />
      <span class="orb orb-a" />
      <span class="orb orb-b" />
      <span class="orb orb-c" />
      <span class="pattern" />
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
  </section>
</template>

<script setup lang="ts">
// specs/web/spec.md — organism: the summary slide, a calm dashboard. The
// running entry is the focus; the next entry and how long is left sit under it
// in a quieter size. Decorative layers are purely visual. Fullscreen is the
// layout's: it owns the toggle and the menu, this card only fills the screen.
import { computed } from 'vue'
import DateDisplay from '../molecules/DateDisplay.vue'
import DayStatus from '../molecules/DayStatus.vue'
import TimeText from '../atoms/TimeText.vue'

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
    /** "N minutes after" note while the passed-entry window is open. */
    passedNote?: string
    nextSoon?: boolean
    pendingTime?: string
    /** Fills the screen with the card alone; the deck chrome steps aside. */
    fullscreen?: boolean
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
    fullscreen: false,
  },
)

// While the passed-entry window is open, the note sits with the running entry
// and replaces the countdown, so the two never appear at once.
const nextNote = computed(() => (props.passedNote ? '' : props.countdown))

</script>

<style scoped>
.dashboard {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  border-radius: 24px;
  isolation: isolate;
  background:
    radial-gradient(
      130% 110% at 50% -10%,
      color-mix(in srgb, var(--primary) 16%, transparent),
      transparent 62%
    ),
    color-mix(in srgb, var(--surface) 55%, var(--bg));
}

/* Ambient decoration: a slowly turning colour wash under drifting orbs. */
.aura {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
/* A very large, very slow colour wheel: as it turns, the card's tint drifts
   between the palette's warm and cool neighbours without ever flashing. */
.gradient {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  inline-size: 180vmax;
  block-size: 180vmax;
  margin-block-start: -90vmax;
  margin-inline-start: -90vmax;
  border-radius: 50%;
  opacity: 0.5;
  background: conic-gradient(
    from 0deg,
    color-mix(in srgb, var(--primary) 24%, transparent),
    color-mix(in srgb, var(--primary) 6%, var(--surface-2)),
    color-mix(in srgb, var(--primary) 18%, transparent),
    transparent 72%,
    color-mix(in srgb, var(--primary) 24%, transparent)
  );
  animation: turn 90s linear infinite;
}
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(46px);
  opacity: 0.55;
}
.orb-a {
  inline-size: clamp(20rem, 52vmax, 60rem);
  aspect-ratio: 1;
  top: -22%;
  inset-inline-start: -18%;
  background: color-mix(in srgb, var(--primary) 55%, transparent);
  animation: drift-a 22s ease-in-out infinite alternate;
}
.orb-b {
  inline-size: clamp(18rem, 44vmax, 52rem);
  aspect-ratio: 1;
  bottom: -20%;
  inset-inline-end: -14%;
  background: color-mix(in srgb, var(--primary) 32%, var(--surface-2));
  animation: drift-b 28s ease-in-out infinite alternate;
}
.orb-c {
  inline-size: clamp(12rem, 26vmax, 30rem);
  aspect-ratio: 1;
  top: 34%;
  inset-inline-end: 22%;
  background: color-mix(in srgb, var(--primary) 24%, transparent);
  opacity: 0.5;
  animation: drift-a 34s ease-in-out infinite alternate-reverse;
}
/* A faint geometric lattice, the print on a prayer mat. */
.pattern {
  position: absolute;
  inset: 0;
  opacity: 0.11;
  background-image:
    radial-gradient(
      circle at 50% 50%,
      color-mix(in srgb, var(--fg) 45%, transparent) 1px,
      transparent 1.5px
    ),
    repeating-linear-gradient(
      45deg,
      color-mix(in srgb, var(--fg) 16%, transparent) 0 1px,
      transparent 1px 26px
    );
  background-size: 26px 26px, 26px 26px;
  mask-image: radial-gradient(120% 90% at 50% 45%, #000 24%, transparent 72%);
  -webkit-mask-image: radial-gradient(
    120% 90% at 50% 45%,
    #000 24%,
    transparent 72%
  );
}

.content {
  position: relative;
  z-index: 1;
  block-size: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(1rem, 4vh, 2.2rem);
  padding: clamp(1rem, 4vh, 2rem) 1rem;
  text-align: center;
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
  color: color-mix(in srgb, var(--fg) 82%, transparent);
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
  color: var(--muted);
}
.current-name {
  margin: 0;
  font-size: clamp(2.6rem, 11vh, 4.6rem);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -0.02em;
  background: linear-gradient(
    160deg,
    var(--fg),
    color-mix(in srgb, var(--primary) 55%, var(--fg))
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-wrap: balance;
}
.current-time {
  font-size: clamp(1.1rem, 3.6vh, 1.6rem);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--fg) 72%, transparent);
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
  color: var(--primary);
  white-space: nowrap;
}
/* The next entry is close: warm the hero up. */
.current.soon .current-name {
  background: linear-gradient(160deg, var(--primary), var(--fg));
  -webkit-background-clip: text;
  background-clip: text;
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
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 62%, transparent);
  backdrop-filter: blur(8px);
  font-size: clamp(0.9rem, 2.6vh, 1.15rem);
}
.next-label {
  font-size: 0.72em;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}
.next-name {
  font-weight: 700;
}
.next-time {
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--fg) 78%, transparent);
}
.next-note {
  font-size: 0.82em;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  white-space: nowrap;
}
.next.soon {
  border-color: color-mix(in srgb, var(--primary) 60%, transparent);
}
.next.soon .next-note {
  color: var(--primary);
}

/* Fullscreen: the card alone, edge to edge, above the deck's chrome. */
.dashboard.fullscreen {
  position: fixed;
  inset: 0;
  z-index: 60;
  border-radius: 0;
  max-inline-size: none;
}
.dashboard.fullscreen .content {
  gap: clamp(1.2rem, 5vh, 2.6rem);
}

@keyframes turn {
  to {
    transform: rotate(360deg);
  }
}

@keyframes drift-a {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(8%, 10%, 0) scale(1.12);
  }
}
@keyframes drift-b {
  from {
    transform: translate3d(0, 0, 0) scale(1.05);
  }
  to {
    transform: translate3d(-10%, -8%, 0) scale(0.95);
  }
}

@media (prefers-reduced-motion: reduce) {
  .gradient,
  .orb {
    animation: none;
  }
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
    font-size: clamp(2rem, 12vh, 3rem);
  }
}
</style>
