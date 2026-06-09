import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { lessons, getLesson } from '../data/lessons'
import VirtualKeyboard from '../components/VirtualKeyboard'
import { Hand, fingersForChar } from '../components/Hands'
import StatBar from '../components/StatBar'
import CertificateResult from '../components/CertificateResult'
import TypingText from '../components/TypingText'
import LineTyping from '../components/LineTyping'
import { useTypingSession, type BackspaceMode } from '../lib/useTypingSession'
import { api, getStoredUser } from '../api'

const STAGES = ['Read Instructions', 'Learn Keys', 'Practice Words', 'Type Paragraphs'] as const

export default function LearnTyping() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const lesson = getLesson(lessonId || '') || lessons[0]
  const lessonIndex = lessons.findIndex((l) => l.id === lesson.id)

  const [stage, setStage] = useState(0)
  const [exIndex, setExIndex] = useState(0)
  const [fontSize, setFontSize] = useState(18)
  const [bold, setBold] = useState(false)
  const [imageStyle, setImageStyle] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(true)
  const [showResult, setShowResult] = useState(false)
  // Live status bar is hidden by default; a checkbox in Settings shows/hides it.
  const [showStatusBar, setShowStatusBar] = useState(false)

  const [settings, setSettings] = useState({
    backspaceMode: 'full' as BackspaceMode,
    moveOnError: true,
    playSounds: false,
  })

  // Build the list of exercise texts for the current stage.
  const exercises = useMemo(() => {
    if (stage === 1) return lesson.drills
    if (stage === 2) {
      // group words into lines of 8
      const lines: string[] = []
      for (let i = 0; i < lesson.words.length; i += 8) {
        lines.push(lesson.words.slice(i, i + 8).join(' '))
      }
      return lines
    }
    if (stage === 3) return lesson.paragraphs
    return []
  }, [stage, lesson])

  const target = exercises[exIndex] || ''
  const session = useTypingSession(target, settings)
  const surfaceRef = useRef<HTMLDivElement>(null)

  // reset when target changes
  useEffect(() => {
    session.reset()
    if (stage > 0) surfaceRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, stage])

  // when finished, show report + persist
  useEffect(() => {
    if (session.isDone && session.finishedAt) {
      setShowResult(true)
      const user = getStoredUser()
      api
        .saveResult({
          userId: user?.id ?? null,
          module: `learn:${lesson.id}:${STAGES[stage]}`,
          wpm: session.stats.wpm,
          accuracy: session.stats.accuracy,
          errors: session.stats.errors,
          durationSec: session.stats.elapsedSec,
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.isDone, session.finishedAt])

  const nextChar = target[session.typed.length]

  function changeLesson(dir: -1 | 1) {
    const ni = lessonIndex + dir
    if (ni >= 0 && ni < lessons.length) {
      navigate(`/learn/${lessons[ni].id}`)
      setStage(0)
      setExIndex(0)
    }
  }

  return (
    <div className="space-y-4">
      {/* Lesson header + nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Lesson {lessonIndex + 1} of {lessons.length}
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">{lesson.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" disabled={lessonIndex === 0} onClick={() => changeLesson(-1)}>
            ‹ Prev
          </button>
          <select
            className="input w-auto"
            value={lesson.id}
            onChange={(e) => {
              navigate(`/learn/${e.target.value}`)
              setStage(0)
              setExIndex(0)
            }}
          >
            {lessons.map((l, i) => (
              <option key={l.id} value={l.id}>
                {i + 1}. {l.title}
              </option>
            ))}
          </select>
          <button
            className="btn-ghost"
            disabled={lessonIndex === lessons.length - 1}
            onClick={() => changeLesson(1)}
          >
            Next ›
          </button>
        </div>
      </div>

      {/* Stage tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {STAGES.map((s, i) => (
          <button
            key={s}
            onClick={() => {
              setStage(i)
              setExIndex(0)
            }}
            className={[
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition',
              i === stage
                ? 'bg-brand-600 text-white shadow'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            ].join(' ')}
          >
            <span
              className={[
                'grid h-5 w-5 place-items-center rounded-full text-[11px]',
                i === stage ? 'bg-white/25' : 'bg-slate-100 text-slate-500',
              ].join(' ')}
            >
              {i + 1}
            </span>
            {s}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[200px_1fr_220px]">
        {/* Left: font + finger guide */}
        <aside className="space-y-4">
          {/* Display options are hidden while reading instructions */}
          {stage !== 0 && (
            <div className="card p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Display</div>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={bold} onChange={(e) => setBold(e.target.checked)} />
                Bold
              </label>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={imageStyle}
                  onChange={(e) => setImageStyle(e.target.checked)}
                />
                Image Style (single line)
              </label>
            </div>
          )}
          {/* Finger placement guidance is only relevant while reading instructions */}
          {stage === 0 && <FingerGuide lessonKeys={lesson.keys} />}
        </aside>

        {/* Center */}
        <div className="space-y-3">
          {stage === 0 ? (
            <Instructions lesson={lesson} onStart={() => setStage(1)} />
          ) : (
            <>
              {/* reference text (or image-style input strip) */}
              {imageStyle ? (
                <LineTyping
                  target={target}
                  typed={session.typed}
                  bold={bold}
                  onKeyDown={session.onKeyDown}
                  inputRef={surfaceRef}
                />
              ) : (
                <TypingText
                  target={target}
                  typed={session.typed}
                  highlight="word-error"
                  fontSize={fontSize}
                  bold={bold}
                  showScrollbar
                  autoScroll={false}
                  className="min-h-[120px]"
                />
              )}

              {/* exercise controls */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    className="btn-ghost px-2"
                    disabled={exIndex === 0}
                    onClick={() => setExIndex((i) => Math.max(0, i - 1))}
                  >
                    «
                  </button>
                  <select
                    className="input w-auto"
                    value={exIndex}
                    onChange={(e) => setExIndex(Number(e.target.value))}
                  >
                    {exercises.map((_, i) => (
                      <option key={i} value={i}>
                        Exercise {i + 1} / {exercises.length}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn-ghost px-2"
                    disabled={exIndex >= exercises.length - 1}
                    onClick={() => setExIndex((i) => Math.min(exercises.length - 1, i + 1))}
                  >
                    »
                  </button>
                </div>
                <FontSizer fontSize={fontSize} setFontSize={setFontSize} />
              </div>

              {/* typing surface (hidden in image style — the strip is the input) */}
              {!imageStyle && (
                <div
                  ref={surfaceRef}
                  tabIndex={0}
                  onKeyDown={session.onKeyDown}
                  className="min-h-[120px] cursor-text rounded-xl bg-slate-900 p-4 font-mono text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-brand-500"
                  style={{ fontSize, whiteSpace: 'pre-wrap' }}
                  onClick={() => surfaceRef.current?.focus()}
                >
                  {session.typed.length === 0 && (
                    <span className="text-slate-500">Click here and start typing…</span>
                  )}
                  {session.typed.split('').map((ch, i) => (
                    <span
                      key={i}
                      className={ch === target[i] ? 'text-emerald-400' : 'bg-rose-500/40 text-rose-200'}
                    >
                      {ch === '\n' ? '\u21B5\n' : ch}
                    </span>
                  ))}
                  <span className="animate-pulse text-brand-400">▎</span>
                </div>
              )}

              {showStatusBar && <StatBar stats={session.stats} />}

              {showKeyboard && (
                <div className="flex items-center justify-center gap-1">
                  <Hand side="left" active={fingersForChar(nextChar)} className="hidden h-36 w-24 shrink-0 sm:block lg:w-28" />
                  <div className="min-w-0 flex-1">
                    <VirtualKeyboard nextChar={nextChar} activeKeys={lesson.keys} />
                  </div>
                  <Hand side="right" active={fingersForChar(nextChar)} className="hidden h-36 w-24 shrink-0 sm:block lg:w-28" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: settings */}
        <aside className="space-y-4">
          {/* Settings are hidden while reading instructions */}
          {stage !== 0 && (
          <div className="card p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Settings</div>

            <div className="mt-3">
              <div className="text-xs font-semibold text-slate-500">Backspace Options</div>
              <div className="mt-1 space-y-1">
                {(
                  [
                    ['full', 'Full Backspace'],
                    ['word', 'One Word Backspace'],
                    ['off', 'Deactivate Backspace'],
                  ] as [BackspaceMode, string][]
                ).map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="bs"
                      checked={settings.backspaceMode === val}
                      onChange={() => setSettings((s) => ({ ...s, backspaceMode: val }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showStatusBar}
                  onChange={(e) => setShowStatusBar(e.target.checked)}
                />
                Show Status Bar
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showKeyboard}
                  onChange={(e) => setShowKeyboard(e.target.checked)}
                />
                Show Keyboard
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.playSounds}
                  onChange={(e) => setSettings((s) => ({ ...s, playSounds: e.target.checked }))}
                />
                Play Sounds
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.moveOnError}
                  onChange={(e) => setSettings((s) => ({ ...s, moveOnError: e.target.checked }))}
                />
                Move on Error
              </label>
            </div>
          </div>
          )}

          {!getStoredUser() && (
            <div className="card bg-brand-50 p-4 text-sm text-brand-800 ring-brand-200">
              <Link to="/login" className="font-semibold underline">
                Sign in
              </Link>{' '}
              to save your progress and reports.
            </div>
          )}
        </aside>
      </div>

      {showResult && (
        <CertificateResult
          title={`Learn Typing — ${STAGES[stage]}`}
          userName={getStoredUser()?.name || 'Guest'}
          exerciseTitle={`${lesson.title} — ${STAGES[stage]} (Exercise ${exIndex + 1})`}
          target={target}
          typed={session.typed}
          stats={session.stats}
          onClose={() => setShowResult(false)}
          onRepeat={() => {
            setShowResult(false)
            session.reset()
            surfaceRef.current?.focus()
          }}
          onNext={
            exIndex < exercises.length - 1
              ? () => {
                  setShowResult(false)
                  setExIndex((i) => i + 1)
                  setTimeout(() => surfaceRef.current?.focus(), 50)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}

function Instructions({ lesson, onStart }: { lesson: ReturnType<typeof getLesson>; onStart: () => void }) {
  if (!lesson) return null
  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold text-slate-900">How to do this lesson</h2>
      <ul className="mt-3 space-y-2">
        {lesson.instructions.map((line, i) => (
          <li key={i} className="flex gap-3 text-sm text-slate-600">
            <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
              {i + 1}
            </span>
            {line}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        {lesson.keys.map((k) => (
          <span
            key={k}
            className="rounded-md bg-slate-900 px-3 py-1.5 font-mono text-sm font-bold uppercase text-white"
          >
            {k}
          </span>
        ))}
      </div>
      <button className="btn-primary mt-5" onClick={onStart}>
        Start practising →
      </button>
    </div>
  )
}

function FingerGuide({ lessonKeys }: { lessonKeys: string[] }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Finger placement</div>
      <p className="mt-2 text-xs text-slate-500">
        Rest your fingers on the home row. Index fingers feel the bumps on{' '}
        <b className="text-slate-700">F</b> and <b className="text-slate-700">J</b>.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[11px] font-semibold">
        <div className="rounded-lg bg-rose-100 py-2 text-rose-700">Pinky<br />A · ;</div>
        <div className="rounded-lg bg-amber-100 py-2 text-amber-700">Ring<br />S · L</div>
        <div className="rounded-lg bg-emerald-100 py-2 text-emerald-700">Middle<br />D · K</div>
        <div className="rounded-lg bg-sky-100 py-2 text-sky-700">Index<br />F · J</div>
      </div>
    </div>
  )
}

function FontSizer({
  fontSize,
  setFontSize,
}: {
  fontSize: number
  setFontSize: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button className="btn-ghost px-2" onClick={() => setFontSize(Math.max(12, fontSize - 2))}>
        A-
      </button>
      <span className="w-6 text-center text-sm font-semibold text-slate-500">{fontSize}</span>
      <button className="btn-ghost px-2" onClick={() => setFontSize(Math.min(40, fontSize + 2))}>
        A+
      </button>
    </div>
  )
}
