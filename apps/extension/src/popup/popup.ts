// specs/extension/spec.md — toolbar popup. Rendering only: core computes the
// times, view.ts formats them, this file draws them.
import { DISTRICTS, resolveDistrict } from '@wsb/core'
import { MORA_PAGE_URL } from '@wsb/data/mora'
import { loadDay, type LoadedDay } from '../shared/day.js'
import { isRtl, t } from '../shared/i18n.js'
import {
  getSettings,
  saveSettings,
  type ExtensionSettings,
} from '../shared/settings.js'
import { buildDayView } from '../shared/view.js'
import { getUpdateState, type UpdateState } from '../shared/update.js'
import { RELEASES_URL } from '../shared/constants.js'

const root = document.querySelector<HTMLElement>('#app')!
const LOCALES = [
  { code: 'ms', label: 'Bahasa Melayu' },
  { code: 'ms-Arab', label: 'بهاس ملايو (Jawi)' },
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
] as const

let settings: ExtensionSettings
let day: LoadedDay | null = null
let loading = true
let update: UpdateState = { latest: null, available: false }

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

function toggle(
  label: string,
  checked: boolean,
  disabled: boolean,
  onChange: (checked: boolean) => void,
): HTMLLabelElement {
  const wrapper = element('label', 'toggle')
  wrapper.append(element('span', undefined, label))
  const input = element('input')
  input.type = 'checkbox'
  input.checked = checked
  input.disabled = disabled
  input.addEventListener('change', () => onChange(input.checked))
  wrapper.append(input)
  return wrapper
}

function render(): void {
  const strings = (key: string, args?: Record<string, string | number>) =>
    t(settings.locale, key, args)
  root.replaceChildren()

  if (loading) {
    root.append(element('p', 'state', strings('state.loading')))
    return
  }

  if (!day) {
    root.append(element('p', 'state', strings('state.unavailable')))
  } else {
    const view = buildDayView(day, settings)
    root.append(element('p', 'weekday', view.weekday))
    root.append(element('p', 'dates', `${view.masihi} · ${view.hijri}`))
    const next = element('p', 'next', view.next)
    if (view.soon) next.classList.add('soon')
    root.append(next)

    if (day.stale) root.append(element('p', 'muted', strings('state.offline')))

    const rows = element('ul', 'rows')
    for (const row of view.rows) {
      const item = element('li', `row${row.current ? ' current' : ''}`)
      item.append(element('span', undefined, row.label))
      item.append(element('span', 'time', row.time))
      rows.append(item)
    }
    root.append(rows)
  }

  if (update.available && update.latest) {
    const banner = element('div', 'update')
    const message = element(
      'span',
      undefined,
      strings('extension.updateAvailable', { version: update.latest }),
    )
    const link = element('a', 'update-link', strings('extension.updateDownload'))
    link.href = RELEASES_URL
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    banner.append(message, link)
    root.append(banner)
  }

  root.append(element('hr', 'hr'))
  root.append(
    element('p', 'muted', strings('settings.title')),
  )
  root.append(
    select(
      strings('district.label'),
      DISTRICTS.map((district) => ({
        value: district,
        label: strings(`district.${district}`),
      })),
      settings.district,
      (value) => void updateSettings({ district: resolveDistrict(value) }),
    ),
  )

  const controls = element('div', 'controls')
  controls.append(
    select(
      strings('settings.language'),
      LOCALES.map((entry) => ({ value: entry.code, label: entry.label })),
      settings.locale,
      (value) => {
        if (LOCALES.some((entry) => entry.code === value)) {
          void updateSettings({ locale: value as ExtensionSettings['locale'] })
        }
      },
    ),
  )
  controls.append(
    select(
      strings('settings.timeFormat.label'),
      [
        { value: '24h', label: strings('settings.timeFormat.h24') },
        { value: '12h', label: strings('settings.timeFormat.h12') },
      ],
      settings.timeFormat,
      (value) => {
        if (value === '24h' || value === '12h') {
          void updateSettings({ timeFormat: value })
        }
      },
    ),
  )
  root.append(controls)

  const toggles = element('div', 'toggles')
  toggles.append(
    toggle(
      settings.notifications
        ? strings('notification.enabled')
        : strings('notification.enable'),
      settings.notifications,
      false,
      (checked) => void setNotifications(checked),
    ),
  )
  toggles.append(
    toggle(
      strings('extension.pageHeader'),
      settings.header,
      false,
      (checked) => void updateSettings({ header: checked }),
    ),
  )
  root.append(toggles)

  const reloadButton = element('button', 'primary', strings('action.reloadData'))
  reloadButton.addEventListener('click', () => void reload())
  root.append(reloadButton)

  const footer = element('div', 'footer')
  const source = element('a', undefined, strings('source.name'))
  source.href = MORA_PAGE_URL
  source.target = '_blank'
  source.rel = 'noopener noreferrer'
  footer.append(source)
  root.append(footer)
}

// chrome.notifications is granted at install; the toggle is the opt-in.
async function setNotifications(enabled: boolean): Promise<void> {
  await updateSettings({ notifications: enabled })
}

async function updateSettings(patch: Partial<ExtensionSettings>): Promise<void> {
  settings = await saveSettings(patch)
  render()
}

async function reload(): Promise<void> {
  loading = true
  render()
  await chrome.runtime.sendMessage('wsb:refresh')
  day = await loadDay()
  loading = false
  render()
}

function applyDirection(locale: ExtensionSettings['locale']): void {
  document.documentElement.lang = locale
  document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr'
}

async function init(): Promise<void> {
  settings = await getSettings()
  applyDirection(settings.locale)
  render()
  day = await loadDay()
  loading = false
  render()
}

async function bootstrap(): Promise<void> {
  await init()
  update = await getUpdateState()
  render()
}

chrome.storage.onChanged.addListener((changes) => {
  if ('wsb.extension.settings' in changes) {
    void getSettings().then((next) => {
      settings = next
      applyDirection(settings.locale)
      render()
    })
  }
  if ('wsb.extension.update' in changes) {
    void getUpdateState().then((next) => {
      update = next
      render()
    })
  }
})

void bootstrap().then(() => {
  setInterval(render, 30_000)
})
