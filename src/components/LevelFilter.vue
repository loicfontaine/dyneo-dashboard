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
  <div class="chips" role="group" aria-label="Filtrer par niveau">
    <button
      v-for="level in LEVELS"
      :key="level"
      type="button"
      class="chip"
      :class="[`level-${level}`, { off: !selected.includes(level) }]"
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
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  padding: 0.25em 0.8em;
  border: 1px solid currentColor;
  border-radius: 999px;
  background: transparent;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.chip strong {
  font-variant-numeric: tabular-nums;
}
.chip.off {
  opacity: 0.45;
  border-style: dashed;
}
.chip:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
.level-debug {
  color: var(--level-debug);
}
.level-info {
  color: var(--level-info);
}
.level-warning {
  color: var(--level-warning);
}
.level-error {
  color: var(--level-error);
}
.level-critical {
  color: var(--level-critical);
}
</style>
