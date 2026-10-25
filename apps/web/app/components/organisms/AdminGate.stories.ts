import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, within } from '@storybook/test'
import AdminGate from './AdminGate.vue'

// specs/web/spec.md — organism: shared admin auth gate, every state.
const meta: Meta<typeof AdminGate> = {
  title: 'Organisms/AdminGate',
  component: AdminGate,
  args: {
    state: 'ready',
    email: 'admin@example.com',
    loadingText: 'Memuatkan…',
    signInHint: 'Masuk dengan akaun Google yang dibenarkan.',
    signInLabel: 'Masuk dengan Google',
    forbiddenText: 'Akaun ini tidak dibenarkan mengurus data.',
    signOutLabel: 'Keluar',
    onSignIn: fn(),
    onSignOut: fn(),
  },
}
export default meta

type Story = StoryObj<typeof AdminGate>

export const Ready: Story = {
  render: (args) => ({
    components: { AdminGate },
    setup: () => ({ args }),
    template:
      '<AdminGate v-bind="args"><p>Kandungan pentadbir</p></AdminGate>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Kandungan pentadbir')).toBeVisible()
  },
}

export const Loading: Story = {
  args: { state: 'loading' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Memuatkan…')).toBeVisible()
  },
}

export const SignedOut: Story = {
  args: { state: 'signed-out' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('button', { name: 'Masuk dengan Google' }),
    ).toBeVisible()
  },
}

export const Forbidden: Story = {
  args: { state: 'forbidden', email: 'nope@example.com' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByText('Akaun ini tidak dibenarkan mengurus data.'),
    ).toBeVisible()
    await expect(canvas.getByText('nope@example.com')).toBeVisible()
  },
}
