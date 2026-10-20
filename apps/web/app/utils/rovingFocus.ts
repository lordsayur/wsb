// specs/web/spec.md — keyboard first: arrows move within a menu or chip group,
// wrapping at both ends; a negative index means "nothing focused yet".

export function stepIndex(current: number, length: number, delta: number): number {
  if (length === 0) return -1
  if (current < 0) return delta > 0 ? 0 : length - 1
  return (current + delta + length) % length
}

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function focusables(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)]
}

export function moveFocus(
  items: HTMLElement[],
  current: number,
  delta: number,
): void {
  items[stepIndex(current, items.length, delta)]?.focus()
}

/**
 * Arrow/Home/End keys inside a group of buttons. Attach to the group's
 * `keydown` so every control is reachable without a pointer.
 */
export function onGroupKeydown(
  event: KeyboardEvent,
  container: HTMLElement | null = event.currentTarget as HTMLElement | null,
): void {
  const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End']
  if (!keys.includes(event.key)) return
  const items = focusables(container).filter((item) => item.offsetParent !== null)
  if (items.length === 0) return
  event.preventDefault()
  if (event.key === 'Home') {
    items[0]?.focus()
    return
  }
  if (event.key === 'End') {
    items.at(-1)?.focus()
    return
  }
  const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
  const current = items.indexOf(document.activeElement as HTMLElement)
  moveFocus(items, current, forward ? 1 : -1)
}
