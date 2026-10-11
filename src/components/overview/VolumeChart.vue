<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Bucket } from '../../utils/stats'
import { formatPercent, formatSpan } from '../../utils/format'

const props = defineProps<{ buckets: Bucket[]; bucketMs: number }>()

// Coordonnées internes : le SVG est étiré en largeur (preserveAspectRatio="none"),
// les textes sont en HTML autour pour ne pas être déformés.
const W = 600
const H_VOLUME = 120
const GAP = 2 // espace entre les barres

const timeFormat = new Intl.DateTimeFormat('fr-CH', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

const step = computed(() => W / Math.max(1, props.buckets.length))
const maxTotal = computed(() => Math.max(1, ...props.buckets.map((b) => b.total)))

const bars = computed(() =>
  props.buckets.map((b, i) => {
    const x = i * step.value + GAP / 2
    const width = Math.max(1, step.value - GAP)
    const hTotal = (b.total / maxTotal.value) * H_VOLUME
    const hIssues = (b.issues / maxTotal.value) * H_VOLUME
    return { x, width, hTotal, hIssues, ongoing: b.ongoing }
  }),
)

const hovered = ref<number | null>(null)
const active = computed(() => (hovered.value === null ? null : props.buckets[hovered.value]))

function onPointer(event: PointerEvent) {
  const el = event.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const i = Math.floor(((event.clientX - rect.left) / rect.width) * props.buckets.length)
  hovered.value = Math.min(props.buckets.length - 1, Math.max(0, i))
}

// Au clavier : flèches gauche/droite pour parcourir les tranches
function onKey(event: KeyboardEvent) {
  const n = props.buckets.length
  if (!n) return
  if (event.key === 'ArrowRight') hovered.value = Math.min(n - 1, (hovered.value ?? -1) + 1)
  else if (event.key === 'ArrowLeft') hovered.value = Math.max(0, (hovered.value ?? n) - 1)
  else if (event.key === 'Escape') hovered.value = null
  else return
  event.preventDefault()
}

const tooltipLeft = computed(() =>
  hovered.value === null ? 0 : ((hovered.value + 0.5) / props.buckets.length) * 100,
)

function range(b: Bucket): string {
  return `${timeFormat.format(b.start)} – ${timeFormat.format(b.start + props.bucketMs)}`
}

const first = computed(() => props.buckets[0])
const last = computed(() => props.buckets[props.buckets.length - 1])

const summary = computed(() => {
  const totals = props.buckets.map((b) => b.total)
  if (!totals.length) return 'Pas encore de données'
  return (
    `Volume par tranches de ${formatSpan(props.bucketMs)} : ` +
    `de ${Math.min(...totals)} à ${Math.max(...totals)} logs par tranche. ` +
    `Utilisez les flèches gauche et droite pour lire chaque tranche.`
  )
})
</script>

<template>
  <figure class="chart">
    <figcaption>
      <span class="title">Volume de logs</span>
      <span class="legend">
        <span><i class="key key-issues" aria-hidden="true" /> Problèmes (error + critical)</span>
        <span><i class="key key-other" aria-hidden="true" /> Autres niveaux</span>
        <span class="muted">Tranches de {{ formatSpan(bucketMs) }}, selon l'heure du log</span>
      </span>
    </figcaption>

    <div
      class="plot"
      tabindex="0"
      role="img"
      :aria-label="summary"
      @pointermove="onPointer"
      @pointerleave="hovered = null"
      @keydown="onKey"
      @blur="hovered = null"
    >
      <div class="axis-y" aria-hidden="true">
        <span>{{ maxTotal }}</span>
        <span>0</span>
      </div>
      <svg :viewBox="`0 0 ${W} ${H_VOLUME}`" preserveAspectRatio="none" class="volume">
        <line :x1="0" :x2="W" :y1="H_VOLUME" :y2="H_VOLUME" class="baseline" />
        <g
          v-for="(bar, i) in bars"
          :key="i"
          :class="{ ongoing: bar.ongoing, hovered: hovered === i }"
        >
          <rect
            class="other"
            :x="bar.x"
            :y="H_VOLUME - bar.hTotal"
            :width="bar.width"
            :height="Math.max(0, bar.hTotal - bar.hIssues - (bar.hIssues > 0 ? GAP : 0))"
          />
          <rect
            class="issues"
            :x="bar.x"
            :y="H_VOLUME - bar.hIssues"
            :width="bar.width"
            :height="bar.hIssues"
          />
        </g>
      </svg>

      <div class="axis-x" aria-hidden="true">
        <span v-if="first">{{ timeFormat.format(first.start) }}</span>
        <span v-if="last">{{ timeFormat.format(last.start + bucketMs) }}</span>
      </div>

      <div
        v-if="active"
        class="tooltip"
        role="status"
        :style="{ left: `${tooltipLeft}%` }"
        :class="{ flip: tooltipLeft > 60 }"
      >
        <div class="muted">
          {{ range(active) }}<template v-if="active.ongoing"> · en cours</template>
        </div>
        <div>
          <strong>{{ active.total }}</strong> logs
        </div>
        <div>
          <strong>{{ active.issues }}</strong> problèmes
        </div>
        <div>
          <strong>{{ active.issueRate === null ? '—' : formatPercent(active.issueRate) }}</strong>
          taux de problèmes
        </div>
      </div>
    </div>
  </figure>
</template>

<style scoped>
.chart {
  margin: 0;
}
figcaption {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1.5rem;
  align-items: baseline;
  margin-bottom: 0.5rem;
}
.title {
  font-weight: 600;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  font-size: 0.85rem;
}
.muted {
  color: var(--muted);
}
.key {
  display: inline-block;
  width: 0.75em;
  height: 0.75em;
  border-radius: 2px;
  vertical-align: -0.05em;
}
.key-issues {
  background: var(--level-error);
}
.key-other {
  background: var(--muted);
}
.plot {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 0.5rem;
  border-radius: 4px;
}
.plot:focus-visible {
  outline: 2px solid var(--level-info);
  outline-offset: 4px;
}
.plot svg {
  grid-column: 2;
  width: 100%;
  display: block;
}
.volume {
  height: 120px;
}

.axis-y {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: right;
  font-size: 0.75rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.axis-x {
  grid-column: 2;
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.baseline {
  stroke: var(--border);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.other {
  fill: var(--muted);
  opacity: 0.55;
}
.issues {
  fill: var(--level-error);
}
.ongoing rect {
  opacity: 0.35;
}
.hovered rect {
  opacity: 1;
}
.hovered .other {
  opacity: 0.8;
}
.rate-line {
  fill: none;
  stroke: var(--level-error);
  stroke-width: 2;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.tooltip {
  position: absolute;
  top: 0;
  transform: translateX(0.75rem);
  padding: 0.4rem 0.6rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 15%);
  font-size: 0.8rem;
  white-space: nowrap;
  pointer-events: none;
  font-variant-numeric: tabular-nums;
}
.tooltip.flip {
  transform: translateX(calc(-100% - 0.75rem));
}
</style>
