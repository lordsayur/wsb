<template>
  <form class="composer" @submit.prevent="submit">
    <div class="row">
      <label class="field">
        <span>{{ titleLabel }}</span>
        <input
          v-model="title"
          type="text"
          :maxlength="TITLE_MAX"
          :placeholder="titlePlaceholder"
          required
        />
      </label>
    </div>
    <label class="field">
      <span>{{ bodyLabel }}</span>
      <textarea
        v-model="body"
        rows="4"
        :maxlength="BODY_MAX"
        :placeholder="bodyPlaceholder"
        required
      />
    </label>
    <label class="field">
      <span>{{ linkLabel }}</span>
      <input
        v-model="link"
        type="text"
        placeholder="/changelog"
        :maxlength="LINK_MAX"
      />
    </label>
    <label class="field">
      <span>{{ expiresLabel }}</span>
      <input v-model="expiresAt" type="date" />
    </label>
    <div class="actions">
      <button type="submit" class="primary" :disabled="busy || !valid">
        {{ publishLabel }}
      </button>
      <span v-if="error" class="error" role="alert">{{ error }}</span>
    </div>
  </form>
</template>

<script setup lang="ts">
// specs/notifications/spec.md — organism: compose one Malay announcement.
import { computed, ref } from 'vue'
import {
  BODY_MAX,
  LINK_MAX,
  TITLE_MAX,
  validateAnnouncement,
  type AnnouncementInput,
} from '@wsb/data/notifications'

defineProps<{
  titleLabel: string
  bodyLabel: string
  linkLabel: string
  expiresLabel: string
  publishLabel: string
  titlePlaceholder?: string
  bodyPlaceholder?: string
  busy?: boolean
}>()

const emit = defineEmits<{ publish: [input: AnnouncementInput] }>()

const title = ref('')
const body = ref('')
const link = ref('')
const expiresAt = ref('')
const error = ref('')

const draft = computed(() =>
  validateAnnouncement({
    messages: { ms: { title: title.value, body: body.value } },
    link: link.value,
    expiresAt: expiresAt.value ? `${expiresAt.value}T23:59:59Z` : '',
  }),
)

const valid = computed(
  () => title.value.trim().length > 0 && body.value.trim().length > 0,
)

function submit() {
  error.value = ''
  if (!draft.value.ok) {
    error.value = draft.value.error
    return
  }
  emit('publish', draft.value.value)
  title.value = ''
  body.value = ''
  link.value = ''
  expiresAt.value = ''
}

/** The page reports a server rejection back through this method. */
defineExpose({ fail: (message: string) => (error.value = message) })
</script>

<style scoped>
.composer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
.row {
  display: flex;
  gap: 0.75rem;
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
.actions {
  display: flex;
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
.error {
  font-size: 0.8rem;
  color: #ef4444;
}
</style>
