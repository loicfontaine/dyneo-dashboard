# Dyneo · Logs

Interface web qui permet à un technicien de suivre des logs en direct et de comprendre rapidement
si tout va bien, sans lire de JSON. Vue 3, TypeScript, Vite.

- **Vue d'ensemble** : répartition par niveau, indicateurs de problèmes (taux et tendance, nombre,
  service le plus touché, utilisateurs touchés), volume dans le temps, problèmes principaux, derniers logs.
- **Tous les logs** : liste en direct, filtres (niveau, service, texte), pause, détail d'un log.

## Lancer le projet

Prérequis : Node.js 22.18+ ou 24.12+, et une API qui expose le flux `GET /logs/stream` (SSE).

1. Installer les dépendances :

   ```bash
   npm install
   ```

2. Indiquer l'adresse de l'API dans la variable `VITE_API_URL`. Copier le modèle fourni, puis
   renseigner l'adresse dans `.env.local` (fichier ignoré par Git) :

   ```bash
   cp .env.example .env.local
   ```

   ```dotenv
   VITE_API_URL=https://technical-exercise.dyneo.io
   ```

   Sans cette variable, l'application ne peut pas joindre l'API et reste sur « Reconnexion… ».

3. Lancer le serveur de développement :

   ```bash
   npm run dev
   ```

L'application s'ouvre sur http://localhost:5173.

| Commande            | Rôle                                            |
| ------------------- | ----------------------------------------------- |
| `npm run test:unit` | Tests unitaires (Vitest)                        |
| `npm run build`     | Vérification des types puis build de production |
| `npm run lint`      | ESLint et oxlint, avec correction automatique   |

## Choix principaux

Le détail de chaque décision, avec ses raisons, est dans [DECISIONS.md](DECISIONS.md). En résumé :

- **SSE avec reconnexion gérée par l'application** (attente croissante, de 1 s à 30 s) : à la
  reconnexion, l'historique manquant est redemandé avec `tail`, et les doublons sont écartés par `id`.
- **Pas de Pinia ni de routeur** : un seul flux, partagé par un composable. Les onglets sont dans
  l'URL (`#logs`), donc le bouton Retour fonctionne.
- **Filtrage côté navigateur** : instantané, sans reconnexion, plusieurs niveaux à la fois.
- **Vue d'ensemble sur les 5 dernières minutes**, mesurées depuis le log le plus récent : les
  chiffres évoluent au lieu de saturer avec la mémoire.
- **« Problèmes » = niveaux Erreur + Critique**, jamais le statut HTTP : sur l'API de test, il ne
  reflétait pas la gravité.
- **Lisibilité d'un flux rapide** : mises à jour regroupées toutes les 100 ms, pause automatique
  quand on fait défiler la liste, derniers logs de la vue d'ensemble échantillonnés (toutes les
  erreurs gardées).
- **Accessibilité** : niveau indiqué par couleur, texte et symbole ; contrastes ; thème sombre.
- **Calculs en fonctions pures testées** (`src/utils`), séparés des composants.

## Compromis

- **Historique limité à la mémoire du navigateur** : 10 000 logs (~12 min). L'API n'a pas de
  paramètre de date, seulement `tail` ; un rechargement redemande les 4 000 derniers logs.
- **Tous les logs sont reçus**, même filtrés : coût réseau faible au rythme observé (~13 logs/s),
  à revoir pour un flux beaucoup plus rapide.
- **Liste par pages de 100 lignes**, sans virtualisation : suffisant aujourd'hui, à remplacer pour
  de très longues listes.
- **Composables du flux non testés** (`useLogStream`, `usePausable`) : ce serait la prochaine
  étape, avec un faux `EventSource`.

## Test utilisateur

Un test avec un participant (test des 5 secondes, 4 tâches, questionnaire SUS) est décrit dans
[TEST-UTILISATEUR.md](TEST-UTILISATEUR.md).
