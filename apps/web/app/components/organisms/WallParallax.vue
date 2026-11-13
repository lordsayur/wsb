<template>
  <!-- Inside <TresCanvas> only Three nodes are valid, so the rig stands in as
       an empty one; all its work happens in the render loop. -->
  <TresObject3D />
</template>

<script setup lang="ts">
// specs/web/spec.md — the wall's parallax. On a phone the device's tilt eases
// the camera a few centimetres and swings the lamp with it, so the reader sees
// the normals and the glazed highlights move as they move; on a pointer it is
// the mouse. The scene renders on demand, so this rig runs its own animation
// frame only while the view is still travelling; an idle wall costs no frames.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useTres } from '@tresjs/core'
import { MathUtils, type Object3D } from 'three'
import {
  TILT_RANGE,
  WALL_CAMERA_Z,
  lightSway,
  tiltDrift,
} from '~/utils/background'

const props = defineProps<{
  /** The wall's half-extent, so the drift is a share of what is visible. */
  halfWidth: number
  halfHeight: number
  reducedMotion?: boolean
  /**
   * The lamp to sway with the view, and where the reader's clock puts it. The
   * rig moves it in the same frame as the camera: going through a reactive prop
   * would land a frame late, and its state would not be there when it was
   * invalidated.
   */
  lamp?: Object3D | null
  lampBase?: [number, number, number]
}>()

/** How far the view drifts, as a share of the wall's half-extent. */
const DRIFT = 0.05
const SMOOTHING = 4
/** Below this the camera has arrived; the loop stops asking for frames. */
const SETTLED = 0.0005

const { camera, invalidate } = useTres()

const clampUnit = (value: number) => MathUtils.clamp(value, -1, 1)

/** What the reader is steering with; a coarse pointer is a phone or tablet. */
const coarse =
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(pointer: coarse)').matches

const pointer = { x: 0, y: 0 }
/** The tilt, relative to the pose the phone was first seen in. */
const tilt = { x: 0, y: 0 }
const baseline = { beta: 0, gamma: 0, set: false }
/** The eased steering, as a share of full drift on each axis (-1..1). */
const current = { x: 0, y: 0 }
/** True once real tilt arrives; until then a coarse pointer may still drift
 *  with a finger, and a fine pointer always does. */
const tilted = ref(false)

function onPointerMove(event: PointerEvent) {
  // A phone steers by tilt; once it is tilting, its nudges do not also drag.
  if (coarse && tilted.value) return
  pointer.x = clampUnit((event.clientX / window.innerWidth) * 2 - 1)
  pointer.y = clampUnit(-((event.clientY / window.innerHeight) * 2 - 1))
  wake()
}

function onPointerLeave() {
  pointer.x = 0
  pointer.y = 0
  wake()
}

function screenAngle(): number {
  const angle = screen.orientation?.angle
  if (typeof angle === 'number') return angle
  const legacy = (window as { orientation?: number }).orientation
  return typeof legacy === 'number' ? legacy : 0
}

/** The screen rotation the tilt was last calibrated in, degrees. */
let calibratedAngle: number | null = null

function onOrientation(event: DeviceOrientationEvent) {
  const beta = event.beta
  const gamma = event.gamma
  if (beta == null || gamma == null) return
  const angle = ((screenAngle() % 360) + 360) % 360
  // Rotating swaps which reading is which, so the old baseline would read as a
  // full-tilt lurch; the pose just after a turn becomes the new neutral.
  if (!baseline.set || angle !== calibratedAngle) {
    baseline.beta = beta
    baseline.gamma = gamma
    baseline.set = true
    calibratedAngle = angle
  }
  tilted.value = true
  const landscape = angle === 90 || angle === 270
  const drift = tiltDrift(
    beta,
    gamma,
    baseline.beta,
    baseline.gamma,
    landscape,
    TILT_RANGE,
  )
  tilt.x = drift.x
  tilt.y = drift.y
  wake()
}

/**
 * Where the reader is steering to, as a share of full drift on each axis. Tilt
 * wins where it exists; otherwise the pointer steers.
 */
function target(): { x: number; y: number } {
  return tilted.value ? tilt : pointer
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

  const goal = target()
  const ease = 1 - Math.exp(-SMOOTHING * delta)
  current.x = MathUtils.lerp(current.x, goal.x, ease)
  current.y = MathUtils.lerp(current.y, goal.y, ease)

  place(active)

  if (
    Math.abs(goal.x - current.x) < SETTLED &&
    Math.abs(goal.y - current.y) < SETTLED
  ) {
    current.x = goal.x
    current.y = goal.y
    place(active)
    frame = 0
    last = 0
    return
  }

  frame = requestAnimationFrame(step)
}

/**
 * Put the camera and the lamp where this frame's drift says. Both move here,
 * before the invalidation, so the light's new angle is in the frame that is
 * drawn rather than the one after it.
 */
function place(cameraObject: { position: { set: (x: number, y: number, z: number) => void } }) {
  cameraObject.position.set(
    current.x * props.halfWidth * DRIFT,
    current.y * props.halfHeight * DRIFT,
    WALL_CAMERA_Z,
  )
  placeLamp()
  invalidate()
}

/** The lamp's clock position with this frame's sway added to it. */
function placeLamp() {
  const lamp = props.lamp
  const base = props.lampBase
  if (!lamp || !base) return
  const offset = lightSway(current.x, current.y)
  lamp.position.set(
    base[0] + offset[0],
    base[1] + offset[1],
    base[2] + offset[2],
  )
}

/**
 * The clock moves the lamp's base position, and that binding writes it on its
 * own; re-apply the sway afterwards or the minute tick would snap the lamp back
 * to the arc and lose the drift until the reader moved again.
 */
watch(
  () => props.lampBase,
  () => {
    if (!props.lamp) return
    placeLamp()
    invalidate()
  },
  { flush: 'post' },
)

/** One frame per input: a burst while moving, nothing once the wall settles. */
function wake() {
  if (props.reducedMotion || frame) return
  last = 0
  frame = requestAnimationFrame(step)
}

/**
 * iOS only sends orientation after the reader grants motion access, and only
 * from a gesture. Ask on the first touch, then stop listening for one.
 */
function motionPermission(): (() => Promise<string>) | null {
  if (typeof DeviceOrientationEvent === 'undefined') return null
  const request = (
    DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
  ).requestPermission
  return typeof request === 'function' ? request.bind(DeviceOrientationEvent) : null
}

let armed = true
function askForMotion() {
  if (!armed) return
  armed = false
  void motionPermission()?.().catch(() => undefined)
}

onMounted(() => {
  if (props.reducedMotion) return
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerleave', onPointerLeave)
  window.addEventListener('deviceorientation', onOrientation)
  if (motionPermission()) {
    window.addEventListener('pointerdown', askForMotion, { once: true, passive: true })
  }
})

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerleave', onPointerLeave)
  window.removeEventListener('deviceorientation', onOrientation)
  window.removeEventListener('pointerdown', askForMotion)
})
</script>
