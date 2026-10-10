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
- **Filtrage côté client** plutôt que le paramètre `level` : mesuré, `level` est un filtre exact côté
  serveur (pas « ce niveau et au-dessus »), donc on ne pourrait pas choisir plusieurs niveaux avec
  une seule connexion ; côté client, c'est instantané, sans reconnexion, et les compteurs restent complets.
  Coût : on reçoit tous les logs (~13/s, quelques Ko/s).
- **Pause = gel de l'affichage, pas de la connexion** : rien n'est perdu (tampon de 2000 logs,
  environ 2 à 3 minutes), les compteurs continuent.
- **Rythme mesuré à l'arrivée, moyenne glissante sur 10 s** (le rythme réel varie de 0 à ~24/s par
  vagues). L'historique rejoué à l'ouverture est ignoré pendant 1 s pour éviter un faux pic.
- **Détection de silence à 15 s, libellé neutre** : des silences de 1 à 2 s sont normaux (mesuré),
  et l'API n'envoie pas de keep-alive. Le vrai état de connexion vient de EventSource.
- **Reconnexion gérée par l'application, pas par EventSource** : observé, après l'arrêt du serveur
  la page ne reprenait pas (EventSource passe en CLOSED selon le navigateur). On ferme sur erreur
  et on réessaie : attente 1 s → 30 s avec aléa, remise à zéro après 5 s de connexion stable
  (mesuré : l'API peut répondre 200 puis fermer aussitôt), bouton « Réessayer maintenant ».
- **tail adapté à la durée d'absence** (min 200, max 5000), pessimiste à 20 logs/s ; les doublons
  sont écartés grâce aux id stables. Au-delà de ~6 min d'absence, des logs peuvent manquer.
