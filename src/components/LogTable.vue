<script setup lang="ts">
import { ref } from 'vue'
import type { Log } from '../types/log'
import LevelBadge from './LevelBadge.vue'
import { formatDuration, formatTime, describeStatus } from '../utils/format'

defineProps<{
  logs: Log[]
  selectedId?: string
  /** zone de défilement propre (liste complète) ; sinon la table suit la page */
  scrollable?: boolean
}>()
const emit = defineEmits<{
  /** true quand l'utilisateur a quitté le haut de la liste, false quand il y revient */
  scrolled: [away: boolean]
  select: [log: Log]
}>()

// Les nouveaux logs arrivent en haut : au-delà de ce seuil, on considère que l'utilisateur lit
const AWAY_PX = 40

const wrap = ref<HTMLElement>()
let away = false

function onScroll() {
  const top = wrap.value?.scrollTop ?? 0
  const now = away ? top > 0 : top > AWAY_PX
  if (now !== away) {
    away = now
    emit('scrolled', away)
  }
}

function scrollToTop() {
  wrap.value?.scrollTo({ top: 0 })
}
defineExpose({ scrollToTop })

function onRowKey(event: KeyboardEvent, log: Log) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  emit('select', log)
}
</script>

<template>
  <div ref="wrap" class="wrap" :class="{ scrollable }" @scroll.passive="onScroll">
    <table aria-label="Logs (Entrée ou clic sur une ligne pour le détail)">
      <thead>
        <tr>
          <th>Heure</th>
          <th>Niveau</th>
          <th>Service</th>
          <th>Message</th>
          <th class="num">Durée</th>
          <th>Statut HTTP</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="log in logs"
          :key="log.id"
          :class="[`level-${log.level}`, { selected: log.id === selectedId }]"
          tabindex="0"
          @click="emit('select', log)"
          @keydown="onRowKey($event, log)"
        >
          <td class="time">{{ formatTime(log.timestamp) }}</td>
          <td><LevelBadge :level="log.level" /></td>
          <td>{{ log.service }}</td>
          <td>{{ log.message }}</td>
          <td class="num">{{ formatDuration(log.duration_ms) }}</td>
          <td>
            <span class="status" :title="describeStatus(log.metadata.http_status)">
              {{ log.metadata.http_status }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="$slots.footer" class="footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.wrap {
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 6px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--bg);
  text-align: left;
  color: var(--muted);
  font-weight: 600;
  padding: 0.4rem 0.6rem;
  border-bottom: 2px solid var(--border);
  white-space: nowrap;
}
td {
  padding: 0.35rem 0.6rem;
  border-bottom: 1px solid var(--border);
}
td:first-child {
  border-left: 4px solid var(--c);
}
.time,
.num {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.time {
  color: var(--muted);
}
.num {
  text-align: right;
}
.status {
  padding: 0.05em 0.5em;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.wrap.scrollable {
  max-height: 70vh;
}
.footer {
  padding: 0.75rem;
  text-align: center;
}
tbody tr {
  cursor: pointer;
}
tbody tr:hover td {
  background: color-mix(in srgb, var(--text) 5%, transparent);
}
tbody tr:focus-visible {
  outline: 2px solid var(--level-info);
  outline-offset: -2px;
}
tr.selected td {
  background: color-mix(in srgb, var(--level-info) 12%, transparent);
}

/* --c : couleur de la barre à gauche de chaque ligne */
tr.level-debug {
  --c: var(--level-debug);
}
tr.level-info {
  --c: var(--level-info);
}
tr.level-warning {
  --c: var(--level-warning);
}
tr.level-error {
  --c: var(--level-error);
  background: color-mix(in srgb, var(--level-error) 10%, transparent);
}
tr.level-critical {
  --c: var(--level-critical);
  background: color-mix(in srgb, var(--level-critical) 15%, transparent);
}
</style>
