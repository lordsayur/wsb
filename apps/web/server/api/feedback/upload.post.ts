// specs/feedback/spec.md — `POST /api/feedback/upload`: one screenshot, stored
// in the public `feedback` bucket. The browser never holds write credentials;
// the route checks the type and size and uploads with the service role.
import { ATTACHMENT_MAX } from '@wsb/data/feedback'
import { createRateLimiter } from '../../utils/rateLimit'

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp'])
const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}
const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10 })

/** Sniffs the real type from the first bytes; the client's word is not proof. */
function sniffType(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e) {
    return 'image/png'
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  const riff = String.fromCharCode(...bytes.slice(0, 4))
  const webp = String.fromCharCode(...bytes.slice(8, 12))
  if (riff === 'RIFF' && webp === 'WEBP') return 'image/webp'
  return null
}

function clientKey(event: Parameters<typeof readMultipartFormData>[0]): string {
  const forwarded = getHeader(event, 'x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  return first || getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}

export default defineEventHandler(async (event) => {
  if (!limiter.allow(clientKey(event))) {
    setResponseStatus(event, 429)
    return { ok: false, error: 'Too many messages' }
  }

  const config = useRuntimeConfig(event)
  const url = config.public.supabaseUrl as string
  const key = config.supabaseServiceKey as string
  if (!url || !key) {
    setResponseStatus(event, 503)
    return { ok: false, error: 'Could not attach the image' }
  }

  const parts = await readMultipartFormData(event)
  const file = parts?.find((part) => part.name === 'file')
  if (!file || !file.data?.length) {
    setResponseStatus(event, 400)
    return { ok: false, error: 'No image' }
  }
  if (file.data.length > MAX_BYTES) {
    setResponseStatus(event, 413)
    return { ok: false, error: 'Image is too large' }
  }

  const type = sniffType(file.data)
  if (!type || !ALLOWED.has(type)) {
    setResponseStatus(event, 415)
    return { ok: false, error: 'Unsupported image type' }
  }

  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${EXTENSIONS[type]}`
  const upload = await fetch(`${url}/storage/v1/object/feedback/${path}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': type,
      'x-upsert': 'false',
    },
    body: new Uint8Array(file.data),
  })

  if (!upload.ok) {
    const detail = await upload.text().catch(() => '')
    console.error('feedback: storage rejected the upload', upload.status, detail)
    setResponseStatus(event, 502)
    return { ok: false, error: 'Could not attach the image' }
  }

  return {
    ok: true,
    url: `${url}/storage/v1/object/public/feedback/${path}`,
    max: ATTACHMENT_MAX,
  }
})
