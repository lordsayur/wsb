import { URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // specs/web/spec.md — tests import the app the same way the app does.
    alias: { '~': new URL('./app', import.meta.url).pathname },
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
