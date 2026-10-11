import { describe, it, expect } from 'vitest'
import { mergeLogs } from '../../utils/mergeLogs'
import type { Log } from '../../types/log'

const log = (id: string): Log => ({
  id,
  timestamp: '2026-10-01T08:00:00.000000Z',
  level: 'info',
  service: 'auth-service',
  message: 'Request handled',
  duration_ms: 100,
  metadata: { request_id: 'abc', user_id: 1, http_status: 200 },
})

const ids = (logs: Log[]) => logs.map((l) => l.id)

describe('mergeLogs', () => {
  it('place les nouveaux logs en tête, le plus récent en premier', () => {
    expect(ids(mergeLogs([log('a')], [log('b'), log('c')], 10))).toEqual(['c', 'b', 'a'])
  })

  it('ignore les logs déjà présents (historique rejoué après reconnexion)', () => {
    const current = [log('b'), log('a')]
    expect(ids(mergeLogs(current, [log('a'), log('b'), log('c')], 10))).toEqual(['c', 'b', 'a'])
  })

  it('ignore les doublons à l’intérieur du lot reçu', () => {
    expect(ids(mergeLogs([], [log('a'), log('a')], 10))).toEqual(['a'])
  })

  it('plafonne la liste en supprimant les plus anciens', () => {
    expect(ids(mergeLogs([log('a')], [log('b'), log('c')], 2))).toEqual(['c', 'b'])
  })

  it('renvoie la même liste quand rien n’est nouveau', () => {
    const current = [log('a')]
    expect(mergeLogs(current, [log('a')], 10)).toBe(current)
  })
})
