// Builds the extension into dist/: bundles the TypeScript entry points with
// esbuild, copies the manifest, popup HTML/CSS and icons, then zips it for the
// GitHub release. specs/extension/spec.md — no remote code, no analytics.
import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const out = join(root, 'dist')
const zip = process.argv.includes('--zip')

await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })

await build({
  entryPoints: {
    background: join(root, 'src/background.ts'),
    content: join(root, 'src/content/content.ts'),
    popup: join(root, 'src/popup/popup.ts'),
  },
  bundle: true,
  format: 'esm',
  target: 'chrome114',
  platform: 'browser',
  outdir: out,
  entryNames: '[name]',
  minify: true,
  sourcemap: false,
  logLevel: 'info',
  // specs/extension/spec.md — Supabase is the only runtime source.
  define: {
    __WSB_SUPABASE_URL__: JSON.stringify(process.env.WSB_SUPABASE_URL ?? ''),
    __WSB_SUPABASE_ANON_KEY__: JSON.stringify(
      process.env.WSB_SUPABASE_ANON_KEY ?? process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    ),
  },
})

await cp(join(root, 'src/manifest.json'), join(out, 'manifest.json'))
await cp(join(root, 'src/popup/popup.html'), join(out, 'popup.html'))
await cp(join(root, 'src/popup/popup.css'), join(out, 'popup.css'))
await cp(join(root, 'static/icons'), join(out, 'icons'), { recursive: true })

const manifestPath = join(out, 'manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

if (zip) {
  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  // Stable asset name: the download page links to /releases/latest/download.
  const name = 'wsb-extension.zip'
  const target = join(root, name)
  await rm(target, { force: true })
  execFileSync('zip', ['-qr', target, '.'], { cwd: out })
  console.log(`zip: ${name} (v${manifest.version}, pkg ${packageJson.version})`)
}
