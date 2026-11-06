// specs/feedback/spec.md — `POST /api/feedback`: a reader sends a message and
// the server files it as a GitHub issue. The token stays on the server, so
// sending feedback never needs a GitHub account.
import {
  HONEYPOT_FIELD,
  issueContent,
  ownAttachments,
  validateFeedback,
} from '@wsb/data/feedback'
import { createRateLimiter } from '../utils/rateLimit'

const GITHUB_API = 'https://api.github.com'
const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 })

function clientKey(event: {
  node: {
    req: {
      headers: Record<string, string | string[] | undefined>
      socket?: { remoteAddress?: string }
    }
  }
}): string {
  const forwarded = event.node.req.headers['x-forwarded-for']
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return (
    first?.split(',')[0]?.trim() ||
    event.node.req.socket?.remoteAddress ||
    'unknown'
  )
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const repo = config.public.feedbackRepo as string
  const token = config.feedbackGithubToken as string

  const payload = await readBody(event)
  const feedback = validateFeedback(payload, payload?.[HONEYPOT_FIELD])

  // A bot fills the honeypot; answer as if it worked, but write nothing.
  if (!feedback.ok && feedback.error === 'Rejected') {
    return { ok: true, filed: false }
  }
  if (!feedback.ok) {
    setResponseStatus(event, 400)
    return { ok: false, error: feedback.error }
  }

  // An attachment must live in this project's own bucket, so a message can
  // never hotlink an arbitrary image into an issue.
  feedback.value.attachments = ownAttachments(
    feedback.value.attachments,
    config.public.supabaseUrl as string,
  )

  // The limit applies whether or not GitHub is configured: it protects the
  // route, not just the filing.
  if (!limiter.allow(clientKey(event))) {
    setResponseStatus(event, 429)
    return { ok: false, error: 'Too many messages' }
  }

  if (!token || !repo) {
    // Unconfigured is not the sender's fault; keep the message in the log so a
    // maintainer can still act on it.
    console.warn(
      'feedback: GitHub is not configured; message follows',
      JSON.stringify(feedback.value),
    )
    return { ok: true, filed: false }
  }

  const issue = issueContent(feedback.value, { repo })
  const response = await fetch(`${GITHUB_API}/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'wsb-feedback',
    },
    body: JSON.stringify(issue),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error('feedback: GitHub rejected the issue', response.status, detail)
    setResponseStatus(event, 502)
    return { ok: false, error: 'Could not file the issue' }
  }

  const created = (await response.json()) as { html_url?: string }
  return { ok: true, filed: true, url: created.html_url ?? '' }
})
