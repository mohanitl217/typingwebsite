import { keyboardRows, fingerColors, lookupChar, type KeyDef } from '../data/keyboard'

interface Props {
  /** the next character the user should type */
  nextChar?: string
  /** keys to emphasise for the current lesson */
  activeKeys?: string[]
  /**
   * When set, character keycaps are rendered using this CSS font-family so that
   * legacy glyph fonts (KrutiDev/DevLys) display the Devanagari glyph for each key.
   */
  glyphFont?: string
}

export default function VirtualKeyboard({ nextChar, activeKeys = [], glyphFont }: Props) {
  const target = nextChar ? lookupChar(nextChar) : null
  const highlightCode = target?.code
  // When a shift is required, only the Shift key on the opposite hand of the
  // key being typed should be highlighted (proper touch-typing technique).
  // Left-hand keys use the Right Shift, right-hand keys use the Left Shift.
  const shiftCode =
    target?.shift && target.finger !== 'thumb'
      ? target.finger.startsWith('l-')
        ? 'ShiftRight'
        : 'ShiftLeft'
      : undefined

  return (
    <div className="select-none rounded-xl bg-slate-100 p-3 ring-1 ring-slate-200">
      <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
        {keyboardRows.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1.5">
            {row.map((key) => (
              <Key
                key={key.code}
                def={key}
                glyphFont={glyphFont}
                isNext={
                  highlightCode === key.code ||
                  (shiftCode !== undefined && key.code === shiftCode)
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

/** Single printable character keys (letters / digits / symbols), not Tab/Enter/etc. */
function isCharKey(def: KeyDef) {
  return def.code.length === 1 && def.code !== ' '
}

function Key({
  def,
  isNext,
  isActive,
  glyphFont,
}: {
  def: KeyDef
  isNext: boolean
  isActive: boolean
  glyphFont?: string
}) {
  const width = def.width ?? 1
  const base = fingerColors[def.finger]

  // In glyph mode, show the legacy-font glyph for the key's character.
  const glyph = glyphFont && isCharKey(def)
  const mainLabel = glyph ? def.code : def.label
  const isLetter = /^[a-z]$/.test(def.code)
  const shiftLabel = glyph ? def.shift ?? (isLetter ? def.code.toUpperCase() : undefined) : def.shift

  return (
    <div
      style={{ flex: `${width} 0 0`, minWidth: width > 1 ? undefined : 34 }}
      className={[
        'relative flex h-10 items-center justify-center rounded-md text-xs font-semibold ring-1 transition',
        glyph ? '' : 'capitalize',
        isNext
          ? 'z-10 scale-110 bg-amber-400 font-extrabold text-slate-900 ring-2 ring-amber-500 animate-key-glow'
          : isActive
            ? `${base} text-slate-800 ring-slate-400 ring-2`
            : `${base} text-slate-700 ring-slate-300/70`,
        def.home && !isNext ? 'ring-2 ring-slate-500' : '',
      ].join(' ')}
    >
      {shiftLabel && shiftLabel !== mainLabel && (
        <span
          className="absolute left-1 top-0.5 text-[9px] font-normal opacity-70"
          style={glyph ? { fontFamily: glyphFont } : undefined}
        >
          {shiftLabel}
        </span>
      )}
      <span style={glyph ? { fontFamily: glyphFont, fontSize: 16 } : undefined}>{mainLabel}</span>
    </div>
  )
}
