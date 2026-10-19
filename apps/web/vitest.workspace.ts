import { defineWorkspace } from 'vitest/config'
import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin'

// specs/web/spec.md — components ship with stories; stories double as tests.
export default defineWorkspace([
  {
    extends: './vitest.config.ts',
    test: {
      name: 'unit',
      environment: 'node',
      include: ['app/**/*.test.ts'],
    },
  },
  {
    plugins: await storybookTest({ configDir: '.storybook' }),
    test: {
      name: 'storybook',
      setupFiles: ['.storybook/vitest.setup.ts'],
      browser: {
        enabled: true,
        provider: 'playwright',
        headless: true,
        name: 'chromium',
      },
    },
  },
])
