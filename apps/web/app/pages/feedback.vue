<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import FeedbackForm from '~/components/organisms/FeedbackForm.vue'
import { FEEDBACK_KINDS, TEMPLATE_SECTIONS } from '@wsb/data/feedback'
import { useFeedback } from '~/composables/useFeedback'

// specs/feedback/spec.md — /feedback: a reader writes a message and the server
// files it as a GitHub issue. No GitHub account is needed to send.
const { t, locale } = useI18n()
const { busy, sent, error, send, page, version, repo } = useFeedback()

const kinds = computed(() =>
  FEEDBACK_KINDS.map((value) => ({
    value,
    label: t(`feedback.kind.${value}`),
    hint: t(`feedback.hint.${value}`),
    sections: TEMPLATE_SECTIONS[value].map((section) =>
      t(`feedback.section.${section}`),
    ),
  })),
)

// Server upload rejections are codes; the catalogue turns them into sentences.
const attachmentErrors = computed(() => ({
  'Image is too large': t('feedback.attachment.tooLarge'),
  'Unsupported image type': t('feedback.attachment.unsupported'),
  'Too many messages': t('feedback.attachment.tooMany'),
}))

const form = ref<InstanceType<typeof FeedbackForm> | null>(null)

async function submit(draft: Parameters<typeof send>[0]) {
  if (await send(draft)) form.value?.reset()
}

/** Server errors are surfaced as localized text, not raw codes. */
const errorText = computed(() =>
  error.value ? t(`feedback.error.${error.value}`, t('feedback.error.failed')) : '',
)

useSeoMeta({
  title: () => t('feedback.title'),
  description: () => t('feedback.intro'),
  robots: 'noindex',
})
</script>

<template>
  <div class="page">
    <main class="content">
      <header class="head">
        <h1 class="title">{{ t('feedback.title') }}</h1>
        <p class="intro">{{ t('feedback.intro') }}</p>
      </header>

      <p class="note">{{ t('feedback.githubNote') }}</p>

      <FeedbackForm
        ref="form"
        :kind-label="t('feedback.kindLabel')"
        :kinds="kinds"
        :title-field-label="t('feedback.fields.title')"
        :body-field-label="t('feedback.fields.body')"
        :contact-field-label="t('feedback.fields.contact')"
        :title-placeholder="t('feedback.fields.titlePlaceholder')"
        :contact-placeholder="t('feedback.fields.contactPlaceholder')"
        :honeypot-label="t('feedback.fields.honeypot')"
        :attachment-label="t('feedback.attachment.attachmentLabel')"
        :attachment-alt="t('feedback.attachment.attachmentAlt')"
        :attach-label="t('feedback.attachment.attachLabel')"
        :uploading-label="t('feedback.attachment.uploadingLabel')"
        :remove-attachment-label="t('feedback.attachment.removeAttachmentLabel')"
        :attachment-error-label="t('feedback.attachment.attachmentErrorLabel')"
        :attachment-errors="attachmentErrors"
        :submit-label="t('feedback.submit')"
        :sent-label="t('feedback.sent')"
        :github-label="t('feedback.githubAction')"
        :github-repo="repo"
        :page="page"
        :version="version"
        :locale="locale"
        :busy="busy"
        :error="errorText"
        :sent="sent"
        @submit="submit"
      />

      <p class="privacy">
        <NuxtLink to="/privacy">{{ t('feedback.privacyLink') }}</NuxtLink>
        <span>{{ t('feedback.privacyNote') }}</span>
      </p>

      <NuxtLink class="back" to="/">
        <Icon name="lucide:arrow-left" aria-hidden="true" />
        {{ t('feedback.back') }}
      </NuxtLink>
    </main>
  </div>
</template>

<style scoped>
.page {
  height: 100vh;
  height: 100dvh;
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
  overflow-y: auto;
}
.content {
  width: 100%;
  max-width: 34rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.head {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.title {
  margin: 0;
  font-size: 1.5rem;
}
.intro,
.note {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
}
.note {
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 0.85rem;
}
.privacy {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
}
.back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}
</style>
