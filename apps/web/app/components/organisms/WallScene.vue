<template>
  <div class="wall-scene" :data-light="light.kind">
    <TresCanvas
      class="wall-canvas"
      :alpha="true"
      :antialias="true"
      :dpr="[1, 1.75]"
      :clear-alpha="0"
      :tone-mapping="NoToneMapping"
      power-preference="high-performance"
      render-mode="on-demand"
    >
    <TresPerspectiveCamera :args="[WALL_FOV, 1, 0.1, 60]" :position="[0, 0, WALL_CAMERA_Z]" />

    <!-- Ambient floor: the wall is never pitch black, whatever the hour. -->
    <TresAmbientLight :intensity="0.9" />
    <TresHemisphereLight :args="['#fff4e3', '#6b4d33', 0.55]" />

    <!-- The sun by day, the moon by night, moved by the reader's own clock. -->
    <TresDirectionalLight
      :color="light.color"
      :intensity="light.intensity"
      :position="light.position"
    />
    <!-- A soft fill from below so the tiles keep their colour in shadow. -->
    <TresDirectionalLight
      color="#fff6ea"
      :intensity="0.5"
      :position="[-2.4, -1.8, 3.2]"
    />

    <!-- Top band: matte peach cement; the prayer text sits over this one. -->
    <TresMesh
      v-if="topMap"
      :position="[0, bands.top.center, 0]"
      :scale="[bands.top.width, bands.top.height, 1]"
    >
      <TresPlaneGeometry :args="[1, 1]" />
      <TresMeshStandardMaterial
        :map="topMap"
        :normal-map="topNormalMap"
        :normal-scale="[0.6, 0.6]"
        :roughness="0.9"
        :metalness="0"
      />
    </TresMesh>

    <!-- Bottom band: glazed ceramic tiles, glossy under the same light. -->
    <TresMesh
      v-if="bottomMap"
      :position="[0, bands.bottom.center, 0]"
      :scale="[bands.bottom.width, bands.bottom.height, 1]"
    >
      <TresPlaneGeometry :args="[1, 1]" />
      <TresMeshPhysicalMaterial
        :map="bottomMap"
        :normal-map="bottomNormalMap"
        :roughness="0.1"
        :metalness="0.1"
        :clearcoat="1"
        :clearcoat-roughness="0.18"
      />
    </TresMesh>

    <WallParallax
      :half-width="bands.width / 2"
      :half-height="viewHeight / 2"
      :reduced-motion="reducedMotion"
    />
    </TresCanvas>
  </div>
</template>

<script setup lang="ts">
// specs/web/spec.md — the summary's 3D wall: a peach cement band carrying the
// text over a glazed Islamic tile band, lit by the reader's local clock, with a
// small parallax from the pointer and the phone's tilt. Client-only: it mounts
// after the CSS backdrop has already painted, and renders on demand.
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { useTexture } from '@tresjs/cientos'
import { NoToneMapping, SRGBColorSpace, type Texture } from 'three'
import WallParallax from './WallParallax.vue'
import {
  TEXT_SHARE,
  WALL_CAMERA_Z,
  WALL_FOV,
  WALL_OVERSCAN,
  coverRepeat,
  wallLight,
  wallLightAt,
  type WallLight,
} from '~/utils/background'

const props = defineProps<{
  /** Width / height of the card the canvas fills. */
  aspect: number
  reducedMotion?: boolean
  /**
   * The hour of day to light the wall for. Stories pass a fixed hour so the
   * morning and night looks are deterministic; absent, the reader's clock wins.
   */
  hour?: number
}>()

const top = useTexture('/wall/top.webp')
const topNormal = useTexture('/wall/top-normal.webp')
const bottom = useTexture('/wall/bottom.webp')
const bottomNormal = useTexture('/wall/bottom-normal.webp')

const topMap = computed(() => (top.state.value as Texture | null) ?? null)
const topNormalMap = computed(
  () => (topNormal.state.value as Texture | null) ?? null,
)
const bottomMap = computed(() => (bottom.state.value as Texture | null) ?? null)
const bottomNormalMap = computed(
  () => (bottomNormal.state.value as Texture | null) ?? null,
)

// Base-colour maps are sRGB; normal maps stay linear (the loader's default).
for (const map of [topMap, bottomMap]) {
  watchEffect(() => {
    if (map.value) map.value.colorSpace = SRGBColorSpace
  })
}

/** The visible height at the wall plane, in world units. */
const viewHeight = 2 * WALL_CAMERA_Z * Math.tan((WALL_FOV * Math.PI) / 360)

const bands = computed(() => {
  const height = viewHeight
  const width = height * Math.max(props.aspect, 0.0001) * WALL_OVERSCAN
  const topEdge = (height * WALL_OVERSCAN) / 2
  const bottomEdge = -topEdge
  const split = height * (0.5 - TEXT_SHARE)
  return {
    width,
    top: { width, height: topEdge - split, center: (topEdge + split) / 2 },
    bottom: { width, height: split - bottomEdge, center: (split + bottomEdge) / 2 },
  }
})

/** Cover each band with its texture, cropped and centred, never stretched. */
watchEffect(() => {
  const layout = bands.value
  cover(topMap.value, layout.top.width / layout.top.height)
  cover(bottomMap.value, layout.bottom.width / layout.bottom.height)
})

function cover(texture: Texture | null, planeAspect: number) {
  if (!texture) return
  const image = texture.image as { width?: number; height?: number } | undefined
  if (!image?.width || !image.height) return
  const { repeat, offset } = coverRepeat(planeAspect, image.width / image.height)
  texture.repeat.set(repeat[0], repeat[1])
  texture.offset.set(offset[0], offset[1])
}

/** Recomputed every minute: the sun sets and the moon rises while you watch. */
const now = ref(new Date())
const light = computed<WallLight>(() =>
  typeof props.hour === 'number' ? wallLight(props.hour) : wallLightAt(now.value),
)
let clock = 0

onMounted(() => {
  if (typeof props.hour === 'number') return
  clock = window.setInterval(() => (now.value = new Date()), 60_000)
})

onBeforeUnmount(() => window.clearInterval(clock))
</script>

<style scoped>
.wall-scene {
  inline-size: 100%;
  block-size: 100%;
}
.wall-canvas {
  inline-size: 100%;
  block-size: 100%;
}
</style>
