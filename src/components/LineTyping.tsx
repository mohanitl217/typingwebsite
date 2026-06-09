import { useEffect, useLayoutEffect, useRef } from 'react'
import type React from 'react'

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
}: Props) {
  const localRef = useRef<HTMLDivElement>(null)
  const containerRef = inputRef ?? localRef
  const stripRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const pos = typed.length

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
  }, [pos, target, fontSize, containerRef])

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
          {target.split('').map((ch, i) => {
            const typedCh = typed[i]
            const isTyped = i < pos
            const isCurrent = i === pos
            const correct = typedCh === ch

            let cls = 'text-indigo-700'
            if (isTyped) cls = correct ? 'text-emerald-600' : 'rounded bg-rose-200 text-rose-700'
            if (isCurrent) cls = 'rounded border-2 border-amber-500 bg-amber-50 text-slate-900'

            return (
              <span
                key={i}
                ref={isCurrent ? cursorRef : undefined}
                className={`inline-block px-1 ${cls}`}
              >
                {ch === ' ' ? '\u00A0' : ch === '\n' ? '\u21B5' : ch}
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
