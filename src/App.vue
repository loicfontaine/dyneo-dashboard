<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useLogStream } from './composables/useLogStream'
import { usePausable } from './composables/usePausable'
import { filterLogs } from './utils/filterLogs'
import { LEVELS, type Level } from './types/log'
import StatusBar from './components/StatusBar.vue'
import LevelFilter from './components/LevelFilter.vue'
import LogToolbar from './components/LogToolbar.vue'
import LogTable from './components/LogTable.vue'
import '@/assets/main.css'

const API_URL = import.meta.env.VITE_API_URL
const MAX_VISIBLE = 100

// Le paramètre tail est ajouté par le composable (et adapté après une coupure)
const { logs, status, ignored, ratePerSecond, silenceSeconds, retryIn, reconnectNow } =
  useLogStream({ url: `${API_URL}/logs/stream?life=0` })

// Les compteurs portent sur le flux en direct : ils continuent pendant la pause
// et ne dépendent pas des filtres.
const counts = computed(() => {
  const result = Object.fromEntries(LEVELS.map((l) => [l, 0])) as Record<Level, number>
  for (const log of logs.value) result[log.level]++
  return result
})

// Liste des services (non documentée par l'API) construite depuis les données.
// Elle ne change que lorsqu'un nouveau service apparaît : le menu n'est pas redessiné
// à chaque mise à jour du flux.
const services = ref<string[]>([])
watch(logs, (list) => {
  const known = new Set(services.value)
  const before = known.size
  for (const log of list) known.add(log.service)
  if (known.size !== before) services.value = [...known].sort()
})

const levels = ref<Level[]>([...LEVELS])
const service = ref('')
const search = ref('')

const { displayed, paused, missed, toggle } = usePausable(logs)

const filtered = computed(() =>
  filterLogs(displayed.value, {
    levels: levels.value,
    service: service.value,
    search: search.value,
  }),
)
const visible = computed(() => filtered.value.slice(0, MAX_VISIBLE))

function resetFilters() {
  levels.value = [...LEVELS]
  service.value = ''
  search.value = ''
}
</script>

<template>
  <h1>Logs</h1>

  <StatusBar
    :status="status"
    :rate="ratePerSecond"
    :silence="silenceSeconds"
    :retry-in="retryIn"
    :total="logs.length"
    :ignored="ignored"
    @reconnect="reconnectNow"
  />

  <LevelFilter v-model="levels" :counts="counts" />

  <LogToolbar
    v-model:search="search"
    v-model:service="service"
    :services="services"
    :paused="paused"
    @toggle="toggle"
  />

  <p class="note">
    {{ filtered.length }} logs correspondent · {{ visible.length }} affichés
    <template v-if="paused"> · en pause : {{ missed }} nouveaux logs depuis la pause</template>
  </p>

  <LogTable v-if="visible.length" :logs="visible" />
  <p v-else-if="logs.length === 0" class="empty">En attente des premiers logs…</p>
  <p v-else class="empty">
    Aucun log ne correspond aux filtres.
    <button type="button" @click="resetFilters">Réinitialiser les filtres</button>
  </p>
</template>

<style scoped>
.note {
  color: var(--muted);
  font-size: 0.9rem;
}
.empty {
  padding: 2rem;
  text-align: center;
  color: var(--muted);
}
</style>
