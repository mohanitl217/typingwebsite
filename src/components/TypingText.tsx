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
}: Props) {
  const cursorRef = useRef<HTMLSpanElement | null>(null)
  const pos = typed.length
  const [wStart, wEnd] = useMemo(() => wordRange(target, pos), [target, pos])

  useEffect(() => {
    if (autoScroll && cursorRef.current) {
      cursorRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [pos, autoScroll])

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
          if (isCurrent) cls += ' border-b-2 border-brand-600'
          if (highlight === 'letter' && isCurrent) {
            cls = 'bg-brand-600 text-white rounded'
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
