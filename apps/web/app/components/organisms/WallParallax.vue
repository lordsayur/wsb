<template>
  <!-- Inside <TresCanvas> only Three nodes are valid, so the rig stands in as
       an empty one; all its work happens in the render loop. -->
  <TresObject3D />
</template>

<script setup lang="ts">
// specs/web/spec.md — the wall's parallax: the phone's tilt and the pointer
// ease the camera a few centimetres, so the wall shifts as the reader moves.
// The scene renders on demand, so this rig runs its own animation frame only
// while the camera is still travelling; an idle wall costs no frames at all.
import { onBeforeUnmount, onMounted } from 'vue'
import { useTres } from '@tresjs/core'
import { MathUtils } from 'three'
import { WALL_CAMERA_Z } from '~/utils/background'

const props = defineProps<{
  /** The wall's half-extent, so the drift is a share of what is visible. */
  halfWidth: number
  halfHeight: number
  reducedMotion?: boolean
}>()

/** How far the view drifts, as a share of the wall's half-extent. */
const DRIFT = 0.05
const SMOOTHING = 4
/** Below this the camera has arrived; the loop stops asking for frames. */
const SETTLED = 0.0005

const { camera, invalidate } = useTres()

const pointer = { x: 0, y: 0 }
const gyro = { x: 0, y: 0 }
const current = { x: 0, y: 0 }
const clampUnit = (value: number) => MathUtils.clamp(value, -1, 1)

function onPointerMove(event: PointerEvent) {
  pointer.x = clampUnit((event.clientX / window.innerWidth) * 2 - 1)
  pointer.y = clampUnit(-((event.clientY / window.innerHeight) * 2 - 1))
  wake()
}

function onPointerLeave() {
  pointer.x = 0
  pointer.y = 0
  wake()
}

function onOrientation(event: DeviceOrientationEvent) {
  // gamma is the left/right tilt, beta the front/back; beta 45° is upright.
  if (event.gamma != null) gyro.x = clampUnit(event.gamma / 35)
  if (event.beta != null) gyro.y = clampUnit((event.beta - 45) / 45)
  wake()
}

function targetX() {
  return clampUnit(pointer.x + gyro.x) * props.halfWidth * DRIFT
}

function targetY() {
  return clampUnit(pointer.y + gyro.y) * props.halfHeight * DRIFT
}

let frame = 0
let last = 0

function step(now: number) {
  const active = camera.value
  if (!active) {
    frame = 0
    return
  }
  const delta = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60
  last = now

  const ease = 1 - Math.exp(-SMOOTHING * delta)
  current.x = MathUtils.lerp(current.x, targetX(), ease)
  current.y = MathUtils.lerp(current.y, targetY(), ease)

  if (
    Math.abs(targetX() - current.x) < SETTLED &&
    Math.abs(targetY() - current.y) < SETTLED
  ) {
    current.x = targetX()
    current.y = targetY()
    active.position.set(current.x, current.y, WALL_CAMERA_Z)
    invalidate()
    frame = 0
    last = 0
    return
  }

  active.position.set(current.x, current.y, WALL_CAMERA_Z)
  invalidate()
  frame = requestAnimationFrame(step)
}

/** One frame per input: a burst while moving, nothing once the wall settles. */
function wake() {
  if (props.reducedMotion || frame) return
  last = 0
  frame = requestAnimationFrame(step)
}

onMounted(() => {
  if (props.reducedMotion) return
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerleave', onPointerLeave)
  window.addEventListener('deviceorientation', onOrientation)
})

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerleave', onPointerLeave)
  window.removeEventListener('deviceorientation', onOrientation)
})
</script>
