import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import type { Log } from '../types/log'
import { mergeLogs } from '../utils/mergeLogs'

export type ConnectionStatus = 'connexion' | 'connecté' | 'reconnexion' | 'fermé'

interface Options {
  url: string
  max?: number
}

export function useLogStream({ url, max = 2000 }: Options) {
  const logs = shallowRef<Log[]>([]) // du plus récent au plus ancien
  const status = ref<ConnectionStatus>('connexion')
  const ignored = ref(0) // lignes reçues mais illisibles

  let source: EventSource | null = null
  let pending: Log[] = []
  let timer: ReturnType<typeof setTimeout> | undefined

  // Les logs arrivent un par un : on les regroupe, puis on met à jour l'écran
  // au plus 10 fois par seconde, au lieu d'une fois par log.
  function flush() {
    timer = undefined
    logs.value = mergeLogs(logs.value, pending, max)
    pending = []
  }

  function connect() {
    source = new EventSource(url)
    source.onopen = () => {
      status.value = 'connecté'
    }
    source.onerror = () => {
      // CONNECTING = le navigateur va réessayer tout seul ; CLOSED = abandon définitif
      status.value = source?.readyState === EventSource.CLOSED ? 'fermé' : 'reconnexion'
    }
    source.onmessage = (event: MessageEvent<string>) => {
      try {
        pending.push(JSON.parse(event.data) as Log)
      } catch {
        ignored.value++
        return
      }
      timer ??= setTimeout(flush, 100)
    }
  }

  function disconnect() {
    source?.close()
    clearTimeout(timer)
  }

  onMounted(connect)
  onUnmounted(disconnect)

  return { logs, status, ignored }
}
