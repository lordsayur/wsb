// specs/vscode/spec.md — webview side of the times panel. Draws the state the
// extension host sends; no domain logic.
import type { PanelState } from '../panel.js'

interface StateMessage {
  type: 'state'
  state: PanelState
}

const vscode = acquireVsCodeApi()
const root = document.querySelector<HTMLElement>('#app')!

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function select(
  label: string,
  options: { value: string; label: string }[],
  value: string,
  onChange: (value: string) => void,
): HTMLLabelElement {
  const wrapper = element('label', 'field')
  wrapper.append(element('span', 'field-label', label))
  const control = element('select')
  control.setAttribute('aria-label', label)
  for (const option of options) {
    const node = element('option', undefined, option.label)
    node.value = option.value
    control.append(node)
  }
  control.value = value
  control.addEventListener('change', () => onChange(control.value))
  wrapper.append(control)
  return wrapper
}

function applyDirection(state: PanelState): void {
  document.documentElement.lang = state.settings.locale
  document.documentElement.dir =
    state.settings.locale === 'ar' || state.settings.locale === 'ms-Arab'
      ? 'rtl'
      : 'ltr'
}

function render(state: PanelState): void {
  const { strings, view } = state
  applyDirection(state)
  root.replaceChildren()

  if (state.loading) {
    root.append(element('p', 'state', strings.loading))
    return
  }

  if (!view) {
    root.append(element('p', 'state', strings.unavailable))
  } else {
    root.append(element('h1', 'weekday', view.weekday))
    root.append(element('p', 'dates', `${view.masihi} · ${view.hijri}`))
    const next = element('p', 'next', view.next)
    if (view.soon) next.classList.add('soon')
    root.append(next)

    if (state.stale) root.append(element('p', 'muted', strings.offline))

    const rows = element('ul', 'rows')
    for (const row of view.rows) {
      const item = element('li', `row${row.current ? ' current' : ''}`)
      item.append(element('span', undefined, row.label))
      item.append(element('span', 'time', row.time))
      rows.append(item)
    }
    root.append(rows)
  }

  root.append(element('h2', 'section', strings.settingsTitle))
  root.append(
    select(
      strings.districtLabel,
      state.districts,
      state.settings.district,
      (value) => vscode.postMessage({ type: 'setting', key: 'district', value }),
    ),
  )

  const controls = element('div', 'controls')
  controls.append(
    select(
      strings.language,
      state.locales,
      state.settings.locale,
      (value) => vscode.postMessage({ type: 'setting', key: 'locale', value }),
    ),
  )
  controls.append(
    select(
      strings.timeFormat,
      [
        { value: '24h', label: strings.h24 },
        { value: '12h', label: strings.h12 },
      ],
      state.settings.timeFormat,
      (value) => vscode.postMessage({ type: 'setting', key: 'timeFormat', value }),
    ),
  )
  root.append(controls)

  const reload = element('button', 'primary', strings.reload)
  reload.addEventListener('click', () => vscode.postMessage({ type: 'reload' }))
  root.append(reload)

  const links = element('div', 'links')
  const app = element('button', 'link', strings.openApp)
  app.addEventListener('click', () =>
    vscode.postMessage({ type: 'open', url: strings.webUrl }),
  )
  links.append(app)
  root.append(links)

  const footer = element('div', 'footer')
  const source = element('button', 'link', strings.sourceName)
  source.addEventListener('click', () =>
    vscode.postMessage({ type: 'open', url: strings.sourceUrl }),
  )
  footer.append(source)
  root.append(footer)
}

window.addEventListener('message', (event: MessageEvent<StateMessage>) => {
  if (event.data.type === 'state') render(event.data.state)
})

// The host pushes the first state; ask once in case it is ready before us.
vscode.postMessage({ type: 'ready' })
