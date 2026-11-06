// specs/feedback/spec.md — the feedback form's payload and the rules that make
// one worth filing. Pure and vendor-free: the Nuxt server route, the admin
// viewer and the tests all use these.

export type Validation<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

/** What kind of message this is. A bug is the only kind GitHub gets a label for. */
export const FEEDBACK_KINDS = ['bug', 'idea', 'other'] as const

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]

export const KIND_LABELS: Record<FeedbackKind, string> = {
  bug: 'Bug report',
  idea: 'Suggestion',
  other: 'Other',
}

export const TITLE_MAX = 120
export const BODY_MAX = 4000
export const CONTACT_MAX = 200
export const PAGE_MAX = 200
export const HONEYPOT_FIELD = 'website'
/** Images a message may carry. Each is a public URL the issue embeds. */
export const ATTACHMENT_MAX = 3
export const ATTACHMENT_URL_MAX = 500
/** How many real characters, ignoring headings, a message needs. */
export const BODY_MIN = 10

/**
 * The sections each kind asks for. The shell supplies a localized heading per
 * section, so the structure lives here and the words live in the catalogues.
 */
export const TEMPLATE_SECTIONS: Record<FeedbackKind, readonly string[]> = {
  bug: ['whatHappened', 'expected', 'steps', 'environment'],
  idea: ['problem', 'proposal', 'alternatives'],
  other: ['message'],
}

export interface FeedbackInput {
  kind: FeedbackKind
  title: string
  body: string
  /** How to reach the sender; free text, so email is optional. */
  contact: string
  /** The route the form was opened from, when the shell knows it. */
  page: string
  /** App version at the time of writing. */
  version: string
  /** Locale at the time of writing. */
  locale: string
  /** Public image URLs, in the order the sender attached them. */
  attachments: string[]
}

export interface Feedback extends FeedbackInput {
  id: string
  /** ISO instant the message was received. */
  createdAt: string
  /** True once an issue exists for it. */
  filed: boolean
  /** URL of the filed issue, empty while it has not been filed. */
  issueUrl: string
}

const KIND = new Set<string>(FEEDBACK_KINDS)

export function isFeedbackKind(value: unknown): value is FeedbackKind {
  return typeof value === 'string' && KIND.has(value)
}

/**
 * Shape of an attachment URL: absolute `https`, bounded, no whitespace. The
 * server additionally proves it belongs to its own storage bucket.
 */
export function isAttachmentUrl(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= ATTACHMENT_URL_MAX &&
    /^https:\/\/[^\s]+$/i.test(value)
  )
}

/**
 * Keeps only URLs under this project's own public feedback bucket, so a
 * message can never hotlink an arbitrary image into an issue.
 */
export function ownAttachments(
  urls: readonly string[],
  storageUrl: string,
): string[] {
  if (!storageUrl) return []
  const prefix = `${storageUrl.replace(/\/+$/, '')}/storage/v1/object/public/feedback/`
  return urls.filter((url) => isAttachmentUrl(url) && url.startsWith(prefix))
}

/** Keeps the well-formed URLs, drops the rest and caps the count. */
export function normalizeAttachments(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => isAttachmentUrl(item))
    .slice(0, ATTACHMENT_MAX)
}

function trim(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

export interface BodySection {
  /** The localized heading shown to the sender and written into the issue. */
  heading: string
  /** What the sender typed under it; may be empty. */
  text: string
}

/**
 * Turns labelled fields into the issue body. The sender never writes Markdown:
 * each non-empty field becomes a `###` section, and empty ones are omitted.
 */
export function composeBody(sections: readonly BodySection[]): string {
  return sections
    .filter((section) => section.text.trim() !== '')
    .map((section) => `### ${section.heading.trim()}\n\n${section.text.trim()}`)
    .join('\n\n')
}

/**
 * Characters that count as a message. Heading lines are structure, so a body
 * made only of headings is still too short.
 */
export function meaningfulLength(body: string): number {
  return body
    .split('\n')
    .filter((line) => !/^\s*#{1,6}\s/.test(line))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim().length
}

/**
 * Validates one submission. The honeypot must be empty; a filled one is
 * reported as invalid so the caller can accept it silently and drop it.
 */
export function validateFeedback(
  value: unknown,
  honeypot: unknown,
): Validation<FeedbackInput> {
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    return { ok: false, error: 'Rejected' }
  }

  const input = (value ?? {}) as Record<string, unknown>

  if (!isFeedbackKind(input.kind)) {
    return { ok: false, error: 'Unknown kind' }
  }

  const title = trim(input.title, TITLE_MAX)
  if (!title) return { ok: false, error: 'Title is required' }

  const body = trim(input.body, BODY_MAX)
  if (meaningfulLength(body) < BODY_MIN) {
    return { ok: false, error: 'Message is too short' }
  }

  return {
    ok: true,
    value: {
      kind: input.kind,
      title,
      body,
      contact: trim(input.contact, CONTACT_MAX),
      page: trim(input.page, PAGE_MAX),
      version: trim(input.version, 40),
      locale: trim(input.locale, 20),
      attachments: normalizeAttachments(input.attachments),
    },
  }
}

/** The issue title and body a maintainer reads on GitHub. */
export function issueContent(
  feedback: FeedbackInput,
  options: { repo: string },
): { title: string; body: string; labels: string[] } {
  const meta = [
    feedback.kind && `Kind: ${KIND_LABELS[feedback.kind]}`,
    feedback.version && `Version: ${feedback.version}`,
    feedback.locale && `Locale: ${feedback.locale}`,
    feedback.page && `Page: ${feedback.page}`,
    feedback.contact && `Contact: ${feedback.contact}`,
    `Source: ${options.repo} web feedback form`,
  ].filter(Boolean)

  const images = (feedback.attachments ?? []).map(
    (url, index) => `![Attachment ${index + 1}](${url})`,
  )

  return {
    title: feedback.title,
    body: [
      feedback.body,
      ...(images.length > 0 ? ['', ...images] : []),
      '',
      '---',
      ...meta.map((line) => `- ${line}`),
    ].join('\n'),
    labels: feedback.kind === 'bug' ? ['bug'] : [],
  }
}

/**
 * A prefilled GitHub issue URL, for a sender who would rather file it
 * themselves. No account is needed for the form itself; this link only works
 * for someone who is signed in to GitHub.
 */
export function issueLink(
  feedback: FeedbackInput,
  options: { repo: string },
): string {
  const { title, body, labels } = issueContent(feedback, options)
  const query = new URLSearchParams({ title, body })
  if (labels.length > 0) query.set('labels', labels.join(','))
  return `https://github.com/${options.repo}/issues/new?${query.toString()}`
}
