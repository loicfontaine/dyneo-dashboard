import { LEVELS, type Level, type Log } from '../types/log'

/**
 * « Erreur » = niveau error ou critical. Le statut HTTP n'est volontairement pas utilisé :
 * mesuré, ~40 % des logs ont un 4xx/5xx quel que soit leur niveau.
 */
export function isIssue(level: Level): boolean {
  return level === 'error' || level === 'critical'
}

function time(log: Log): number {
  return Date.parse(log.timestamp)
}

/**
 * Logs dont le timestamp est dans les `windowMs` précédant le log le plus récent.
 * La référence est le log le plus récent et non l'horloge du navigateur :
 * un décalage d'horloge avec le serveur ne vide pas la fenêtre.
 */
export function lastWindow(logs: Log[], windowMs: number): Log[] {
  let newest = -Infinity
  for (const log of logs) newest = Math.max(newest, time(log))
  const from = newest - windowMs
  return logs.filter((log) => time(log) >= from)
}

export interface Summary {
  total: number
  issues: number
  /** entre 0 et 1, null s'il n'y a aucun log */
  issueRate: number | null
  /** durée couverte par les logs (du plus ancien au plus récent), en ms */
  spanMs: number
}

/** Indicateurs clés sur une liste de logs. */
export function summarize(logs: Log[]): Summary {
  let issues = 0
  let newest = -Infinity
  let oldest = Infinity
  for (const log of logs) {
    if (isIssue(log.level)) issues++
    newest = Math.max(newest, time(log))
    oldest = Math.min(oldest, time(log))
  }
  return {
    total: logs.length,
    issues,
    issueRate: logs.length ? issues / logs.length : null,
    spanMs: logs.length ? newest - oldest : 0,
  }
}

export interface Bucket {
  /** début de la tranche (ms depuis epoch) */
  start: number
  total: number
  issues: number
  /** null quand la tranche est vide (pas de taux à afficher) */
  issueRate: number | null
  /** la tranche la plus récente est encore en cours de remplissage */
  ongoing: boolean
}

/**
 * Regroupe les logs par tranches de `bucketMs` selon leur timestamp (et non leur heure
 * d'arrivée : l'historique rejoué à la reconnexion fausserait le graphique).
 * Les tranches vides sont conservées (elles montrent les silences). La première tranche
 * est écartée : elle est tronquée par le plafond de la mémoire.
 */
export function bucketByTime(logs: Log[], bucketMs: number): Bucket[] {
  if (logs.length === 0) return []
  const times = logs.map(time).filter((t) => !Number.isNaN(t))
  if (times.length === 0) return []
  const first = Math.floor(Math.min(...times) / bucketMs) * bucketMs
  const last = Math.floor(Math.max(...times) / bucketMs) * bucketMs
  const count = (last - first) / bucketMs + 1

  const totals = Array.from({ length: count }, () => 0)
  const issues = Array.from({ length: count }, () => 0)
  logs.forEach((log) => {
    const t = time(log)
    if (Number.isNaN(t)) return
    const i = Math.floor((t - first) / bucketMs)
    totals[i]!++
    if (isIssue(log.level)) issues[i]!++
  })

  const buckets = totals.map((total, i) => ({
    start: first + i * bucketMs,
    total,
    issues: issues[i]!,
    issueRate: total ? issues[i]! / total : null,
    ongoing: i === count - 1,
  }))
  return buckets.length > 1 ? buckets.slice(1) : buckets
}

/** Taille de tranche : 5 s, élargie par multiples de 5 s pour ne pas dépasser `maxBuckets`. */
export function pickBucketMs(spanMs: number, maxBuckets = 60): number {
  const step = 5000
  return step * Math.max(1, Math.ceil(spanMs / (maxBuckets * step)))
}

export interface IssueGroup {
  level: Level
  message: string
  count: number
  /** part parmi les erreurs (0 à 1) */
  share: number
  /** timestamp de la dernière occurrence */
  last: string
  services: string[]
}

/** Nombre de logs par niveau (tous les niveaux présents, à 0 si absents). */
export function countByLevel(logs: Log[]): Record<Level, number> {
  const counts = Object.fromEntries(LEVELS.map((l) => [l, 0])) as Record<Level, number>
  for (const log of logs) counts[log.level]++
  return counts
}

/**
 * Erreurs principales regroupées par message (les messages n'ont pas de partie variable :
 * un regroupement par texte suffit, pas besoin de « patterns »). Triées par fréquence.
 */
export function topErrors(logs: Log[]): IssueGroup[] {
  const groups = new Map<
    string,
    Omit<IssueGroup, 'share' | 'services'> & { services: Set<string> }
  >()
  let totalIssues = 0
  // logs du plus récent au plus ancien : la première occurrence vue est la dernière en date
  for (const log of logs) {
    if (!isIssue(log.level)) continue
    totalIssues++
    const key = `${log.level}\u0000${log.message}`
    const group = groups.get(key)
    if (group) {
      group.count++
      group.services.add(log.service)
    } else {
      groups.set(key, {
        level: log.level,
        message: log.message,
        count: 1,
        last: log.timestamp,
        services: new Set([log.service]),
      })
    }
  }
  return [...groups.values()]
    .map((g) => ({ ...g, share: g.count / totalIssues, services: [...g.services].sort() }))
    .sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
}

/**
 * Échantillon des logs récents pour un affichage lisible : toutes les erreurs (error, critical)
 * et un seul log des autres niveaux par créneau de `everyMs`. Dans chaque créneau, on garde le
 * plus ancien : il ne change plus quand d'autres logs arrivent, donc la liste ne clignote pas.
 * `logs` va du plus récent au plus ancien ; le résultat aussi, limité à `count`.
 */
export function sampleRecent(logs: Log[], everyMs: number, count: number): Log[] {
  const newest = logs[0] ? time(logs[0]) : 0
  // On parcourt un horizon fixe plutôt que de s'arrêter à `count` éléments : sinon le plus
  // ancien log d'un créneau peut ne pas être vu, et la ligne choisie changerait au rendu suivant.
  // (count + 2) créneaux suffisent à remplir la liste même sans aucune erreur.
  const from = (Math.floor(newest / everyMs) - count - 2) * everyMs
  const kept: { log: Log; t: number }[] = []
  const slots = new Map<number, number>() // créneau → position dans `kept`
  for (const log of logs) {
    const t = time(log)
    if (t < from) break
    if (isIssue(log.level)) {
      kept.push({ log, t })
      continue
    }
    const slot = Math.floor(t / everyMs)
    const i = slots.get(slot)
    if (i === undefined) {
      slots.set(slot, kept.length)
      kept.push({ log, t })
    } else if (t < kept[i]!.t) {
      kept[i] = { log, t }
    }
  }
  return kept
    .sort((a, b) => b.t - a.t)
    .slice(0, count)
    .map((k) => k.log)
}

export interface Trend {
  /** taux de problèmes de la dernière minute (0 à 1), null sans log */
  current: number | null
  /** taux de la minute précédente, null sans log */
  previous: number | null
  /** sens de l'évolution ; 'stable' sous le seuil, null si une des deux minutes est vide */
  direction: 'up' | 'down' | 'stable' | null
}

/**
 * Taux de problèmes de la dernière minute comparé à la minute précédente, mesurés par rapport
 * au log le plus récent. Sous `threshold` (en points, 0,02 = 2 points), l'écart est considéré
 * comme stable : sinon la flèche changerait à chaque petite variation.
 */
export function problemTrend(logs: Log[], periodMs = 60_000, threshold = 0.02): Trend {
  let newest = -Infinity
  for (const log of logs) newest = Math.max(newest, time(log))
  const cur = { total: 0, errors: 0 }
  const prev = { total: 0, errors: 0 }
  for (const log of logs) {
    const age = newest - time(log)
    const slot = age < periodMs ? cur : age < 2 * periodMs ? prev : null
    if (!slot) continue
    slot.total++
    if (isIssue(log.level)) slot.errors++
  }
  const current = cur.total ? cur.errors / cur.total : null
  const previous = prev.total ? prev.errors / prev.total : null
  let direction: Trend['direction'] = null
  if (current !== null && previous !== null) {
    const delta = current - previous
    direction = Math.abs(delta) < threshold ? 'stable' : delta > 0 ? 'up' : 'down'
  }
  return { current, previous, direction }
}

/** Utilisateurs différents touchés par au moins un problème, et utilisateurs différents en tout. */
export function affectedUsers(logs: Log[]): { affected: number; total: number } {
  const all = new Set<number>()
  const affected = new Set<number>()
  for (const log of logs) {
    all.add(log.metadata.user_id)
    if (isIssue(log.level)) affected.add(log.metadata.user_id)
  }
  return { affected: affected.size, total: all.size }
}
/** Service qui a le plus de problèmes, avec sa part parmi les problèmes ; null s'il n'y en a pas. */
export function topProblemService(
  logs: Log[],
): { service: string; count: number; share: number } | null {
  const counts = new Map<string, number>()
  let total = 0
  for (const log of logs) {
    if (!isIssue(log.level)) continue
    total++
    counts.set(log.service, (counts.get(log.service) ?? 0) + 1)
  }
  let best: { service: string; count: number } | null = null
  for (const [service, count] of counts) {
    // à égalité, l'ordre alphabétique : le résultat ne saute pas d'un service à l'autre
    if (!best || count > best.count || (count === best.count && service < best.service))
      best = { service, count }
  }
  return best ? { ...best, share: best.count / total } : null
}
