export const LEVELS = ['debug', 'info', 'warning', 'error', 'critical'] as const
export type Level = (typeof LEVELS)[number]

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
