import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setStoredUser, getStoredUser } from '../api'

export default function SignIn() {
  const navigate = useNavigate()
  const existing = getStoredUser()
  const [name, setName] = useState(existing?.name ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const user = await api.registerUser(name.trim())
      setStoredUser(user)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Could not sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="text-xl font-extrabold text-slate-900">Sign in to track progress</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter a name to save your test results. No password needed.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Your name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mohan"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Please wait…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
