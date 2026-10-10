import type { Level } from '../types/log'

export const LEVEL_LABELS: Record<Level, string> = {
  debug: 'Debug',
  info: 'Info',
  warning: 'Avertissement',
  error: 'Erreur',
  critical: 'Critique',
}

// Symbole en plus de la couleur et du texte
export const LEVEL_ICONS: Record<Level, string> = {
  debug: '○',
  info: 'ℹ',
  warning: '▲',
  error: '✖',
  critical: '‼',
}

const timeFormat = new Intl.DateTimeFormat('fr-CH', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

/** "2026-10-01T08:25:13.132559Z" → "10:25:13.132" (heure locale, avec millisecondes) */
export function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return timestamp
  return `${timeFormat.format(date)}.${String(date.getMilliseconds()).padStart(3, '0')}`
}

/** 662 → "662 ms" ; 1690 → "1.69 s" */
export function formatDuration(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`
}

const STATUS_LABELS: Record<number, string> = {
  200: 'OK',
  201: 'Créé',
  400: 'Requête invalide',
  404: 'Introuvable',
  500: 'Erreur serveur',
}

/** Libellé humain d'un code HTTP, avec un repli sur la famille pour les codes inconnus */
export function describeStatus(code: number): string {
  const known = STATUS_LABELS[code]
  if (known) return known
  if (code >= 500) return 'Erreur serveur'
  if (code >= 400) return 'Erreur client'
  if (code >= 300) return 'Redirection'
  if (code >= 200) return 'Succès'
  return 'Statut inconnu'
}

/** 150000 → "2 min 30 s" ; 42000 → "42 s" ; 120000 → "2 min" */
export function formatSpan(ms: number): string {
  const total = Math.round(ms / 1000)
  const min = Math.floor(total / 60)
  const s = total % 60
  if (min === 0) return `${s} s`
  return s === 0 ? `${min} min` : `${min} min ${s} s`
}

/** 0.1234 → "12.3 %" */
export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)} %`
}
