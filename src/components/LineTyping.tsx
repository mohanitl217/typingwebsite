import { useEffect, useLayoutEffect, useRef } from 'react'
import type React from 'react'
import type { StripSegment } from '../lib/hindiLayouts'

interface Props {
  target: string
  typed: string
  /** Override font (KrutiDev / DevLys / Mangal). */
  fontFamily?: string
  bold?: boolean
  /** Big letter size for the image-style strip. */
  fontSize?: number
  onKeyDown?: (e: React.KeyboardEvent) => void
  /** Focusable element ref (so parent focus() calls still work). */
  inputRef?: React.RefObject<HTMLDivElement>
  /**
   * Override the "current" (boxed) cell. Defaults to typed.length. Used by the
   * Remington layouts where the short-i matra ि is keyed BEFORE its consonant,
   * so the cursor must sit on the ि cell (which comes later in Unicode order).
   */
  cursorIndex?: number
  /** Cell index of a short-i matra that is currently held / floating, or null. */
  floatedIndex?: number | null
  /** Brief pulse: render the current cell as wrong (out-of-order keystroke). */
  flash?: boolean
  /**
   * Display order for the cells (array of target indices). Used by Remington
   * layouts to show the short-i matra ि BEFORE its consonant. Defaults to the
   * natural order [0, 1, 2, …].
   */
  order?: number[]
  /**
   * Pre-built strip cells. When provided, the strip renders these instead of
   * one cell per codepoint: completed/upcoming aksharas show as combined
   * ligatures (e.g. जी) and only the akshara being typed is split into its
   * keystroke components. (Used for the Unicode Devanagari layouts.)
   */
  segments?: StripSegment[]
}

const SEGMENT_CLASS: Record<StripSegment['status'], string> = {
  done: 'text-emerald-600',
  wrong: 'rounded bg-rose-200 text-rose-700',
  current: 'rounded border-2 border-amber-500 bg-amber-50 text-slate-900',
  floated: 'rounded bg-amber-100 text-amber-700 ring-1 ring-amber-300',
  partial: 'rounded bg-amber-100 text-amber-700',
  upcoming: 'text-slate-400',
}

function renderText(text: string): string {
  if (text === ' ') return '\u00A0'
  if (text === '\n') return '\u21B5'
  if (text === '\t') return '\u2192'
  return text
}

/**
 * "Image style" typing display: there is NO separate typing box — this strip is
 * itself the input. Letters are large and shown on a single row; the character
 * to type next sits in a fixed, boxed cursor while the text scrolls through it
 * right-to-left as you type (typed letters move off to the left).
 */
export default function LineTyping({
  target,
  typed,
  fontFamily,
  bold,
  fontSize = 46,
  onKeyDown,
  inputRef,
  cursorIndex,
  floatedIndex = null,
  flash = false,
  order,
  segments,
}: Props) {
  const localRef = useRef<HTMLDivElement>(null)
  const containerRef = inputRef ?? localRef
  const stripRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const pos = typed.length
  const cur = cursorIndex ?? pos

  // Keep the current letter pinned at a fixed horizontal anchor; the strip
  // slides left as you advance (right-to-left scrolling).
  useLayoutEffect(() => {
    const strip = stripRef.current
    const container = containerRef.current
    if (!strip || !container) return
    const anchor = container.clientWidth * 0.3
    const cursor = cursorRef.current
    const cursorLeft = cursor ? cursor.offsetLeft : strip.scrollWidth
    strip.style.transform = `translate(${-(cursorLeft - anchor)}px, -50%)`
  }, [cur, pos, target, fontSize, containerRef, segments])

  // Autofocus so the user can start typing immediately.
  useEffect(() => {
    containerRef.current?.focus()
  }, [containerRef, target])

  return (
    <div>
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onClick={() => containerRef.current?.focus()}
        className="relative cursor-text overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-brand-500"
        style={{ height: Math.round(fontSize * 2.3) }}
      >
        <div
          ref={stripRef}
          className="absolute left-0 top-1/2 whitespace-nowrap will-change-transform"
          style={{
            fontFamily: fontFamily ?? '"JetBrains Mono", monospace',
            fontSize,
            fontWeight: bold ? 700 : 400,
            lineHeight: 1,
          }}
        >
          {segments
            ? segments.map((seg, k) => {
                const isCurrent = seg.status === 'current'
                const cls =
                  isCurrent && flash
                    ? 'rounded border-2 border-rose-500 bg-rose-100 text-rose-700'
                    : SEGMENT_CLASS[seg.status]
                return (
                  <span
                    key={k}
                    ref={seg.anchor ? cursorRef : undefined}
                    className={`inline-block px-1 ${cls}`}
                  >
                    {renderText(seg.text)}
                  </span>
                )
              })
            : (order ?? target.split('').map((_, i) => i)).map((oi, k) => {
                const ch = target[oi]
                const typedCh = typed[oi]
                const isTyped = oi < pos
                const isCurrent = oi === cur
                const isFloated = oi === floatedIndex
                const correct = typedCh === ch

                let cls = 'text-indigo-700'
                if (isTyped) cls = correct ? 'text-emerald-600' : 'rounded bg-rose-200 text-rose-700'
                if (isFloated) cls = 'rounded bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                if (isCurrent) {
                  cls = flash
                    ? 'rounded border-2 border-rose-500 bg-rose-100 text-rose-700'
                    : 'rounded border-2 border-amber-500 bg-amber-50 text-slate-900'
                }

                return (
                  <span
                    key={k}
                    ref={isCurrent ? cursorRef : undefined}
                    className={`inline-block px-1 ${cls}`}
                  >
                    {renderText(ch)}
                  </span>
                )
              })}
          {pos >= target.length && target.length > 0 && (
            <span className="inline-block px-2 text-emerald-600">✓</span>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-sm font-medium text-slate-500">
        {pos === 0 ? 'Press any key to start' : `${pos} / ${target.length}`}
      </p>
    </div>
  )
}
