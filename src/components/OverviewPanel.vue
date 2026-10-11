<script setup lang="ts"></script>

<template>
  <div class="overview">
    <div class="heading">
      <h2>Vue d’ensemble</h2>
      <span class="period">Période : 10 dernières minutes</span>
    </div>
    <p class="hint">
      Les compteurs portent sur le flux en direct : ils continuent pendant la pause et ne dépendent
      pas des filtres.
    </p>
  </div>
</template>

<style scoped>
.overview {
  display: grid;
  gap: 1.5rem;
}
.period {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
}
.heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}
h2 {
  font-size: 1rem;
  margin: 0;
}
.hint {
  margin: 0.1rem 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}
</style>
