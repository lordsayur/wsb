import type { StorybookConfig } from '@storybook/vue3-vite'
import vue from '@vitejs/plugin-vue'
import templateCompilerOptions from '@tresjs/core/template-compiler-options'

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
  // specs/web/spec.md — stories resolve `~` to the app directory and the TresJS
  // nodes (`<TresMesh>` and friends) stay custom elements, exactly as in Nuxt.
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    plugins: [
      ...(viteConfig.plugins ?? []),
      vue({ template: templateCompilerOptions.template }),
    ],
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
