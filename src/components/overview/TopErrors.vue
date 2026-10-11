<script setup lang="ts">
import type { IssueGroup } from '../../utils/stats'
import LevelBadge from '../LevelBadge.vue'
import { formatPercent, formatTime } from '../../utils/format'

defineProps<{ groups: IssueGroup[] }>()
const emit = defineEmits<{ select: [group: IssueGroup] }>()
</script>

<template>
  <section>
    <h2>Problèmes principaux</h2>
    <p v-if="!groups.length" class="muted">Aucun problème dans la période.</p>
    <div v-else class="wrap">
      <table>
        <thead>
          <tr>
            <th>Niveau</th>
            <th>Message</th>
            <th class="num">Nombre</th>
            <th class="num">Part</th>
            <th>Dernière</th>
            <th>Services</th>
            <th><span class="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in groups" :key="`${g.level}-${g.message}`">
            <td><LevelBadge :level="g.level" /></td>
            <td>{{ g.message }}</td>
            <td class="num">{{ g.count }}</td>
            <td class="num">{{ formatPercent(g.share) }}</td>
            <td class="num muted">{{ formatTime(g.last) }}</td>
            <td class="muted" :title="g.services.join(', ')">{{ g.services.length }}</td>
            <td>
              <button type="button" class="link" @click="emit('select', g)">Voir les logs</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
h2 {
  font-size: 1rem;
  margin: 0 0 0.5rem;
}
.wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
th {
  text-align: left;
  color: var(--muted);
  font-weight: 600;
  padding: 0.3rem 0.5rem;
  border-bottom: 2px solid var(--border);
  white-space: nowrap;
}
td {
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid var(--border);
}
.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.muted {
  color: var(--muted);
}
.link {
  padding: 0.1em 0.5em;
  font-size: 0.8rem;
  white-space: nowrap;
}
</style>
