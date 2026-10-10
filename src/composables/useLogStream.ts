import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import type { Log } from '../types/log'
import { mergeLogs } from '../utils/mergeLogs'

export type ConnectionStatus = 'connexion' | 'connecté' | 'reconnexion'

interface Options {
  /** URL du flux, SANS paramètre tail : il est ajouté à chaque connexion */
  url: string
  /** Historique demandé à la première connexion */
  tail?: number
  max?: number
}

const RATE_WINDOW_S = 10 // le rythme est une moyenne sur 10 s (il varie par vagues)
const HISTORY_GRACE_MS = 1500 // l'historique rejoué à l'ouverture ne compte pas comme du « live »
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 30_000
const STABLE_AFTER_MS = 5000 // une connexion est « stable » après 5 s
const MAX_TAIL = 5000 // maximum accepté par l'API
const PESSIMISTIC_RATE = 20 // logs/s : haut des vagues mesurées

type Timer = ReturnType<typeof setTimeout> | undefined

export function useLogStream({ url, tail = 200, max = 2000 }: Options) {
  const logs = shallowRef<Log[]>([]) // du plus récent au plus ancien
  const status = ref<ConnectionStatus>('connexion')
  const ignored = ref(0) // lignes reçues mais illisibles
  const ratePerSecond = ref(0)
  const silenceSeconds = ref<number | null>(null) // secondes depuis le dernier log reçu
  const retryIn = ref<number | null>(null) // secondes avant la prochaine tentative

  let source: EventSource | null = null
  let stopped = false
  let attempt = 0
  let retryAt = 0
  let pending: Log[] = []
  let flushTimer: Timer
  let retryTimer: Timer
  let stableTimer: Timer
  let statsTimer: ReturnType<typeof setInterval> | undefined

  let liveFrom = 0
  let lastMessageAt: number | null = null
  let arrivals: number[] = [] // heures d'arrivée (ms) des logs live

  function flush() {
    flushTimer = undefined
    logs.value = mergeLogs(logs.value, pending, max)
    pending = []
  }

  function updateStats() {
    const now = Date.now()
    arrivals = arrivals.filter((t) => now - t <= RATE_WINDOW_S * 1000)
    const span = Math.min(RATE_WINDOW_S, Math.max(1, (now - liveFrom) / 1000))
    ratePerSecond.value = status.value === 'connecté' ? arrivals.length / span : 0
    silenceSeconds.value = lastMessageAt === null ? null : Math.floor((now - lastMessageAt) / 1000)
    retryIn.value =
      status.value === 'reconnexion' ? Math.max(0, Math.ceil((retryAt - now) / 1000)) : null
  }

  // Après une coupure, on redemande assez d'historique pour couvrir l'absence.
  // Les doublons sont écartés par mergeLogs grâce aux id stables.
  function tailToRequest(): number {
    if (lastMessageAt === null) return tail
    const awaySeconds = (Date.now() - lastMessageAt) / 1000
    return Math.min(MAX_TAIL, Math.max(tail, Math.ceil(awaySeconds * PESSIMISTIC_RATE * 1.5)))
  }

  function scheduleReconnect() {
    if (stopped) return
    status.value = 'reconnexion'
    const delay =
      Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt) * (0.8 + Math.random() * 0.4)
    attempt++
    retryAt = Date.now() + delay
    retryTimer = setTimeout(connect, delay)
    updateStats()
  }

  function connect() {
    if (stopped) return
    clearTimeout(retryTimer)
    source?.close()

    const target = new URL(url, window.location.href)
    target.searchParams.set('tail', String(tailToRequest()))
    source = new EventSource(target)

    source.onopen = () => {
      status.value = 'connecté'
      liveFrom = Date.now() + HISTORY_GRACE_MS
      stableTimer = setTimeout(() => (attempt = 0), STABLE_AFTER_MS)
    }

    source.onerror = () => {
      // On prend la main : on ferme et on réessaie nous-mêmes. Sinon, selon le navigateur,
      // EventSource abandonne définitivement dès que le serveur est injoignable.
      source?.close()
      source = null
      clearTimeout(stableTimer)
      scheduleReconnect()
    }

    source.onmessage = (event: MessageEvent<string>) => {
      const now = Date.now()
      lastMessageAt = now
      if (now >= liveFrom) arrivals.push(now)
      try {
        pending.push(JSON.parse(event.data) as Log)
      } catch {
        ignored.value++
        return
      }
      flushTimer ??= setTimeout(flush, 100)
    }
  }

  function reconnectNow() {
    attempt = 0
    connect()
  }

  onMounted(() => {
    connect()
    statsTimer = setInterval(updateStats, 1000)
  })

  onUnmounted(() => {
    stopped = true
    source?.close()
    clearTimeout(flushTimer)
    clearTimeout(retryTimer)
    clearTimeout(stableTimer)
    clearInterval(statsTimer)
  })

  return { logs, status, ignored, ratePerSecond, silenceSeconds, retryIn, reconnectNow }
}
