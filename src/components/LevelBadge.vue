<script setup lang="ts">
import type { Level } from '../types/log'
import { LEVEL_ICONS, LEVEL_LABELS } from '../utils/format'

defineProps<{ level: Level }>()
</script>

<template>
  <span class="badge" :class="`level-${level}`">
    <span aria-hidden="true">{{ LEVEL_ICONS[level] }}</span>
    {{ LEVEL_LABELS[level] }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  padding: 0.1em 0.6em;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
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
