// specs/feedback/spec.md — posts to the app's own route; the server files the
// GitHub issue. The reader is never sent to GitHub unless they choose to.
import type { FeedbackInput } from '@wsb/data/feedback'
import { shrinkImage } from '~/utils/imageResize'
import { CHANGELOG } from '~/utils/changelog'

export interface FeedbackDraft {
  kind: FeedbackInput['kind']
  title: string
  body: string
  contact: string
  honeypot: string
  attachments: string[]
}

export interface FeedbackResult {
  ok: boolean
  filed?: boolean
  url?: string
  error?: string
}

export interface UploadResult {
  ok: boolean
  url?: string
  error?: string
}

/** Shrinks one picked image and stores it; returns its public URL. */
export async function uploadAttachment(file: File): Promise<UploadResult> {
  try {
    const blob = await shrinkImage(file)
    const body = new FormData()
    body.append('file', blob, 'attachment.jpg')
    return await $fetch<UploadResult>('/api/feedback/upload', {
      method: 'POST',
      body,
    })
  } catch (cause) {
    return {
      ok: false,
      error:
        (cause as { data?: { error?: string } }).data?.error ?? 'failed',
    }
  }
}

export function useFeedback() {
  const route = useRoute()
  const { locale } = useI18n()
  const config = useRuntimeConfig().public
  const busy = ref(false)
  const sent = ref(false)
  const error = ref('')

  /**
   * Where the sender came from: the footer passes `?from=`, so the issue says
   * which page the message is about rather than `/feedback`.
   */
  const page = computed(() => {
    const from = route.query.from
    return typeof from === 'string' ? from.slice(0, 200) : ''
  })

  async function send(draft: FeedbackDraft) {
    busy.value = true
    error.value = ''
    sent.value = false
    try {
      const result = await $fetch<FeedbackResult>('/api/feedback', {
        method: 'POST',
        body: {
          kind: draft.kind,
          title: draft.title,
          body: draft.body,
          contact: draft.contact,
          page: page.value,
          version: CHANGELOG.version,
          locale: locale.value,
          website: draft.honeypot,
          attachments: draft.attachments,
        },
      })
      if (result.ok) {
        sent.value = true
        return true
      }
      error.value = result.error ?? 'failed'
      return false
    } catch (cause) {
      error.value =
        (cause as { data?: { error?: string } }).data?.error ?? 'failed'
      return false
    } finally {
      busy.value = false
    }
  }

  return {
    busy,
    sent,
    error,
    send,
    page,
    version: CHANGELOG.version,
    locale,
    repo: (config.feedbackRepo as string) || '',
  }
}
