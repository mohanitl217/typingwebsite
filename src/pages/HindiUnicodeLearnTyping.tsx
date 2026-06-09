import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { mangalLessons, getMangalLesson } from '../data/mangalLessons'
import { getHindiLayout, hindiLayouts, findKeyForNext, MANGAL_FONT } from '../lib/hindiLayouts'
import { useHindiLayoutInput } from '../lib/useHindiLayoutInput'
import UnicodeKeyboard from '../components/UnicodeKeyboard'
import StatBar from '../components/StatBar'
import CertificateResult from '../components/CertificateResult'
import TypingText from '../components/TypingText'
import LineTyping from '../components/LineTyping'
import { useTypingSession } from '../lib/useTypingSession'
import { api, getStoredUser } from '../api'

const STAGES = ['Read Instructions', 'Learn Keys', 'Practice Words', 'Type Paragraphs'] as const

export default function HindiUnicodeLearnTyping() {
  const { layout: layoutSlug, lessonId } = useParams()
  const navigate = useNavigate()
  const layout = getHindiLayout(layoutSlug) || hindiLayouts[0]
  const lesson = getMangalLesson(lessonId || '') || mangalLessons[0]
  const lessonIndex = mangalLessons.findIndex((l) => l.id === lesson.id)

  const [stage, setStage] = useState(0)
  const [exIndex, setExIndex] = useState(0)
  const [fontSize, setFontSize] = useState(28)
  const [bold, setBold] = useState(false)
  const [imageStyle, setImageStyle] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(true)
  const [showStatusBar, setShowStatusBar] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const settings = { backspaceMode: 'full' as const, moveOnError: true, playSounds: false }

  const exercises = useMemo(() => {
    if (stage === 1) return lesson.drills
    if (stage === 2) {
      const lines: string[] = []
      for (let i = 0; i < lesson.words.length; i += 6) {
        lines.push(lesson.words.slice(i, i + 6).join(' '))
      }
      return lines
    }
    if (stage === 3) return lesson.paragraphs
    return []
  }, [stage, lesson])

  const target = exercises[exIndex] || ''
  const session = useTypingSession(target, settings)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const onKeyDown = useHindiLayoutInput(layout, session, target)

  useEffect(() => {
    session.reset()
    if (stage > 0) surfaceRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, stage, layout.id])

  useEffect(() => {
    if (session.isDone && session.finishedAt) {
      setShowResult(true)
      const user = getStoredUser()
      api
        .saveResult({
          userId: user?.id ?? null,
          module: `hindi-mangal-${layout.id}-learn:${lesson.id}:${STAGES[stage]}`,
          wpm: session.stats.wpm,
          accuracy: session.stats.accuracy,
          errors: session.stats.errors,
          durationSec: session.stats.elapsedSec,
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.isDone, session.finishedAt])

  const remaining = target.slice(session.typed.length)
  const nextKey = findKeyForNext(layout, remaining)

  function changeLesson(dir: -1 | 1) {
    const ni = lessonIndex + dir
    if (ni >= 0 && ni < mangalLessons.length) {
      navigate(`/hindi/mangal/${layout.slug}/learn/${mangalLessons[ni].id}`)
      setStage(0)
      setExIndex(0)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header + layout switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-accent-600">
            Hindi (Mangal Unicode) • {layout.label} • Lesson {lessonIndex + 1} of {mangalLessons.length}
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">{lesson.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {hindiLayouts.map((l) => (
            <Link
              key={l.id}
              to={`/hindi/mangal/${l.slug}/learn/${lesson.id}`}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition',
                l.id === layout.id
                  ? 'bg-brand-600 text-white ring-brand-700'
                  : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
              ].join(' ')}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Lesson nav */}
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-ghost" disabled={lessonIndex === 0} onClick={() => changeLesson(-1)}>
          ‹ Prev
        </button>
        <select
          className="input w-auto"
          value={lesson.id}
          onChange={(e) => {
            navigate(`/hindi/mangal/${layout.slug}/learn/${e.target.value}`)
            setStage(0)
            setExIndex(0)
          }}
        >
          {mangalLessons.map((l, i) => (
            <option key={l.id} value={l.id}>
              {i + 1}. {l.title}
            </option>
          ))}
        </select>
        <button
          className="btn-ghost"
          disabled={lessonIndex === mangalLessons.length - 1}
          onClick={() => changeLesson(1)}
        >
          Next ›
        </button>
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

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="space-y-3">
          {stage === 0 ? (
            <Instructions lesson={lesson} onStart={() => setStage(1)} />
          ) : (
            <>
              {imageStyle ? (
                <LineTyping
                  target={target}
                  typed={session.typed}
                  bold={bold}
                  fontFamily={MANGAL_FONT}
                  onKeyDown={onKeyDown}
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
                  fontFamily={MANGAL_FONT}
                  className="min-h-[110px]"
                />
              )}

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
                <div className="flex items-center gap-1">
                  <button className="btn-ghost px-2" onClick={() => setFontSize(Math.max(16, fontSize - 2))}>
                    A-
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-slate-500">{fontSize}</span>
                  <button className="btn-ghost px-2" onClick={() => setFontSize(Math.min(48, fontSize + 2))}>
                    A+
                  </button>
                </div>
              </div>

              {/* typing surface (real Unicode Devanagari) */}
              {/* typing surface (hidden in image style — the strip is the input) */}
              {!imageStyle && (
                <div
                  ref={surfaceRef}
                  tabIndex={0}
                  onKeyDown={onKeyDown}
                  className="min-h-[110px] cursor-text rounded-xl bg-slate-900 p-4 text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-brand-500"
                  style={{ fontSize, whiteSpace: 'pre-wrap', fontFamily: MANGAL_FONT }}
                  onClick={() => surfaceRef.current?.focus()}
                >
                  {session.typed.length === 0 && (
                    <span className="text-slate-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Click here and start typing…
                    </span>
                  )}
                  {[...session.typed].map((ch, i) => (
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

              {showKeyboard && <UnicodeKeyboard layout={layout} nextCode={nextKey?.code} nextShift={nextKey?.shift} />}
            </>
          )}
        </div>

        {/* Right: settings */}
        <aside className="space-y-4">
          <div className="card p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Options</div>
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
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showKeyboard}
                onChange={(e) => setShowKeyboard(e.target.checked)}
              />
              Show Keyboard
            </label>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showStatusBar}
                onChange={(e) => setShowStatusBar(e.target.checked)}
              />
              Show Status Bar
            </label>
          </div>

          <div className="card p-4 text-xs text-slate-500">
            <div className="font-bold text-slate-600">{layout.label}</div>
            <p className="mt-1">{layout.description}</p>
            <p className="mt-2">
              Type the highlighted key on the on-screen keyboard. Output is real Unicode Devanagari,
              so it works in any Mangal/Unicode application.
            </p>
          </div>

          <div className="flex justify-center">
            <Link to={`/hindi/mangal/${layout.slug}/test`} className="btn-ghost w-full justify-center">
              Go to {layout.label} Test →
            </Link>
          </div>

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
          title={`Hindi (${layout.label}) — ${STAGES[stage]}`}
          userName={getStoredUser()?.name || 'Guest'}
          exerciseTitle={`${lesson.title} — ${STAGES[stage]} (Exercise ${exIndex + 1})`}
          target={target}
          typed={session.typed}
          stats={session.stats}
          fontFamily={MANGAL_FONT}
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

function Instructions({
  lesson,
  onStart,
}: {
  lesson: ReturnType<typeof getMangalLesson>
  onStart: () => void
}) {
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
            className="grid h-10 min-w-[40px] place-items-center rounded-md bg-slate-900 px-3 text-white"
            style={{ fontFamily: MANGAL_FONT, fontSize: 20 }}
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
