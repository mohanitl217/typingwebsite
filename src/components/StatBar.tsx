import type { TypingStats } from '../types'

export default function StatBar({
  stats,
  timeLabel,
}: {
  stats: TypingStats
  timeLabel?: string
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Stat label="Speed" value={`${stats.wpm}`} unit="WPM" tone="brand" />
      <Stat label="Accuracy" value={`${stats.accuracy}`} unit="%" tone="emerald" />
      <Stat label="Errors" value={`${stats.errors}`} unit="" tone="rose" />
      <Stat label="Time" value={timeLabel ?? `${stats.elapsedSec}`} unit={timeLabel ? '' : 's'} tone="slate" />
    </div>
  )
}

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string
  value: string
  unit: string
  tone: 'brand' | 'emerald' | 'rose' | 'slate'
}) {
  const tones = {
    brand: 'text-brand-600',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    slate: 'text-slate-700',
  }
  return (
    <div className="card px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-0.5 text-2xl font-extrabold ${tones[tone]}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-semibold text-slate-400">{unit}</span>}
      </div>
    </div>
  )
}
