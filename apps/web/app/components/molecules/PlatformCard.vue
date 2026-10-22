<template>
  <article class="platform-card" :class="{ soon: status === 'soon' }">
    <header class="head">
      <h2 class="name">{{ name }}</h2>
      <span class="status">{{ statusLabel }}</span>
    </header>
    <p class="description">{{ description }}</p>
    <ScreenshotZoom
      v-if="screenshot"
      :src="screenshot"
      :alt="screenshotAlt ?? name"
      :zoom-label="zoomLabel"
      :close-label="closeLabel"
      :zoom-in-label="zoomInLabel"
      :zoom-out-label="zoomOutLabel"
    />
    <div v-if="command" class="command-block">
      <span class="command-label">{{ commandLabel }}</span>
      <div class="command-row">
        <code class="command">{{ command }}</code>
        <button type="button" class="copy" @click="copyCommand">
          <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" aria-hidden="true" />
          {{ copied ? copiedLabel : copyLabel }}
        </button>
      </div>
    </div>
    <div v-if="href || storeHref" class="actions">
      <a v-if="href" class="action" :href="href" rel="noopener">
        <Icon name="lucide:download" aria-hidden="true" />
        {{ actionLabel }}
      </a>
      <a
        v-if="storeHref"
        class="action secondary"
        :href="storeHref"
        rel="noopener"
      >
        <Icon name="lucide:store" aria-hidden="true" />
        {{ storeLabel }}
      </a>
    </div>
    <p v-else class="action disabled" aria-disabled="true">{{ actionLabel }}</p>
  </article>
</template>

<script setup lang="ts">
// specs/web/spec.md — molecule: one platform on the downloads page. A terminal
// install command is shown with a copy button; the shell owns the clipboard.
import { ref } from 'vue'
import ScreenshotZoom from './ScreenshotZoom.vue'

const props = withDefaults(
  defineProps<{
    name: string
    description: string
    status: 'available' | 'soon'
    statusLabel: string
    actionLabel: string
    href?: string
    storeLabel?: string
    storeHref?: string
    command?: string
    screenshot?: string
    screenshotAlt?: string
    commandLabel?: string
    copyLabel?: string
    copiedLabel?: string
    zoomLabel?: string
    closeLabel?: string
    zoomInLabel?: string
    zoomOutLabel?: string
  }>(),
  {
    href: undefined,
    storeLabel: undefined,
    storeHref: undefined,
    command: undefined,
    screenshot: undefined,
    screenshotAlt: undefined,
    commandLabel: 'Terminal',
    copyLabel: 'Copy',
    copiedLabel: 'Copied',
    zoomLabel: 'Open full size',
    closeLabel: 'Close',
    zoomInLabel: 'Click to zoom in',
    zoomOutLabel: 'Click to zoom out',
  },
)

const emit = defineEmits<{ copy: [command: string] }>()
const copied = ref(false)

function copyCommand() {
  emit('copy', props.command!)
  copied.value = true
  setTimeout(() => (copied.value = false), 2_000)
}
</script>

<style scoped>
.platform-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}
.name {
  margin: 0;
  font-size: 1rem;
}
.status {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--primary);
  color: var(--primary);
  white-space: nowrap;
}
.description {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.8;
}
.command-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.command-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.6;
}
.command-row {
  display: flex;
  align-items: stretch;
  gap: 0.4rem;
}
.command {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  white-space: nowrap;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-alt, rgba(0, 0, 0, 0.04));
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
}
.copy {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.action {
  align-self: flex-start;
  font: inherit;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 700;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  text-decoration: none;
  background: var(--primary);
  color: var(--primary-fg);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.action.secondary {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
}
.action.disabled {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
  cursor: not-allowed;
}
.platform-card.soon {
  opacity: 0.75;
}
</style>
