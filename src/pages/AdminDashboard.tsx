import { useEffect, useMemo, useState } from 'react'
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

/** All manageable typing sections. Admins can add/edit/delete exercises in each. */
const SECTIONS: { category: string; label: string }[] = [
  { category: 'english-test', label: 'English Typing Test' },
  { category: 'hindi-krutidev-test', label: 'Hindi Typing — KrutiDev & DevLys' },
  { category: 'hindi-remington-gail-test', label: 'Hindi Unicode — Remington (GAIL)' },
  { category: 'hindi-inscript-test', label: 'Hindi Unicode — INSCRIPT' },
  { category: 'hindi-remington-cbi-test', label: 'Hindi Unicode — Remington (CBI)' },
  { category: 'numbers-test', label: 'Number Typing' },
]

const EXERCISE_TYPES: Exercise['type'][] = ['paragraph', 'words', 'numbers']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('exercises')
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      navigate('/')
      return
    }
    api
      .adminMe()
      .then(() => setAuthed(true))
      .catch(() => {
        clearToken()
        navigate('/')
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
            navigate('/')
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
  const [loading, setLoading] = useState(true)
  // Editor state: open when set. `ex` present => editing, otherwise adding to `category`.
  const [editor, setEditor] = useState<null | { ex?: Exercise; category: string }>(null)

  async function load() {
    setLoading(true)
    try {
      setList(await api.adminListExercises())
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  async function remove(id: string) {
    if (!confirm('Delete this exercise?')) return
    await api.adminDeleteExercise(id)
    await load()
  }

  // Group exercises by category.
  const byCat = useMemo(() => {
    const m: Record<string, Exercise[]> = {}
    for (const ex of list) (m[ex.category] ||= []).push(ex)
    return m
  }, [list])

  const knownCats = new Set(SECTIONS.map((s) => s.category))
  const otherCats = Object.keys(byCat).filter((c) => !knownCats.has(c))

  if (loading) {
    return <div className="card p-8 text-center text-slate-500">Loading exercises…</div>
  }

  return (
    <div className="space-y-4">
      {SECTIONS.map((sec) => (
        <SectionCard
          key={sec.category}
          label={sec.label}
          items={byCat[sec.category] || []}
          onAdd={() => setEditor({ category: sec.category })}
          onEdit={(ex) => setEditor({ ex, category: ex.category })}
          onDelete={remove}
        />
      ))}

      {otherCats.map((c) => (
        <SectionCard
          key={c}
          label={c}
          items={byCat[c]}
          onAdd={() => setEditor({ category: c })}
          onEdit={(ex) => setEditor({ ex, category: ex.category })}
          onDelete={remove}
        />
      ))}

      {editor && (
        <ExerciseEditorModal
          initial={editor}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            setEditor(null)
            await load()
          }}
        />
      )}
    </div>
  )
}

function sectionLabel(category: string) {
  return SECTIONS.find((s) => s.category === category)?.label ?? category
}

function SectionCard({
  label,
  items,
  onAdd,
  onEdit,
  onDelete,
}: {
  label: string
  items: Exercise[]
  onAdd: () => void
  onEdit: (ex: Exercise) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate font-bold text-slate-800">{label}</div>
          <div className="text-xs text-slate-400">
            {items.length} exercise{items.length === 1 ? '' : 's'}
          </div>
        </div>
        <button className="btn-primary flex-shrink-0 px-3 py-1.5 text-sm" onClick={onAdd}>
          + Add Exercise
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {items.length === 0 && (
          <div className="p-4 text-sm text-slate-400">No exercises in this section yet.</div>
        )}
        {items.map((ex) => (
          <div key={ex.id} className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="font-semibold text-slate-800">{ex.title}</div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{ex.text}</p>
              <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                {ex.type}
              </span>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <button className="btn-ghost px-2 py-1 text-xs" onClick={() => onEdit(ex)}>
                Edit
              </button>
              <button
                className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                onClick={() => onDelete(ex.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExerciseEditorModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: { ex?: Exercise; category: string }
  onClose: () => void
  onSaved: () => Promise<void> | void
}) {
  const editing = Boolean(initial.ex)
  const [title, setTitle] = useState(initial.ex?.title ?? '')
  const [text, setText] = useState(initial.ex?.text ?? '')
  const [category, setCategory] = useState(initial.ex?.category ?? initial.category)
  const [type, setType] = useState<Exercise['type']>(initial.ex?.type ?? 'paragraph')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !text.trim()) {
      setError('Title and passage text are both required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await api.adminUpdateExercise(initial.ex!.id, { title, text, category, type })
      } else {
        await api.adminCreateExercise({ title, text, category, type })
      }
      await onSaved()
    } catch (err: any) {
      setError(err.message || 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form
        onSubmit={save}
        className="w-full max-w-lg animate-fade-in space-y-3 rounded-xl bg-white p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800">
            {editing ? 'Edit Exercise' : 'Add Exercise'}
          </h3>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
            {sectionLabel(category)}
          </span>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500">Title</label>
          <input
            className="input mt-1"
            placeholder="Exercise title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">Section</label>
            <select
              className="input mt-1"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {SECTIONS.map((s) => (
                <option key={s.category} value={s.category}>
                  {s.label}
                </option>
              ))}
              {!SECTIONS.some((s) => s.category === category) && (
                <option value={category}>{category}</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Type</label>
            <select
              className="input mt-1"
              value={type}
              onChange={(e) => setType(e.target.value as Exercise['type'])}
            >
              {EXERCISE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500">Passage text</label>
          <textarea
            className="input mt-1 min-h-[160px]"
            placeholder="Paste the passage text…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
          </button>
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
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Mobile</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Attempts</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                No users yet.
              </td>
            </tr>
          )}
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 font-semibold text-slate-800">{u.name}</td>
              <td className="px-4 py-3 text-slate-600">{u.email || '-'}</td>
              <td className="px-4 py-3 text-slate-600">{u.mobile || '-'}</td>
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
