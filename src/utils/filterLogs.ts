import type { Level, Log } from '../types/log'

export interface Filters {
  levels: Level[] // niveaux affichés ; vide = tous
  service: string // '' = tous les services
  search: string
}

/** Cherche dans le message, le service et le request_id (sans tenir compte de la casse). */
export function filterLogs(logs: Log[], filters: Filters): Log[] {
  const q = filters.search.trim().toLowerCase()
  return logs.filter(
    (log) =>
      (filters.levels.length === 0 || filters.levels.includes(log.level)) &&
      (filters.service === '' || log.service === filters.service) &&
      (q === '' ||
        log.message.toLowerCase().includes(q) ||
        log.service.toLowerCase().includes(q) ||
        log.metadata.request_id.includes(q)),
  )
}
