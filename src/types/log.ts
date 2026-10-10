export type Level = 'debug' | 'info' | 'warning' | 'error' | 'critical'

export interface Log {
  id: string
  timestamp: string
  level: Level
  service: string
  message: string
  duration_ms: number
  metadata: {
    request_id: string
    user_id: number
    http_status: number
  }
}
