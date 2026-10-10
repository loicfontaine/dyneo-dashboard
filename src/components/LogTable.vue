<script setup lang="ts">
import type { Log } from '../types/log'
import LevelBadge from './LevelBadge.vue'
import { formatDuration, formatTime, describeStatus } from '../utils/format'

defineProps<{ logs: Log[] }>()
</script>

<template>
  <div class="wrap">
    <table>
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
        <tr v-for="log in logs" :key="log.id" :class="`level-${log.level}`">
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
  </div>
</template>

<style scoped>
.wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
th {
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
