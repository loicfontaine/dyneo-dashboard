<script setup lang="ts">
import { useLogStream } from './composables/useLogStream'

const API_URL = import.meta.env.VITE_API_URL

// life=3000 : le mock coupe la connexion toutes les 3 s, pour tester la reconnexion.
// À retirer (ou remplacer par life=0) ensuite.
const { logs, status, ignored } = useLogStream({
  url: `${API_URL}/logs/stream?tail=200&life=3000`,
})
</script>

<template>
  <h1>Logs</h1>
  <p>
    Connexion : {{ status }} · {{ logs.length }} logs en mémoire · {{ ignored }} lignes ignorées
  </p>
  <ul>
    <li v-for="log in logs.slice(0, 100)" :key="log.id">
      {{ log.timestamp }} · {{ log.level }} · {{ log.service }} · {{ log.message }}
    </li>
  </ul>
</template>
