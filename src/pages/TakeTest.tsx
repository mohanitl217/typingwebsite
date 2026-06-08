import { useEffect, useMemo, useRef, useState } from 'react'
import { api, getStoredUser } from '../api'
import type { Exercise } from '../types'
import TypingText, { type HighlightMode } from '../components/TypingText'
import StatBar from '../components/StatBar'
import CertificateResult from '../components/CertificateResult'
import { useTypingSession, type BackspaceMode } from '../lib/useTypingSession'

const DURATIONS = [1, 2, 5, 10, 15, 20]

/** Split plain text into indented paragraphs for word-processor mode. */
function toParagraphs(text: string, withTabs: boolean): string {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text]
  const paras: string[] = []
  for (let i = 0; i < sentences.length; i += 4) {
    const chunk = sentences
      .slice(i, i + 4)
      .join('')
      .trim()
    paras.push((withTabs ? '\t' : '') + chunk)
  }
  return paras.join('\n\n')
}

type Mode = 'normal' | 'printout' | 'exam'

export interface FontOption {
  id: string
  label: string
  family: string
}

interface TakeTestProps {
  /** exercise category to load (default English) */
  category?: string
  /** module name stored on results (defaults to category) */
  moduleName?: string
  /** optional legacy-font selector (e.g. KrutiDev / DevLys for Hindi) */
  fontOptions?: FontOption[]
  /** heading shown above the test */
  heading?: string
}

export default function TakeTest({
  category = 'english-test',
  moduleName,
  fontOptions,
  heading,
}: TakeTestProps) {
  const mod = moduleName ?? category
  const localKey = `tm_local_exercises_${category}`

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exIndex, setExIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const [mode, setMode] = useState<Mode>('normal')
  const [popup, setPopup] = useState<null | 'printout' | 'exam'>(null)
  // Right-hand Settings panel can be hidden via the "Hide Settings" toggle.
  const [showSettings, setShowSettings] = useState(true)
  // The live status bar (speed/accuracy/errors/time) is hidden by default.
  // A checkbox in Settings shows/hides it (tick = show, untick = hide).
  const [showStatusBar, setShowStatusBar] = useState(false)

  const [fontId, setFontId] = useState(fontOptions?.[0]?.id ?? '')
  const fontFamily = fontOptions?.find((f) => f.id === fontId)?.family

  const [duration, setDuration] = useState(10)
  const [fontSize, setFontSize] = useState(fontOptions ? 24 : 18)
  const [bold, setBold] = useState(false)

  const [backspaceMode, setBackspaceMode] = useState<BackspaceMode>('off')
  const [highlight, setHighlight] = useState<HighlightMode>('none')
  const [showScrollbar, setShowScrollbar] = useState(true)
  const [autoScroll, setAutoScroll] = useState(false)

  const [applyWordLimit, setApplyWordLimit] = useState(false)
  const [wordLimit, setWordLimit] = useState(300)

  const [wordProcessor, setWordProcessor] = useState(true)
  const [allowParagraphs, setAllowParagraphs] = useState(false)
  const [allowTabs, setAllowTabs] = useState(false)

  const [showResult, setShowResult] = useState(false)
  const [remaining, setRemaining] = useState(duration * 60)

  const surfaceRef = useRef<HTMLDivElement>(null)

  // load exercises
  useEffect(() => {
    api
      .listExercises(category)
      .then((list) => {
        const local = JSON.parse(localStorage.getItem(localKey) || '[]') as Exercise[]
        setExercises([...list, ...local])
      })
      .catch(() => {
        const local = JSON.parse(localStorage.getItem(localKey) || '[]') as Exercise[]
        setExercises(local)
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  // build target text from current exercise + transforms
  const baseText = exercises[exIndex]?.text || ''
  const target = useMemo(() => {
    let t = baseText.replace(/\s+/g, ' ').trim()
    if (applyWordLimit) {
      t = t.split(' ').slice(0, Math.max(10, wordLimit)).join(' ')
    }
    if (wordProcessor && allowParagraphs) {
      t = toParagraphs(t, allowTabs)
    }
    return t
  }, [baseText, applyWordLimit, wordLimit, wordProcessor, allowParagraphs, allowTabs])

  const settings = { backspaceMode, moveOnError: true, playSounds: false }
  const session = useTypingSession(target, settings)

  useEffect(() => {
    session.reset()
    setRemaining(duration * 60)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, exIndex])

  // countdown timer (starts when typing starts)
  useEffect(() => {
    if (!session.startedAt || session.finishedAt) return
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id)
          session.finish()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [session.startedAt, session.finishedAt])

  // finished -> result
  useEffect(() => {
    if (session.finishedAt && !showResult) {
      setShowResult(true)
      const user = getStoredUser()
      api
        .saveResult({
          userId: user?.id ?? null,
          module: mod,
          exerciseId: exercises[exIndex]?.id ?? null,
          wpm: session.stats.wpm,
          accuracy: session.stats.accuracy,
          errors: session.stats.errors,
          durationSec: session.stats.elapsedSec,
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.finishedAt])

  async function requestBrowserFullscreen() {
    const el = document.documentElement as any
    try {
      if (el.requestFullscreen) await el.requestFullscreen()
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
      else if (el.msRequestFullscreen) await el.msRequestFullscreen()
    } catch {
      /* user denied or unsupported – overlay still works */
    }
  }

  async function exitBrowserFullscreen() {
    const d = document as any
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) {
        if (d.exitFullscreen) await d.exitFullscreen()
        else if (d.webkitExitFullscreen) await d.webkitExitFullscreen()
        else if (d.msExitFullscreen) await d.msExitFullscreen()
      }
    } catch {
      /* ignore */
    }
  }

  function exitExam() {
    setMode('normal')
    exitBrowserFullscreen()
  }

  function enterPrintout() {
    setPopup('printout')
  }
  function enterExam() {
    setPopup('exam')
  }
  function confirmPopup() {
    if (popup === 'printout') setMode('printout')
    if (popup === 'exam') {
      setMode('exam')
      // Trigger actual browser full screen (like pressing F11) on user gesture.
      requestBrowserFullscreen()
    }
    setPopup(null)
    setTimeout(() => surfaceRef.current?.focus(), 50)
  }

  // If the user leaves browser full screen (e.g. presses Esc), drop exam mode too.
  useEffect(() => {
    function onFsChange() {
      const d = document as any
      const isFs = Boolean(d.fullscreenElement || d.webkitFullscreenElement)
      if (!isFs) {
        setMode((m) => (m === 'exam' ? 'normal' : m))
      }
    }
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange)
    }
  }, [])

  function addExercise() {
    const text = window.prompt('Paste the passage text for the new exercise:')
    if (!text || !text.trim()) return
    const title = window.prompt('Give it a title:', 'My Exercise') || 'My Exercise'
    const ex: Exercise = {
      id: 'local-' + Date.now().toString(36),
      title,
      category,
      type: 'paragraph',
      text: text.trim(),
    }
    const local = JSON.parse(localStorage.getItem(localKey) || '[]') as Exercise[]
    local.push(ex)
    localStorage.setItem(localKey, JSON.stringify(local))
    setExercises((prev) => [...prev, ex])
    setExIndex(exercises.length)
  }

  const mmss = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`
  const hideReference = mode === 'printout'

  const content = (
    <div className={mode === 'exam' ? 'flex h-full flex-col gap-3' : 'space-y-3'}>
      {/* top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-50 p-2 ring-1 ring-brand-100">
        <div className="flex gap-2">
          {mode === 'printout' ? (
            <button className="btn-accent" onClick={() => setMode('normal')}>
              Exit Printout Mode
            </button>
          ) : (
            <button className="btn-ghost" onClick={enterPrintout}>
              Go Printout Mode
            </button>
          )}
        </div>
        <button className="text-sm font-semibold text-brand-600 hover:underline" onClick={addExercise}>
          + Add New Exercise
        </button>
        {mode === 'exam' ? (
          <button className="btn-accent" onClick={exitExam}>
            Exit Exam Mode
          </button>
        ) : (
          <button className="btn-ghost" onClick={enterExam}>
            Go Exam Mode
          </button>
        )}
      </div>

      {/* reference passage (hidden in printout) */}
      {!hideReference && (
        <TypingText
          target={target}
          typed={session.typed}
          highlight={highlight}
          fontSize={fontSize}
          bold={bold}
          showScrollbar={showScrollbar}
          autoScroll={autoScroll}
          fontFamily={fontFamily}
          className={mode === 'exam' ? 'max-h-[40vh]' : 'max-h-72'}
        />
      )}
      {hideReference && (
        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
          Printout Mode — type from your printed copy. The passage is hidden on screen.
        </div>
      )}

      {/* controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Duration:</span>
            <select
              className="input w-auto"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} Minute{d > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
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
            {exercises.map((ex, i) => (
              <option key={ex.id} value={i}>
                Exercise {i + 1}/{exercises.length} — {ex.title}
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
          <button className="btn-ghost px-2" onClick={() => setFontSize(Math.max(12, fontSize - 2))}>
            A-
          </button>
          <span className="w-6 text-center text-sm font-semibold text-slate-500">{fontSize}</span>
          <button className="btn-ghost px-2" onClick={() => setFontSize(Math.min(40, fontSize + 2))}>
            A+
          </button>
        </div>
      </div>

      <p className="text-center text-xs font-medium text-slate-500">
        Select test duration and start typing. Timer will start automatically.
      </p>

      {/* timer + live stats (hidden by default, toggled from Settings) */}
      {showStatusBar && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-lg bg-slate-900 px-4 py-2 font-mono text-lg font-bold text-white">
            ⏱ {mmss}
          </div>
          <div className="flex-1">
            <StatBar stats={session.stats} timeLabel={mmss} />
          </div>
        </div>
      )}

      {/* typing surface */}
      <div
        ref={surfaceRef}
        tabIndex={0}
        onKeyDown={session.onKeyDown}
        onClick={() => surfaceRef.current?.focus()}
        className={[
          'cursor-text rounded-xl bg-white p-4 font-mono text-slate-800 outline-none ring-1 ring-slate-300 focus:ring-2 focus:ring-brand-500',
          mode === 'exam' ? 'flex-1 overflow-auto' : 'min-h-[200px]',
          showScrollbar ? '' : 'no-scrollbar',
        ].join(' ')}
        style={{ fontSize, whiteSpace: 'pre-wrap', ...(fontFamily ? { fontFamily } : {}) }}
      >
        {session.typed.length === 0 && (
          <span className="text-slate-400">Click here and start typing…</span>
        )}
        {session.typed.split('').map((ch, i) => (
          <span
            key={i}
            className={ch === target[i] ? 'text-slate-800' : 'bg-rose-200 text-rose-700'}
          >
            {ch === '\n' ? '\u21B5\n' : ch === '\t' ? '\u2192\t' : ch}
          </span>
        ))}
        {!session.finishedAt && <span className="animate-pulse text-brand-500">▎</span>}
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={() => session.reset()}>
          Reset
        </button>
        <button
          className="btn-primary"
          disabled={!session.startedAt || !!session.finishedAt}
          onClick={() => session.finish()}
        >
          Finish & see result
        </button>
      </div>
    </div>
  )

  return (
    <>
      {mode === 'exam' ? (
        <div className="fixed inset-0 z-40 bg-slate-100 p-4">
          <div className="mx-auto flex h-full max-w-5xl flex-col">{content}</div>
        </div>
      ) : (
        <div className="space-y-4">
          {heading && <h1 className="text-xl font-extrabold text-slate-900">{heading}</h1>}
          <div
            className={
              showSettings
                ? 'grid gap-4 lg:grid-cols-[200px_1fr_260px]'
                : 'grid gap-4 lg:grid-cols-[200px_1fr]'
            }
          >
            <LeftPanel
              fontOptions={fontOptions}
              fontId={fontId}
              setFontId={setFontId}
              bold={bold}
              setBold={setBold}
            />
            <div>
              {loading ? (
                <div className="card p-8 text-center text-slate-500">Loading exercises…</div>
              ) : exercises.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">
                  No exercises yet. Use “Add New Exercise” to create one.
                  <div className="mt-3">
                    <button className="btn-primary" onClick={addExercise}>
                      + Add New Exercise
                    </button>
                  </div>
                </div>
              ) : (
                content
              )}
            </div>
            {showSettings ? (
              <Settings
                onHide={() => setShowSettings(false)}
                backspaceMode={backspaceMode}
                setBackspaceMode={setBackspaceMode}
                highlight={highlight}
                setHighlight={setHighlight}
                showStatusBar={showStatusBar}
                setShowStatusBar={setShowStatusBar}
                showScrollbar={showScrollbar}
                setShowScrollbar={setShowScrollbar}
                autoScroll={autoScroll}
                setAutoScroll={setAutoScroll}
                applyWordLimit={applyWordLimit}
                setApplyWordLimit={setApplyWordLimit}
                wordLimit={wordLimit}
                setWordLimit={setWordLimit}
                wordProcessor={wordProcessor}
                setWordProcessor={setWordProcessor}
                allowParagraphs={allowParagraphs}
                setAllowParagraphs={setAllowParagraphs}
                allowTabs={allowTabs}
                setAllowTabs={setAllowTabs}
              />
            ) : (
              <button
                className="btn-ghost fixed bottom-4 right-4 z-30 shadow-lg ring-1 ring-slate-300"
                onClick={() => setShowSettings(true)}
              >
                ⚙ Show Settings
              </button>
            )}
          </div>
        </div>
      )}

      {/* mode popups */}
      {popup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md animate-fade-in rounded-xl bg-white p-5 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-brand-600">
                i
              </div>
              <h3 className="font-bold text-slate-800">
                {popup === 'exam' ? 'Go to Full Screen Mode' : 'Printout Mode'}
              </h3>
            </div>
            <div className="space-y-2 py-4 text-sm text-slate-600">
              {popup === 'exam' ? (
                <>
                  <p>Go to full screen mode.</p>
                  <p>
                    Full screen mode will give you an actual feeling of a typing test. Most typing
                    tests are taken in full screen mode.
                  </p>
                  <p>Hope it will help you prepare yourself for exams.</p>
                </>
              ) : (
                <>
                  <p>You are entering Printout Mode.</p>
                  <p>
                    The passage to type will <b>not be shown</b> on screen — type from your printed
                    copy. Only the typing area will be available.
                  </p>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setPopup(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={confirmPopup}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showResult && (
        <CertificateResult
          title="Typing Test Result"
          userName={getStoredUser()?.name || 'Guest'}
          exerciseTitle={exercises[exIndex]?.title || '-'}
          target={target}
          typed={session.typed}
          stats={session.stats}
          durationSec={duration * 60}
          fontFamily={fontFamily}
          onClose={() => {
            setShowResult(false)
            if (mode === 'exam') exitExam()
          }}
          onRepeat={() => {
            setShowResult(false)
            session.reset()
            setRemaining(duration * 60)
            surfaceRef.current?.focus()
          }}
          onNext={
            exIndex < exercises.length - 1
              ? () => {
                  setShowResult(false)
                  setExIndex((i) => i + 1)
                  setRemaining(duration * 60)
                  setTimeout(() => surfaceRef.current?.focus(), 50)
                }
              : undefined
          }
        />
      )}
    </>
  )
}

function LeftPanel({
  fontOptions,
  fontId,
  setFontId,
  bold,
  setBold,
}: {
  fontOptions?: FontOption[]
  fontId: string
  setFontId: (v: string) => void
  bold: boolean
  setBold: (v: boolean) => void
}) {
  return (
    <aside className="card h-fit space-y-4 p-4">
      {fontOptions && fontOptions.length > 0 && (
        <Group title="Select Font">
          {fontOptions.map((f) => (
            <Radio
              key={f.id}
              name="font"
              checked={fontId === f.id}
              onChange={() => setFontId(f.id)}
              label={f.label}
            />
          ))}
        </Group>
      )}
      <Group title="Text">
        <Check checked={bold} onChange={setBold} label="Bold" />
      </Group>
    </aside>
  )
}

function Settings(props: any) {
  const {
    onHide,
    backspaceMode,
    setBackspaceMode,
    highlight,
    setHighlight,
    showScrollbar,
    setShowScrollbar,
    autoScroll,
    setAutoScroll,
    applyWordLimit,
    setApplyWordLimit,
    wordLimit,
    setWordLimit,
    wordProcessor,
    setWordProcessor,
    allowParagraphs,
    setAllowParagraphs,
    allowTabs,
    setAllowTabs,
    showStatusBar,
    setShowStatusBar,
  } = props
  return (
    <aside className="card h-fit space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-extrabold text-slate-700">Settings</div>
        <button
          className="rounded-md px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-300 hover:bg-slate-100"
          onClick={onHide}
        >
          Hide Settings ✕
        </button>
      </div>

      <Group title="Status Bar">
        <Check
          checked={showStatusBar}
          onChange={setShowStatusBar}
          label="Show Status Bar (Speed / Accuracy / Errors / Time)"
        />
      </Group>

      <Group title="Backspace Options">
        {(
          [
            ['full', 'Full Backspace'],
            ['word', 'One Word Backspace'],
            ['off', 'Deactivate Backspace'],
          ] as [BackspaceMode, string][]
        ).map(([val, label]) => (
          <Radio
            key={val}
            name="bs"
            checked={backspaceMode === val}
            onChange={() => setBackspaceMode(val)}
            label={label}
          />
        ))}
      </Group>

      <Group title="Highlight Options">
        {(
          [
            ['word', 'Word Highlight'],
            ['word-error', 'Word + Error Highlight'],
            ['none', 'No Highlight'],
            ['letter', 'Letter Highlight'],
          ] as [HighlightMode, string][]
        ).map(([val, label]) => (
          <Radio
            key={val}
            name="hl"
            checked={highlight === val}
            onChange={() => setHighlight(val)}
            label={label}
          />
        ))}
      </Group>

      <Group title="Scrollbar Options">
        <Check checked={showScrollbar} onChange={setShowScrollbar} label="Show Scrollbar" />
        <Check checked={autoScroll} onChange={setAutoScroll} label="Auto Scroll" />
      </Group>

      <Group title="Paragraph Settings">
        <Check checked={applyWordLimit} onChange={setApplyWordLimit} label="Apply Word Limit" />
        <input
          type="number"
          min={50}
          max={1500}
          disabled={!applyWordLimit}
          className="input mt-1 disabled:opacity-50"
          value={wordLimit}
          onChange={(e) => setWordLimit(Number(e.target.value))}
        />
        <p className="text-[11px] text-slate-400">(min=50, max=1500)</p>
      </Group>

      <Group title="Word Processing Mode (NTPC/SSC/Court)">
        <Check
          checked={wordProcessor}
          onChange={setWordProcessor}
          label="Word Processor Mode (SSC, Court, Steno)"
        />
        <Check
          checked={allowParagraphs}
          onChange={setAllowParagraphs}
          disabled={!wordProcessor}
          label="Allow Paragraphs"
        />
        <Check
          checked={allowTabs}
          onChange={setAllowTabs}
          disabled={!wordProcessor}
          label="Allow Tabs"
        />
      </Group>
    </aside>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</div>
      <div className="mt-2 space-y-1.5">{children}</div>
    </div>
  )
}
function Radio({
  name,
  checked,
  onChange,
  label,
}: {
  name: string
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      {label}
    </label>
  )
}
function Check({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <label className={`flex items-center gap-2 text-sm ${disabled ? 'text-slate-300' : 'text-slate-600'}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}
