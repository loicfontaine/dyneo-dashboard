# Test utilisateur

Un test avec **1 participant**, pour montrer la démarche (pas pour tirer des conclusions
générales). 

## Processus

**Objectif** : vérifier qu'un technicien comprend en quelques secondes ce qui se passe, puis qu'il
sait trouver l'origine des problèmes, lire un log précis et lire une liste qui défile


**Mise en situation** : « Tu es technicien, tu arrives à ton poste et tu ouvres cette page pour
savoir si tout va bien. »

1. **Test des 5 secondes** : la vue d'ensemble est montrée 5 s puis cachée. Questions : tout
   allait-il bien ? Qu'as-tu remarqué en premier ? Quels chiffres te reviennent ? À quoi sert la
   page ?
2. **Tâches**

   | # | Consigne | Réussite si… |
   | --- | --- | --- |
   | 1 | Quel service est le plus touché par les problèmes ? | Il nomme le service de la tuile « Service le plus touché » |
   | 2 | Montre-moi les logs de ce service qui posent problème. | La liste est filtrée sur ce service, niveaux Erreur et Critique |
   | 3 | Trouve le « Database timeout » le plus récent et donne son identifiant de requête. | Il lit le `request_id` dans le panneau de détail |
   | 4 | Dans la liste complète, descends pour lire un log plus ancien. | Il lit le log sans qu'il lui échappe, et sait relancer le direct |

   Pour chaque tâche : résultat (réussi, avec hésitation, échec), temps, hésitations.
3. **Questionnaire SUS** : 10 affirmations notées de 1 (pas du tout d'accord) à 5 (tout à fait
   d'accord), remplies seul, avant toute discussion. Score : (note − 1) pour les affirmations
   impaires, (5 − note) pour les paires, somme × 2,5. Résultat sur 100 ; 68 = moyenne de référence.

## Résultats

**5 secondes** : le participant a surtout décrit la mise en page (ce qu'il a vu à l'écran).
Sur le contenu, il a seulement retenu qu'il y avait beaucoup de rouge, donc des problèmes.

**Tâches**

| Tâche | Résultat | Temps | Observation |
| --- | --- | --- | --- |
| 1 – Service le plus touché | Réussi avec hésitation | 10 s | A utilisé « Problèmes principaux » au lieu de la tuile « Service le plus touché » |
| 2 – Logs de ce service | Échec | 3 s | A cliqué sur un problème principal au lieu du service |
| 3 – `request_id` d'un Database timeout | Réussi | 15 s | Direct |
| 4 – Lire un log plus ancien | Réussi | 5 s | A appuyé sur Pause au lieu de simplement faire défiler |

**SUS : 82,5 / 100**, au-dessus de la moyenne de référence (68).

## Ce que j'en retiens

- **La tuile « Service le plus touché » n'est pas vue** : les tâches 1 et 2 sont passées par le
  tableau « Problèmes principaux ». Piste : rendre la tuile plus visible, ou proposer le filtre par
  service depuis ce tableau.
- **Le rouge porte le message à lui seul en 5 secondes**, mais aucun chiffre n'a été retenu.
  Piste : mettre davantage en avant le taux de problèmes.
- **La pause manuelle est trouvée naturellement** : le participant a appuyé sur Pause avant de
  défiler, donc la pause automatique au défilement n'a pas été testée.
