import type { Decorator } from '@storybook/vue3'
import { defineComponent, provide } from 'vue'

/**
 * Injection key shared with the `<ClientOnly>` stand-in in `preview.ts`. A story
 * that needs the client-only slot — the WebGL wall — opts in with
 * `parameters: { clientOnly: true }`. Everything else keeps the CSS fallback, so
 * most stories never pay for Three.js.
 */
export const CLIENT_ONLY: unique symbol = Symbol('wsb.storybook.clientOnly')

/** Provides the opt-in flag down to the `<ClientOnly>` stand-in. */
const StoryClientOnlyProvider = defineComponent({
  name: 'StoryClientOnlyProvider',
  setup(_, { slots }) {
    provide(CLIENT_ONLY, true)
    return () => slots.default?.()
  },
})

export const withClientOnly: Decorator = (story, context) => {
  if (!context.parameters?.clientOnly) return story()
  return {
    components: { StoryClientOnlyProvider },
    template: '<StoryClientOnlyProvider><story /></StoryClientOnlyProvider>',
  }
}
