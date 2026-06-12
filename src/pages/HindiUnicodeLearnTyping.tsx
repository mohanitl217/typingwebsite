import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { mangalLessons, getMangalLesson } from '../data/mangalLessons'
import {
  getHindiLayout,
  hindiLayouts,
  nextKeyToward,
  typingCursorIndex,
  floatedMatraIndex,
  buildTypingStrip,
  incompleteAksharaStart,
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

  const [settings, setSettings] = useState({
    backspaceMode: 'full' as BackspaceMode,
    moveOnError: true,
    playSounds: false,
  })

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
  const { onKeyDown, pending: pendingMatra, pendingHalf, flash } = useHindiLayoutInput(layout, session, target)

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

  const nextKey = nextKeyToward(layout, session.typed, target, pendingMatra, pendingHalf)
  const cursorIndex = typingCursorIndex(layout, session.typed, target, pendingMatra)
  const floatedIndex = pendingMatra ? floatedMatraIndex(layout, session.typed, target) : null
  const strip = useMemo(
    () => buildTypingStrip(layout, target, session.typed, pendingMatra, pendingHalf),
    [layout, target, session.typed, pendingMatra, pendingHalf],
  )
  const incompleteStart = incompleteAksharaStart(target, session.typed.length)

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
              to={
                l.id === 'remington-gail'
                  ? '/hindi/remington-gail'
                  : `/hindi/mangal/${l.slug}/learn/${lesson.id}`
              }
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
                  flash={flash}
                  segments={strip}
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
                  cursorIndex={cursorIndex}
                  floatedIndex={floatedIndex}
                  flash={flash}
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
                <KeyHint layout={layout} nextCode={nextKey?.code} nextShift={nextKey?.shift} />
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
                      className={
                        ch !== target[i]
                          ? 'bg-rose-500/40 text-rose-200'
                          : incompleteStart !== null && i >= incompleteStart
                            ? 'text-amber-300'
                            : 'text-emerald-400'
                      }
                    >
                      {ch === '\n' ? '\u21B5\n' : ch}
                    </span>
                  ))}
                  {pendingMatra && (
                    <span
                      className="rounded bg-amber-400/20 px-0.5 text-amber-300"
                      title="short-i matra held — now type its consonant"
                    >
                      {'\u25CC\u093F'}
                    </span>
                  )}
                  {pendingHalf && (
                    <span
                      className="rounded bg-amber-400/20 px-0.5 text-amber-300"
                      title="half letter typed — now press the ा completer"
                    >
                      {pendingHalf + '\u094D'}
                    </span>
                  )}
                  <span
                    className={
                      flash
                        ? 'rounded bg-rose-500/40 px-0.5 text-rose-200'
                        : 'animate-pulse text-brand-400'
                    }
                  >
                    ▎
                  </span>
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
            <Link to={`/hindi/mangal/${layout.slug}/test`} className="btn-ghost w-full justify-center">
              Go to {layout.label} Test →
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

/**
 * Shows which physical QWERTY key to press next for the Unicode (Mangal)
 * layouts (Remington GAIL / InScript / Remington CBI). Unlike the glyph fonts,
 * one key press maps to real Devanagari via the layout IME, so we preview the
 * exact output that the keystroke produces (plus Shift + finger guidance).
 */
function KeyHint({
  layout,
  nextCode,
  nextShift,
}: {
  layout: HindiLayout
  nextCode?: string | null
  nextShift?: boolean
}) {
  // Keep the slot present (centred) so surrounding controls don't jump around.
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
