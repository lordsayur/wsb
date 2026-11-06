<script setup lang="ts">
// specs/web/spec.md — the admin shell: menus on the left, account top right.
// Pages only render their content; the shell owns navigation and identity.
import { useI18n } from 'vue-i18n'
import { useAdminAuth } from '~/composables/useAdminAuth'

const { t } = useI18n()
const route = useRoute()
const { state, email, signOut } = useAdminAuth()

const links = computed(() => [
  {
    to: '/admin',
    icon: 'lucide:clock',
    label: t('admin.nav.times'),
  },
  {
    to: '/admin/analytics',
    icon: 'lucide:chart-line',
    label: t('admin.nav.analytics'),
  },
  {
    to: '/admin/settings',
    icon: 'lucide:settings',
    label: t('admin.nav.settings'),
  },
  {
    to: '/admin/notifications',
    icon: 'lucide:bell',
    label: t('admin.nav.notifications'),
  },
])

function current(to: string) {
  return to === '/admin' ? route.path === '/admin' : route.path.startsWith(to)
}
</script>

<template>
  <div class="shell">
    <aside class="side">
      <p class="brand">{{ t('admin.title') }}</p>
      <nav class="nav" :aria-label="t('admin.nav.label')">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          class="link"
          :class="{ active: current(link.to) }"
          :to="link.to"
          :aria-current="current(link.to) ? 'page' : undefined"
        >
          <Icon :name="link.icon" size="1.1rem" aria-hidden="true" />
          <span>{{ link.label }}</span>
        </NuxtLink>
      </nav>
      <NuxtLink class="link back" to="/">
        <Icon name="lucide:arrow-left" size="1.1rem" aria-hidden="true" />
        <span>{{ t('admin.back') }}</span>
      </NuxtLink>
    </aside>

    <div class="body">
      <header class="top">
        <div v-if="state === 'ready'" class="account">
          <span
            class="email"
            :title="email"
            :aria-label="`${t('admin.email')}: ${email}`"
          >{{ email }}</span>
          <button type="button" class="signout" @click="signOut">
            {{ t('admin.signOut') }}
          </button>
        </div>
      </header>
      <div class="content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.shell {
  height: 100vh;
  height: 100dvh;
  display: flex;
  overflow: hidden;
}
.side {
  flex: 0 0 15rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem 0.75rem;
  border-inline-end: 1px solid var(--border);
  background: var(--surface);
  overflow-y: auto;
}
.brand {
  margin: 0 0 0.5rem;
  padding: 0 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.7;
}
.nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.6rem;
  border-radius: 8px;
  color: var(--fg);
  font-size: 0.9rem;
  text-decoration: none;
}
.link:hover {
  background: var(--surface-2);
}
.link.active {
  background: var(--primary);
  color: var(--primary-fg);
  font-weight: 700;
}
.back {
  margin-top: auto;
  color: var(--muted);
}
.body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.top {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-height: 3.25rem;
  padding: 0 1.25rem;
  border-bottom: 1px solid var(--border);
}
.account {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}
.email {
  font-size: 0.85rem;
  opacity: 0.8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.signout {
  font: inherit;
  font-size: 0.85rem;
  min-height: var(--control-h);
  padding: 0 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--fg);
  cursor: pointer;
}
.content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.5rem 1.25rem 3rem;
}
@media (max-width: 720px) {
  .shell {
    flex-direction: column;
  }
  .side {
    flex: 0 0 auto;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-inline-end: none;
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
  }
  .brand {
    display: none;
  }
  .nav {
    flex-direction: row;
  }
  .link {
    white-space: nowrap;
  }
  .back {
    margin-top: 0;
    margin-inline-start: auto;
  }
  .content {
    padding: 1rem 0.75rem 3rem;
  }
}
</style>
