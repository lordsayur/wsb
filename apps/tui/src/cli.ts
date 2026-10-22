#!/usr/bin/env node
// specs/tui/spec.md — executable entry; keeps `main` importable for tests.
import { main } from './main.js'

main().then(
  (code) => process.exit(code),
  (error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
  },
)
