import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  remingtonGailExercises,
  getRemingtonGailExercise,
} from '../data/remingtonGailLessons'
import {
  getHindiLayout,
  hindiLayouts,
  nextKeyToward,
  rawKeyOutput,
  MANGAL_FONT,
  type HindiLayout,
} from '../lib/hindiLayouts'
import { useHindiLayoutInput } from '../lib/useHindiLayoutInput'
import UnicodeKeyboard, { keyDefToEventCode } from '../components/UnicodeKeyboard'
import { keyboardRows, fingerNames } from '../data/keyboard'
import StatBar from '../components/StatBar'
import CertificateResult from '../components/CertificateResult'
import TypingText from '../components/TypingText'
import LineTyping from '../components/LineTyping'
import { useTypingSession, type BackspaceMode } from '../lib/useTypingSession'
import { api, getStoredUser } from '../api'

/* ------------------------------------------------------------------ */
/* Completion progress (persisted in localStorage)                     */
/* ------------------------------------------------------------------ */
type Progress = Record<string, { wpm: number; accuracy: number }>
const PROGRESS_KEY = 'remington-gail-progress'

function loadProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
  } catch {
    return {}
  }
}
function persistProgress(p: Progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p))
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

const REMINGTON_GAIL: HindiLayout = getHindiLayout('remington-gail') || hindiLayouts[0]

export default function RemingtonGailCourse() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()

  const exercise = exerciseId ? getRemingtonGailExercise(exerciseId) : undefined
  const exIndex = exercise
    ? remingtonGailExercises.findIndex((e) => e.id === exercise.id)
    : -1

  // ---- display + typing options (all the usual ones) ----
  const [fontSize, setFontSize] = useState(28)
  const [bold, setBold] = useState(false)
  const [imageStyle, setImageStyle] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(true)
  const [showStatusBar, setShowStatusBar] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [settings, setSettings] = useState({
    backspaceMode: 'full' as BackspaceMode,
    moveOnError: true,
    playSounds: false,
  })

  const [progress, setProgress] = useState<Progress>(() => loadProgress())

  // ---- typing session (hooks must run unconditionally) ----
  const target = exercise?.text ?? ''
  const session = useTypingSession(target, settings)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const onKeyDown = useHindiLayoutInput(REMINGTON_GAIL, session, target)

  useEffect(() => {
    session.reset()
    if (exercise) surfaceRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  useEffect(() => {
    if (session.isDone && session.finishedAt && exercise) {
      setShowResult(true)
      // Mark this exercise complete (tick + "Complete").
      setProgress((prev) => {
        const next = {
          ...prev,
          [exercise.id]: { wpm: session.stats.wpm, accuracy: session.stats.accuracy },
        }
        persistProgress(next)
        return next
      })
      const user = getStoredUser()
      api
        .saveResult({
          userId: user?.id ?? null,
          module: `hindi-remington-gail-learn:${exercise.id}`,
          wpm: session.stats.wpm,
          accuracy: session.stats.accuracy,
          errors: session.stats.errors,
          durationSec: session.stats.elapsedSec,
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.isDone, session.finishedAt])

  const nextKey = nextKeyToward(REMINGTON_GAIL, session.typed, target)

  function goToExercise(idx: number) {
    if (idx >= 0 && idx < remingtonGailExercises.length) {
      navigate(`/hindi/remington-gail/${remingtonGailExercises[idx].id}`)
    }
  }

  // ================================================================
  // LIST VIEW — all exercises
  // ================================================================
  if (!exercise) {
    const doneCount = remingtonGailExercises.filter((e) => progress[e.id]).length
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-accent-600">
              Hindi (Mangal Unicode) • Remington GAIL
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Remington GAIL — {remingtonGailExercises.length} Exercises
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              किसी भी अभ्यास पर <b>Start</b> दबाएँ और पूरा ड्रिल टाइप करें। पूरा होने पर उस पर{' '}
              <span className="font-semibold text-emerald-600">✓ Complete</span> दिखेगा।
            </p>
          </div>
          <div className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
            Completed:{' '}
            <span className="text-emerald-600">
              {doneCount}/{remingtonGailExercises.length}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {remingtonGailExercises.map((e) => {
            const done = progress[e.id]
            return (
              <div
                key={e.id}
                className={[
                  'card flex flex-col gap-3 p-4 transition hover:shadow-md',
                  done ? 'ring-1 ring-emerald-200' : '',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={[
                      'grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-sm font-bold',
                      done ? 'bg-emerald-500 text-white' : 'bg-brand-100 text-brand-700',
                    ].join(' ')}
                  >
                    {done ? '✓' : e.number}
                  </span>
                  {done && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                      Complete · {done.wpm} WPM
                    </span>
                  )}
                </div>
                <div className="min-h-[40px]">
                  <div
                    className="font-bold text-slate-800"
                    style={{ fontFamily: MANGAL_FONT }}
                  >
                    {e.title}
                  </div>
                  {e.focus && (
                    <div className="mt-1 text-xs text-slate-400" style={{ fontFamily: MANGAL_FONT }}>
                      {e.focus}
                    </div>
                  )}
                </div>
                <Link
                  to={`/hindi/remington-gail/${e.id}`}
                  className={[
                    'mt-auto rounded-lg px-3 py-2 text-center text-sm font-semibold transition',
                    done
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-brand-600 text-white hover:bg-brand-700',
                  ].join(' ')}
                >
                  {done ? 'Practise again' : 'Start'}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ================================================================
  // DRILL VIEW — single exercise (clean: no stage tabs / layout switch)
  // ================================================================
  const isComplete = session.isDone || Boolean(progress[exercise.id])

  return (
    <div className="space-y-4">
      {/* Top bar: Back + Prev / dropdown / Next  */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/hindi/remington-gail" className="btn-ghost">
          ← Back to exercises
        </Link>
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost px-2"
            disabled={exIndex <= 0}
            onClick={() => goToExercise(exIndex - 1)}
          >
            ‹ Prev
          </button>
          <select
            className="input w-auto"
            value={exercise.id}
            onChange={(e) => navigate(`/hindi/remington-gail/${e.target.value}`)}
          >
            {remingtonGailExercises.map((e, i) => (
              <option key={e.id} value={e.id}>
                {progress[e.id] ? '✓ ' : ''}
                {i + 1}. {e.title}
              </option>
            ))}
          </select>
          <button
            className="btn-ghost px-2"
            disabled={exIndex >= remingtonGailExercises.length - 1}
            onClick={() => goToExercise(exIndex + 1)}
          >
            Next ›
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-accent-600">
          Remington GAIL • Exercise {exIndex + 1} of {remingtonGailExercises.length}
        </div>
        <h1 className="text-xl font-extrabold text-slate-900" style={{ fontFamily: MANGAL_FONT }}>
          {exercise.title}
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[200px_1fr_220px]">
        {/* Left: display options */}
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
          </div>
        </aside>

        {/* Center */}
        <div className="space-y-3">
          {isComplete && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white">
                ✓
              </span>
              Complete
              {session.isDone && (
                <span className="ml-auto font-semibold text-emerald-600">
                  {session.stats.wpm} WPM • {session.stats.accuracy}% accuracy
                </span>
              )}
            </div>
          )}

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
            <KeyHint layout={REMINGTON_GAIL} nextCode={nextKey?.code} nextShift={nextKey?.shift} />
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

          {showKeyboard && (
            <UnicodeKeyboard layout={REMINGTON_GAIL} nextCode={nextKey?.code} nextShift={nextKey?.shift} />
          )}
        </div>

        {/* Right: settings */}
        <aside className="space-y-4">
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

          <div className="flex justify-center">
            <Link to="/hindi/mangal/remington-gail/test" className="btn-ghost w-full justify-center">
              Go to Remington GAIL Test →
            </Link>
          </div>

          {!getStoredUser() && (
            <div className="card bg-brand-50 p-4 text-sm text-brand-800 ring-brand-200">
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => window.dispatchEvent(new Event('open-auth'))}
              >
                Sign in
              </button>{' '}
              to save your progress and reports.
            </div>
          )}
        </aside>
      </div>

      {showResult && (
        <CertificateResult
          title="Remington GAIL — Practice"
          userName={getStoredUser()?.name || 'Guest'}
          exerciseTitle={`Exercise ${exIndex + 1}: ${exercise.title}`}
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
            exIndex < remingtonGailExercises.length - 1
              ? () => {
                  setShowResult(false)
                  goToExercise(exIndex + 1)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}

/** Readable QWERTY label for a KeyboardEvent.code (e.g. "KeyD" → "D"). */
const CODE_LABELS: Record<string, string> = {
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Space: 'Space',
}
function codeToLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  return CODE_LABELS[code] ?? code
}

function KeyHint({
  layout,
  nextCode,
  nextShift,
}: {
  layout: HindiLayout
  nextCode?: string | null
  nextShift?: boolean
}) {
  if (!nextCode) return <div className="flex-1" />

  const keyDef = keyboardRows.flat().find((d) => keyDefToEventCode(d) === nextCode)
  const keyLabel = codeToLabel(nextCode)
  const glyph = rawKeyOutput(layout, nextCode, !!nextShift, false)
  const showGlyph = Boolean(glyph && glyph.trim())

  return (
    <div className="flex flex-1 flex-wrap items-center justify-center gap-1.5 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Press</span>
      {nextShift && (
        <>
          <Keycap>⇧ Shift</Keycap>
          <span className="text-slate-300">+</span>
        </>
      )}
      <Keycap wide={keyLabel.length > 1}>{keyLabel}</Keycap>
      {showGlyph && (
        <>
          <span className="text-slate-300">→</span>
          <span className="leading-none text-brand-700" style={{ fontFamily: MANGAL_FONT, fontSize: 22 }}>
            {glyph}
          </span>
        </>
      )}
      {keyDef && (
        <span className="ml-1 hidden text-xs font-medium text-slate-400 md:inline">
          ({fingerNames[keyDef.finger]})
        </span>
      )}
    </div>
  )
}

function Keycap({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <span
      className={[
        'inline-grid h-8 place-items-center rounded-md bg-slate-900 text-xs font-bold text-white shadow-sm ring-1 ring-slate-700',
        wide ? 'px-2.5' : 'min-w-[2rem]',
      ].join(' ')}
    >
      {children}
    </span>
  )
}
