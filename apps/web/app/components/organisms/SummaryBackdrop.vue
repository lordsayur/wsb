<template>
  <div class="backdrop" :class="`is-${style}`" aria-hidden="true">
    <div v-if="style === 'aurora'" class="aurora">
      <span class="gradient" />
      <span class="orb orb-a" />
      <span class="orb orb-b" />
      <span class="orb orb-c" />
      <span class="pattern" />
    </div>

    <!-- The flat bands paint on the server and in every browser; the WebGL
         wall mounts on top of them once the client can render it. -->
    <template v-else>
      <span class="band band-top" />
      <span class="band band-bottom" />
      <span class="rail" />
    </template>
  </div>
</template>

<script setup lang="ts">
// specs/web/spec.md — the summary's decorative backdrop, chosen in Settings.
// The wall's flat bands are the CSS fallback for the 3D scene: the card looks
// right before a single texture arrives, and stays right without WebGL.
import type { BackgroundStyle } from '~/utils/background'

withDefaults(
  defineProps<{
    style?: BackgroundStyle
  }>(),
  { style: 'wall' },
)
</script>

<style scoped>
.backdrop {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

/* Wall fallback: the two bands, in the textures' own average colours, so the
   swap to the 3D scene changes detail and light, never the layout. */
.band {
  position: absolute;
  inset-inline: 0;
}
.band-top {
  inset-block-start: 0;
  block-size: 60%;
  background:
    radial-gradient(
      120% 80% at 50% -10%,
      rgb(255 231 205 / 55%),
      transparent 70%
    ),
    #e8b895;
}
.band-bottom {
  inset-block-start: 60%;
  block-size: 40%;
  background:
    radial-gradient(
      120% 70% at 50% 0%,
      rgb(255 255 255 / 18%),
      transparent 65%
    ),
    #1f6f68;
}
/* A hairline of light where the two materials meet, like a ceramic edge. */
.band-bottom {
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 28%);
}

/* The wooden trim over the seam, before the scene's own rail arrives: the same
   brown, the same thin shadow falling on the tiles. */
.rail {
  position: absolute;
  inset-inline: 0;
  inset-block-start: 60%;
  block-size: 1.7%;
  translate: 0 -50%;
  background: linear-gradient(
    to bottom,
    #7d5836,
    #5b3a22 45%,
    #3b2514 100%
  );
  box-shadow:
    inset 0 1px 0 rgb(255 226 190 / 25%),
    0 3px 6px rgb(0 0 0 / 22%);
}

/* Aurora: the backdrop that came before the wall, kept whole. */
.aurora {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
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
</style>
