import { useEffect, useMemo, useRef } from 'react'

export type HighlightMode = 'letter' | 'word' | 'word-error' | 'none'

/** Reference display layout: classic wrapping block, or a single scrolling line. */
export type DisplayMode = 'block' | 'line'

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
   * 'block' (default): the passage wraps over multiple lines.
   * 'line': a single horizontal row that scrolls sideways, with a boxed cursor
   * on the current character ("image style" tutor layout).
   */
  display?: DisplayMode
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
  display = 'block',
}: Props) {
  const cursorRef = useRef<HTMLSpanElement | null>(null)
  const pos = typed.length
  const [wStart, wEnd] = useMemo(() => wordRange(target, pos), [target, pos])
  const isLine = display === 'line'

  useEffect(() => {
    // In line mode always keep the cursor in view (scrolling sideways);
    // in block mode only when auto-scroll is enabled.
    if ((isLine || autoScroll) && cursorRef.current) {
      cursorRef.current.scrollIntoView({
        block: 'nearest',
        inline: isLine ? 'center' : 'nearest',
        behavior: 'smooth',
      })
    }
  }, [pos, autoScroll, isLine])

  const chars = target.split('').map((ch, i) => {
    const typedCh = typed[i]
    const isTyped = i < pos
    const isCurrent = i === pos
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
      if (isCurrent) {
        // Boxed cursor in line mode; underline in block mode.
        cls += isLine
          ? ' rounded border-2 border-amber-500 bg-amber-50 text-slate-800'
          : ' border-b-2 border-brand-600'
      }
      if (highlight === 'letter' && isCurrent && !isLine) {
        cls = 'bg-brand-600 text-white rounded'
      }
    } else if (isCurrent) {
      cls = isLine
        ? 'rounded border-2 border-amber-500 bg-amber-50 text-slate-800'
        : 'border-b-2 border-brand-600 text-slate-500'
    }

    return (
      <span
        key={i}
        ref={isCurrent ? cursorRef : undefined}
        className={isLine ? `inline-block ${cls}` : cls}
      >
        {ch === '\n' ? '\u21B5\n' : ch}
      </span>
    )
  })

  if (isLine) {
    return (
      <div
        className={[
          'flex items-center rounded-xl bg-white px-4 ring-1 ring-slate-200 overflow-x-auto overflow-y-hidden',
          showScrollbar ? '' : 'no-scrollbar',
          bold ? 'font-bold' : '',
          className,
        ].join(' ')}
        style={{
          fontSize,
          fontFamily: fontFamily ?? '"JetBrains Mono", monospace',
          whiteSpace: 'nowrap',
        }}
      >
        {chars}
        {pos >= target.length && target.length > 0 && (
          <span className="ml-1 text-emerald-600">✓</span>
        )}
      </div>
    )
  }

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
      {chars}
    </div>
  )
}
