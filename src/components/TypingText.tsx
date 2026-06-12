import { useEffect, useMemo, useRef } from 'react'

export type HighlightMode = 'letter' | 'word' | 'word-error' | 'none'

interface Props {
  target: string
  typed: string
  highlight: HighlightMode
  fontSize: number
  bold: boolean
  showScrollbar: boolean
  autoScroll: boolean
  className?: string
  /** Override the default monospace font (e.g. KrutiDev/DevLys for Hindi). */
  fontFamily?: string
  /**
   * Override the "current" cell. Defaults to typed.length. Used by Remington
   * layouts where the short-i matra ि is keyed BEFORE its consonant, so the
   * cursor must sit on the ि cell (which comes later in Unicode order).
   */
  cursorIndex?: number
  /** Cell index of a short-i matra that is currently held / floating, or null. */
  floatedIndex?: number | null
  /** Brief pulse: render the current cell as wrong (out-of-order keystroke). */
  flash?: boolean
}

/** Find the [start,end) range of the word containing index i. */
function wordRange(text: string, i: number): [number, number] {
  let start = i
  while (start > 0 && text[start - 1] !== ' ' && text[start - 1] !== '\n') start--
  let end = i
  while (end < text.length && text[end] !== ' ' && text[end] !== '\n') end++
  return [start, end]
}

export default function TypingText({
  target,
  typed,
  highlight,
  fontSize,
  bold,
  showScrollbar,
  autoScroll,
  className = '',
  fontFamily,
  cursorIndex,
  floatedIndex = null,
  flash = false,
}: Props) {
  const cursorRef = useRef<HTMLSpanElement | null>(null)
  const pos = typed.length
  const cur = cursorIndex ?? pos
  const [wStart, wEnd] = useMemo(() => wordRange(target, pos), [target, pos])

  useEffect(() => {
    if (autoScroll && cursorRef.current) {
      cursorRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [cur, autoScroll])

  return (
    <div
      className={[
        'rounded-xl bg-white p-4 leading-relaxed ring-1 ring-slate-200 overflow-auto',
        showScrollbar ? '' : 'no-scrollbar',
        bold ? 'font-bold' : '',
        className,
      ].join(' ')}
      style={{ fontSize, fontFamily: fontFamily ?? '"JetBrains Mono", monospace', whiteSpace: 'pre-wrap' }}
    >
      {target.split('').map((ch, i) => {
        const typedCh = typed[i]
        const isTyped = i < pos
        const isCurrent = i === cur
        const isFloated = i === floatedIndex
        const correct = typedCh === ch

        let cls = 'text-slate-400'
        if (highlight !== 'none') {
          if (isTyped) {
            cls = correct ? 'text-emerald-600' : 'bg-rose-200 text-rose-700 rounded'
          }
          if (highlight === 'word' || highlight === 'word-error') {
            if (i >= wStart && i < wEnd && !isTyped) cls = 'bg-brand-100 text-brand-800 rounded'
          }
          if (highlight === 'word-error' && isTyped && !correct) {
            cls = 'bg-rose-300 text-rose-800 rounded'
          }
          if (isFloated && !isTyped) cls = 'bg-amber-100 text-amber-700 rounded ring-1 ring-amber-300'
          if (isCurrent) {
            cls += flash ? ' bg-rose-200 text-rose-700 rounded border-b-2 border-rose-500' : ' border-b-2 border-brand-600'
          }
          if (highlight === 'letter' && isCurrent) {
            cls = flash ? 'bg-rose-500 text-white rounded' : 'bg-brand-600 text-white rounded'
          }
        } else if (isCurrent) {
          cls = 'border-b-2 border-brand-600 text-slate-500'
        }

        return (
          <span key={i} ref={isCurrent ? cursorRef : undefined} className={cls}>
            {ch === '\n' ? '\u21B5\n' : ch}
          </span>
        )
      })}
    </div>
  )
}
