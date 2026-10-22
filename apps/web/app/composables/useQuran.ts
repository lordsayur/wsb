// specs/quran/spec.md — the reader's state machine. Core picks and validates;
// this only holds selection, reveal latches and the lazily loaded text.
import { computed, ref, shallowRef } from 'vue'
import { QuranCorpus, type JuzLoader } from '@wsb/data/quran'
import {
  initialReveal,
  passage,
  pickAyah,
  rangeCount,
  reveal as latch,
  scopeRange,
  type AyahRef,
  type Reveal,
  type RevealKind,
  type Scope,
} from '@wsb/core'

export type QuranPhase = 'setup' | 'reading'

/** Loads `juz-NN.json` from the public corpus; throws when unavailable. */
const fetchJuz: JuzLoader = async (juz) => {
  const res = await fetch(`/quran/juz-${String(juz).padStart(2, '0')}.json`)
  if (!res.ok) throw new Error(`juz ${juz}: ${res.status}`)
  return (await res.json()) as Record<string, string>
}

let corpus: QuranCorpus | null = null

function getCorpus(): QuranCorpus {
  corpus ??= new QuranCorpus(fetchJuz)
  return corpus
}

export function useQuran() {
  const index = getCorpus().index
  const phase = ref<QuranPhase>('setup')
  const draft = ref<Scope>({ kind: 'all' })
  const active = ref<Scope>({ kind: 'all' })
  const current = shallowRef<AyahRef | null>(null)
  const hints = ref<Reveal>(initialReveal())
  const refs = shallowRef<AyahRef[]>([])
  const texts = shallowRef<(string | null)[]>([])
  const loading = ref(false)
  const failed = ref(false)

  const suras = index.suras
  const draftRange = computed(() => scopeRange(draft.value))
  const activeRange = computed(() => scopeRange(active.value))
  const count = computed(() => rangeCount(index, draftRange.value))
  const rangeEmpty = computed(() => count.value === 0)
  const activeCount = computed(() => rangeCount(index, activeRange.value))

  const sura = computed(() => {
    const ref = current.value
    return ref ? (suras[ref.surah - 1] ?? null) : null
  })

  let request = 0

  async function load(picked: AyahRef, extra: number) {
    const token = (request += 1)
    const nextRefs = passage(index, picked, activeRange.value, extra)
    loading.value = true
    failed.value = false
    try {
      const loaded = await getCorpus().texts(nextRefs)
      if (token !== request) return
      refs.value = nextRefs
      texts.value = loaded
    } catch {
      if (token !== request) return
      refs.value = nextRefs
      texts.value = []
      failed.value = true
    } finally {
      if (token === request) loading.value = false
    }
  }

  function roll() {
    const picked = pickAyah(index, activeRange.value)
    current.value = picked
    hints.value = initialReveal()
    refs.value = []
    texts.value = []
    failed.value = false
    if (picked) void load(picked, 0)
  }

  /** Apply the draft scope and show the first ayah of the new scope. */
  function start() {
    if (rangeEmpty.value) return
    active.value = { ...draft.value }
    phase.value = 'reading'
    roll()
  }

  /** Back to setup, keeping the active selection as the draft. */
  function changeFilter() {
    draft.value = { ...active.value }
    phase.value = 'setup'
  }

  function next() {
    const picked = current.value
    if (!picked) return
    const extra = hints.value.next + 1
    hints.value = { ...hints.value, next: extra }
    void load(picked, extra)
  }

  function reveal(kind: RevealKind) {
    if (!current.value) return
    hints.value = latch(hints.value, kind)
  }

  function retry() {
    const picked = current.value
    if (picked) void load(picked, hints.value.next)
  }

  return {
    index,
    suras,
    phase,
    draft,
    active,
    draftRange,
    activeRange,
    current,
    hints,
    refs,
    texts,
    loading,
    failed,
    count,
    rangeEmpty,
    activeCount,
    sura,
    start,
    roll,
    next,
    reveal,
    changeFilter,
    retry,
    newAyah: roll,
  }
}
