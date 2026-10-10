import type { Log } from '../types/log'

/**
 * Ajoute des logs reçus (du plus ancien au plus récent) en tête d'une liste
 * (du plus récent au plus ancien). Ignore ceux dont l'id existe déjà
 * (historique rejoué après une reconnexion) et plafonne la liste à `max`.
 */
export function mergeLogs(current: Log[], incoming: Log[], max: number): Log[] {
  const known = new Set(current.map((log) => log.id))
  const fresh: Log[] = []
  for (const log of incoming) {
    if (!known.has(log.id)) {
      known.add(log.id)
      fresh.push(log)
    }
  }
  if (fresh.length === 0) return current
  return [...fresh.reverse(), ...current].slice(0, max)
}
