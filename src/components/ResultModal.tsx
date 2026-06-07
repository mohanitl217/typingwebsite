import type { TypingStats } from '../types'

export default function ResultModal({
  stats,
  title = 'Test Complete!',
  onClose,
  onRetry,
}: {
  stats: TypingStats
  title?: string
  onClose: () => void
  onRetry: () => void
}) {
  const grade =
    stats.accuracy >= 95 && stats.wpm >= 40
      ? { label: 'Excellent', color: 'text-emerald-600' }
      : stats.accuracy >= 90
        ? { label: 'Good job', color: 'text-brand-600' }
        : stats.accuracy >= 75
          ? { label: 'Keep practising', color: 'text-amber-600' }
          : { label: 'Needs work', color: 'text-rose-600' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md animate-fade-in rounded-2xl bg-white p-6 shadow-2xl">
        <div className="text-center">
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</div>
          <div className={`mt-1 text-2xl font-extrabold ${grade.color}`}>{grade.label}</div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Metric label="Net Speed" value={`${stats.wpm} WPM`} />
          <Metric label="Accuracy" value={`${stats.accuracy}%`} />
          <Metric label="Errors" value={`${stats.errors}`} />
          <Metric label="Time" value={`${stats.elapsedSec}s`} />
          <Metric label="Correct chars" value={`${stats.correctChars}`} />
          <Metric label="Typed chars" value={`${stats.typedChars}`} />
        </div>

        <div className="mt-6 flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary flex-1" onClick={onRetry}>
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-lg font-bold text-slate-800">{value}</div>
    </div>
  )
}
