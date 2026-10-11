import { describe, it, expect } from 'vitest'
import {
  affectedUsers,
  bucketByTime,
  countByLevel,
  isIssue,
  lastWindow,
  pickBucketMs,
  problemTrend,
  sampleRecent,
  summarize,
  topErrors,
  topProblemService,
} from '../stats'
import { LEVELS, type Level, type Log } from '../../types/log'

const T0 = Date.parse('2026-10-01T08:00:00.000Z')

const make = (over: Partial<Log> & { at?: number } = {}): Log => {
  const { at = 0, ...rest } = over

  return {
    id: `${T0 + at}-${Math.random()}`,
    timestamp: new Date(T0 + at).toISOString(),
    level: 'info',
    service: 'auth-service',
    message: 'Request handled',
    duration_ms: 100,
    metadata: {
      request_id: 'abc123',
      user_id: 1,
      http_status: 200,
    },
    ...rest,
  }
}

describe('isIssue', () => {
  it('identifie error et critical comme des problèmes', () => {
    expect(isIssue('error')).toBe(true)
    expect(isIssue('critical')).toBe(true)
  })

  it('ignore les autres niveaux', () => {
    expect(isIssue('info')).toBe(false)
    expect(isIssue('warning')).toBe(false)
  })
})

describe('lastWindow', () => {
  it('garde les logs dans la fenêtre du plus récent', () => {
    const logs = [make({ at: 50_000 }), make({ at: 70_000 }), make({ at: 5_000 })]

    expect(lastWindow(logs, 60_000)).toEqual(logs.slice(0, 2))
  })

  it('inclut un log exactement à la limite', () => {
    const logs = [make({ at: 10_000 }), make({ at: 70_000 })]

    expect(lastWindow(logs, 60_000)).toEqual(logs)
  })

  it('renvoie une liste vide sans logs', () => {
    expect(lastWindow([], 60_000)).toEqual([])
  })
})

describe('summarize', () => {
  it('renvoie les valeurs attendues sans logs', () => {
    expect(summarize([])).toEqual({
      total: 0,
      issues: 0,
      issueRate: null,
      spanMs: 0,
    })
  })

  it('compte les problèmes et mesure la période couverte', () => {
    const logs = [
      make({ at: 30_000, level: 'critical' }),
      make({
        at: 10_000,
        metadata: { request_id: 'x', user_id: 1, http_status: 500 },
      }),
      make({ at: 0, level: 'error' }),
      make({ at: 0 }),
    ]

    expect(summarize(logs)).toEqual({
      total: 4,
      issues: 2,
      issueRate: 0.5,
      spanMs: 30_000,
    })
  })

  it('retourne un taux de 0 sans problème', () => {
    expect(summarize([make(), make({ at: 1_000 })])).toEqual({
      total: 2,
      issues: 0,
      issueRate: 0,
      spanMs: 1_000,
    })
  })
})

describe('bucketByTime', () => {
  it('renvoie une liste vide sans logs', () => {
    expect(bucketByTime([], 5_000)).toEqual([])
  })

  it('renvoie une liste vide si aucun timestamp n’est valide', () => {
    expect(bucketByTime([make({ timestamp: 'invalid' })], 5_000)).toEqual([])
  })

  it('garde les tranches vides et écarte la première', () => {
    const logs = [
      make({ at: 21_000, level: 'error' }),
      make({ at: 20_500 }),
      make({ at: 6_000 }),
      make({ at: 1_000 }),
    ]

    const buckets = bucketByTime(logs, 5_000)

    expect(buckets.map((b) => b.start - T0)).toEqual([5_000, 10_000, 15_000, 20_000])
    expect(buckets.map((b) => b.total)).toEqual([1, 0, 0, 2])
    expect(buckets.map((b) => b.issues)).toEqual([0, 0, 0, 1])
    expect(buckets.map((b) => b.issueRate)).toEqual([0, null, null, 0.5])
    expect(buckets.map((b) => b.ongoing)).toEqual([false, false, false, true])
  })

  it('conserve une tranche unique', () => {
    const buckets = bucketByTime([make({ at: 1_000 })], 5_000)

    expect(buckets).toHaveLength(1)
    expect(buckets[0]!.ongoing).toBe(true)
  })

  it('ignore les logs avec un timestamp invalide', () => {
    const buckets = bucketByTime([make({ at: 1_000 }), make({ timestamp: 'invalid' })], 5_000)

    expect(buckets).toHaveLength(1)
    expect(buckets[0]!.total).toBe(1)
  })
})

describe('pickBucketMs', () => {
  it('garde des tranches de 5 secondes pour une période courte', () => {
    expect(pickBucketMs(150_000)).toBe(5_000)
  })

  it('élargit les tranches au-delà du nombre maximal', () => {
    expect(pickBucketMs(600_000)).toBe(10_000)
  })

  it('respecte un nombre maximal de tranches personnalisé', () => {
    expect(pickBucketMs(100_000, 10)).toBe(10_000)
  })

  it('garde des tranches de 5 secondes pour une durée nulle', () => {
    expect(pickBucketMs(0)).toBe(5_000)
  })
})

describe('countByLevel', () => {
  it('initialise tous les niveaux à zéro sans logs', () => {
    const counts = countByLevel([])

    for (const level of LEVELS) {
      expect(counts[level]).toBe(0)
    }
  })

  it('compte les logs par niveau', () => {
    const logs = [
      make({ level: 'info' }),
      make({ level: 'info' }),
      make({ level: 'warning' }),
      make({ level: 'error' }),
      make({ level: 'critical' }),
    ]

    expect(countByLevel(logs)).toEqual({
      ...Object.fromEntries(LEVELS.map((level: Level) => [level, 0])),
      info: 2,
      warning: 1,
      error: 1,
      critical: 1,
    })
  })
})

describe('topErrors', () => {
  it('regroupe les problèmes par niveau et message', () => {
    const logs = [
      make({
        at: 3_000,
        level: 'error',
        message: 'Database timeout',
        service: 'user-service',
      }),
      make({ at: 2_000, level: 'critical', message: 'Out of memory' }),
      make({ at: 1_000, level: 'error', message: 'Database timeout' }),
      make({ at: 0, level: 'warning', message: 'Retrying upstream call' }),
    ]

    const groups = topErrors(logs)

    expect(groups.map((g) => [g.message, g.count, g.share])).toEqual([
      ['Database timeout', 2, 2 / 3],
      ['Out of memory', 1, 1 / 3],
    ])

    expect(groups[0]!.last).toBe(logs[0]!.timestamp)
    expect(groups[0]!.services).toEqual(['auth-service', 'user-service'])
  })

  it('sépare deux niveaux pour un même message', () => {
    const groups = topErrors([
      make({ at: 2_000, level: 'error', message: 'Timeout' }),
      make({ at: 1_000, level: 'critical', message: 'Timeout' }),
    ])

    expect(groups).toHaveLength(2)
    expect(groups.map((g) => g.level).sort()).toEqual(['critical', 'error'])
  })

  it('renvoie une liste vide sans problème', () => {
    expect(topErrors([make(), make({ level: 'warning' })])).toEqual([])
  })

  it('trie les groupes par fréquence décroissante', () => {
    const groups = topErrors([
      make({ at: 5_000, level: 'error', message: 'A' }),
      make({ at: 4_000, level: 'error', message: 'B' }),
      make({ at: 3_000, level: 'error', message: 'B' }),
      make({ at: 2_000, level: 'error', message: 'B' }),
      make({ at: 1_000, level: 'error', message: 'A' }),
    ])

    expect(groups.map((g) => [g.message, g.count])).toEqual([
      ['B', 3],
      ['A', 2],
    ])
  })
})

describe('sampleRecent', () => {
  const at = (logs: Log[]) => logs.map((log) => Date.parse(log.timestamp) - T0)

  it('garde toutes les erreurs et le log non-problème le plus ancien par créneau', () => {
    const logs = [
      make({ at: 9_000 }),
      make({ at: 8_000, level: 'critical' }),
      make({ at: 7_000, level: 'error' }),
      make({ at: 6_000 }),
      make({ at: 4_000 }),
      make({ at: 1_000, level: 'warning' }),
    ]

    expect(at(sampleRecent(logs, 5_000, 10))).toEqual([8_000, 7_000, 6_000, 1_000])
  })

  it('reste stable quand de nouveaux logs arrivent dans le créneau', () => {
    const before = [make({ at: 6_000 }), make({ at: 1_000 })]
    const after = [make({ at: 8_000 }), make({ at: 7_000 }), ...before]

    expect(at(sampleRecent(after, 5_000, 10))).toEqual(at(sampleRecent(before, 5_000, 10)))
  })

  it('limite le résultat au nombre demandé', () => {
    const logs = Array.from({ length: 20 }, (_, i) =>
      make({ at: 20_000 - i * 100, level: 'error' }),
    )

    expect(sampleRecent(logs, 5_000, 5)).toHaveLength(5)
  })

  it('renvoie une liste vide sans logs', () => {
    expect(sampleRecent([], 5_000, 10)).toEqual([])
  })
})

describe('problemTrend', () => {
  it('renvoie des taux nuls sans logs', () => {
    expect(problemTrend([])).toEqual({
      current: null,
      previous: null,
      direction: null,
    })
  })

  it('détecte une hausse du taux de problèmes', () => {
    const logs = [
      make({ at: 120_000, level: 'error' }),
      make({ at: 110_000 }),
      make({ at: 50_000 }),
      make({ at: 10_000 }),
    ]

    expect(problemTrend(logs)).toEqual({
      current: 0.5,
      previous: 0,
      direction: 'up',
    })
  })

  it('détecte une baisse du taux de problèmes', () => {
    const logs = [
      make({ at: 120_000 }),
      make({ at: 110_000 }),
      make({ at: 50_000, level: 'error' }),
      make({ at: 10_000, level: 'error' }),
    ]

    expect(problemTrend(logs)).toEqual({
      current: 0,
      previous: 1,
      direction: 'down',
    })
  })

  it('considère les variations inférieures au seuil comme stables', () => {
    const logs = [
      make({ at: 120_000, level: 'error' }),
      ...Array.from({ length: 99 }, (_, i) => make({ at: 119_000 - i })),
      make({ at: 50_000, level: 'error' }),
      ...Array.from({ length: 99 }, (_, i) => make({ at: 49_000 - i })),
    ]

    expect(problemTrend(logs).direction).toBe('stable')
  })

  it('ne détermine pas la direction si une période est vide', () => {
    const logs = [make({ at: 120_000, level: 'error' })]

    expect(problemTrend(logs).direction).toBe(null)
  })
})

describe('affectedUsers', () => {
  it('renvoie zéro utilisateur sans logs', () => {
    expect(affectedUsers([])).toEqual({ affected: 0, total: 0 })
  })

  it('compte les utilisateurs distincts affectés et tous les utilisateurs', () => {
    const logs = [
      make({ level: 'error', metadata: { request_id: 'a', user_id: 1, http_status: 500 } }),
      make({ level: 'info', metadata: { request_id: 'b', user_id: 1, http_status: 200 } }),
      make({ level: 'warning', metadata: { request_id: 'c', user_id: 2, http_status: 200 } }),
      make({ level: 'critical', metadata: { request_id: 'd', user_id: 3, http_status: 500 } }),
    ]

    expect(affectedUsers(logs)).toEqual({ affected: 2, total: 3 })
  })
})

describe('topProblemService', () => {
  it('renvoie null sans problème', () => {
    expect(topProblemService([make(), make({ level: 'warning' })])).toBe(null)
  })

  it('renvoie le service ayant le plus de problèmes et sa part', () => {
    const logs = [
      make({ level: 'error', service: 'api' }),
      make({ level: 'critical', service: 'api' }),
      make({ level: 'error', service: 'auth' }),
      make({ level: 'info', service: 'other' }),
    ]

    expect(topProblemService(logs)).toEqual({
      service: 'api',
      count: 2,
      share: 2 / 3,
    })
  })

  it('départage les services à égalité par ordre alphabétique', () => {
    const logs = [
      make({ at: 2_000, level: 'error', service: 'zebra' }),
      make({ at: 1_000, level: 'error', service: 'api' }),
    ]

    expect(topProblemService(logs)).toEqual({
      service: 'api',
      count: 1,
      share: 0.5,
    })
  })
})
