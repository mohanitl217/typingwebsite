import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken, getToken } from '../api'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // already logged in? go to dashboard
  useEffect(() => {
    if (getToken()) {
      api
        .adminMe()
        .then(() => navigate('/admin/dashboard'))
        .catch(() => {})
    }
  }, [navigate])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { token } = await api.adminLogin(username, password)
      setToken(token)
      navigate('/admin/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-xl font-extrabold text-slate-900">Admin Login</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage exercises and users. Default credentials: <code>admin</code> / <code>admin123</code>.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Username</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
