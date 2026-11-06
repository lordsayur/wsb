<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatDate } from '@wsb/core'
import { isAnnouncementActive, type Announcement } from '@wsb/data/notifications'
import AdminGate from '~/components/organisms/AdminGate.vue'
import AnnouncementComposer from '~/components/organisms/AnnouncementComposer.vue'
import { supabaseClient } from '~/utils/supabase'
import { callAdmin, useAdminAuth } from '~/composables/useAdminAuth'
import { fetchAnnouncements } from '~/composables/useNotifications'

// specs/notifications/spec.md — admin publishing. The Edge Function checks the
// allowlist and validates; this page only composes and reflects the result.
definePageMeta({ layout: 'admin' })

const { t, locale } = useI18n()
const { state, email, signIn, signOut } = useAdminAuth()
const client = supabaseClient()

const items = ref<Announcement[]>([])
const busy = ref(false)
const message = ref('')
const failed = ref(false)
const composer = ref<InstanceType<typeof AnnouncementComposer> | null>(null)

const rows = computed(() =>
  items.value.map((item) => ({
    ...item,
    dateLabel: formatDate(item.publishedAt.slice(0, 10), locale.value),
    active: isAnnouncementActive(item, new Date()),
    title: item.messages.ms?.title ?? '',
  })),
)

function report(text: string, ok: boolean) {
  message.value = text
  failed.value = !ok
}

async function load() {
  items.value = await fetchAnnouncements(client)
}

async function publish(input: {
  messages: Announcement['messages']
  link: string
  expiresAt: string | null
}) {
  if (!client) return
  busy.value = true
  try {
    const result = await callAdmin(client, { action: 'publish', ...input })
    if (result.error) {
      composer.value?.fail(result.error)
      report(t('admin.announcements.failed'), false)
    } else {
      report(t('admin.announcements.published'), true)
      await load()
    }
  } catch (error) {
    report(error instanceof Error ? error.message : t('admin.failed'), false)
  } finally {
    busy.value = false
  }
}

async function remove(id: string) {
  if (!client || !window.confirm(t('admin.announcements.deleteConfirm'))) return
  busy.value = true
  try {
    const result = await callAdmin(client, { action: 'delete', id })
    if (result.error) report(t('admin.announcements.failed'), false)
    else {
      report(t('admin.announcements.deleted'), true)
      await load()
    }
  } catch (error) {
    report(error instanceof Error ? error.message : t('admin.failed'), false)
  } finally {
    busy.value = false
  }
}

watch(state, (value) => {
  if (value === 'ready') void load()
}, { immediate: true })

useSeoMeta({ title: () => t('admin.nav.notifications'), robots: 'noindex' })
</script>

<template>
  <div class="page">
    <header class="head">
      <h1 class="title">{{ t('admin.announcements.title') }}</h1>
      <p class="intro">{{ t('admin.announcements.intro') }}</p>
    </header>

    <AdminGate
      :state="state"
      :email="email"
      :loading-text="t('state.loading')"
      :sign-in-hint="t('admin.signInHint')"
      :sign-in-label="t('admin.signIn')"
      :forbidden-text="t('admin.forbidden')"
      :sign-out-label="t('admin.signOut')"
      @sign-in="signIn"
      @sign-out="signOut"
    >
      <AnnouncementComposer
        ref="composer"
        :title-label="t('admin.announcements.titleField')"
        :body-label="t('admin.announcements.bodyField')"
        :link-label="t('admin.announcements.linkField')"
        :expires-label="t('admin.announcements.expiresField')"
        :publish-label="t('admin.announcements.publish')"
        :title-placeholder="t('admin.announcements.titlePlaceholder')"
        :body-placeholder="t('admin.announcements.bodyPlaceholder')"
        :busy="busy"
        @publish="publish"
      />

      <p
        v-if="message"
        class="message"
        :class="{ failed }"
        role="status"
        aria-live="polite"
      >{{ message }}</p>

      <section class="list">
        <h2 class="heading">{{ t('admin.announcements.list') }}</h2>
        <p v-if="rows.length === 0" class="empty">
          {{ t('admin.announcements.empty') }}
        </p>
        <ul v-else class="rows">
          <li v-for="row in rows" :key="row.id" class="row">
            <div class="row-main">
              <p class="row-title">{{ row.title }}</p>
              <p class="row-meta">
                <time :datetime="row.publishedAt">{{ row.dateLabel }}</time>
                <span v-if="!row.active" class="inactive">
                  {{ t('admin.announcements.inactive') }}
                </span>
              </p>
            </div>
            <button
              type="button"
              class="delete"
              :disabled="busy"
              @click="remove(row.id)"
            >
              {{ t('admin.announcements.delete') }}
            </button>
          </li>
        </ul>
      </section>
    </AdminGate>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.head {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.title {
  margin: 0;
  font-size: 1.5rem;
}
.intro {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.75;
}
.message {
  margin: 0;
  font-size: 0.85rem;
}
.message.failed {
  color: #ef4444;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.heading {
  margin: 0;
  font-size: 1rem;
}
.empty {
  margin: 0;
  opacity: 0.7;
  font-size: 0.9rem;
}
.rows {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}
.row-main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.row-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
}
.row-meta {
  margin: 0;
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  opacity: 0.7;
}
.inactive {
  color: #ef4444;
  opacity: 1;
}
.delete {
  font: inherit;
  font-size: 0.8rem;
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
