// Builds the VS Code extension: bundles the extension host and the webview
// panel, copies the manifest fields VS Code needs from package.json, and the
// Arabic font. specs/vscode/spec.md — no remote code, no analytics.
import { cp, mkdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const out = join(root, 'dist')

await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })

const shared = {
  bundle: true,
  format: 'esm',
  target: 'node20',
  platform: 'node',
  outdir: out,
  entryNames: '[name]',
  minify: true,
  sourcemap: false,
  logLevel: 'info',
  // specs/vscode/spec.md — Supabase is the only runtime source.
  define: {
    __WSB_SUPABASE_URL__: JSON.stringify(process.env.WSB_SUPABASE_URL ?? ''),
    __WSB_SUPABASE_ANON_KEY__: JSON.stringify(
      process.env.WSB_SUPABASE_ANON_KEY ?? process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    ),
  },
}

await build({
  ...shared,
  format: 'cjs',
  entryPoints: { extension: join(root, 'src/extension.ts') },
  outExtension: { '.js': '.cjs' },
  external: ['vscode'],
})

await build({
  ...shared,
  format: 'iife',
  target: 'es2022',
  platform: 'browser',
  entryPoints: { panel: join(root, 'src/webview/entry.ts') },
})

await cp(join(root, 'src/webview/panel.css'), join(root, 'dist/panel.css'))
// The webview's localResourceRoots is dist/, so the Arabic font ships beside
// the panel assets. Reuses the browser extension's copy of Noto Naskh.
await cp(join(root, '../extension/static/fonts'), join(out, 'fonts'), {
  recursive: true,
})
