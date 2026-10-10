import { describe, it, expect } from 'vitest'
import { filterLogs, type Filters } from '../filterLogs'
import { LEVELS, type Log } from '../../types/log'

const make = (over: Partial<Log> = {}): Log => ({
  id: '1',
  timestamp: '2026-10-01T08:00:00.000000Z',
  level: 'info',
  service: 'auth-service',
  message: 'Request handled',
  duration_ms: 100,
  metadata: { request_id: 'abc123', user_id: 1, http_status: 200 },
  ...over,
})

const all: Filters = { levels: [], service: '', search: '' }

describe('filterLogs', () => {
  const logs = [
    make({ id: 'a' }),
    make({ id: 'b', level: 'error', message: 'Database timeout', service: 'user-service' }),
    make({
      id: 'c',
      level: 'critical',
      message: 'Out of memory',
      metadata: { request_id: 'ff00ee', user_id: 2, http_status: 200 },
    }),
  ]
  const ids = (f: Partial<Filters>) => filterLogs(logs, { ...all, ...f }).map((l) => l.id)

  it('garde tout sans filtre', () => expect(ids({})).toEqual(['a', 'b', 'c']))
  it('filtre par niveaux', () => expect(ids({ levels: ['error', 'critical'] })).toEqual(['b', 'c']))
  it('garde tous les niveaux si aucun n’est choisi', () =>
    expect(ids({ levels: [] })).toEqual(['a', 'b', 'c']))
  it('accepte la liste complète des niveaux', () =>
    expect(ids({ levels: [...LEVELS] })).toEqual(['a', 'b', 'c']))
  it('filtre par service', () => expect(ids({ service: 'user-service' })).toEqual(['b']))
  it('cherche dans le message sans tenir compte de la casse', () =>
    expect(ids({ search: 'TIMEOUT' })).toEqual(['b']))
  it('cherche par request_id', () => expect(ids({ search: 'ff00' })).toEqual(['c']))
  it('combine les filtres', () => expect(ids({ levels: ['error'], search: 'memory' })).toEqual([]))
})
