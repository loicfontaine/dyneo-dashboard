<script setup lang="ts">
import { computed } from 'vue'
import type { Summary, Trend } from '../../utils/stats'
import { formatPercent } from '../../utils/format'

const props = defineProps<{
  summary: Summary
  trend: Trend
  topService: { service: string; count: number; share: number } | null
  users: { affected: number; total: number }
}>()
const emit = defineEmits<{ showService: [service: string] }>()

// Tendance en texte + flèche, sans couleur d'alerte (le taux varie, on ne veut pas d'alarme)
const trendText = computed(() => {
  const { direction, current } = props.trend
  if (direction === null || current === null) return 'Tendance après 2 min de données'
  const last = `${formatPercent(current)} sur la dernière minute`
  if (direction === 'up') return `↑ ${last}`
  if (direction === 'down') return `↓ ${last}`
  return `→ stable sur la dernière minute`
})
</script>

<template>
  <section class="kpis" aria-labelledby="kpis-title">
    <h3 id="kpis-title">Problèmes</h3>
    <dl>
      <div class="kpi">
        <dt>Taux</dt>
        <dd>
          <span class="value">{{
            summary.issueRate === null ? '—' : formatPercent(summary.issueRate)
          }}</span>
          <span class="sub">{{ trendText }}</span>
        </dd>
      </div>
      <div class="kpi">
        <dt>Nombre</dt>
        <dd>
          <span class="value">{{ summary.issues }}</span>
          <span class="sub">Erreur + Critique</span>
        </dd>
      </div>
      <div class="kpi">
        <dt>Service le plus touché</dt>
        <dd v-if="topService">
          <button
            type="button"
            class="value service"
            :title="`Voir les problèmes de ${topService.service}`"
            @click="emit('showService', topService.service)"
          >
            {{ topService.service }}
          </button>
          <span class="sub">{{ formatPercent(topService.share) }} des problèmes</span>
        </dd>
        <dd v-else><span class="value">—</span></dd>
      </div>
      <div class="kpi">
        <dt>Utilisateurs touchés</dt>
        <dd>
          <span class="value">{{ users.affected }}</span>
          <span class="sub">sur {{ users.total }} actifs</span>
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}
/* Même hauteur que le donut (160 px) : deux rangées de tuiles */
dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(0, 1fr);
  gap: 0.5rem;
  height: 160px;
  max-width: 32rem;
  margin: 0;
}
.kpi {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
}
dt {
  color: var(--muted);
  font-size: 0.8rem;
}
dd {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin: 0;
}
.value {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.service {
  padding: 0;
  border: none;
  background: none;
  text-align: left;
  color: var(--level-info);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.sub {
  color: var(--muted);
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 52rem) {
  dl {
    height: auto;
  }
}
</style>
