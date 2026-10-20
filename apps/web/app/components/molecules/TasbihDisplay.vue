<template>
  <g class="tasbih-display">
    <rect class="lcd" width="176" height="70" rx="10" />
    <g
      v-for="(digit, index) in digits"
      :key="index"
      :transform="`translate(${26 + index * 33} 13) scale(0.25 0.2444)`"
    >
      <line
        v-for="segment in ALL_SEGMENTS"
        :key="`ghost-${segment}`"
        class="segment ghost"
        v-bind="line(segment)"
      />
      <line
        v-for="segment in segmentsFor(digit)"
        :key="segment"
        class="segment lit"
        v-bind="line(segment)"
      />
    </g>
  </g>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: seven-segment LCD readout, no counter logic.
import {
  SEGMENT_LINES,
  type Segment,
  segmentsFor,
} from '~/utils/segments'

defineProps<{ digits: string[] }>()

const ALL_SEGMENTS: Segment[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

function line(segment: Segment) {
  const [x1, y1, x2, y2] = SEGMENT_LINES[segment]
  return { x1, y1, x2, y2 }
}
</script>

<style scoped>
.lcd {
  fill: #b9cda8;
  stroke: #7f9470;
  stroke-width: 2;
}
.segment {
  stroke-linecap: round;
  stroke-width: 14;
}
.segment.ghost {
  stroke: rgb(43 58 47 / 12%);
}
.segment.lit {
  stroke: #2b3a2f;
}
</style>
