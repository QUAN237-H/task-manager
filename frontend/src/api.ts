import axios from 'axios'
import type { ApiErrorBody, AuthResponse, Task, TaskPayload, TaskStatus } from './types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const url = config.url ?? ''
  const isAuthRoute = url.includes('/api/auth/')
  if (!isAuthRoute) {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

export class ApiError extends Error {
  status?: number
  fields: Record<string, string>

  constructor(message: string, options?: { status?: number; fields?: Record<string, string> }) {
    super(message)
    this.name = 'ApiError'
    this.status = options?.status
    this.fields = options?.fields ?? {}
  }
}

function parseFieldsFromMessage(message: string): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const part of message.split(';')) {
    const trimmed = part.trim()
    const idx = trimmed.indexOf(':')
    if (idx <= 0) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    if (key && value) fields[key] = value
  }
  return fields
}

function stripHtmlMessage(raw: string): string | undefined {
  const text = raw.trim()
  if (!text.startsWith('<') && !text.toLowerCase().includes('<!doctype')) {
    return text || undefined
  }
  const title = text.match(/<title>(.*?)<\/title>/i)?.[1]
  if (title) {
    return title.replace(/\s+/g, ' ').replace(/–/g, '-').trim()
  }
  return undefined
}

function toApiError(error: unknown, fallback: string): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | string | undefined
    const status = error.response?.status
    let message = fallback
    let fields: Record<string, string> = {}

    if (typeof data === 'string' && data.trim()) {
      message = stripHtmlMessage(data) ?? `${fallback}${status ? ` (${status})` : ''}`
    } else if (data && typeof data === 'object') {
      if (data.fields && Object.keys(data.fields).length > 0) {
        fields = data.fields
      }
      if (typeof data.message === 'string' && data.message.trim()) {
        message = data.message.trim()
        if (Object.keys(fields).length === 0) {
          fields = parseFieldsFromMessage(message)
        }
      } else if (typeof data.error === 'string' && data.error.trim()) {
        message = data.error.trim()
      }
    }

    if (message === fallback && error.message) {
      message = error.message
    }

    if (status && message === error.message) {
      message = `${fallback} (${status})`
    }

    return new ApiError(message, { status, fields })
  }

  if (error instanceof Error) {
    return new ApiError(error.message || fallback)
  }

  return new ApiError(fallback)
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/api/auth/register', { name, email, password })
    return data
  } catch (error) {
    throw toApiError(error, 'Registration failed')
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password })
    return data
  } catch (error) {
    throw toApiError(error, 'Login failed')
  }
}

export async function fetchTasks(status?: TaskStatus | '', search?: string): Promise<Task[]> {
  try {
    const { data } = await api.get<Task[]>('/api/tasks', {
      params: {
        status: status || undefined,
        search: search || undefined,
      },
    })
    return data
  } catch (error) {
    throw toApiError(error, 'Could not load tasks')
  }
}

export async function createTask(payload: TaskPayload): Promise<Task> {
  try {
    const { data } = await api.post<Task>('/api/tasks', payload)
    return data
  } catch (error) {
    throw toApiError(error, 'Could not create task')
  }
}

export async function updateTask(id: number, payload: TaskPayload): Promise<Task> {
  try {
    const { data } = await api.put<Task>(`/api/tasks/${id}`, payload)
    return data
  } catch (error) {
    throw toApiError(error, 'Could not update task')
  }
}

export async function deleteTask(id: number): Promise<void> {
  try {
    await api.delete(`/api/tasks/${id}`)
  } catch (error) {
    throw toApiError(error, 'Could not delete task')
  }
}
