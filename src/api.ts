import type { Exercise, TestResult, User } from './types'

const TOKEN_KEY = 'tm_admin_token'
const USER_KEY = 'tm_user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as User) : null
}
export function setStoredUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}
export function clearStoredUser() {
  localStorage.removeItem(USER_KEY)
}

async function request<T>(url: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(url, { ...options, headers })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      message = data.error || message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  // exercises
  listExercises: (category?: string) =>
    request<Exercise[]>(`/api/exercises${category ? `?category=${category}` : ''}`),
  // users
  registerUser: (name: string) =>
    request<User>('/api/users', { method: 'POST', body: JSON.stringify({ name }) }),
  // results
  saveResult: (payload: Partial<TestResult>) =>
    request<TestResult>('/api/results', { method: 'POST', body: JSON.stringify(payload) }),

  // admin
  adminLogin: (username: string, password: string) =>
    request<{ token: string; admin: { id: string; username: string } }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  adminMe: () => request<{ admin: { id: string; username: string } }>('/api/admin/me', {}, true),
  adminListExercises: () => request<Exercise[]>('/api/exercises'),
  adminCreateExercise: (payload: Partial<Exercise>) =>
    request<Exercise>('/api/admin/exercises', { method: 'POST', body: JSON.stringify(payload) }, true),
  adminUpdateExercise: (id: string, payload: Partial<Exercise>) =>
    request<Exercise>(`/api/admin/exercises/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, true),
  adminDeleteExercise: (id: string) =>
    request<Exercise>(`/api/admin/exercises/${id}`, { method: 'DELETE' }, true),
  adminListUsers: () => request<User[]>('/api/admin/users', {}, true),
  adminSetUserActive: (id: string, active: boolean) =>
    request<User>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) }, true),
  adminDeleteUser: (id: string) =>
    request<User>(`/api/admin/users/${id}`, { method: 'DELETE' }, true),
  adminListResults: () => request<TestResult[]>('/api/admin/results', {}, true),
}
