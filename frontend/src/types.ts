export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

export interface UserInfo {
  userId: number
  email: string
  name: string
}

export interface AuthResponse extends UserInfo {
  token: string
  type: string
}

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

export interface TaskPayload {
  title: string
  description?: string
  status: TaskStatus
}

export interface ApiErrorBody {
  message?: string
  error?: string
  status?: number
  path?: string
  fields?: Record<string, string>
}
