import { describe, it, expect } from 'vitest'
import { formatDuration, formatTime, describeStatus, formatSpan, formatPercent } from '../format'

describe('formatDuration', () => {
  it('affiche les millisecondes sous la seconde', () => {
    expect(formatDuration(662)).toBe('662 ms')
  })
  it('passe en secondes à partir de 1000 ms', () => {
    expect(formatDuration(1690)).toBe('1.69 s')
  })
})

describe('formatTime', () => {
  it("renvoie HH:MM:SS.mmm (l'heure exacte dépend du fuseau)", () => {
    expect(formatTime('2026-10-01T08:25:13.132559Z')).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/)
  })
  it('garde le texte brut si la date est invalide', () => {
    expect(formatTime('pas une date')).toBe('pas une date')
  })
})

describe('describeStatus', () => {
  it('connaît les codes vus sur l’API', () => {
    expect(describeStatus(404)).toBe('Introuvable')
  })
  it('se replie sur la famille pour un code inconnu', () => {
    expect(describeStatus(418)).toBe('Erreur client')
    expect(describeStatus(503)).toBe('Erreur serveur')
  })
})

describe('formatSpan', () => {
  it('affiche les secondes seules sous la minute', () => expect(formatSpan(42_000)).toBe('42 s'))
  it('combine minutes et secondes', () => expect(formatSpan(150_000)).toBe('2 min 30 s'))
  it('omet les secondes nulles', () => expect(formatSpan(120_000)).toBe('2 min'))
})

describe('formatPercent', () => {
  it('arrondit à une décimale', () => expect(formatPercent(0.1234)).toBe('12.3 %'))
})
