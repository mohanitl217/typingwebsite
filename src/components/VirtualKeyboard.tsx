import { keyboardRows, fingerColors, lookupChar, type KeyDef } from '../data/keyboard'

interface Props {
  /** the next character the user should type */
  nextChar?: string
  /** keys to emphasise for the current lesson */
  activeKeys?: string[]
}

export default function VirtualKeyboard({ nextChar, activeKeys = [] }: Props) {
  const target = nextChar ? lookupChar(nextChar) : null
  const highlightCode = target?.code
  const needsShift = target?.shift

  return (
    <div className="select-none rounded-xl bg-slate-100 p-3 ring-1 ring-slate-200">
      <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
        {keyboardRows.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1.5">
            {row.map((key) => (
              <Key
                key={key.code}
                def={key}
                isNext={
                  highlightCode === key.code ||
                  Boolean(needsShift && (key.code === 'ShiftLeft' || key.code === 'ShiftRight'))
                }
                isActive={activeKeys.includes(key.code) || activeKeys.includes(key.label)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function Key({ def, isNext, isActive }: { def: KeyDef; isNext: boolean; isActive: boolean }) {
  const width = def.width ?? 1
  const base = fingerColors[def.finger]
  return (
    <div
      style={{ flex: `${width} 0 0`, minWidth: width > 1 ? undefined : 34 }}
      className={[
        'relative flex h-10 items-center justify-center rounded-md text-xs font-semibold capitalize ring-1 transition',
        isNext
          ? 'bg-brand-600 text-white ring-brand-700 shadow-lg shadow-brand-600/40 scale-105'
          : isActive
            ? `${base} text-slate-800 ring-slate-400 ring-2`
            : `${base} text-slate-700 ring-slate-300/70`,
        def.home && !isNext ? 'ring-2 ring-slate-500' : '',
      ].join(' ')}
    >
      {def.shift && def.shift !== def.label && (
        <span className="absolute left-1 top-0.5 text-[9px] font-normal opacity-70">
          {def.shift}
        </span>
      )}
      <span>{def.label}</span>
    </div>
  )
}
