<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Log } from '../types/log'
import LevelBadge from './LevelBadge.vue'
import { describeStatus, formatDuration, formatTime } from '../utils/format'

const props = defineProps<{ log: Log }>()
const emit = defineEmits<{ close: [] }>()

const closeButton = ref<HTMLButtonElement>()

// Le focus va dans le panneau à l'ouverture et à chaque changement de log
watch(
  () => props.log.id,
  () => nextTick(() => closeButton.value?.focus()),
  { immediate: true },
)

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <aside class="panel" aria-labelledby="detail-title">
    <header>
      <h2 id="detail-title">Détail du log</h2>
      <button ref="closeButton" type="button" @click="emit('close')">
        Fermer <span aria-hidden="true">✕</span>
      </button>
    </header>

    <dl>
      <dt>Heure</dt>
      <dd>
        {{ formatTime(log.timestamp) }}
        <small>{{ log.timestamp }}</small>
      </dd>
      <dt>Niveau</dt>
      <dd><LevelBadge :level="log.level" /></dd>
      <dt>Service</dt>
      <dd>{{ log.service }}</dd>
      <dt>Message</dt>
      <dd>{{ log.message }}</dd>
      <dt>Durée</dt>
      <dd>{{ formatDuration(log.duration_ms) }}</dd>
      <dt>Statut HTTP</dt>
      <dd>{{ log.metadata.http_status }} · {{ describeStatus(log.metadata.http_status) }}</dd>
      <dt>request_id</dt>
      <dd>
        <code>{{ log.metadata.request_id }}</code>
      </dd>
      <dt>user_id</dt>
      <dd>
        <code>{{ log.metadata.user_id }}</code>
      </dd>
      <dt>id</dt>
      <dd>
        <code>{{ log.id }}</code>
      </dd>
    </dl>

    <details>
      <summary>JSON brut</summary>
      <pre>{{ JSON.stringify(log, null, 2) }}</pre>
    </details>
  </aside>
</template>

<style scoped>
.panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  width: min(26rem, 100vw);
  overflow-y: auto;
  padding: 1rem 1.25rem;
  background: var(--bg);
  border-left: 1px solid var(--border);
  box-shadow: -4px 0 16px rgb(0 0 0 / 15%);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
h2 {
  font-size: 1.1rem;
  margin: 0;
}
dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem 1rem;
  margin: 1rem 0;
}
dt {
  color: var(--muted);
  font-size: 0.85rem;
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
}
small {
  display: block;
  color: var(--muted);
  font-size: 0.75rem;
}
pre {
  font-size: 0.8rem;
  overflow-x: auto;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
}
</style>
