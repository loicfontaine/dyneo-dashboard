<script setup lang="ts">
import { ref, watch, shallowRef, computed, onMounted, onUnmounted } from 'vue'
import { useLogStream } from './composables/useLogStream'
import { isIssue, lastWindow, type IssueGroup } from './utils/stats'
import { LEVELS, type Level, type Log } from './types/log'
import StatusBar from './components/StatusBar.vue'
import OverviewPanel from './components/overview/OverviewPanel.vue'
import LogsPanel from './components/logs/LogsPanel.vue'
import LogDetail from './components/LogDetail.vue'

import '@/assets/main.css'

const API_URL = import.meta.env.VITE_API_URL
const WINDOW_MS = 5 * 60_000 // la vue d'ensemble porte sur les 5 dernières minutes

// Le paramètre tail est ajouté par le composable (et adapté après une coupure)
const { logs, status, ignored, ratePerSecond, silenceSeconds, retryIn, reconnectNow } =
  useLogStream({ url: `${API_URL}/logs/stream`, tail: 4000, max: 10_000 })

const windowLogs = computed(() => lastWindow(logs.value, WINDOW_MS))

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

// Onglets, reflétés dans l'URL (#logs) : le bouton Retour et les liens fonctionnent
type Tab = 'overview' | 'logs'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'logs', label: 'Tous les logs' },
]

const onPopState = () => (tab.value = tabFromUrl())
onMounted(() => window.addEventListener('popstate', onPopState))
onUnmounted(() => window.removeEventListener('popstate', onPopState))

const tabFromUrl = (): Tab => (location.hash === '#logs' ? 'logs' : 'overview')
const tab = ref<Tab>(tabFromUrl())

function openTab(next: Tab) {
  if (next === tab.value) return
  tab.value = next
  history.pushState(null, '', next === 'logs' ? '#logs' : location.pathname + location.search)
  window.scrollTo({ top: 0 })
}

function showGroup(group: IssueGroup) {
  levels.value = [group.level]
  service.value = ''
  search.value = group.message
  openTab('logs')
}

// Service le plus touché : ses problèmes uniquement
function showService(name: string) {
  levels.value = LEVELS.filter(isIssue)
  service.value = name
  search.value = ''
  openTab('logs')
}

// Filtres de la liste : gardés ici pour que la vue d'ensemble puisse les régler.
// Aucun niveau choisi = tous les niveaux affichés.
const levels = ref<Level[]>([])
const service = ref('')
const search = ref('')

const selected = shallowRef<Log | null>(null)
</script>

<template>
  <h1>Logs</h1>
  <StatusBar
    :status="status"
    :rate="ratePerSecond"
    :silence="silenceSeconds"
    :retry-in="retryIn"
    :ignored="ignored"
    @reconnect="reconnectNow"
  />

  <div class="tabs" role="tablist" aria-label="Vues">
    <button
      v-for="t in TABS"
      :id="`tab-${t.id}`"
      :key="t.id"
      type="button"
      role="tab"
      :aria-selected="tab === t.id"
      :aria-controls="`panel-${t.id}`"
      :tabindex="tab === t.id ? 0 : -1"
      @click="openTab(t.id)"
    >
      {{ t.label }}
    </button>
  </div>
  <main :id="`panel-${tab}`" role="tabpanel" :aria-labelledby="`tab-${tab}`">
    <OverviewPanel
      v-if="tab === 'overview'"
      :logs="windowLogs"
      :window-ms="WINDOW_MS"
      :selected-id="selected?.id"
      @show-group="showGroup"
      @show-service="showService"
      @show-all="openTab('logs')"
      @select="selected = $event"
    />
    <LogsPanel
      v-else
      v-model:levels="levels"
      v-model:service="service"
      v-model:search="search"
      :logs="logs"
      :services="services"
      :selected-id="selected?.id"
      @select="selected = $event"
    />
  </main>
  <LogDetail v-if="selected" :log="selected" @close="selected = null" />
</template>

<style scoped>
h1 {
  margin: 0;
}
.tabs {
  display: flex;
  gap: 0.25rem;
  margin: 1.25rem 0;
  border-bottom: 1px solid var(--border);
}
.tabs button {
  margin-bottom: -1px;
  padding: 0.5em 1em;
  border: none;
  border-bottom: 3px solid transparent;
  border-radius: 0;
  background: none;
  color: var(--muted);
  font-weight: 600;
}
.tabs button[aria-selected='true'] {
  color: var(--text);
  border-bottom-color: var(--level-info);
}
.tabs button:focus-visible {
  outline: 2px solid var(--level-info);
  outline-offset: -2px;
}
</style>
