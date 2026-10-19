// specs/extension/spec.md — the fixed on-page header. Isolated in a shadow
// root; enabled by default; the popup's toggle removes it immediately. The
// header sits in the page flow via a spacer so it never covers content.
import { HEADER_HOST_ID } from '../shared/constants.js'

interface HeaderRow {
  prayer: string
  label: string
  time: string
  current: boolean
}

interface HeaderState {
  enabled: boolean
  text: string
  label?: string
  closeLabel?: string
  soon?: boolean
  rtl?: boolean
  rows: HeaderRow[]
}

const SPACER_ID = `${HEADER_HOST_ID}-spacer`

// specs/extension/spec.md — Arabic-script locales use the bundled Noto Naskh.
function fontFaces(): string {
  const base = chrome.runtime.getURL('fonts/')
  return `
@font-face {
  font-family: 'WSB Arabic';
  src: url('${base}NotoNaskhArabic-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'WSB Arabic';
  src: url('${base}NotoNaskhArabic-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}`
}

const HOST_STYLE = `
:host {
  all: initial;
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: 2147483647;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  line-height: 1.35;
  color: #f4f4f1;
}
.bar[dir='rtl'] {
  font-family: 'WSB Arabic', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
.bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
  background: #191c1f;
  border-block-end: 2px solid #facc15;
  box-shadow: 0 2px 8px rgb(0 0 0 / 25%);
}
.bar.soon { background: #facc15; color: #1c1917; }
/* The caption only makes sense in the narrow fallback; hide it beside the
   full entry list so it is not mistaken for the first entry's label. */
.label { display: none; opacity: 0.7; white-space: nowrap; }
.entries {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}
.entry { display: flex; align-items: baseline; gap: 4px; white-space: nowrap; }
.entry.current { color: #facc15; font-weight: 700; }
.bar[dir='rtl'] .entry.current { box-shadow: inset -2px 0 0 #facc15; }
.bar.soon .entry.current { color: #1c1917; }
.entry .name { opacity: 0.7; }
.text {
  flex: 0 0 auto;
  margin-inline-start: auto;
  font-weight: 600;
  white-space: nowrap;
}
.close {
  all: unset;
  cursor: pointer;
  padding: 0 2px;
  font-size: 13px;
  line-height: 1;
  opacity: 0.65;
}
.close:hover, .close:focus-visible { opacity: 1; }
/* Too narrow for all eight entries: show the next entry and duration only. */
@media (max-width: 900px) {
  .entries { display: none; }
  .label { display: inline; }
}
@media (max-width: 320px) {
  .label { display: none; }
}
`

let host: HTMLElement | null = null
let shadow: ShadowRoot | null = null
let spacer: HTMLElement | null = null
let observer: ResizeObserver | null = null

function ensureChrome(): void {
  if (!spacer) {
    spacer = document.createElement('div')
    spacer.id = SPACER_ID
    spacer.style.cssText = 'height:0;margin:0;padding:0;border:0;'
    document.body?.prepend(spacer)
  }
  if (!host) {
    host = document.createElement('div')
    host.id = HEADER_HOST_ID
    shadow = host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = fontFaces() + HOST_STYLE
    shadow.append(style)
  }
}

function syncSpacer(): void {
  if (!host || !spacer) return
  spacer.style.height = `${host.getBoundingClientRect().height}px`
}

function buildBar(state: HeaderState, closeLabel: string): HTMLElement {
  const bar = document.createElement('div')
  bar.className = `bar${state.soon ? ' soon' : ''}`
  bar.setAttribute('role', 'status')
  bar.dir = state.rtl ? 'rtl' : 'ltr'

  if (state.label) {
    const label = document.createElement('span')
    label.className = 'label'
    label.textContent = state.label
    bar.append(label)
  }

  const entries = document.createElement('div')
  entries.className = 'entries'
  for (const row of state.rows) {
    const entry = document.createElement('span')
    entry.className = `entry${row.current ? ' current' : ''}`
    entry.dataset.prayer = row.prayer
    const name = document.createElement('span')
    name.className = 'name'
    name.textContent = row.label
    const time = document.createElement('span')
    time.className = 'time'
    time.textContent = row.time
    entry.append(name, time)
    entries.append(entry)
  }
  bar.append(entries)

  const text = document.createElement('span')
  text.className = 'text'
  text.textContent = state.text
  bar.append(text)

  const close = document.createElement('button')
  close.className = 'close'
  close.type = 'button'
  close.setAttribute('aria-label', closeLabel)
  close.title = closeLabel
  close.textContent = '✕'
  close.addEventListener('click', () => {
    void chrome.storage.local.get('wsb.extension.settings').then((values) => {
      const settings = { ...(values['wsb.extension.settings'] as object), header: false }
      return chrome.storage.local.set({ 'wsb.extension.settings': settings })
    })
  })
  bar.append(close)

  return bar
}

function mount(state: HeaderState): void {
  if (!state.enabled || !state.text || !document.body) {
    unmount()
    return
  }
  ensureChrome()
  const closeLabel = state.closeLabel ?? '✕'
  shadow!.replaceChildren(shadow!.firstChild!, buildBar(state, closeLabel))
  if (!host!.isConnected) document.documentElement.append(host!)

  if (!observer) {
    observer = new ResizeObserver(syncSpacer)
    observer.observe(host!)
  }
  syncSpacer()
}

function unmount(): void {
  host?.remove()
  spacer?.remove()
  spacer = null
  observer?.disconnect()
  observer = null
}

async function refresh(): Promise<void> {
  try {
    const state = (await chrome.runtime.sendMessage('wsb:header')) as
      | HeaderState
      | undefined
    if (!state) return
    mount(state)
  } catch {
    // The worker may be restarting; the next tick retries.
  }
}

chrome.storage.onChanged.addListener((changes) => {
  if ('wsb.extension.settings' in changes) void refresh()
})

void refresh()
setInterval(refresh, 60_000)
