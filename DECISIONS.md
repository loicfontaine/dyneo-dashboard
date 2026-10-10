## Décisions

- **Flux : SSE (`/logs/stream` + EventSource)** plutôt que NDJSON.
  Raison : temps réel natif, parsing et reconnexion intégrés. Mesuré : les deux flux
  sont coupés par le serveur (de <1 s à ~40 s), donc la reconnexion est de toute façon nécessaire.
- **Vue 3 + `<script setup>` + TypeScript** : le type `Log` documente l'API.
- **Pas de Pinia, pas de routeur** : une page, un seul flux partagé.
- **Fusion des logs en fonction pure (`mergeLogs`)** testée avec Vitest : déduplication par `id`
  (l'historique est rejoué à chaque reconnexion, mesuré : ids stables), plafond de 10 000 logs (~12 min à 13 logs/s, ~7 min au plus haut des vagues).
- **Mises à jour regroupées toutes les 100 ms** (≈ 13 logs/s en moyenne, jusqu'à 5000 d'un coup
  à la connexion) et `shallowRef` pour éviter de rendre réactifs 10 000 objets.
