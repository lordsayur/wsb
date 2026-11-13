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
      :shadows="true"
    >
    <TresPerspectiveCamera :args="[WALL_FOV, 1, 0.1, 60]" :position="[0, 0, WALL_CAMERA_Z]" />

    <!-- Ambient floor: the wall is never pitch black, whatever the hour. -->
    <TresAmbientLight :intensity="0.9" />
    <TresHemisphereLight :args="['#fff4e3', '#6b4d33', 0.55]" />

    <!-- The sun by day, the moon by night, moved by the reader's own clock and
         swayed with the view, so the rails and tiles show their relief as you
         move. It casts the rail's shadow; the bias keeps the thin trim clean. -->
    <TresDirectionalLight
      ref="lamp"
      :color="light.color"
      :intensity="light.intensity"
      :position="light.position"
      cast-shadow
      :shadow-camera-left="-9"
      :shadow-camera-right="9"
      :shadow-camera-top="5"
      :shadow-camera-bottom="-5"
      :shadow-camera-near="0.5"
      :shadow-camera-far="16"
      :shadow-mapSize-width="1024"
      :shadow-mapSize-height="1024"
      :shadow-bias="-0.0004"
      :shadow-normal-bias="0.0015"
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
      receive-shadow
    >
      <TresPlaneGeometry :args="[1, 1]" />
      <TresMeshStandardMaterial
        :map="topMap"
        :normal-map="topNormalMap"
        :normal-scale="[0.6, 0.6]"
        :roughness-map="topRoughMap"
        :roughness="1"
        :metalness="0"
      />
    </TresMesh>

    <!-- Bottom band: glazed ceramic tiles, glossy under the same light. -->
    <TresMesh
      v-if="bottomMap"
      :position="[0, bands.bottom.center, 0]"
      :scale="[bands.bottom.width, bands.bottom.height, 1]"
      receive-shadow
    >
      <TresPlaneGeometry :args="[1, 1]" />
      <TresMeshPhysicalMaterial
        :map="bottomMap"
        :normal-map="bottomNormalMap"
        :roughness-map="bottomRoughMap"
        :specular-color-map="bottomSpecularMap"
        :roughness="1"
        :metalness="0.1"
        :clearcoat="1"
        :clearcoat-roughness="0.18"
      />
    </TresMesh>

    <!-- The wooden dado rail bridges the cement/tile seam: the front half of a
         squashed cylinder, so it reads as a soft moulding rather than a flat
         board. It stands proud of the wall, so the light catches its crown and
         drops a thin shadow onto the tiles below. -->
    <TresMesh
      v-if="railMap"
      :position="[0, bands.split, -RAIL_BITE]"
      :rotation="[0, 0, -Math.PI / 2]"
      :scale="[1, 1, RAIL_DEPTH / (RAIL_HEIGHT / 2)]"
      cast-shadow
      receive-shadow
    >
      <TresCylinderGeometry
        :args="[
          RAIL_HEIGHT / 2,
          RAIL_HEIGHT / 2,
          bands.width,
          32,
          1,
          true,
          -Math.PI / 2,
          Math.PI,
        ]"
      />
      <TresMeshStandardMaterial
        :map="railMap"
        :normal-map="railNormalMap"
        :normal-scale="[1, 1]"
        :roughness-map="railRoughMap"
        :roughness="1"
        :metalness="0"
      />
    </TresMesh>

    <WallParallax
      :half-width="bands.width / 2"
      :half-height="viewHeight / 2"
      :reduced-motion="reducedMotion"
      :lamp="lamp"
      :lamp-base="light.position"
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
import {
  NoToneMapping,
  RepeatWrapping,
  SRGBColorSpace,
  type Object3D,
  type Texture,
} from 'three'
import WallParallax from './WallParallax.vue'
import {
  RAIL_BITE,
  RAIL_DEPTH,
  RAIL_HEIGHT,
  TEXT_SHARE,
  WALL_CAMERA_Z,
  WALL_FOV,
  WALL_OVERSCAN,
  coverRepeat,
  railRepeats,
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
const topRough = useTexture('/wall/top-rough.webp')
const bottom = useTexture('/wall/bottom.webp')
const bottomNormal = useTexture('/wall/bottom-normal.webp')
const bottomRough = useTexture('/wall/bottom-rough.webp')
const bottomSpecular = useTexture('/wall/bottom-specular.webp')
const rail = useTexture('/wall/rail.webp')
const railNormal = useTexture('/wall/rail-normal.webp')
const railRough = useTexture('/wall/rail-rough.webp')

const topMap = computed(() => (top.state.value as Texture | null) ?? null)
const topNormalMap = computed(
  () => (topNormal.state.value as Texture | null) ?? null,
)
const topRoughMap = computed(
  () => (topRough.state.value as Texture | null) ?? null,
)
const bottomMap = computed(() => (bottom.state.value as Texture | null) ?? null)
const bottomNormalMap = computed(
  () => (bottomNormal.state.value as Texture | null) ?? null,
)
const bottomRoughMap = computed(
  () => (bottomRough.state.value as Texture | null) ?? null,
)
const bottomSpecularMap = computed(
  () => (bottomSpecular.state.value as Texture | null) ?? null,
)
const railMap = computed(() => (rail.state.value as Texture | null) ?? null)
const railNormalMap = computed(
  () => (railNormal.state.value as Texture | null) ?? null,
)
const railRoughMap = computed(
  () => (railRough.state.value as Texture | null) ?? null,
)

// Base-colour and specular-colour maps are sRGB; normal and roughness maps
// stay linear (the loader's default).
for (const map of [topMap, bottomMap, railMap, bottomSpecularMap]) {
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
    split,
    top: { width, height: topEdge - split, center: (topEdge + split) / 2 },
    bottom: { width, height: split - bottomEdge, center: (split + bottomEdge) / 2 },
  }
})

/**
 * Cover each band with its maps, cropped and centred, never stretched. The
 * normal and roughness maps share the base map's transform, so a feature and
 * its groove sit on the same pixel.
 */
watchEffect(() => {
  const layout = bands.value
  coverBand(
    topMap.value,
    [topNormalMap.value, topRoughMap.value],
    layout.top.width / layout.top.height,
  )
  coverBand(
    bottomMap.value,
    [bottomNormalMap.value, bottomRoughMap.value, bottomSpecularMap.value],
    layout.bottom.width / layout.bottom.height,
  )
})

/**
 * The rail is a long, thin moulding, so its grain repeats along the wall rather
 * than one strip smeared across it. The cylinder's UVs run u around the profile
 * and v along the length, and the tile itself wraps mirror-repeat: its last row
 * is the first row mirrored, so any whole number of repeats joins invisibly.
 */
watchEffect(() => {
  const map = railMap.value
  if (!map) return
  const repeats = railRepeats(bands.value.width)
  for (const texture of [map, railNormalMap.value, railRoughMap.value]) {
    if (!texture) continue
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(1, repeats)
    texture.offset.set(0, 0)
    // The moulding is seen at a shallow angle; anisotropic filtering keeps the
    // grain sharp along its length instead of smearing it.
    texture.anisotropy = 4
  }
})

function coverBand(
  base: Texture | null,
  maps: (Texture | null)[],
  planeAspect: number,
) {
  if (!base) return
  const image = base.image as { width?: number; height?: number } | undefined
  if (!image?.width || !image.height) return
  const repeat = coverRepeat(planeAspect, image.width / image.height)
  for (const texture of [base, ...maps]) {
    if (!texture) continue
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(repeat.repeat[0], repeat.repeat[1])
    texture.offset.set(repeat.offset[0], repeat.offset[1])
  }
}

/** Recomputed every minute: the sun sets and the moon rises while you watch. */
const now = ref(new Date())
const light = computed<WallLight>(() =>
  typeof props.hour === 'number' ? wallLight(props.hour) : wallLightAt(now.value),
)

/**
 * The lamp itself. The rig sways it directly from the same frame that moves the
 * camera, so the angle the reader sees already includes the drift.
 */
const lamp = ref<Object3D | null>(null)

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
