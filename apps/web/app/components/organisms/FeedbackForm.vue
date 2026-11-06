<template>
  <form class="feedback" @submit.prevent="submit">
    <fieldset class="kinds">
      <legend>{{ kindLabel }}</legend>
      <div class="kind-options">
        <label v-for="option in kinds" :key="option.value" class="kind">
          <input
            v-model="kind"
            type="radio"
            name="feedback-kind"
            :value="option.value"
          />
          <span>{{ option.label }}</span>
        </label>
      </div>
    </fieldset>

    <label class="field">
      <span>{{ titleFieldLabel }}</span>
      <input
        v-model="title"
        type="text"
        :maxlength="TITLE_MAX"
        :placeholder="titlePlaceholder"
        required
      />
      <small class="counter">{{ title.length }}/{{ TITLE_MAX }}</small>
    </label>

    <p v-if="current?.hint" class="hint">{{ current.hint }}</p>

    <!-- One labelled field per section; the sender never types Markdown. -->
    <fieldset class="sections">
      <legend>{{ bodyFieldLabel }}</legend>
      <label v-for="section in fields" :key="section.key" class="field">
        <span>{{ section.heading }}</span>
        <textarea v-model="section.text" rows="3" :maxlength="BODY_MAX" />
      </label>
    </fieldset>
    <p class="body-counter">{{ bodyLength }}/{{ BODY_MAX }}</p>

    <label class="field">
      <span>{{ contactFieldLabel }}</span>
      <input
        v-model="contact"
        type="text"
        :maxlength="CONTACT_MAX"
        :placeholder="contactPlaceholder"
      />
    </label>

    <!-- spec: an optional screenshot; shrunk before it leaves the device -->
    <div class="attachments">
      <p class="attachments-label">{{ attachmentLabel }}</p>
      <ul v-if="images.length > 0" class="thumbs">
        <li v-for="(image, index) in images" :key="image.url" class="thumb">
          <img :src="image.url" :alt="`${attachmentAlt} ${index + 1}`" />
          <button
            type="button"
            class="remove"
            :aria-label="`${removeAttachmentLabel} ${index + 1}`"
            @click="removeImage(index)"
          >
            <Icon name="lucide:x" aria-hidden="true" />
          </button>
        </li>
      </ul>
      <label v-if="images.length < maxAttachments" class="attach">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          :disabled="uploading"
          @change="pickImage"
        />
        <Icon
          :name="uploading ? 'lucide:loader-circle' : 'lucide:image-plus'"
          :class="{ spin: uploading }"
          aria-hidden="true"
        />
        <span>{{ uploading ? uploadingLabel : attachLabel }}</span>
      </label>
      <p v-if="attachmentError" class="message error" role="alert">
        {{ attachmentError }}
      </p>
    </div>

    <!-- spec: honeypot, hidden from people and from assistive tech -->
    <div class="honeypot" aria-hidden="true">
      <label>
        {{ honeypotLabel }}
        <input v-model="honeypot" type="text" tabindex="-1" autocomplete="off" />
      </label>
    </div>

    <div class="actions">
      <button type="submit" class="primary" :disabled="busy || !valid">
        {{ submitLabel }}
      </button>
      <a
        v-if="githubHref"
        class="github"
        :href="githubHref"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon name="lucide:external-link" aria-hidden="true" />
        {{ githubLabel }}
      </a>
    </div>

    <p v-if="error" class="message error" role="alert">{{ error }}</p>
    <p v-else-if="sent" class="message success" role="status">{{ sentLabel }}</p>
  </form>
</template>

<script setup lang="ts">
// specs/feedback/spec.md — organism: the feedback form. It validates locally for
// fast feedback, then posts to the app's own route; it never talks to GitHub.
import { computed, ref, watch } from 'vue'
import {
  ATTACHMENT_MAX,
  BODY_MAX,
  BODY_MIN,
  CONTACT_MAX,
  TITLE_MAX,
  composeBody,
  isFeedbackKind,
  issueLink,
  meaningfulLength,
  type BodySection,
  type FeedbackKind,
} from '@wsb/data/feedback'
import { uploadAttachment } from '~/composables/useFeedback'

const props = defineProps<{
  kindLabel: string
  kinds: {
    value: FeedbackKind
    label: string
    /** One line telling the sender what this kind wants. */
    hint?: string
    /** Section headings, in order, used to seed the body. */
    sections?: string[]
  }[]
  titleFieldLabel: string
  bodyFieldLabel: string
  contactFieldLabel: string
  titlePlaceholder?: string
  contactPlaceholder?: string
  honeypotLabel: string
  attachmentLabel: string
  attachmentAlt: string
  attachLabel: string
  uploadingLabel: string
  removeAttachmentLabel: string
  /** Localized text per server error code, plus the generic fallback. */
  attachmentErrorLabel: string
  attachmentErrors?: Record<string, string>
  submitLabel: string
  sentLabel: string
  githubLabel?: string
  /** `owner/repo`; when set, a prefilled GitHub issue link is offered too. */
  githubRepo?: string
  /** Context stamped onto the issue, and onto the request. */
  page?: string
  version?: string
  locale?: string
  busy?: boolean
  error?: string
  sent?: boolean
}>()

const emit = defineEmits<{
  submit: [
    value: {
      kind: FeedbackKind
      title: string
      body: string
      contact: string
      /** `HONEYPOT_FIELD`; empty for a person, filled by a bot. */
      honeypot: string
      /** Public URLs of the uploaded screenshots, in pick order. */
      attachments: string[]
    },
  ]
}>()

const kind = ref<FeedbackKind>('bug')
const title = ref('')
const contact = ref('')
const honeypot = ref('')
const images = ref<{ url: string }[]>([])
const uploading = ref(false)
const attachmentError = ref('')
const maxAttachments = ATTACHMENT_MAX

/** The chosen kind's definition, for its hint and sections. */
const current = computed(() => props.kinds.find((item) => item.value === kind.value))

/** One editable field per section, kept stable by its position. */
interface Field extends BodySection {
  key: number
}

const fields = ref<Field[]>(buildFields(kind.value))

function buildFields(value: FeedbackKind, previous: Field[] = []): Field[] {
  const definition = props.kinds.find((item) => item.value === value)
  return (definition?.sections ?? []).map((heading, key) => ({
    key,
    heading,
    // Text moves with a heading that both kinds share; otherwise a field keeps
    // what it had at the same position.
    text:
      previous.find((field) => field.heading === heading)?.text ??
      previous[key]?.text ??
      '',
  }))
}

// Changing kind rebuilds the fields, keeping any text whose heading survives.
watch(kind, (next) => {
  fields.value = buildFields(next, fields.value)
})

/** The issue body, assembled from the filled fields. */
const body = computed(() =>
  composeBody(fields.value.map(({ heading, text }) => ({ heading, text }))),
)

const bodyLength = computed(() => body.value.length)

const valid = computed(
  () =>
    isFeedbackKind(kind.value) &&
    title.value.trim().length > 0 &&
    meaningfulLength(body.value) >= BODY_MIN,
)

/** The same payload the form sends, with the surrounding context added. */
const draft = computed(() => ({
  kind: kind.value,
  title: title.value.trim(),
  body: body.value.trim(),
  contact: contact.value.trim(),
  page: props.page ?? '',
  version: props.version ?? '',
  locale: props.locale ?? '',
  attachments: images.value.map((image) => image.url),
}))

/** Prefilled GitHub issue, for a sender who would rather file it there. */
const githubHref = computed(() =>
  props.githubRepo && draft.value.title && draft.value.body
    ? issueLink(draft.value, { repo: props.githubRepo })
    : '',
)

async function pickImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || images.value.length >= maxAttachments) return
  uploading.value = true
  attachmentError.value = ''
  const result = await uploadAttachment(file)
  uploading.value = false
  if (result.ok && result.url) {
    images.value = [...images.value, { url: result.url }]
    return
  }
  attachmentError.value =
    (result.error && props.attachmentErrors?.[result.error]) ||
    props.attachmentErrorLabel
}

function removeImage(index: number) {
  images.value = images.value.filter((_, at) => at !== index)
}

function submit() {
  if (!valid.value) return
  emit('submit', {
    kind: kind.value,
    title: title.value.trim(),
    body: body.value.trim(),
    contact: contact.value.trim(),
    honeypot: honeypot.value,
    attachments: images.value.map((image) => image.url),
  })
}

/** Clears the form after a successful send. */
function reset() {
  title.value = ''
  contact.value = ''
  honeypot.value = ''
  images.value = []
  attachmentError.value = ''
  fields.value = buildFields(kind.value)
}

defineExpose({ reset })
</script>

<style scoped>
.feedback {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
.kinds {
  margin: 0;
  padding: 0;
  border: 0;
}
.kinds legend {
  padding: 0;
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 0.4rem;
}
.kind-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.kind {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-size: 0.85rem;
  cursor: pointer;
}
.kind input {
  accent-color: var(--primary);
  margin: 0;
}
.kind:has(input:checked) {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 14%, transparent);
  font-weight: 600;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.8rem;
}
.field > span {
  opacity: 0.7;
}
.counter {
  align-self: flex-end;
  font-size: 0.7rem;
  opacity: 0.5;
  font-variant-numeric: tabular-nums;
}
input,
textarea {
  font: inherit;
  font-size: 0.9rem;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--fg);
  width: 100%;
}
textarea {
  resize: vertical;
  min-height: 7rem;
}
.sections {
  margin: 0;
  padding: 0;
  border: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
/* The legend names the group for assistive tech only; each field already has
   its own visible heading, so showing it too just stacks two labels. */
.sections legend {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
.sections textarea {
  min-height: 3.6rem;
}
.body-counter {
  margin: 0;
  align-self: flex-end;
  font-size: 0.7rem;
  opacity: 0.5;
  font-variant-numeric: tabular-nums;
}
.hint {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.65;
}
.attachments {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.attachments-label {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
}
.thumbs {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.thumb {
  position: relative;
  width: 5rem;
  height: 5rem;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface-2);
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.remove {
  position: absolute;
  top: 0.15rem;
  inset-inline-end: 0.15rem;
  display: grid;
  place-items: center;
  width: 1.35rem;
  height: 1.35rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  cursor: pointer;
}
.attach {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  align-self: flex-start;
  padding: 0.4rem 0.7rem;
  border-radius: 8px;
  border: 1px dashed var(--border);
  font-size: 0.85rem;
  cursor: pointer;
}
.attach input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.attach:has(input:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}
.spin {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.honeypot {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
.primary {
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.5rem 0.9rem;
  border: 0;
  border-radius: 8px;
  background: var(--primary);
  color: var(--primary-fg);
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.github {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--primary);
}
.message {
  margin: 0;
  font-size: 0.85rem;
}
.error {
  color: #ef4444;
}
.success {
  color: var(--primary);
}
</style>
