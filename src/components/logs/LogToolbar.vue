<script setup lang="ts">
const search = defineModel<string>('search', { required: true })
const service = defineModel<string>('service', { required: true })
const logDurationThresholdMs = defineModel<number | undefined>('logDurationThresholdMs', {
  required: false,
})
defineProps<{ services: string[]; paused: boolean; filtersActive: boolean }>()
const emit = defineEmits<{ toggle: []; reset: []; showSlowLogs: [] }>()
function onShowSlowLogs() {
  logDurationThresholdMs.value = logDurationThresholdMs.value === undefined ? 100 : undefined
}
</script>

<template>
  <div class="toolbar">
    <input
      v-model="search"
      type="search"
      placeholder="Rechercher (message, service, request_id)"
      aria-label="Rechercher"
    />
    <select v-model="service" aria-label="Filtrer par service">
      <option value="">Tous les services</option>
      <option v-for="s in services" :key="s" :value="s">{{ s }}</option>
    </select>
    <button type="button" :disabled="!filtersActive" @click="emit('reset')">
      ✕ Réinitialiser les filtres
    </button>
    <button type="button" @click="onShowSlowLogs">
      {{ logDurationThresholdMs ? 'Voir tous les logs' : 'voir les logs lents (≥ 100 ms)' }}
    </button>

    <button type="button" @click="emit('toggle')">
      {{ paused ? '▶ Reprendre' : '⏸ Pause' }}
    </button>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}
.toolbar input[type='search'] {
  flex: 1 1 16rem;
}
</style>
