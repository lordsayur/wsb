import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, fn, userEvent, within } from '@storybook/test'
import FeedbackForm from './FeedbackForm.vue'

// specs/feedback/spec.md — organism: the feedback form.
const meta: Meta<typeof FeedbackForm> = {
  title: 'Organisms/FeedbackForm',
  component: FeedbackForm,
  args: {
    kindLabel: 'Jenis',
    kinds: [
      {
        value: 'bug',
        label: 'Pepijat',
        hint: 'Terangkan apa yang berlaku.',
        sections: ['Apa yang berlaku', 'Apa yang dijangka'],
      },
      {
        value: 'idea',
        label: 'Cadangan',
        hint: 'Mulakan dengan masalah.',
        sections: ['Masalah', 'Penyelesaian'],
      },
      { value: 'other', label: 'Lain-lain', sections: ['Mesej'] },
    ],
    titleFieldLabel: 'Tajuk',
    bodyFieldLabel: 'Mesej',
    contactFieldLabel: 'E-mel (pilihan)',
    titlePlaceholder: 'Ringkaskan isu',
    contactPlaceholder: 'supaya kami boleh bertanya lanjut',
    honeypotLabel: 'Jangan isi medan ini',
    attachmentLabel: 'Gambar (pilihan)',
    attachmentAlt: 'Lampiran',
    attachLabel: 'Tambah gambar',
    uploadingLabel: 'Memuat naik…',
    removeAttachmentLabel: 'Buang gambar',
    attachmentErrorLabel: 'Gambar tidak dapat dimuat naik.',
    submitLabel: 'Hantar',
    sentLabel: 'Terima kasih!',
    githubLabel: 'Buka isu di GitHub',
    githubRepo: 'lordsayur/wsb',
    page: '/today',
    version: '4.0.0-beta.1',
    locale: 'ms',
    busy: false,
    error: '',
    sent: false,
    onSubmit: fn(),
  },
}
export default meta

type Story = StoryObj<typeof FeedbackForm>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Hantar' })).toBeDisabled()
    await expect(canvas.getByRole('radio', { name: 'Pepijat' })).toBeChecked()
    await expect(canvas.getByLabelText('Apa yang berlaku')).toHaveValue('')
    await expect(canvas.getByLabelText('Apa yang dijangka')).toHaveValue('')
    await expect(canvas.getByText('Terangkan apa yang berlaku.')).toBeVisible()
  },
}

export const SwitchesSections: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: 'Cadangan' }))
    await expect(canvas.getByLabelText('Masalah')).toBeVisible()
    await expect(canvas.getByLabelText('Penyelesaian')).toBeVisible()
    await expect(canvas.queryByLabelText('Apa yang berlaku')).toBeNull()
  },
}

export const KeepsTypedText: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(
      canvas.getByLabelText('Apa yang berlaku'),
      'Asar tersasar tiga minit.',
    )
    await userEvent.click(canvas.getByRole('radio', { name: 'Lain-lain' }))
    await userEvent.click(canvas.getByRole('radio', { name: 'Pepijat' }))
    await expect(canvas.getByLabelText('Apa yang berlaku')).toHaveValue(
      'Asar tersasar tiga minit.',
    )
  },
}


export const Send: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: 'Cadangan' }))
    await userEvent.type(canvas.getByLabelText(/^Tajuk/), 'Waktu Asar salah')
    await userEvent.type(
      canvas.getByLabelText('Masalah'),
      'Asar menunjukkan 15:10 tetapi MORA 15:13.',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Hantar' }))
    await expect(args.onSubmit).toHaveBeenCalledWith({
      kind: 'idea',
      title: 'Waktu Asar salah',
      body: '### Masalah\n\nAsar menunjukkan 15:10 tetapi MORA 15:13.',
      contact: '',
      honeypot: '',
      attachments: [],
    })
  },
}

export const GitHubFallback: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText(/^Tajuk/), 'Tajuk isu')
    await userEvent.type(
      canvas.getByLabelText('Apa yang berlaku'),
      'Badan isu yang penuh.',
    )
    const link = canvas.getByRole('link', { name: /Buka isu di GitHub/ })
    const url = new URL(link.getAttribute('href') ?? '')
    await expect(url.pathname).toBe('/lordsayur/wsb/issues/new')
    await expect(url.searchParams.get('title')).toBe('Tajuk isu')
  },
}

export const Sent: Story = {
  args: { sent: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent(
      'Terima kasih!',
    )
  },
}

export const Failed: Story = {
  args: { error: 'Maklum balas tidak dapat dihantar. Cuba lagi.' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(
      'Maklum balas tidak dapat dihantar',
    )
  },
}

export const AttachLabel: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Gambar (pilihan)')).toBeVisible()
    const input = canvasElement.querySelector('input[type="file"]')
    await expect(input).not.toBeNull()
    await expect(input?.getAttribute('accept')).toBe(
      'image/png,image/jpeg,image/webp',
    )
  },
}
