import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import { processLayoutKey, rawKeyOutput, isConsonant, type HindiLayout } from './hindiLayouts'

interface LayoutSession {
  typed: string
  handleChar: (ch: string) => void
  popChar: () => void
  handleBackspace: () => void
}

const MODIFIER_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'AltGraph',
  'Meta',
  'CapsLock',
  'Dead',
  'Tab',
  'Escape',
])

const SHORT_I = '\u093F' // ि — short-i matra (keyed BEFORE its consonant on Remington)

/** True if `out` ends with a full consonant (so a floating short-i can attach). */
function endsWithFullConsonant(out: string): boolean {
  return out.length > 0 && isConsonant(out[out.length - 1])
}

export interface HindiLayoutInput {
  /** key handler to wire onto the typing surface */
  onKeyDown: (e: React.KeyboardEvent) => void
  /** a short-i matra has been pressed and is waiting for its consonant */
  pending: boolean
}

/**
 * Returns an onKeyDown handler that turns physical key presses into Unicode
 * Devanagari via the given layout's input-method engine and feeds the result
 * into a typing session. Combining keystrokes (e.g. अ + ा → आ) pop the
 * provisional character before inserting the combined one; because the session
 * uses functional state updates these compose correctly within one event.
 *
 * Remington short-i: on layouts where `shortIBeforeConsonant` is set, the short
 * i matra (ि) is keyed BEFORE its consonant (it visually sits to the left). We
 * therefore "float" a pressed ि — nothing is committed yet — and, when the next
 * consonant cluster arrives, emit `<consonant…> + ि` so the buffer stays valid
 * Unicode (e.g. pressing ि then क yields कि, never the broken िक). The returned
 * `pending` flag lets the page move the on-screen key hint onto the consonant
 * once the matra is floating.
 */
export function useHindiLayoutInput(
  layout: HindiLayout,
  session: LayoutSession,
  target: string,
): HindiLayoutInput {
  const [pendingShortI, setPendingShortI] = useState(false)
  // Ref mirror so the (memoised) key handler always reads the latest value.
  const pendingRef = useRef(false)
  const setPending = useCallback((v: boolean) => {
    pendingRef.current = v
    setPendingShortI(v)
  }, [])

  // Drop any floating matra when the drill text changes / resets.
  useEffect(() => {
    setPending(false)
  }, [target, setPending])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return

      if (e.key === 'Backspace') {
        e.preventDefault()
        // A floating short-i is cancelled first, before deleting committed text.
        if (pendingRef.current) {
          setPending(false)
          return
        }
        session.handleBackspace()
        return
      }
      if (e.key === 'Enter') {
        if (target.includes('\n')) {
          e.preventDefault()
          if (pendingRef.current) setPending(false)
          session.handleChar('\n')
        }
        return
      }
      if (MODIFIER_KEYS.has(e.key)) return

      const altgr =
        e.getModifierState?.('AltGraph') === true || (e.altKey && e.ctrlKey)

      // --- Remington: the short-i matra ि is typed BEFORE its consonant. ---
      if (layout.shortIBeforeConsonant) {
        const base = rawKeyOutput(layout, e.code, e.shiftKey, altgr)

        // Pressing the ि key floats the matra (nothing is committed yet). A
        // repeated press while already floating is a no-op.
        if (base === SHORT_I) {
          e.preventDefault()
          setPending(true)
          return
        }

        if (pendingRef.current) {
          const res = processLayoutKey(layout, session.typed, e.code, e.shiftKey, altgr)
          if (!res) return
          e.preventDefault()
          if (endsWithFullConsonant(res.insert)) {
            // Attach: emit the consonant cluster, then the held ि after it, so
            // the stored Unicode is consonant-first (e.g. कि) while the typing
            // order was ि-first.
            for (let i = 0; i < res.remove; i++) session.popChar()
            for (const ch of res.insert) session.handleChar(ch)
            session.handleChar(SHORT_I)
            setPending(false)
            return
          }
          // A non-consonant key cancels the floating matra, then applies normally.
          setPending(false)
          for (let i = 0; i < res.remove; i++) session.popChar()
          for (const ch of res.insert) session.handleChar(ch)
          return
        }
      }

      const res = processLayoutKey(layout, session.typed, e.code, e.shiftKey, altgr)
      if (!res) return

      e.preventDefault()
      for (let i = 0; i < res.remove; i++) session.popChar()
      for (const ch of res.insert) session.handleChar(ch)
    },
    [layout, session, target, setPending],
  )

  return useMemo(() => ({ onKeyDown, pending: pendingShortI }), [onKeyDown, pendingShortI])
}
