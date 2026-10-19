import { onBeforeUnmount, onMounted, ref } from 'vue'

// specs/web/spec.md — pull down at the top to reload the app.
export const PULL_THRESHOLD = 64
export const PULL_MAX = 96

/** Converts a downward finger delta into the resisted pull distance. */
export function pullDistance(delta: number): number {
  return delta <= 0 ? 0 : Math.min(PULL_MAX, delta * 0.5)
}

/** Whether releasing at this pull distance should trigger a reload. */
export function shouldRefresh(pull: number): boolean {
  return pull >= PULL_THRESHOLD
}

/** Tracks a downward pull gesture and calls `onRefresh` past the threshold. */
export function usePullToRefresh(onRefresh: () => void) {
  const pull = ref(0)
  const refreshing = ref(false)
  let startY = 0
  let tracking = false
  let settle: ReturnType<typeof setTimeout> | undefined

  function interactive(target: EventTarget | null): boolean {
    return (
      target instanceof Element &&
      !!target.closest('select, button, a, input, textarea, [role="menu"]')
    )
  }

  function onTouchStart(event: TouchEvent) {
    if (refreshing.value || event.touches.length !== 1) return
    if (interactive(event.target)) return
    if (window.scrollY > 0) return
    startY = event.touches[0]!.clientY
    tracking = true
  }

  function onTouchMove(event: TouchEvent) {
    if (!tracking) return
    const distance = pullDistance(event.touches[0]!.clientY - startY)
    if (distance <= 0) {
      pull.value = 0
      return
    }
    event.preventDefault()
    pull.value = distance
  }

  function onTouchEnd() {
    if (!tracking) return
    tracking = false
    if (!shouldRefresh(pull.value)) {
      pull.value = 0
      return
    }
    refreshing.value = true
    pull.value = PULL_THRESHOLD
    setTimeout(onRefresh, 250)
    settle = setTimeout(() => {
      refreshing.value = false
      pull.value = 0
    }, 1_200)
  }

  onMounted(() => {
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)
  })

  onBeforeUnmount(() => {
    clearTimeout(settle)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('touchcancel', onTouchEnd)
  })

  return { pull, refreshing, threshold: PULL_THRESHOLD }
}
