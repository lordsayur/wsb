// specs/web/spec.md — only show the updating hint when revalidation actually
// takes a moment; a fast cache hit should not flash a spinner.
import { ref, type Ref } from 'vue'

const DELAY_MS = 250

export function useDelayedFlag(delayMs = DELAY_MS): {
  flag: Ref<boolean>
  start: () => void
  stop: () => void
} {
  const flag = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  function start() {
    stop()
    timer = setTimeout(() => {
      flag.value = true
    }, delayMs)
  }

  function stop() {
    if (timer) clearTimeout(timer)
    timer = undefined
    flag.value = false
  }

  return { flag, start, stop }
}
