import { useEffect, useMemo, useRef, useState } from 'react'
import VirtualKeyboard from '../components/VirtualKeyboard'
import StatBar from '../components/StatBar'
import CertificateResult from '../components/CertificateResult'
import { useTypingSession } from '../lib/useTypingSession'
import { api, getStoredUser } from '../api'

type Level = 'easy' | 'medium' | 'hard'

function genNumbers(level: Level, seed: number): string {
  const groups = level === 'easy' ? 8 : level === 'medium' ? 10 : 12
  const size = level === 'easy' ? 3 : level === 'medium' ? 4 : 5
  // simple seeded pseudo-random
  let s = seed || 1
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const parts: string[] = []
  for (let i = 0; i < groups; i++) {
    let g = ''
    for (let j = 0; j < size; j++) g += Math.floor(rand() * 10)
    parts.push(g)
  }
  return parts.join(' ')
}

export default function NumberTyping() {
  const [level, setLevel] = useState<Level>('easy')
  const [seed, setSeed] = useState(() => Date.now() % 100000)
  const [fontSize, setFontSize] = useState(24)
  const [showKeyboard, setShowKeyboard] = useState(true)
  const [showResult, setShowResult] = useState(false)

  const target = useMemo(() => genNumbers(level, seed), [level, seed])
  const session = useTypingSession(target, {
    backspaceMode: 'full',
    moveOnError: true,
    playSounds: false,
  })
  const surfaceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    session.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  useEffect(() => {
    if (session.isDone && session.finishedAt) {
      setShowResult(true)
      const user = getStoredUser()
      api
        .saveResult({
          userId: user?.id ?? null,
          module: `numbers:${level}`,
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Number Typing</h1>
          <p className="text-sm text-slate-500">
            Build speed and accuracy typing digits (0–9) on the number row.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['easy', 'medium', 'hard'] as Level[]).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={[
                'rounded-lg px-3 py-2 text-sm font-semibold capitalize transition',
                level === l ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200',
              ].join(' ')}
            >
              {l}
            </button>
          ))}
          <button className="btn-ghost" onClick={() => setSeed(Date.now() % 100000)}>
            ↻ New set
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 text-center ring-1 ring-slate-200">
        <div
          className="font-mono tracking-widest"
          style={{ fontSize, whiteSpace: 'pre-wrap' }}
        >
          {target.split('').map((ch, i) => {
            const t = session.typed[i]
            const isCur = i === session.typed.length
            let cls = 'text-slate-300'
            if (i < session.typed.length) cls = t === ch ? 'text-emerald-600' : 'bg-rose-200 text-rose-700 rounded'
            if (isCur) cls = 'bg-brand-600 text-white rounded'
            return (
              <span key={i} className={cls}>
                {ch}
              </span>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showKeyboard} onChange={(e) => setShowKeyboard(e.target.checked)} />
          Show Keyboard
        </label>
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

      <div
        ref={surfaceRef}
        tabIndex={0}
        onKeyDown={session.onKeyDown}
        onClick={() => surfaceRef.current?.focus()}
        className="min-h-[90px] cursor-text rounded-xl bg-slate-900 p-4 text-center font-mono tracking-widest text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-2 focus:ring-brand-500"
        style={{ fontSize }}
      >
        {session.typed.length === 0 && <span className="text-slate-500">Click & type the numbers…</span>}
        {session.typed.split('').map((ch, i) => (
          <span key={i} className={ch === target[i] ? 'text-emerald-400' : 'bg-rose-500/40 text-rose-200'}>
            {ch}
          </span>
        ))}
        {!session.finishedAt && <span className="animate-pulse text-brand-400">▎</span>}
      </div>

      <StatBar stats={session.stats} />

      {showKeyboard && <VirtualKeyboard nextChar={nextChar} activeKeys={['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']} />}

      {showResult && (
        <CertificateResult
          title={`Number Typing — ${level}`}
          userName={getStoredUser()?.name || 'Guest'}
          exerciseTitle={`Number drill (${level})`}
          target={target}
          typed={session.typed}
          stats={session.stats}
          onClose={() => setShowResult(false)}
          onRepeat={() => {
            setShowResult(false)
            setSeed(Date.now() % 100000)
            surfaceRef.current?.focus()
          }}
          onNext={() => {
            setShowResult(false)
            setSeed(Date.now() % 100000)
            setTimeout(() => surfaceRef.current?.focus(), 50)
          }}
        />
      )}
    </div>
  )
}
