// specs/quran/spec.md — recitation playback: one audio element, one ayah at a
// time, no autoplay. The host passes a URL per row; this owns the lifecycle.
import { onScopeDispose, ref } from 'vue'

export type AudioStatus = 'idle' | 'loading' | 'playing' | 'error'

export function useAyahAudio() {
  const status = ref<AudioStatus>('idle')
  const active = ref<number | null>(null)
  let el: HTMLAudioElement | null = null
  let token = 0

  /** Detach the current request and stop the element. */
  function stop() {
    token += 1
    if (el) {
      el.onended = null
      el.onerror = null
      el.pause()
    }
    status.value = 'idle'
    active.value = null
  }

  function play(index: number, url: string) {
    token += 1
    const mine = token
    el ??= new Audio()
    el.preload = 'auto'
    el.onended = () => {
      if (mine !== token) return
      status.value = 'idle'
    }
    el.onerror = () => {
      if (mine !== token) return
      status.value = 'error'
    }
    el.src = url
    active.value = index
    status.value = 'loading'
    void el
      .play()
      .then(() => {
        if (mine === token) status.value = 'playing'
      })
      .catch(() => {
        if (mine === token) status.value = 'error'
      })
  }

  /** Play an ayah; pressing the same one again while playing or loading stops it. */
  function toggle(index: number, url: string | null) {
    const current = active.value === index
    if (current && (status.value === 'playing' || status.value === 'loading')) {
      stop()
      return
    }
    if (!url) {
      stop()
      return
    }
    play(index, url)
  }

  onScopeDispose(() => {
    token += 1
    el?.pause()
    el = null
  })

  return { status, active, toggle, stop }
}
