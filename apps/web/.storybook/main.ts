import type { StorybookConfig } from '@storybook/vue3-vite'
import vue from '@vitejs/plugin-vue'

const config: StorybookConfig = {
  stories: ['../app/components/**/*.stories.@(ts|js)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/experimental-addon-test',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  // specs/web/spec.md — stories resolve `~` to the app directory.
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    plugins: [...(viteConfig.plugins ?? []), vue()],
    resolve: {
      ...viteConfig.resolve,
      alias: {
        ...viteConfig.resolve?.alias,
        '~': new URL('../app', import.meta.url).pathname,
      },
    },
  }),
}

export default config
