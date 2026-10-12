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
- **Pause = gel de l'affichage, pas de la connexion** : rien n'est perdu (tampon de 10'000 logs,
  environ 12 minutes au rythme moyen), les compteurs continuent.
- **Rythme mesuré à l'arrivée, moyenne glissante sur 10 s** (le rythme réel varie de 0 à ~24/s par
  vagues). L'historique rejoué à l'ouverture est ignoré pendant 1.5 s pour éviter un faux pic.
- **Détection de silence à 15 s, libellé neutre** : des silences de 1 à 2 s sont normaux (mesuré),
  et l'API n'envoie pas de keep-alive. Le vrai état de connexion vient de EventSource.
- **Reconnexion gérée par l'application, pas par EventSource** : observé, après l'arrêt du serveur
  la page ne reprenait pas (EventSource passe en CLOSED selon le navigateur). On ferme sur erreur
  et on réessaie : attente 1 s → 30 s avec aléa, remise à zéro après 5 s de connexion stable
  (mesuré : l'API peut répondre 200 puis fermer aussitôt), bouton « Réessayer maintenant ».
- **tail adapté à la durée d'absence** (min 200, max 5000), pessimiste à 20 logs/s ; les doublons
  sont écartés grâce aux id stables. Au-delà de ~6 min d'absence, des logs peuvent manquer.
- **Heure locale avec millisecondes** : les timestamps sont en UTC, plusieurs logs partagent la même seconde.
- **Lignes JSON illisibles ignorées et comptées** : une ligne du flux qui n'est pas du JSON valide est
  écartée sans casser la liste. Le nombre de lignes ignorées s'affiche dans la barre d'état,
  uniquement s'il est supérieur à zéro, pour ne pas encombrer l'écran en temps normal.

### Vue d'ensemble (bonnes pratiques des dashboards de logs)

- **Onglets plutôt qu'une longue page** : « Vue d'ensemble » répond à « tout va bien en ce
  moment ? » (indicateurs, répartition, volume, problèmes principaux, 10 derniers logs) ;
  « Tous les logs » sert à chercher (filtres, pause, liste
  complète). Un nombre n'apparaît qu'une fois par vue. L'onglet est
  dans l'URL (`#logs`)
- **Vue d'ensemble sur une fenêtre fixe : les 5 dernières minutes**. Avec une durée fixe, les chiffres bougent et se comparent d'un moment à l'autre.
- **Fenêtre mesurée par rapport au log le plus récent, pas à l'horloge du navigateur** : si l'horloge
  du poste est décalée par rapport à celle du serveur, une fenêtre calée sur l'horloge locale
  pourrait être vide ou tronquée. Contrepartie : après une coupure, la vue d'ensemble montre les
  5 minutes qui précèdent le dernier log reçu ; la barre d'état indique alors depuis combien de
  temps aucun log n'est arrivé.
- **Tendance du taux de problèmes : dernière minute contre la minute précédente**, avec un seuil de
  2 points : en dessous, la tendance est affichée comme « stable ». Sans seuil, la flèche changerait
  à chaque petite variation. Pas de couleur d'alerte sur la tendance, le taux varie naturellement.
- **Échantillonnage des logs dans la vue d’ensemble** : avec environ 13 logs par seconde, les 10 lignes affichées défilaient trop vite pour être lisibles. Pour ralentir le défilement, on conserve toutes les erreurs et les logs critiques, mais seulement un log des autres niveaux toutes les 5 secondes. On choisit le plus ancien log de chaque période afin que les lignes déjà affichées ne changent pas lorsque de nouveaux logs arrivent. La vue d’ensemble affiche ainsi environ 1,5 nouvelle ligne par seconde au lieu de 13. Tous les logs restent accessibles dans « Tous les logs ».

### Design

- **Statut HTTP en neutre** : mesuré, ~40 % des logs ont un 4xx/5xx quel que soit leur niveau
  (même « critical » avec 200). Colorer le statut créerait de fausses alertes.
