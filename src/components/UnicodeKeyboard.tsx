import { keyboardRows, fingerColors, type KeyDef } from '../data/keyboard'
import { MANGAL_FONT, type HindiLayout } from '../lib/hindiLayouts'

/** Map a KeyDef (whose `code` is the US-QWERTY character) to a KeyboardEvent.code. */
export function keyDefToEventCode(def: KeyDef): string | null {
  const c = def.code
  if (/^[a-z]$/.test(c)) return 'Key' + c.toUpperCase()
  if (/^[0-9]$/.test(c)) return 'Digit' + c
  const map: Record<string, string> = {
    '`': 'Backquote',
    '-': 'Minus',
    '=': 'Equal',
    '[': 'BracketLeft',
    ']': 'BracketRight',
    '\\': 'Backslash',
    ';': 'Semicolon',
    "'": 'Quote',
    ',': 'Comma',
    '.': 'Period',
    '/': 'Slash',
    ' ': 'Space',
  }
  return map[c] ?? null
}

interface Props {
  layout: HindiLayout
  /** the KeyboardEvent.code the user should press next */
  nextCode?: string | null
  /** whether the next key needs Shift */
  nextShift?: boolean
}

export default function UnicodeKeyboard({ layout, nextCode, nextShift }: Props) {
  // Highlight the opposite-hand Shift key when a shifted key is required.
  const shiftCode = nextShift && nextCode ? oppositeShift(nextCode) : undefined

  return (
    <div className="select-none rounded-xl bg-slate-100 p-3 ring-1 ring-slate-200">
      <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
        {keyboardRows.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1.5">
            {row.map((key) => (
              <Key
                key={key.code}
                def={key}
                layout={layout}
                isNext={
                  (nextCode != null && keyDefToEventCode(key) === nextCode) ||
                  (shiftCode !== undefined && key.code === shiftCode)
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Left-hand keys use the Right Shift; right-hand keys use the Left Shift. */
function oppositeShift(code: string): 'ShiftLeft' | 'ShiftRight' {
  const leftHand = new Set([
    'Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
    'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT',
    'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG',
    'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB',
  ])
  return leftHand.has(code) ? 'ShiftRight' : 'ShiftLeft'
}

function isCharKey(def: KeyDef) {
  return def.code.length === 1 && def.code !== ' '
}

function Key({ def, layout, isNext }: { def: KeyDef; layout: HindiLayout; isNext: boolean }) {
  const width = def.width ?? 1
  const base = fingerColors[def.finger]
  const code = keyDefToEventCode(def)
  const mapped = isCharKey(def) && code ? layout.keys[code] : undefined

  const mainLabel = mapped?.def ?? (isCharKey(def) ? def.label : def.label)
  const shiftLabel = mapped?.shift

  return (
    <div
      style={{ flex: `${width} 0 0`, minWidth: width > 1 ? undefined : 34 }}
      className={[
        'relative flex h-11 items-center justify-center rounded-md text-xs font-semibold ring-1 transition',
        isNext
          ? 'bg-brand-600 text-white ring-brand-700 shadow-lg shadow-brand-600/40 scale-105'
          : `${base} text-slate-700 ring-slate-300/70`,
        def.home && !isNext ? 'ring-2 ring-slate-500' : '',
      ].join(' ')}
    >
      {shiftLabel && (
        <span
          className="absolute left-1 top-0.5 text-[9px] font-normal opacity-70"
          style={{ fontFamily: MANGAL_FONT }}
        >
          {shiftLabel}
        </span>
      )}
      <span style={mapped ? { fontFamily: MANGAL_FONT, fontSize: 15 } : undefined}>
        {mainLabel}
      </span>
    </div>
  )
}
