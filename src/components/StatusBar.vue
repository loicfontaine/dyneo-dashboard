<script setup lang="ts">
import { computed } from 'vue'
import type { ConnectionStatus } from '../composables/useLogStream'

const props = defineProps<{
  status: ConnectionStatus
  rate: number
  silence: number | null
  retryIn: number | null
  total: number
  ignored: number
}>()
const emit = defineEmits<{ reconnect: [] }>()

const LABELS: Record<ConnectionStatus, string> = {
  connexion: 'Connexion…',
  connecté: 'Connecté',
  reconnexion: 'Reconnexion…',
}
const ICONS: Record<ConnectionStatus, string> = {
  connexion: '◌',
  connecté: '●',
  reconnexion: '⟳',
}

// Des silences de 1 à 2 s sont normaux sur cette API (mesuré) : seuil large, libellé neutre
const quiet = computed(
  () => props.status === 'connecté' && props.silence !== null && props.silence >= 15,
)
</script>

<template>
  <div class="bar">
    <span class="pill" :class="status">
      <span aria-hidden="true">{{ ICONS[status] }}</span> {{ LABELS[status] }}
    </span>
    <span v-if="status === 'reconnexion'">
      {{ retryIn ? `Nouvelle tentative dans ${retryIn} s` : 'Tentative en cours…' }}
      <button type="button" class="retry" @click="emit('reconnect')">Réessayer maintenant</button>
    </span>
    <span>{{ rate.toFixed(1) }} logs/s <small>(moyenne sur 10 s)</small></span>
    <span>{{ total }} logs en mémoire</span>
    <span v-if="ignored > 0">{{ ignored }} lignes illisibles ignorées</span>
    <strong v-if="quiet">Aucun log reçu depuis {{ silence }} s</strong>
    <span v-else-if="status !== 'connecté' && silence !== null">
      Dernier log reçu il y a {{ silence }} s
    </span>
  </div>
</template>

<style scoped>
.bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.5rem;
  align-items: center;
  color: var(--muted);
  font-size: 0.9rem;
}
.pill { font-weight: 600; }
.pill.connecté { color: var(--ok); }
.retry { margin-left: 0.5rem; font-size: 0.85rem; padding: 0.15em 0.6em; }
small { opacity: 0.8; }
</style>
