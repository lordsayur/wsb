// specs/extension/spec.md — the small on-page header. Isolated in a shadow
// root; enabled by default; the popup's toggle removes it immediately.
import { HEADER_HOST_ID } from '../shared/constants.js'

interface HeaderState {
  enabled: boolean
  text: string
  label?: string
  closeLabel?: string
  soon?: boolean
}

const HOST_STYLE = `
:host {
  all: initial;
  position: fixed;
  inset-block-start: 8px;
  inset-inline-end: 8px;
  z-index: 2147483647;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  line-height: 1.35;
  color: #f4f4f1;
}
.pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px 5px 10px;
  border-radius: 999px;
  background: #191c1f;
  border: 1px solid #facc15;
  box-shadow: 0 6px 18px rgb(0 0 0 / 30%);
  max-width: min(70vw, 320px);
}
.pill.soon { background: #facc15; color: #1c1917; }
.label { opacity: 0.7; }
.text { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.close {
  all: unset;
  cursor: pointer;
  padding: 0 2px;
  font-size: 13px;
  line-height: 1;
  opacity: 0.65;
}
.close:hover, .close:focus-visible { opacity: 1; }
`

let host: HTMLElement | null = null
let shadow: ShadowRoot | null = null

function mount(state: HeaderState): void {
  if (!state.enabled || !state.text) {
    unmount()
    return
  }
  if (!host) {
    host = document.createElement('div')
    host.id = HEADER_HOST_ID
    shadow = host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = HOST_STYLE
    shadow.append(style)
  }
  const pill = document.createElement('div')
  pill.className = `pill${state.soon ? ' soon' : ''}`
  pill.setAttribute('role', 'status')

  if (state.label) {
    const label = document.createElement('span')
    label.className = 'label'
    label.textContent = state.label
    pill.append(label)
  }

  const text = document.createElement('span')
  text.className = 'text'
  text.textContent = state.text
  pill.append(text)

  const close = document.createElement('button')
  close.className = 'close'
  close.type = 'button'
  close.setAttribute('aria-label', state.closeLabel ?? '✕')
  close.title = state.closeLabel ?? ''
  close.textContent = '✕'
  close.addEventListener('click', () => {
    void chrome.storage.local.get('wsb.extension.settings').then((values) => {
      const settings = { ...(values['wsb.extension.settings'] as object), header: false }
      return chrome.storage.local.set({ 'wsb.extension.settings': settings })
    })
  })
  pill.append(close)

  shadow!.replaceChildren(shadow!.firstChild!, pill)
  if (!host.isConnected) document.documentElement.append(host)
}

function unmount(): void {
  host?.remove()
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
