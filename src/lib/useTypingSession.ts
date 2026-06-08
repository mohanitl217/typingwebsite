import { useCallback, useMemo, useRef, useState } from 'react'

export type BackspaceMode = 'full' | 'word' | 'off'

export interface TypingSettings {
  backspaceMode: BackspaceMode
  moveOnError: boolean
  playSounds: boolean
}

export interface SessionState {
  typed: string
  startedAt: number | null
  finishedAt: number | null
  /** index of each typed char that was wrong (for stats) */
  errorCount: number
}

const beep = (() => {
  let ctx: AudioContext | null = null
  return (ok: boolean) => {
    try {
      ctx = ctx || new (window.AudioContext || (window as any).webkitAudioContext)()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.frequency.value = ok ? 660 : 220
      g.gain.value = 0.04
      o.start()
      o.stop(ctx.currentTime + 0.04)
    } catch {
      /* ignore */
    }
  }
})()

export function useTypingSession(target: string, settings: TypingSettings) {
  const [typed, setTyped] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [finishedAt, setFinishedAt] = useState<number | null>(null)
  const errorRef = useRef(0)
  const [errorCount, setErrorCount] = useState(0)
  const keystrokesRef = useRef(0)
  const [keystrokes, setKeystrokes] = useState(0)
  const backspaceRef = useRef(0)
  const [backspaces, setBackspaces] = useState(0)

  const reset = useCallback(() => {
    setTyped('')
    setStartedAt(null)
    setFinishedAt(null)
    errorRef.current = 0
    setErrorCount(0)
    keystrokesRef.current = 0
    setKeystrokes(0)
    backspaceRef.current = 0
    setBackspaces(0)
  }, [])

  const finish = useCallback(() => {
    setFinishedAt((f) => f ?? Date.now())
  }, [])

  const handleChar = useCallback(
    (ch: string) => {
      if (finishedAt) return
      // Every printable key press counts as a keystroke (key depression).
      keystrokesRef.current += 1
      setKeystrokes(keystrokesRef.current)
      setTyped((prev) => {
        if (prev.length >= target.length) return prev
        const expected = target[prev.length]
        const correct = ch === expected
        if (!correct) {
          errorRef.current += 1
          setErrorCount(errorRef.current)
        }
        if (settings.playSounds) beep(correct)

        // Move on error OFF: block until the correct key is pressed.
        if (!settings.moveOnError && !correct) {
          return prev
        }
        const next = prev + ch
        if (next.length === 1 && !startedAt) setStartedAt(Date.now())
        if (next.length >= target.length) setFinishedAt(Date.now())
        return next
      })
      if (!startedAt) setStartedAt((s) => s ?? Date.now())
    },
    [finishedAt, target, settings.moveOnError, settings.playSounds, startedAt],
  )

  const handleBackspace = useCallback(() => {
    if (finishedAt) return
    if (settings.backspaceMode === 'off') return
    setTyped((prev) => {
      if (prev.length === 0) return prev
      backspaceRef.current += 1
      setBackspaces(backspaceRef.current)
      if (settings.backspaceMode === 'word') {
        // delete back to the start of the current word
        let i = prev.length
        // skip trailing spaces
        while (i > 0 && prev[i - 1] === ' ') i--
        while (i > 0 && prev[i - 1] !== ' ') i--
        return prev.slice(0, i)
      }
      return prev.slice(0, -1)
    })
  }, [finishedAt, settings.backspaceMode])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
        return
      }
      if (e.key === 'Enter') {
        if (target.includes('\n')) {
          e.preventDefault()
          handleChar('\n')
        }
        return
      }
      if (e.key === 'Tab') {
        if (target.includes('\t')) {
          e.preventDefault()
          handleChar('\t')
        }
        return
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        handleChar(e.key)
      }
    },
    [handleBackspace, handleChar, target],
  )

  const stats = useMemo(() => {
    const elapsedMs = (finishedAt ?? Date.now()) - (startedAt ?? Date.now())
    const elapsedSec = startedAt ? Math.max(0.001, elapsedMs / 1000) : 0
    let correctChars = 0
    for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) correctChars++
    const words = correctChars / 5
    const wpm = elapsedSec > 0 ? Math.round((words / elapsedSec) * 60) : 0
    const accuracy =
      typed.length + errorCount > 0
        ? Math.round((correctChars / Math.max(1, typed.length + errorCount)) * 100)
        : 100
    return {
      wpm: Math.max(0, wpm),
      accuracy: Math.min(100, Math.max(0, accuracy)),
      errors: errorCount,
      correctChars,
      typedChars: typed.length,
      elapsedSec: Math.round(elapsedSec),
      keystrokes,
      backspaces,
    }
  }, [typed, target, startedAt, finishedAt, errorCount, keystrokes, backspaces])

  return {
    typed,
    startedAt,
    finishedAt,
    isDone: typed.length >= target.length && target.length > 0,
    stats,
    onKeyDown,
    handleChar,
    handleBackspace,
    reset,
    finish,
  }
}
