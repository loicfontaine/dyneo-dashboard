<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { LEVELS, type Level, type Log } from '../types/log'
import { usePausable } from '../composables/usePausable'
import { filterLogs } from '../utils/filterLogs'
import { formatTime } from '../utils/format'
import LevelFilter from './LevelFilter.vue'
import LogToolbar from './LogToolbar.vue'
import LogTable from './LogTable.vue'

const props = defineProps<{ logs: Log[]; services: string[]; selectedId?: string }>()
const emit = defineEmits<{ select: [log: Log] }>()

const levels = defineModel<Level[]>('levels', { required: true })
const service = defineModel<string>('service', { required: true })
const search = defineModel<string>('search', { required: true })

const PAGE = 100

const { displayed, paused, pausedBy, missed, pause, resume } = usePausable(toRef(props, 'logs'))

// Compteurs par niveau sur les logs qui correspondent au service et à la recherche :
// ils disent combien de lignes on obtiendrait en cochant chaque niveau.
const counts = computed(() => {
  const result = Object.fromEntries(LEVELS.map((l) => [l, 0])) as Record<Level, number>
  const matching = filterLogs(displayed.value, {
    levels: [...LEVELS],
    service: service.value,
    search: search.value,
  })
  for (const log of matching) result[log.level]++
  return result
})

const filtered = computed(() =>
  filterLogs(displayed.value, {
    levels: levels.value,
    service: service.value,
    search: search.value,
  }),
)

const limit = ref(PAGE)
const visible = computed(() => filtered.value.slice(0, limit.value))
const oldest = computed(() => displayed.value[displayed.value.length - 1])

const table = ref<InstanceType<typeof LogTable>>()

// Les nouveaux logs arrivent en haut : quand l'utilisateur fait défiler la liste pour lire,
// on gèle l'affichage ; il reprend tout seul quand il revient en haut.
function onTableScrolled(away: boolean) {
  if (away) pause('scroll')
  else if (pausedBy.value === 'scroll') resume()
}

function togglePause() {
  if (!paused.value) return pause('user')
  resume()
  limit.value = PAGE
  table.value?.scrollToTop()
}

// Changer de filtre change la liste : on repart du haut, en direct
watch([levels, service, search], () => {
  if (pausedBy.value === 'scroll') resume()
  limit.value = PAGE
  table.value?.scrollToTop()
})

const filtersActive = computed(
  () => levels.value.length > 0 || service.value !== '' || search.value.trim() !== '',
)

function resetFilters() {
  levels.value = []
  service.value = ''
  search.value = ''
}
</script>

<template>
  <div>
    <!-- Collant : filtres et bouton Reprendre restent visibles si la page défile -->
    <div class="controls">
      <LevelFilter v-model="levels" :counts="counts" />

      <LogToolbar
        v-model:search="search"
        v-model:service="service"
        :services="services"
        :paused="paused"
        :filters-active="filtersActive"
        @toggle="togglePause"
        @reset="resetFilters"
      />

      <p class="note">
        {{ filtered.length }} logs
        <template v-if="oldest">depuis {{ formatTime(oldest.timestamp) }}</template>
        <template v-if="pausedBy === 'scroll'">
          · pause pendant la lecture : {{ missed }} nouveaux (revenez en haut ou cliquez sur
          Reprendre)
        </template>
        <template v-else-if="paused"> · en pause : {{ missed }} nouveaux depuis la pause</template>
      </p>
    </div>

    <LogTable
      v-if="visible.length"
      ref="table"
      scrollable
      :logs="visible"
      :selected-id="selectedId"
      @scrolled="onTableScrolled"
      @select="emit('select', $event)"
    >
      <template v-if="filtered.length > visible.length" #footer>
        <button type="button" @click="limit += PAGE">
          Afficher {{ Math.min(PAGE, filtered.length - visible.length) }} logs plus anciens
        </button>
      </template>
    </LogTable>
    <p v-else-if="logs.length === 0" class="empty">En attente des premiers logs…</p>
    <p v-else class="empty">
      Aucun log ne correspond aux filtres.
      <button type="button" @click="resetFilters">Réinitialiser les filtres</button>
    </p>
  </div>
</template>

<style scoped>
.controls {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--bg);
  padding-top: 0.25rem;
}
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
