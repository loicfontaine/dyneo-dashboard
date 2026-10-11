<script setup lang="ts">
import { LEVELS, type Level } from '../types/log'
import { LEVEL_ICONS, LEVEL_LABELS } from '../utils/format'

const selected = defineModel<Level[]>({ required: true })
defineProps<{ counts: Record<Level, number> }>()

function toggle(level: Level) {
  selected.value = selected.value.includes(level)
    ? selected.value.filter((l) => l !== level)
    : [...selected.value, level]
}
</script>

<template>
  <div class="chips" role="group" aria-label="Filtrer par niveau (aucun choisi : tous les niveaux)">
    <button
      v-for="level in LEVELS"
      :key="level"
      type="button"
      class="chip"
      :class="[`level-${level}`, { on: selected.includes(level) }]"
      :aria-pressed="selected.includes(level)"
      @click="toggle(level)"
    >
      <span aria-hidden="true">{{ LEVEL_ICONS[level] }}</span>
      {{ LEVEL_LABELS[level] }}
      <strong>{{ counts[level] }}</strong>
    </button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}
/* --c : couleur du niveau. Par défaut le bouton est en contour ; choisi, il est rempli. */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.25em 0.8em;
  border: 1px solid var(--c);
  border-radius: 999px;
  background: transparent;
  color: var(--c);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.chip:hover {
  background: color-mix(in srgb, var(--c) 10%, transparent);
}
.chip.on {
  background: var(--c);
  color: var(--bg); /* contraste vérifié ≥ 4,8:1 pour chaque niveau, en clair et en sombre */
}
.chip strong {
  font-variant-numeric: tabular-nums;
}
.chip:focus-visible {
  outline: 2px solid var(--c);
  outline-offset: 2px;
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
