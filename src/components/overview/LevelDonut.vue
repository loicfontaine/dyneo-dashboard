<script setup lang="ts">
import { computed, ref } from 'vue'
import { LEVELS, type Level } from '../../types/log'
import { LEVEL_ICONS, LEVEL_LABELS, formatPercent } from '../../utils/format'

const props = defineProps<{ counts: Record<Level, number> }>()

// Donut en coordonnées internes (viewBox 100 × 100). Chaque niveau est un arc dessiné avec
// stroke-dasharray sur un même cercle ; GAP laisse un fin espace entre deux segments.
const R = 40
const STROKE = 14
const C = 2 * Math.PI * R
const GAP = 1.2

const total = computed(() => LEVELS.reduce((sum, l) => sum + props.counts[l], 0))

// Ordre fixe (celui des filtres), en partant de midi dans le sens des aiguilles d'une montre
const segments = computed(() => {
  let start = 0
  return LEVELS.map((level) => {
    const count = props.counts[level]
    const share = total.value ? count / total.value : 0
    const length = share * C
    const segment = {
      level,
      count,
      share,
      dash: `${Math.max(0, length - GAP)} ${C}`,
      offset: -start,
    }
    start += length
    return segment
  })
})

const hovered = ref<Level | null>(null)

const label = computed(
  () =>
    'Répartition par niveau : ' +
    segments.value
      .map((s) => `${LEVEL_LABELS[s.level]} ${s.count} (${formatPercent(s.share)})`)
      .join(', '),
)
</script>

<template>
  <figure class="donut">
    <figcaption>Répartition par niveau</figcaption>
    <div class="body">
      <svg viewBox="0 0 100 100" role="img" :aria-label="label">
        <g transform="rotate(-90 50 50)">
          <circle :cx="50" :cy="50" :r="R" class="track" :stroke-width="STROKE" />
          <circle
            v-for="s in segments"
            v-show="s.count > 0"
            :key="s.level"
            :cx="50"
            :cy="50"
            :r="R"
            :class="['segment', `level-${s.level}`, { dim: hovered && hovered !== s.level }]"
            :stroke-width="STROKE"
            :stroke-dasharray="s.dash"
            :stroke-dashoffset="s.offset"
            @pointerenter="hovered = s.level"
            @pointerleave="hovered = null"
          />
        </g>
        <text x="50" y="49" class="total">{{ total }}</text>
        <text x="50" y="60" class="unit">logs</text>
      </svg>

      <!-- La légende porte toutes les valeurs : le graphique n'est jamais lu par la couleur seule -->
      <table class="legend">
        <tbody>
          <tr
            v-for="s in segments"
            :key="s.level"
            :class="[`level-${s.level}`, { dim: hovered && hovered !== s.level }]"
            @pointerenter="hovered = s.level"
            @pointerleave="hovered = null"
          >
            <th scope="row">
              <i class="key" aria-hidden="true" />
              <span aria-hidden="true" class="icon">{{ LEVEL_ICONS[s.level] }}</span>
              {{ LEVEL_LABELS[s.level] }}
            </th>
            <td class="num">{{ s.count }}</td>
            <td class="num muted">{{ formatPercent(s.share) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </figure>
</template>

<style scoped>
.donut {
  margin: 0;
}
figcaption {
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.5rem;
}
svg {
  width: 150px;
  height: 150px;
  flex: none;
}
.track {
  fill: none;
  stroke: var(--border);
}
.segment {
  fill: none;
  stroke: var(--c);
  transition: opacity 0.15s;
}
.total {
  text-anchor: middle;
  font-size: 15px;
  font-weight: 600;
  fill: var(--text);
  font-variant-numeric: tabular-nums;
}
.unit {
  text-anchor: middle;
  font-size: 8px;
  fill: var(--muted);
}
.legend {
  border-collapse: collapse;
  font-size: 0.85rem;
}
.legend th {
  text-align: left;
  font-weight: 600;
  color: var(--text);
  padding: 0.15rem 0.75rem 0.15rem 0;
  white-space: nowrap;
}
.legend td {
  padding: 0.15rem 0 0.15rem 0.75rem;
}
.key {
  display: inline-block;
  width: 0.75em;
  height: 0.75em;
  border-radius: 2px;
  margin-right: 0.3em;
  background: var(--c);
  vertical-align: -0.05em;
}
.icon {
  color: var(--c);
  margin-right: 0.2em;
}
.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.muted {
  color: var(--muted);
}
.dim {
  opacity: 0.35;
}
.level-debug {
  --c: var(--level-debug);
}
.level-info {
  --c: var(--level-info);
}
.level-warning {
  --c: var(--level-warning);
}
.level-error {
  --c: var(--level-error);
}
.level-critical {
  --c: var(--level-critical);
}
</style>
