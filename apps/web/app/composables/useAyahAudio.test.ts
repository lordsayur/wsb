import { effectScope } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAyahAudio } from './useAyahAudio'

// specs/quran/spec.md — one recitation at a time, toggle to stop, inline error.

class FakeAudio {
  static instances: FakeAudio[] = []
  src = ''
  preload = ''
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  paused = true
  play = vi.fn(async () => {
    this.paused = false
  })
  pause = vi.fn(() => {
    this.paused = true
  })
  constructor() {
    FakeAudio.instances.push(this)
  }
}

function setup() {
  const scope = effectScope()
  const audio = scope.run(() => useAyahAudio())!
  return { audio, scope }
}

afterEach(() => {
  FakeAudio.instances = []
  vi.unstubAllGlobals()
})

describe('useAyahAudio', () => {
  it('plays a URL and settles into playing', async () => {
    vi.stubGlobal('Audio', FakeAudio)
    const { audio } = setup()
    audio.toggle(0, 'https://example.test/001001.mp3')
    expect(audio.active.value).toBe(0)
    expect(audio.status.value).toBe('loading')
    await Promise.resolve()
    expect(audio.status.value).toBe('playing')
    expect(FakeAudio.instances[0]!.src).toContain('001001.mp3')
  })

  it('stops when the same row is toggled while playing', async () => {
    vi.stubGlobal('Audio', FakeAudio)
    const { audio } = setup()
    audio.toggle(0, 'a.mp3')
    await Promise.resolve()
    expect(audio.status.value).toBe('playing')
    audio.toggle(0, 'a.mp3')
    expect(audio.status.value).toBe('idle')
    expect(audio.active.value).toBeNull()
    expect(FakeAudio.instances[0]!.paused).toBe(true)
  })

  it('replays after the file ends', async () => {
    vi.stubGlobal('Audio', FakeAudio)
    const { audio } = setup()
    audio.toggle(0, 'a.mp3')
    await Promise.resolve()
    FakeAudio.instances[0]!.onended?.()
    expect(audio.status.value).toBe('idle')
    audio.toggle(0, 'a.mp3')
    expect(audio.status.value).toBe('loading')
  })

  it('switching rows reuses the single element', async () => {
    vi.stubGlobal('Audio', FakeAudio)
    const { audio } = setup()
    audio.toggle(0, 'a.mp3')
    audio.toggle(1, 'b.mp3')
    expect(audio.active.value).toBe(1)
    expect(FakeAudio.instances).toHaveLength(1)
    expect(FakeAudio.instances[0]!.src).toBe('b.mp3')
  })

  it('reports an inline error when playback is rejected', async () => {
    class Rejecting extends FakeAudio {
      override play = vi.fn(async () => {
        throw new Error('blocked')
      })
    }
    vi.stubGlobal('Audio', Rejecting)
    const { audio } = setup()
    audio.toggle(0, 'a.mp3')
    await Promise.resolve()
    await Promise.resolve()
    expect(audio.status.value).toBe('error')
  })
})
