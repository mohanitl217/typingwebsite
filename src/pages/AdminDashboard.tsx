import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken, clearToken } from '../api'
import type { Exercise, TestResult, User } from '../types'

type Tab = 'exercises' | 'users' | 'results'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('exercises')
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      navigate('/admin')
      return
    }
    api
      .adminMe()
      .then(() => setAuthed(true))
      .catch(() => {
        clearToken()
        navigate('/admin')
      })
  }, [navigate])

  if (!authed) return <div className="card p-8 text-center text-slate-500">Checking access…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-900">Admin Dashboard</h1>
        <button
          className="btn-ghost"
          onClick={() => {
            clearToken()
            navigate('/admin')
          }}
        >
          Logout
        </button>
      </div>

      <div className="flex gap-2">
        {(['exercises', 'users', 'results'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'rounded-lg px-4 py-2 text-sm font-semibold capitalize transition',
              tab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'exercises' && <ExercisesTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'results' && <ResultsTab />}
    </div>
  )
}

function ExercisesTab() {
  const [list, setList] = useState<Exercise[]>([])
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setList(await api.adminListExercises())
  }
  useEffect(() => {
    load()
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await api.adminUpdateExercise(editingId, { title, text })
      } else {
        await api.adminCreateExercise({ title, text, category: 'english-test', type: 'paragraph' })
      }
      setTitle('')
      setText('')
      setEditingId(null)
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this exercise?')) return
    await api.adminDeleteExercise(id)
    await load()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="card divide-y divide-slate-100">
        {list.length === 0 && <div className="p-6 text-sm text-slate-500">No exercises yet.</div>}
        {list.map((ex) => (
          <div key={ex.id} className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="font-semibold text-slate-800">{ex.title}</div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{ex.text}</p>
              <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                {ex.category}
              </span>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <button
                className="btn-ghost px-2 py-1 text-xs"
                onClick={() => {
                  setEditingId(ex.id)
                  setTitle(ex.title)
                  setText(ex.text)
                }}
              >
                Edit
              </button>
              <button
                className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                onClick={() => remove(ex.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={save} className="card h-fit space-y-3 p-4">
        <div className="font-bold text-slate-700">{editingId ? 'Edit exercise' : 'Add exercise'}</div>
        <input
          className="input"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="input min-h-[160px]"
          placeholder="Paste the passage text…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <button className="btn-primary flex-1">{editingId ? 'Update' : 'Create'}</button>
          {editingId && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setEditingId(null)
                setTitle('')
                setText('')
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  async function load() {
    setUsers(await api.adminListUsers())
  }
  useEffect(() => {
    load()
  }, [])

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Attempts</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                No users yet.
              </td>
            </tr>
          )}
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 font-semibold text-slate-800">{u.name}</td>
              <td className="px-4 py-3">
                <span
                  className={[
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
                  ].join(' ')}
                >
                  {u.active ? 'Active' : 'Blocked'}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{u.attempts ?? 0}</td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex gap-2">
                  <button
                    className="btn-ghost px-2 py-1 text-xs"
                    onClick={async () => {
                      await api.adminSetUserActive(u.id, !u.active)
                      load()
                    }}
                  >
                    {u.active ? 'Block' : 'Unblock'}
                  </button>
                  <button
                    className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                    onClick={async () => {
                      if (!confirm('Delete user and their results?')) return
                      await api.adminDeleteUser(u.id)
                      load()
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ResultsTab() {
  const [results, setResults] = useState<TestResult[]>([])
  useEffect(() => {
    api.adminListResults().then(setResults).catch(() => {})
  }, [])

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Module</th>
            <th className="px-4 py-3">WPM</th>
            <th className="px-4 py-3">Accuracy</th>
            <th className="px-4 py-3">Errors</th>
            <th className="px-4 py-3">When</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {results.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                No results recorded yet.
              </td>
            </tr>
          )}
          {results.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-semibold text-slate-800">{r.userName}</td>
              <td className="px-4 py-3 text-slate-600">{r.module}</td>
              <td className="px-4 py-3 font-bold text-brand-600">{r.wpm}</td>
              <td className="px-4 py-3 text-emerald-600">{r.accuracy}%</td>
              <td className="px-4 py-3 text-rose-600">{r.errors}</td>
              <td className="px-4 py-3 text-slate-500">{new Date(r.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
