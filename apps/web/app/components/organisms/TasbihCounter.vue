<template>
  <div class="tasbih-counter">
    <svg
      class="device"
      viewBox="0 0 300 400"
      role="img"
      :aria-label="label"
    >
      <path class="body" d="M150 16c-90 0-126 64-126 134 0 65 20 100 28 142 10 52 46 92 98 92s88-40 98-92c8-42 28-77 28-142 0-70-36-134-126-134Z" />
      <path class="body-inner" d="M150 28c-80 0-112 57-112 121 0 60 18 92 26 132 9 46 40 82 86 82s77-36 86-82c8-40 26-72 26-132 0-64-32-121-112-121Z" />
      <rect class="well" x="54" y="58" width="192" height="86" rx="14" />
      <g transform="translate(62 66)">
        <TasbihDisplay :digits="digits" />
      </g>

      <circle class="side-key" cx="95" cy="182" r="24" />
      <circle class="side-key" cx="205" cy="182" r="24" />
      <circle class="main-key" cx="150" cy="282" r="62" />
    </svg>

    <button
      type="button"
      class="device-button reset"
      :aria-label="resetLabel"
      :title="resetLabel"
      @click.stop="emit('reset')"
    >
      <Icon name="lucide:rotate-ccw" aria-hidden="true" />
    </button>

    <button
      type="button"
      class="device-button decrement"
      :aria-label="decrementLabel"
      :title="decrementLabel"
      @click.stop="emit('decrement')"
    >
      <Icon name="lucide:minus" aria-hidden="true" />
    </button>

    <button
      type="button"
      class="device-button increment"
      :aria-label="incrementLabel"
      :title="incrementLabel"
      @click.stop="emit('increment')"
    >
      <Icon name="lucide:plus" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
// specs/web/spec.md — organism: the tasbih device. Counter state is owned by
// the page (or a composable); this only renders and emits.
import TasbihDisplay from '../molecules/TasbihDisplay.vue'

defineProps<{
  digits: string[]
  label: string
  incrementLabel: string
  decrementLabel: string
  resetLabel: string
}>()

const emit = defineEmits<{ increment: []; decrement: []; reset: [] }>()
</script>

<style scoped>
.tasbih-counter {
  position: relative;
  width: min(21rem, 78vw);
  aspect-ratio: 3 / 4;
  margin: 0 auto;
}
.device {
  width: 100%;
  height: 100%;
  display: block;
  filter: drop-shadow(0 18px 30px rgb(0 0 0 / 30%));
}
.body {
  fill: color-mix(in srgb, var(--surface-2) 88%, var(--fg));
  stroke: color-mix(in srgb, var(--fg) 28%, transparent);
  stroke-width: 10;
}
.body-inner {
  fill: color-mix(in srgb, var(--bg) 70%, #10161a);
  stroke: color-mix(in srgb, var(--fg) 10%, transparent);
  stroke-width: 2;
}
.well {
  fill: #182024;
  stroke: color-mix(in srgb, var(--fg) 14%, transparent);
  stroke-width: 3;
}
.side-key {
  fill: color-mix(in srgb, var(--fg) 12%, transparent);
  stroke: color-mix(in srgb, var(--fg) 18%, transparent);
  stroke-width: 2;
}
.main-key {
  fill: color-mix(in srgb, var(--fg) 22%, transparent);
  stroke: color-mix(in srgb, var(--fg) 26%, transparent);
  stroke-width: 2;
  transition: fill 0.12s ease-out;
}
.device-button {
  position: absolute;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: color-mix(in srgb, var(--fg) 80%, transparent);
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.device-button:active {
  background: color-mix(in srgb, var(--fg) 10%, transparent);
}
.device-button.reset {
  left: 23.67%;
  top: 40.5%;
  width: 16%;
  aspect-ratio: 1;
  font-size: 1.1rem;
}
.device-button.decrement {
  left: 60.33%;
  top: 40.5%;
  width: 16%;
  aspect-ratio: 1;
  font-size: 1.1rem;
}
.device-button.increment {
  left: 30%;
  top: 55%;
  width: 40%;
  aspect-ratio: 1;
  font-size: 2rem;
  color: color-mix(in srgb, var(--fg) 65%, transparent);
}
.increment:active {
  background: color-mix(in srgb, var(--primary) 18%, transparent);
}
.tasbih-counter:hover .main-key {
  fill: color-mix(in srgb, var(--fg) 26%, transparent);
}
</style>
