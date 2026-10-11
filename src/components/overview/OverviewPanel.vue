<script setup lang="ts">
import { computed } from 'vue'
import type { Log } from '../../types/log.ts'
import {
  affectedUsers,
  bucketByTime,
  countByLevel,
  pickBucketMs,
  problemTrend,
  sampleRecent,
  summarize,
  topErrors,
  topProblemService,
  type IssueGroup,
} from '../../utils/stats'
import { formatSpan } from '../../utils/format.ts'
import KpiRow from './KpiRow.vue'
import VolumeChart from './VolumeChart.vue'
import TopErrors from './TopErrors.vue'
import LogTable from '../LogTable.vue'
import LevelDonut from './LevelDonut.vue'

const props = defineProps<{
  /** logs de la fenêtre observée */
  logs: Log[]
  windowMs: number
  selectedId?: string
}>()
const emit = defineEmits<{
  showGroup: [group: IssueGroup]
  showAll: []
  select: [log: Log]
  showService: [service: string]
}>()

const RECENT = 10
const SAMPLE_EVERY_MS = 5000 // un log non grave toutes les 5 s, sinon la liste défile trop vite

const summary = computed(() => summarize(props.logs))
const bucketMs = computed(() => pickBucketMs(summary.value.spanMs))
const buckets = computed(() => bucketByTime(props.logs, bucketMs.value))
const levelCounts = computed(() => countByLevel(props.logs))
const groups = computed(() => topErrors(props.logs))
const recent = computed(() => sampleRecent(props.logs, SAMPLE_EVERY_MS, RECENT))
const trend = computed(() => problemTrend(props.logs))
const topService = computed(() => topProblemService(props.logs))
const users = computed(() => affectedUsers(props.logs))

// Au démarrage, la mémoire peut couvrir moins que la fenêtre : on affiche la durée réelle
const period = computed(() =>
  summary.value.spanMs >= props.windowMs - 1000
    ? `Sur les ${Math.round(props.windowMs / 60_000)} dernières minutes`
    : `Depuis l'ouverture (${formatSpan(summary.value.spanMs)})`,
)
</script>

<template>
  <div class="overview">
    <p class="period">{{ period }}</p>
    <div class="summary">
      <LevelDonut :counts="levelCounts" />
      <KpiRow
        :summary="summary"
        :trend="trend"
        :top-service="topService"
        :users="users"
        @show-service="emit('showService', $event)"
      />
    </div>
    <VolumeChart v-if="buckets.length" :buckets="buckets" :bucket-ms="bucketMs" />
    <TopErrors :groups="groups" @select="emit('showGroup', $event)" />
    <section>
      <div class="heading">
        <div>
          <h2>Derniers logs</h2>
          <p class="hint">
            Toutes les erreurs et critiques, et un seul log des autres niveaux toutes les
            {{ SAMPLE_EVERY_MS / 1000 }} s. La liste complète est dans « Tous les logs ».
          </p>
        </div>
        <button type="button" @click="emit('showAll')">
          Voir tous les logs <span aria-hidden="true">→</span>
        </button>
      </div>
      <LogTable
        v-if="recent.length"
        :logs="recent"
        :selected-id="selectedId"
        @select="emit('select', $event)"
      />
    </section>
  </div>
</template>

<style scoped>
.overview {
  display: grid;
  gap: 1.5rem;
}
.summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem 2.5rem;
  align-items: start; /* titres alignés, donut et tuiles à la même hauteur (160 px) */
}
@media (max-width: 52rem) {
  .summary {
    grid-template-columns: minmax(0, 1fr);
  }
}
.period {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}
.heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
h2 {
  font-size: 1rem;
  margin: 0;
}
.hint {
  margin: 0.1rem 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}
</style>
