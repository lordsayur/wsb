// Builds the TUI shell. specs/tui/spec.md — core and data are private workspace
// packages, so they are bundled into the published `wsb-tui` package. The
// public Supabase config is baked in from the environment; no remote code.
import { chmod, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const out = join(root, 'dist')
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

const url = process.env.WSB_SUPABASE_URL ?? ''
const anonKey =
  process.env.WSB_SUPABASE_ANON_KEY ??
  process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''

if (/SERVICE_ROLE|service_role/.test(anonKey)) {
  throw new Error('refusing to ship a service-role key in the TUI build')
}

if (process.argv.includes('--binaries')) {
  await binaries()
} else {
  await bundle()
}

/** The npm artifact: one self-contained ESM file plus its manifest. */
async function bundle() {
  await rm(out, { recursive: true, force: true })
  await mkdir(out, { recursive: true })

  await build({
    entryPoints: { cli: join(root, 'src/cli.ts') },
    bundle: true,
    format: 'esm',
    target: 'node18',
    platform: 'node',
    outdir: out,
    entryNames: '[name]',
    minify: true,
    sourcemap: false,
    logLevel: 'info',
    define: {
      __WSB_VERSION__: JSON.stringify(manifest.version),
      __WSB_SUPABASE_URL__: JSON.stringify(url),
      __WSB_SUPABASE_ANON_KEY__: JSON.stringify(anonKey),
    },
  })
  await chmod(join(out, 'cli.js'), 0o755)
  await copyFile(join(root, 'README.md'), join(out, 'README.md'))

  // The published package has no runtime dependencies (core and data are
  // bundled), so ship a minimal manifest beside the bundle.
  await writeFile(
    join(out, 'package.json'),
    JSON.stringify(
      {
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        license: manifest.license,
        type: 'module',
        bin: { wsb: './cli.js', 'wsb-tui': './cli.js' },
        files: ['cli.js', 'README.md'],
        repository: manifest.repository,
        homepage: manifest.homepage,
        keywords: manifest.keywords,
        engines: { node: '>=18' },
      },
      null,
      2,
    ) + '\n',
  )
}

/** Standalone binaries for the platforms the spec lists, with checksums. */
async function binaries() {
  const targets = {
    'linux-x64': 'bun-linux-x64',
    'linux-arm64': 'bun-linux-arm64',
    'darwin-arm64': 'bun-darwin-arm64',
    'windows-x64': 'bun-windows-x64',
  }
  const dir = join(out, 'binaries')
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })

  for (const [name, target] of Object.entries(targets)) {
    const file = join(dir, `wsb-tui-${name}${name.startsWith('windows') ? '.exe' : ''}`)
    execFileSync(
      'bun',
      [
        'build',
        '--compile',
        `--target=${target}`,
        '--define',
        `__WSB_VERSION__=${JSON.stringify(manifest.version)}`,
        '--define',
        `__WSB_SUPABASE_URL__=${JSON.stringify(url)}`,
        '--define',
        `__WSB_SUPABASE_ANON_KEY__=${JSON.stringify(anonKey)}`,
        join(root, 'src/cli.ts'),
        '--outfile',
        file,
      ],
      { cwd: root, stdio: 'inherit' },
    )
    const bytes = await readFile(file)
    await writeFile(`${file}.sha256`, `${createHash('sha256').update(bytes).digest('hex')}  ${file.split('/').pop()}\n`)
  }
}
