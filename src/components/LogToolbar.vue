<script setup lang="ts">
const search = defineModel<string>('search', { required: true })
const service = defineModel<string>('service', { required: true })
defineProps<{ services: string[]; paused: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
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
