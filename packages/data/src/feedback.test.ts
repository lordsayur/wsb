import { describe, expect, it } from 'vitest'
import {
  ATTACHMENT_MAX,
  BODY_MIN,
  FEEDBACK_KINDS,
  TEMPLATE_SECTIONS,
  composeBody,
  isAttachmentUrl,
  issueContent,
  issueLink,
  meaningfulLength,
  normalizeAttachments,
  ownAttachments,
  validateFeedback,
  type FeedbackInput,
} from './feedback.js'

// specs/feedback/spec.md — submission rules and the issue a maintainer gets.

const valid: FeedbackInput = {
  kind: 'bug',
  title: 'Wrong Asar time in Tutong',
  body: 'Asar shows 15:10 but MORA says 15:13.',
  contact: 'someone@example.com',
  page: '/today',
  version: '4.0.0-beta.1',
  locale: 'ms',
  attachments: [],
}

describe('validateFeedback', () => {
  it('accepts a complete report', () => {
    expect(validateFeedback(valid, '')).toEqual({ ok: true, value: valid })
  })

  it('accepts every kind', () => {
    for (const kind of FEEDBACK_KINDS) {
      expect(validateFeedback({ ...valid, kind }, '').ok).toBe(true)
    }
  })

  it('rejects an unknown kind, a blank title and a short body', () => {
    expect(validateFeedback({ ...valid, kind: 'rant' }, '')).toEqual({
      ok: false,
      error: 'Unknown kind',
    })
    expect(validateFeedback({ ...valid, title: '   ' }, '')).toEqual({
      ok: false,
      error: 'Title is required',
    })
    expect(validateFeedback({ ...valid, body: 'too short' }, '')).toEqual({
      ok: false,
      error: 'Message is too short',
    })
  })

  it('rejects a filled honeypot so the route can drop it silently', () => {
    expect(validateFeedback(valid, 'http://spam.example')).toEqual({
      ok: false,
      error: 'Rejected',
    })
  })

  it('trims text and caps the optional fields', () => {
    const result = validateFeedback(
      {
        ...valid,
        title: `  ${valid.title}  `,
        body: `  ${valid.body}  `,
        contact: 'x'.repeat(500),
        page: 'y'.repeat(500),
      },
      '',
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.title).toBe(valid.title)
      expect(result.value.body).toBe(valid.body)
      expect(result.value.contact).toHaveLength(200)
      expect(result.value.page).toHaveLength(200)
    }
  })

  it('keeps well-formed attachment URLs and drops the rest', () => {
    const result = validateFeedback(
      {
        ...valid,
        attachments: [
          'https://example.supabase.co/storage/v1/object/public/feedback/a.jpg',
          'javascript:alert(1)',
          42,
          'http://insecure.example/a.png',
        ],
      },
      '',
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.attachments).toEqual([
        'https://example.supabase.co/storage/v1/object/public/feedback/a.jpg',
      ])
    }
  })

  it('treats the optional fields as optional', () => {
    const result = validateFeedback(
      { kind: 'idea', title: 'Add Jawi numerals', body: 'Everywhere please.' },
      '',
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.contact).toBe('')
      expect(result.value.page).toBe('')
      expect(result.value.version).toBe('')
    }
  })
})

describe('isAttachmentUrl', () => {
  it('accepts only bounded https URLs', () => {
    expect(isAttachmentUrl('https://x.example/a.png')).toBe(true)
    expect(isAttachmentUrl('http://x.example/a.png')).toBe(false)
    expect(isAttachmentUrl('https://x.example/a b.png')).toBe(false)
    expect(isAttachmentUrl(`https://x.example/${'a'.repeat(600)}`)).toBe(false)
  })
})

describe('normalizeAttachments', () => {
  it('drops non-arrays and caps the count', () => {
    expect(normalizeAttachments('nope')).toEqual([])
    expect(
      normalizeAttachments(
        Array.from({ length: 6 }, (_, index) => `https://x.example/${index}.png`),
      ),
    ).toHaveLength(ATTACHMENT_MAX)
  })
})

describe('ownAttachments', () => {
  const base = 'https://example.supabase.co'

  it('keeps only URLs under this project bucket', () => {
    expect(
      ownAttachments(
        [
          `${base}/storage/v1/object/public/feedback/a.jpg`,
          'https://evil.example/a.jpg',
        ],
        base,
      ),
    ).toEqual([`${base}/storage/v1/object/public/feedback/a.jpg`])
  })

  it('drops everything when there is no configured project', () => {
    expect(ownAttachments([`${base}/storage/v1/object/public/feedback/a.jpg`], '')).toEqual([])
  })

  it('ignores a trailing slash on the project URL', () => {
    expect(
      ownAttachments(
        [`${base}/storage/v1/object/public/feedback/a.jpg`],
        `${base}/`,
      ),
    ).toHaveLength(1)
  })
})

describe('issueContent', () => {
  it('carries the message and the context as metadata', () => {
    const issue = issueContent(valid, { repo: 'lordsayur/wsb' })
    expect(issue.title).toBe(valid.title)
    expect(issue.body).toContain(valid.body)
    expect(issue.body).toContain('- Kind: Bug report')
    expect(issue.body).toContain('- Version: 4.0.0-beta.1')
    expect(issue.body).toContain('- Page: /today')
    expect(issue.body).toContain('- Contact: someone@example.com')
    expect(issue.labels).toEqual(['bug'])
  })

  it('embeds each attachment as an image under the message', () => {
    const issue = issueContent(
      {
        ...valid,
        attachments: [
          'https://example.supabase.co/storage/v1/object/public/feedback/a.jpg',
        ],
      },
      { repo: 'lordsayur/wsb' },
    )
    expect(issue.body).toContain('![Attachment 1](')
    expect(issue.body.indexOf('![Attachment 1]')).toBeLessThan(
      issue.body.indexOf('---'),
    )
  })

  it('leaves suggestions unlabelled and omits absent metadata', () => {
    const issue = issueContent(
      { ...valid, kind: 'idea', contact: '', version: '', page: '', locale: '' },
      { repo: 'lordsayur/wsb' },
    )
    expect(issue.labels).toEqual([])
    expect(issue.body).not.toContain('Contact:')
    expect(issue.body).not.toContain('Version:')
  })
})

describe('issueLink', () => {
  it('builds a prefilled new-issue URL', () => {
    const url = new URL(issueLink(valid, { repo: 'lordsayur/wsb' }))
    expect(url.origin).toBe('https://github.com')
    expect(url.pathname).toBe('/lordsayur/wsb/issues/new')
    expect(url.searchParams.get('title')).toBe(valid.title)
    expect(url.searchParams.get('labels')).toBe('bug')
  })

  it('omits labels when there are none', () => {
    const url = new URL(
      issueLink({ ...valid, kind: 'other' }, { repo: 'lordsayur/wsb' }),
    )
    expect(url.searchParams.has('labels')).toBe(false)
  })
})

describe('composeBody', () => {
  it('turns filled fields into headed sections', () => {
    expect(
      composeBody([
        { heading: 'What happened', text: '  Asar was late.  ' },
        { heading: 'Expected', text: '15:13.' },
      ]),
    ).toBe('### What happened\n\nAsar was late.\n\n### Expected\n\n15:13.')
  })

  it('omits a field the sender left empty', () => {
    expect(
      composeBody([
        { heading: 'What happened', text: 'Asar was late.' },
        { heading: 'Expected', text: '   ' },
      ]),
    ).toBe('### What happened\n\nAsar was late.')
  })

  it('produces an empty body when nothing is filled', () => {
    expect(
      composeBody([
        { heading: 'What happened', text: '' },
        { heading: 'Expected', text: '' },
      ]),
    ).toBe('')
  })
})

describe('sections', () => {
  it('gives every kind at least one section', () => {
    for (const kind of FEEDBACK_KINDS) {
      expect(TEMPLATE_SECTIONS[kind].length).toBeGreaterThan(0)
    }
  })

  it('treats an empty set of fields as too short', () => {
    expect(
      validateFeedback(
        {
          ...valid,
          body: composeBody(TEMPLATE_SECTIONS.bug.map((heading) => ({ heading, text: '' }))),
        },
        '',
      ),
    ).toEqual({ ok: false, error: 'Message is too short' })
  })

  it('accepts a filled section', () => {
    const body = composeBody([{ heading: 'What happened', text: 'Asar 15:10.' }])
    expect(meaningfulLength(body)).toBeGreaterThanOrEqual(BODY_MIN)
    expect(validateFeedback({ ...valid, body }, '').ok).toBe(true)
  })
})
