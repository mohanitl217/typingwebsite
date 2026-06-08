import { useCallback } from 'react'
import type React from 'react'
import { processLayoutKey, type HindiLayout } from './hindiLayouts'

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

/**
 * Returns an onKeyDown handler that turns physical key presses into Unicode
 * Devanagari via the given layout's input-method engine and feeds the result
 * into a typing session. Combining keystrokes (e.g. अ + ा → आ) pop the
 * provisional character before inserting the combined one; because the session
 * uses functional state updates these compose correctly within one event.
 */
export function useHindiLayoutInput(layout: HindiLayout, session: LayoutSession, target: string) {
  return useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return

      if (e.key === 'Backspace') {
        e.preventDefault()
        session.handleBackspace()
        return
      }
      if (e.key === 'Enter') {
        if (target.includes('\n')) {
          e.preventDefault()
          session.handleChar('\n')
        }
        return
      }
      if (MODIFIER_KEYS.has(e.key)) return

      const altgr =
        e.getModifierState?.('AltGraph') === true || (e.altKey && e.ctrlKey)
      const res = processLayoutKey(layout, session.typed, e.code, e.shiftKey, altgr)
      if (!res) return

      e.preventDefault()
      for (let i = 0; i < res.remove; i++) session.popChar()
      for (const ch of res.insert) session.handleChar(ch)
    },
    [layout, session, target],
  )
}
