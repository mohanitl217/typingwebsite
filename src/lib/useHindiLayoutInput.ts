import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import {
  processLayoutKey,
  rawKeyOutput,
  isConsonant,
  isHalfOnlyConsonant,
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
const V = '\u094D' // virama / halant
const AA = '\u093E' // ा — aa-matra / inherent-vowel completer

/** True if `out` ends with a full consonant (so a floating short-i can attach). */
function endsWithFullConsonant(out: string): boolean {
  return out.length > 0 && isConsonant(out[out.length - 1])
}

export interface HindiLayoutInput {
  /** key handler to wire onto the typing surface */
  onKeyDown: (e: React.KeyboardEvent) => void
  /** a short-i matra has been pressed and is waiting for its consonant */
  pending: boolean
  /** a half-only consonant (e.g. ण) whose half form is held, waiting for ा */
  pendingHalf: string | null
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
 * Remington short-i ORDER: where `shortIBeforeConsonant` is set, the short-i
 * matra (ि) is keyed BEFORE its consonant — it is held ("floating") and the
 * next consonant commits as `<consonant…> + ि`.
 *
 * Remington half-only consonants: letters like ण/थ/श/ख/ध/भ/घ exist on the
 * keyboard only as a half form (ण्). The full letter is keyed as the half form
 * THEN the ा completer (which drops the virama). To make that an explicit,
 * consistent two-step sequence — and to show the half form as a step — the half
 * form is held in `pendingHalf` and committed as the full consonant when ा is
 * pressed. Pressing anything else first (or in the wrong order) is rejected:
 * blocked, counted as an error, and `flash` pulses.
 */
export function useHindiLayoutInput(
  layout: HindiLayout,
  session: LayoutSession,
  target: string,
): HindiLayoutInput {
  const [pendingShortI, setPendingShortI] = useState(false)
  const [pendingHalf, setPendingHalfState] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  // Ref mirrors so the (memoised) key handler always reads the latest values.
  const pendingRef = useRef(false)
  const halfRef = useRef<string | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const setPending = useCallback((v: boolean) => {
    pendingRef.current = v
    setPendingShortI(v)
  }, [])
  const setHalf = useCallback((v: string | null) => {
    halfRef.current = v
    setPendingHalfState(v)
  }, [])

  const pulseFlash = useCallback(() => {
    setFlash(true)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(false), 300)
  }, [])

  // Drop any pending state / flash when the drill text changes or resets.
  useEffect(() => {
    setPending(false)
    setHalf(null)
    setFlash(false)
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
  }, [target, setPending, setHalf])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return

      if (e.key === 'Backspace') {
        e.preventDefault()
        // A held half form / floating short-i is cancelled before deleting text.
        if (pendingRef.current) {
          setPending(false)
          return
        }
        if (halfRef.current) {
          setHalf(null)
          return
        }
        session.handleBackspace()
        return
      }
      if (e.key === 'Enter') {
        if (target.includes('\n')) {
          e.preventDefault()
          if (pendingRef.current) setPending(false)
          if (halfRef.current) setHalf(null)
          session.handleChar('\n')
        }
        return
      }
      if (MODIFIER_KEYS.has(e.key)) return

      const altgr =
        e.getModifierState?.('AltGraph') === true || (e.altKey && e.ctrlKey)
      const base = rawKeyOutput(layout, e.code, e.shiftKey, altgr)

      // --- Remington: the short-i matra ि is typed BEFORE its consonant. ---
      if (layout.shortIBeforeConsonant) {
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
            // Attach: emit the consonant cluster, then the held ि after it.
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

      // --- Remington: half-only consonants (ण = ण् + ा), keyed as two steps. ---
      if (layout.dropViramaOnAA) {
        if (halfRef.current) {
          const C = halfRef.current
          if (base === AA) {
            // The ा completer turns the held half form into the full consonant.
            e.preventDefault()
            session.handleChar(C)
            setHalf(null)
            return
          }
          if (base === C + V) {
            e.preventDefault() // re-pressing the same half form changes nothing
            return
          }
          if (base == null) return // ignore keys outside the layout
          // Anything other than the ा completer is the wrong next step → reject.
          e.preventDefault()
          session.markError()
          pulseFlash()
          return
        }

        // A half-form key whose full consonant the target wants here is held,
        // so the ा completer can finish it as an explicit second step.
        if (base && base.length === 2 && base[1] === V && isConsonant(base[0])) {
          const C = base[0]
          const m = session.typed.length
          if (isHalfOnlyConsonant(layout, C) && target[m] === C && target[m + 1] !== V) {
            e.preventDefault()
            setHalf(C)
            return
          }
        }
      }

      const res = processLayoutKey(layout, session.typed, e.code, e.shiftKey, altgr)
      if (!res) return

      e.preventDefault()
      for (let i = 0; i < res.remove; i++) session.popChar()
      for (const ch of res.insert) session.handleChar(ch)
    },
    [layout, session, target, setPending, setHalf, pulseFlash],
  )

  return useMemo(
    () => ({ onKeyDown, pending: pendingShortI, pendingHalf, flash }),
    [onKeyDown, pendingShortI, pendingHalf, flash],
  )
}
