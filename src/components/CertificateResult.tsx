import type { TypingStats } from '../types'

interface Props {
  title?: string
  userName?: string
  exerciseTitle?: string
  target: string
  typed: string
  stats: TypingStats
  /** configured test duration in seconds; falls back to elapsed time */
  durationSec?: number
  /** font used to render the typed sample (KrutiDev/DevLys for Hindi) */
  fontFamily?: string
  onClose: () => void
  onRepeat: () => void
  onNext?: () => void
}

function splitWords(s: string) {
  return s.trim().length ? s.trim().split(/\s+/) : []
}

export function computeReport(target: string, typed: string, stats: TypingStats, durationSec?: number) {
  const timeSec = Math.max(1, durationSec || stats.elapsedSec || 1)
  const minutes = timeSec / 60
  const keystrokes = stats.keystrokes ?? stats.typedChars
  const backspaces = stats.backspaces ?? 0
  const errors = stats.errors ?? 0
  const netKeystrokes = Math.max(0, keystrokes - errors)

  const targetWords = splitWords(target)
  const typedWords = splitWords(typed)
  const totalWords = typedWords.length
  let correctWords = 0
  for (let i = 0; i < typedWords.length; i++) {
    if (typedWords[i] === targetWords[i]) correctWords++
  }
  const incorrectWords = Math.max(0, totalWords - correctWords)
  const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0

  const r = (n: number) => Math.max(0, Math.round(n))

  // Method 1: one word = 5 keystrokes
  const m1 = {
    netWpm: r(netKeystrokes / 5 / minutes),
    netKpm: r(netKeystrokes / minutes),
    grossWpm: r(keystrokes / 5 / minutes),
    grossKpm: r(keystrokes / minutes),
  }
  // Method 2: one word = group of letters separated by space
  const m2 = {
    netWpm: r(correctWords / minutes),
    netKpm: r(netKeystrokes / minutes),
    grossWpm: r(totalWords / minutes),
    grossKpm: r(keystrokes / minutes),
  }

  return {
    timeSec,
    totalWords,
    correctWords,
    incorrectWords,
    accuracy,
    backspaces,
    keystrokes,
    m1,
    m2,
  }
}

export default function CertificateResult({
  title = 'Typing Test Result',
  userName = 'Guest',
  exerciseTitle = '-',
  target,
  typed,
  stats,
  durationSec,
  fontFamily,
  onClose,
  onRepeat,
  onNext,
}: Props) {
  const rep = computeReport(target, typed, stats, durationSec)
  const dateStr = new Date().toLocaleString()

  function handlePrint() {
    const win = window.open('', 'PRINT', 'height=900,width=1000')
    if (!win) return
    win.document.write(buildPrintHtml({ title, userName, exerciseTitle, dateStr, rep, typed, fontFamily }))
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
    }, 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
      <div className="my-6 w-full max-w-3xl animate-fade-in">
        {/* Certificate */}
        <div className="rounded-2xl bg-white p-1 shadow-2xl ring-1 ring-slate-200">
          <div className="rounded-xl border-[3px] border-double border-brand-300 p-6 sm:p-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-brand-600">
                <Seal />
                <span className="text-xs font-bold uppercase tracking-[0.3em]">TypeMaster</span>
              </div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                Certificate of Typing Practice
              </h2>
              <p className="mt-1 text-sm text-slate-500">{title}</p>
              <div className="mx-auto mt-3 h-px w-40 bg-gradient-to-r from-transparent via-brand-300 to-transparent" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <Field label="Name" value={userName} />
              <Field label="Date" value={dateStr} />
              <Field label="Exercise" value={exerciseTitle} span />
              <Field label="Test Duration" value={`${rep.timeSec} seconds`} />
              <Field label="Total Words Typed" value={`${rep.totalWords}`} />
              <Field label="Correct Words Typed" value={`${rep.correctWords}`} />
              <Field label="Incorrect Words Typed" value={`${rep.incorrectWords}`} />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Method
                heading="Method 1"
                sub="one word = 5 characters / key strokes"
                m={rep.m1}
                accuracy={rep.accuracy}
                backspaces={rep.backspaces}
              />
              <Method
                heading="Method 2"
                sub="one word = group of letters separated by space"
                m={rep.m2}
                accuracy={rep.accuracy}
                backspaces={rep.backspaces}
              />
            </div>

            <p className="mt-4 text-[11px] italic text-slate-400">
              Note: Key depressions, characters and key strokes are the same thing.
            </p>

            {typed.trim() && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  What you typed
                </div>
                <p
                  className="mt-1 max-h-24 overflow-auto break-words text-sm text-slate-600"
                  style={fontFamily ? { fontFamily } : undefined}
                >
                  {typed}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
          <button className="btn-ghost" onClick={handlePrint}>
            🖨 Print
          </button>
          <button className="btn-accent" onClick={onRepeat}>
            ↻ Repeat
          </button>
          {onNext && (
            <button className="btn-primary" onClick={onNext}>
              Next exercise ››
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? 'col-span-2 flex gap-2' : 'flex gap-2'}>
      <span className="font-semibold text-slate-500">{label}:</span>
      <span className="font-bold text-slate-800">{value}</span>
    </div>
  )
}

function Method({
  heading,
  sub,
  m,
  accuracy,
  backspaces,
}: {
  heading: string
  sub: string
  m: { netWpm: number; netKpm: number; grossWpm: number; grossKpm: number }
  accuracy: number
  backspaces: number
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="text-sm font-extrabold text-slate-700">
        {heading} <span className="text-xs font-medium italic text-slate-400">({sub})</span>
      </div>
      <dl className="mt-2 space-y-1.5 text-sm">
        <Row label="Net Speed">
          <b className="text-brand-600">{m.netWpm}</b> wpm
          <span className="text-slate-400"> · {m.netKpm} ks/min ({m.netKpm * 60}/hr)</span>
        </Row>
        <Row label="Gross Speed">
          <b className="text-slate-700">{m.grossWpm}</b> wpm
          <span className="text-slate-400"> · {m.grossKpm} ks/min ({m.grossKpm * 60}/hr)</span>
        </Row>
        <Row label="Accuracy">
          <b className="text-emerald-600">{accuracy}%</b>
        </Row>
        <Row label="Backspace">
          <b className="text-slate-700">{backspaces}</b> times
        </Row>
      </dl>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-700">{children}</dd>
    </div>
  )
}

function Seal() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="9" r="6" />
      <path d="M8 14l-2 7 6-3 6 3-2-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function buildPrintHtml({
  title,
  userName,
  exerciseTitle,
  dateStr,
  rep,
  typed,
  fontFamily,
}: {
  title: string
  userName: string
  exerciseTitle: string
  dateStr: string
  rep: ReturnType<typeof computeReport>
  typed: string
  fontFamily?: string
}) {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const method = (
    name: string,
    sub: string,
    m: { netWpm: number; netKpm: number; grossWpm: number; grossKpm: number },
  ) => `
    <div class="method">
      <div class="mh"><b>${name}</b> <i>(${sub})</i></div>
      <table>
        <tr><td>Net Speed</td><td><b>${m.netWpm}</b> wpm &middot; ${m.netKpm} ks/min (${m.netKpm * 60}/hr)</td></tr>
        <tr><td>Gross Speed</td><td><b>${m.grossWpm}</b> wpm &middot; ${m.grossKpm} ks/min (${m.grossKpm * 60}/hr)</td></tr>
        <tr><td>Accuracy</td><td><b>${rep.accuracy}%</b></td></tr>
        <tr><td>Backspace</td><td>${rep.backspaces} times</td></tr>
      </table>
    </div>`
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)} — Certificate</title>
  <style>
    *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif}
    body{margin:0;padding:24px;color:#1e293b}
    .frame{border:3px double #818cf8;border-radius:12px;padding:28px}
    h1{font-size:22px;text-align:center;margin:0 0 4px}
    .muted{color:#64748b;text-align:center;margin:0 0 10px;font-size:13px}
    .rule{height:1px;background:#c7d2fe;margin:10px auto;width:200px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;font-size:14px;margin:14px 0}
    .grid .full{grid-column:1 / -1}
    .grid b{color:#0f172a}
    .methods{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .method{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px}
    .mh{font-size:13px;margin-bottom:6px}
    .mh i{color:#94a3b8;font-weight:normal}
    table{width:100%;border-collapse:collapse;font-size:13px}
    td{padding:2px 0}
    td:last-child{text-align:right}
    .note{font-size:11px;color:#94a3b8;font-style:italic;margin-top:12px}
    .typed{margin-top:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;font-size:13px;color:#475569;${
      fontFamily ? `font-family:${fontFamily};` : ''
    }}
    .brand{text-align:center;color:#4f46e5;font-weight:bold;letter-spacing:3px;font-size:12px}
  </style></head><body>
  <div class="frame">
    <div class="brand">TYPEMASTER</div>
    <h1>Certificate of Typing Practice</h1>
    <p class="muted">${esc(title)}</p>
    <div class="rule"></div>
    <div class="grid">
      <div><b>Name:</b> ${esc(userName)}</div>
      <div><b>Date:</b> ${esc(dateStr)}</div>
      <div class="full"><b>Exercise:</b> ${esc(exerciseTitle)}</div>
      <div><b>Test Duration:</b> ${rep.timeSec} seconds</div>
      <div><b>Total Words Typed:</b> ${rep.totalWords}</div>
      <div><b>Correct Words Typed:</b> ${rep.correctWords}</div>
      <div><b>Incorrect Words Typed:</b> ${rep.incorrectWords}</div>
    </div>
    <div class="methods">
      ${method('Method 1', 'one word = 5 characters / key strokes', rep.m1)}
      ${method('Method 2', 'one word = group of letters separated by space', rep.m2)}
    </div>
    <p class="note">Note: Key depressions, characters and key strokes are the same thing.</p>
    ${typed.trim() ? `<div class="typed"><b>What you typed:</b><br>${esc(typed)}</div>` : ''}
  </div>
  </body></html>`
}
