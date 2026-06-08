import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getToken, clearToken } from '../api'
import type { Exercise, TestResult, User } from '../types'
import { lessons } from '../data/lessons'
import { hindiLessons } from '../data/hindiLessons'
import type { Lesson } from '../data/lessons'

type Tab = 'exercises' | 'lessons' | 'users' | 'results'

const TAB_LABELS: Record<Tab, string> = {
  exercises: 'Test Exercises',
  lessons: 'Learn Typing',
  users: 'Users',
  results: 'Results',
}

/** Built-in Learn-Typing lesson sets (static, code-defined). */
const LESSON_GROUPS: { label: string; lessons: Lesson[] }[] = [
  { label: 'Learn Typing — English', lessons },
  { label: 'Learn Typing — Hindi (KrutiDev / DevLys)', lessons: hindiLessons },
]

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

      <div className="flex flex-wrap gap-2">
        {(['exercises', 'lessons', 'users', 'results'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'rounded-lg px-4 py-2 text-sm font-semibold transition',
              tab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200',
            ].join(' ')}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'exercises' && <ExercisesTab />}
      {tab === 'lessons' && <LessonsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'results' && <ResultsTab />}
    </div>
  )
}

function ExercisesTab() {
  const [list, setList] = useState<Exercise[]>([])
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [category, setCategory] = useState('english-test')
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
        await api.adminUpdateExercise(editingId, { title, text, category })
      } else {
        await api.adminCreateExercise({ title, text, category, type: 'paragraph' })
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
                  setCategory(ex.category || 'english-test')
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
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="english-test">English Test</option>
          <option value="hindi-krutidev-test">Hindi Test (KrutiDev / DevLys)</option>
        </select>
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

function LessonsTab() {
  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700 ring-1 ring-amber-100">
        These are the built-in <b>Learn Typing</b> lessons (drills, words &amp; paragraphs) shown for
        reference. They are defined in the app and are read-only here.
      </p>
      {LESSON_GROUPS.map((group) => (
        <div key={group.label} className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="min-w-0">
              <div className="truncate font-bold text-slate-800">{group.label}</div>
              <div className="text-xs text-slate-400">
                {group.lessons.length} lesson{group.lessons.length === 1 ? '' : 's'}
              </div>
            </div>
            <span className="flex-shrink-0 rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              Built-in
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {group.lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const [open, setOpen] = useState(false)
  const counts = `${lesson.drills.length} drills · ${lesson.words.length} words · ${lesson.paragraphs.length} paragraphs`
  return (
    <div className="p-4">
      <button
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="min-w-0">
          <div className="font-semibold text-slate-800">{lesson.title}</div>
          <div className="mt-0.5 text-xs text-slate-400">{counts}</div>
        </div>
        <span className="flex-shrink-0 text-slate-400">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <LessonBlock title="Keys" items={lesson.keys} mono />
          <LessonBlock title="Instructions" items={lesson.instructions} />
          <LessonBlock title="Drills" items={lesson.drills} mono />
          <LessonBlock title="Words" items={lesson.words} mono />
          <LessonBlock title="Paragraphs" items={lesson.paragraphs} mono />
        </div>
      )}
    </div>
  )
}

function LessonBlock({ title, items, mono }: { title: string; items: string[]; mono?: boolean }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</div>
      <ul className={`mt-1 space-y-1 text-sm text-slate-600 ${mono ? 'font-mono' : ''}`}>
        {items.map((it, i) => (
          <li key={i} className="rounded bg-slate-50 px-2 py-1">
            {it}
          </li>
        ))}
      </ul>
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
