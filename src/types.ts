export interface Exercise {
  id: string
  title: string
  category: string
  type: 'paragraph' | 'words' | 'numbers'
  text: string
  createdAt?: string
}

export interface User {
  id: string
  name: string
  email?: string
  mobile?: string
  active: boolean
  createdAt?: string
  attempts?: number
}

export interface TestResult {
  id: string
  userId: string | null
  module: string
  exerciseId: string | null
  wpm: number
  accuracy: number
  errors: number
  durationSec: number
  createdAt: string
  userName?: string
  exerciseTitle?: string
}

export interface TypingStats {
  wpm: number
  accuracy: number
  errors: number
  correctChars: number
  typedChars: number
  elapsedSec: number
  keystrokes?: number
  backspaces?: number
}
