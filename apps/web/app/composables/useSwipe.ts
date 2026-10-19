import { onBeforeUnmount, onMounted, ref } from 'vue'

// specs/web/spec.md — a horizontal swipe moves between the day and the month.
export const SWIPE_THRESHOLD = 56
export const SWIPE_MAX = 160

/** Horizontal travel needed before a swipe counts; vertical drags are ignored. */
export function isSwipe(dx: number, dy: number): boolean {
  return Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)
}

/** Resisted, clamped offset shown while dragging horizontally. */
export function swipeOffset(dx: number): number {
  return Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, dx * 0.4))
}

export interface SwipeHandlers {
  /** Finger moved right. */
  right?: () => void
  /** Finger moved left. */
  left?: () => void
}

/** Calls `next`/`previous` when the user swipes past the threshold. */
export function useSwipe(handlers: SwipeHandlers, target?: Element | null) {
  const offset = ref(0)
  let startX = 0
  let startY = 0
  let tracking = false

  function interactive(node: EventTarget | null): boolean {
    return (
      node instanceof Element &&
      !!node.closest('select, button, a, input, textarea, [role="menu"]')
    )
  }

  function onTouchStart(event: TouchEvent) {
    if (event.touches.length !== 1) return
    if (interactive(event.target)) return
    startX = event.touches[0]!.clientX
    startY = event.touches[0]!.clientY
    tracking = true
    offset.value = 0
  }

  function onTouchMove(event: TouchEvent) {
    if (!tracking) return
    const dx = event.touches[0]!.clientX - startX
    const dy = event.touches[0]!.clientY - startY
    if (!isSwipe(dx, dy)) {
      offset.value = Math.abs(dy) > Math.abs(dx) ? 0 : swipeOffset(dx)
      return
    }
    event.preventDefault()
    offset.value = swipeOffset(dx)
  }

  function onTouchEnd(event: TouchEvent) {
    if (!tracking) return
    tracking = false
    const touch = event.changedTouches[0]
    if (touch) {
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY
      if (isSwipe(dx, dy)) {
        if (dx < 0) handlers.left?.()
        else handlers.right?.()
      }
    }
    offset.value = 0
  }

  onMounted(() => {
    const node = target ?? window
    node.addEventListener('touchstart', onTouchStart as EventListener, {
      passive: true,
    })
    node.addEventListener('touchmove', onTouchMove as EventListener, {
      passive: false,
    })
    node.addEventListener('touchend', onTouchEnd as EventListener)
    node.addEventListener('touchcancel', onTouchEnd as EventListener)
  })

  onBeforeUnmount(() => {
    const node = target ?? window
    node.removeEventListener('touchstart', onTouchStart as EventListener)
    node.removeEventListener('touchmove', onTouchMove as EventListener)
    node.removeEventListener('touchend', onTouchEnd as EventListener)
    node.removeEventListener('touchcancel', onTouchEnd as EventListener)
  })

  return { offset }
}
