import { useState } from 'react'
import { api, setToken, setStoredUser } from '../api'

type Mode = 'signin' | 'signup'

export default function AuthModal({
  onClose,
  onAuthed,
  initialMode = 'signin',
}: {
  onClose: () => void
  /** Called after a successful sign in / sign up. */
  onAuthed: (role: 'admin' | 'user') => void
  initialMode?: Mode
}) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'signup') {
      if (!name.trim() || !email.trim() || !password) {
        setError('Name, email and password are required.')
        return
      }
    } else if (!email.trim() || !password) {
      setError('Please enter your email/username and password.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const res = await api.authRegister({
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          password,
        })
        setStoredUser(res.user)
        onAuthed('user')
      } else {
        const res = await api.authLogin(email.trim(), password)
        if (res.role === 'admin') {
          setToken(res.token)
          onAuthed('admin')
        } else {
          setStoredUser(res.user)
          onAuthed('user')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-fade-in rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-extrabold text-slate-900">
            {mode === 'signin' ? 'Sign in' : 'Create your account'}
          </h2>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={[
              'rounded-md py-2 text-sm font-semibold transition',
              mode === 'signin' ? 'bg-white text-brand-700 shadow' : 'text-slate-500',
            ].join(' ')}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={[
              'rounded-md py-2 text-sm font-semibold transition',
              mode === 'signup' ? 'bg-white text-brand-700 shadow' : 'text-slate-500',
            ].join(' ')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === 'signup' && (
            <Field label="Name">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mohan Kumar"
                autoFocus
              />
            </Field>
          )}

          <Field label={mode === 'signin' ? 'Email or Username' : 'Email ID'}>
            <input
              className="input"
              type={mode === 'signup' ? 'email' : 'text'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'signin' ? 'you@example.com' : 'you@example.com'}
              autoFocus={mode === 'signin'}
            />
          </Field>

          {mode === 'signup' && (
            <Field label="Mobile Number">
              <input
                className="input"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. 9876543210"
              />
            </Field>
          )}

          <Field label="Password">
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button className="btn-primary w-full" disabled={loading}>
            {loading
              ? 'Please wait…'
              : mode === 'signin'
                ? 'Sign In'
                : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          {mode === 'signin' ? (
            <>
              New here?{' '}
              <button
                type="button"
                className="font-semibold text-brand-600 hover:underline"
                onClick={() => switchMode('signup')}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="font-semibold text-brand-600 hover:underline"
                onClick={() => switchMode('signin')}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  )
}
