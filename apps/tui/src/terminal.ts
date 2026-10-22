// specs/tui/spec.md — the only module that touches the terminal. Keeps ANSI,
// raw mode and the alternate screen out of the pure parts, so render/view are
// testable without a tty.
export interface Terminal {
  /** True when stdout is a terminal; false selects the plain piped report. */
  interactive: boolean
  columns(): number
  rows(): number
  /** Paints a whole frame, replacing the previous one. */
  paint(lines: readonly string[]): void
  /** Restores cursor, screen and echo; safe to call twice. */
  restore(): void
  /** Resolves with each keypress (single characters and escape sequences). */
  onKey(handler: (key: string) => void): void
  stop(): void
}

const ALT_SCREEN_ON = '\u001b[?1049h'
const ALT_SCREEN_OFF = '\u001b[?1049l'
const CURSOR_HIDE = '\u001b[?25l'
const CURSOR_SHOW = '\u001b[?25h'
const CLEAR_HOME = '\u001b[H\u001b[2J'

/** Writes to stdout and flushes; the render loop is small enough to be sync. */
function write(text: string): void {
  process.stdout.write(text)
}

/** A tty-backed terminal; the caller must call `restore` on exit. */
export function ttyTerminal(
  input: NodeJS.ReadStream = process.stdin,
  output: NodeJS.WriteStream = process.stdout,
): Terminal {
  let restored = false
  let started = false
  let keyHandler: ((key: string) => void) | undefined

  const restore = () => {
    if (restored) return
    restored = true
    if (started) {
      write(CURSOR_SHOW + ALT_SCREEN_OFF)
      started = false
    }
    if (input.isTTY) input.setRawMode(false)
    if (input.isTTY) input.pause()
  }

  const onData = (chunk: Buffer) => {
    const text = chunk.toString('utf8')
    for (const key of splitKeys(text)) keyHandler?.(key)
  }

  return {
    interactive: Boolean(output.isTTY),
    columns: () => output.columns ?? 80,
    rows: () => output.rows ?? 24,
    paint(lines) {
      if (!started) {
        write(ALT_SCREEN_ON + CURSOR_HIDE)
        started = true
      }
      output.write(CLEAR_HOME + lines.join('\n') + '\n')
    },
    restore,
    onKey(handler) {
      keyHandler = handler
      if (!input.isTTY) return
      input.setRawMode(true)
      input.resume()
      input.on('data', onData)
    },
    stop() {
      if (input.isTTY) input.off('data', onData)
      restore()
    },
  }
}

/** Splits a stdin chunk into keys; `\u001b` alone is the Escape key. */
export function splitKeys(text: string): string[] {
  const keys: string[] = []
  const csi = /\u001b\[[0-9;?]*[A-Za-z~]/y
  let index = 0
  while (index < text.length) {
    csi.lastIndex = index
    const match = csi.exec(text)
    if (match) {
      keys.push(match[0])
      index += match[0].length
      continue
    }
    keys.push(text[index]!)
    index += 1
  }
  return keys
}

export interface ResizeWatcher {
  stop(): void
}

export function onResize(output: NodeJS.WriteStream, handler: () => void): ResizeWatcher {
  output.on('resize', handler)
  return { stop: () => output.off('resize', handler) }
}
