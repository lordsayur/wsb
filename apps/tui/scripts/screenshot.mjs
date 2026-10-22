// specs/tui/spec.md — builds the downloads-page screenshot from the real
// renderer: the frames are produced by shared/render.ts, converted from ANSI to
// HTML, and captured with headless Chromium. No hand-drawn mock.
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const repo = dirname(dirname(root))
const out = join(repo, 'apps/web/public')

const work = mkdtempSync(join(tmpdir(), 'wsb-shot-'))

await build({
  entryPoints: [join(root, 'scripts/screenshot-entry.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  outfile: join(work, 'bundle.mjs'),
  logLevel: 'warning',
})

const payload = JSON.parse(
  execFileSync(process.execPath, [join(work, 'bundle.mjs')], {
    encoding: 'utf8',
  }),
)

writeFileSync(join(work, 'shot.html'), renderHtml(payload))

const png = join(work, 'wsb-tui.png')
execFileSync('chromium', [
  '--headless',
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=2',
  '--window-size=1930,470',
  `--screenshot=${png}`,
  `file://${join(work, 'shot.html')}`,
], { stdio: 'inherit' })

mkdirSync(out, { recursive: true })
copyFileSync(png, join(out, 'tui-screenshot.png'))
console.log(`wrote ${join(out, 'tui-screenshot.png')}`)

/** Converts ANSI SGR codes to inline spans, one line at a time. */
export function ansiToHtml(text, colored) {
  return text
    .split('\n')
    .map((line) => (colored ? lineToHtml(line) : escapeHtml(line)))
    .join('\n')
}

function lineToHtml(line) {
  let out = ''
  let open = false
  let index = 0
  const sgr = /\u001b\[([0-9;]*)m/g
  let match = sgr.exec(line)
  while (match) {
    out += escapeHtml(line.slice(index, match.index))
    if (open) {
      out += '</span>'
      open = false
    }
    const styles = sgrStyles(match[1])
    if (styles) {
      out += `<span style="${styles}">`
      open = true
    }
    index = match.index + match[0].length
    match = sgr.exec(line)
  }
  out += escapeHtml(line.slice(index))
  if (open) out += '</span>'
  return out
}

function sgrStyles(body) {
  const codes = body.split(';').filter(Boolean).map(Number)
  const styles = []
  for (let index = 0; index < codes.length; index += 1) {
    const code = codes[index]
    if (code === 1) styles.push('font-weight:700')
    else if (code === 2) styles.push('opacity:.6')
    else if (code === 7) styles.push('background:rgba(56,189,248,.85)', 'color:#04121f')
    else if (code === 38 && codes[index + 1] === 2) {
      styles.push(`color:rgb(${codes[index + 2]},${codes[index + 3]},${codes[index + 4]})`)
      index += 4
    }
  }
  return styles.join(';')
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** The window chrome and the three panes, side by side. */
function renderHtml(payload) {
  const panes = payload.frames
    .map((frame) => `<pre class="pane">${ansiToHtml(frame, payload.color)}</pre>`)
    .join('')
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 26px;
    background: #0b1020;
    font-family: "JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .window {
    border-radius: 14px;
    overflow: hidden;
    background: #101726;
    box-shadow: 0 26px 70px rgba(0,0,0,.55), 0 0 0 1px rgba(148,163,184,.18);
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 14px;
    background: #0d1422;
    border-bottom: 1px solid rgba(148,163,184,.14);
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .dot.r { background: #fb7185; } .dot.y { background: #fbbf24; } .dot.g { background: #34d399; }
  .title { margin-left: 10px; font-size: 12px; color: #788494; }
  .grid { display: flex; gap: 0; }
  .pane {
    margin: 0;
    padding: 14px 18px;
    font-size: 12px;
    line-height: 1.42;
    white-space: pre;
    color: #cbd5e1;
    font-variant-ligatures: none;
    border-right: 1px solid rgba(148,163,184,.12);
  }
  .pane:last-child { border-right: 0; }
</style>
</head>
<body>
  <div class="window">
    <div class="bar">
      <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
      <span class="title">wsb — Waktu Sembahyang Brunei</span>
    </div>
    <div class="grid">${panes}</div>
  </div>
</body>
</html>`
}
