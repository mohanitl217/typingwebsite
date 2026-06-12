import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import {
  processLayoutKey,
  rawKeyOutput,
  isConsonant,
  shortIClusterLen,
  type HindiLayout,
} from './hindiLayouts'

interface LayoutSession {
  typed: string
  handleChar: (ch: string) => void
  popChar: () => void
  handleBackspace: () => void
  markError: () => void
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
  /** brief true pulse when a wrong / out-of-order key was rejected */
  flash: boolean
}

/**
 * Returns an onKeyDown handler that turns physical key presses into Unicode
 * Devanagari via the given layout's input-method engine and feeds the result
 * into a typing session. Combining keystrokes (e.g. अ + ा → आ) pop the
 * provisional character before inserting the combined one; because the session
 * uses functional state updates these compose correctly within one event.
 *
 * Remington short-i ORDER: on layouts where `shortIBeforeConsonant` is set, the
 * short-i matra (ि) is keyed BEFORE its consonant (it visually sits to the
 * left). This hook ENFORCES that order against the target:
 *  - at a "matra-first" position the ि key must be pressed first; it is held
 *    ("floating") and nothing is committed yet;
 *  - the next consonant cluster then commits as `<consonant…> + ि`, so the
 *    stored Unicode stays correct (ि then क → कि, never the broken िक);
 *  - pressing the consonant (or anything else) before the ि — or pressing ि
 *    where none is expected — is rejected: it is blocked, counted as an error,
 *    and `flash` pulses so the surface can show it as wrong.
 * The returned `pending` flag lets the page move the cursor / key hint onto the
 * consonant while the matra is floating.
 */
export function useHindiLayoutInput(
  layout: HindiLayout,
  session: LayoutSession,
  target: string,
): HindiLayoutInput {
  const [pendingShortI, setPendingShortI] = useState(false)
  const [flash, setFlash] = useState(false)
  // Ref mirror so the (memoised) key handler always reads the latest value.
  const pendingRef = useRef(false)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const setPending = useCallback((v: boolean) => {
    pendingRef.current = v
    setPendingShortI(v)
  }, [])

  const pulseFlash = useCallback(() => {
    setFlash(true)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(false), 300)
  }, [])

  // Drop any floating matra / flash when the drill text changes or resets.
  useEffect(() => {
    setPending(false)
    setFlash(false)
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
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
        const matraFirst = shortIClusterLen(target.slice(session.typed.length)) > 0

        if (pendingRef.current) {
          // ि is floating — the consonant cluster it belongs to comes next.
          if (base === SHORT_I) {
            e.preventDefault() // a second ि press changes nothing
            return
          }
          if (base == null) return // ignore keys outside the layout
          const res = processLayoutKey(layout, session.typed, e.code, e.shiftKey, altgr)
          if (!res) return
          e.preventDefault()
          if (endsWithFullConsonant(res.insert)) {
            // Attach: emit the consonant cluster, then the held ि after it, so
            // the stored Unicode is consonant-first (कि) while typing was ि-first.
            for (let i = 0; i < res.remove; i++) session.popChar()
            for (const ch of res.insert) session.handleChar(ch)
            session.handleChar(SHORT_I)
            setPending(false)
            return
          }
          // Not a consonant: the matra has nothing to attach to — reject it.
          session.markError()
          pulseFlash()
          return
        }

        if (matraFirst) {
          // The short-i must be keyed first here.
          if (base === SHORT_I) {
            e.preventDefault()
            setPending(true)
            return
          }
          if (base == null) return // ignore keys outside the layout
          // Consonant (or anything else) typed before its ि → wrong order.
          e.preventDefault()
          session.markError()
          pulseFlash()
          return
        }

        if (base === SHORT_I) {
          // A short-i where the target does not expect one → wrong.
          e.preventDefault()
          session.markError()
          pulseFlash()
          return
        }
      }

      const res = processLayoutKey(layout, session.typed, e.code, e.shiftKey, altgr)
      if (!res) return

      e.preventDefault()
      for (let i = 0; i < res.remove; i++) session.popChar()
      for (const ch of res.insert) session.handleChar(ch)
    },
    [layout, session, target, setPending, pulseFlash],
  )

  return useMemo(
    () => ({ onKeyDown, pending: pendingShortI, flash }),
    [onKeyDown, pendingShortI, flash],
  )
}
