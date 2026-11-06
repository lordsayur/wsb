import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// specs/web/spec.md — `v-on="object"` keeps the key's case and only
// capitalises the first letter, so a hyphenated key like 'prayer-times'
// becomes `onPrayer-times` and silently never fires. The layout's handler
// keys must be exactly the footer's emit names.
const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

function emittedEvents(): string[] {
  const source = read('../components/organisms/AppFooter.vue')
  const block = source.match(/defineEmits<\{([\s\S]*?)\}>\(\)/)
  if (!block) throw new Error('AppFooter.vue has no defineEmits block')
  return [...block[1]!.matchAll(/^\s*'?([\w:]+)'?:/gm)].map((match) => match[1]!)
}

function handlerKeys(): string[] {
  const source = read('./home.vue')
  const block = source.match(/const footerHandlers = \{([\s\S]*?)\n\}/)
  if (!block) throw new Error('home.vue has no footerHandlers block')
  return [...block[1]!.matchAll(/^\s*'?([\w:]+)'?(?::|\s*,)/gm)].map(
    (match) => match[1]!,
  )
}

describe('home footer handlers', () => {
  it('names every handler exactly as the footer emits it', () => {
    expect(handlerKeys().sort()).toEqual(emittedEvents().sort())
  })

  it('never uses a hyphenated event key, which would be an unmatched listener', () => {
    expect(handlerKeys().filter((key) => key.includes('-'))).toEqual([])
  })
})
