import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthResponse, UserInfo } from './types'
import * as api from './api'

interface AuthContextValue {
  user: UserInfo | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function persistAuth(data: AuthResponse) {
  localStorage.setItem('token', data.token)
  localStorage.setItem(
    'user',
    JSON.stringify({ userId: data.userId, email: data.email, name: data.name } satisfies UserInfo),
  )
}

function readStoredUser(): UserInfo | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserInfo
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<UserInfo | null>(() => readStoredUser())

  const applyAuth = useCallback((data: AuthResponse) => {
    persistAuth(data)
    setToken(data.token)
    setUser({ userId: data.userId, email: data.email, name: data.name })
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.login(email, password)
      applyAuth(data)
    },
    [applyAuth],
  )

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await api.register(name, email, password)
      applyAuth(data)
    },
    [applyAuth],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      register,
      logout,
    }),
    [user, token, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
