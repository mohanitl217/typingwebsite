// QWERTY layout + finger assignments used for the virtual keyboard and
// finger-placement guidance in the Learn Typing module.

export type Finger =
  | 'l-pinky'
  | 'l-ring'
  | 'l-middle'
  | 'l-index'
  | 'r-index'
  | 'r-middle'
  | 'r-ring'
  | 'r-pinky'
  | 'thumb'

export interface KeyDef {
  /** main lowercase / primary label */
  label: string
  /** shifted label shown above (for symbol keys) */
  shift?: string
  /** the character(s) this key produces (lowercase) */
  code: string
  finger: Finger
  /** relative width (1 = standard) */
  width?: number
  /** true for home-row resting keys */
  home?: boolean
}

export const fingerColors: Record<Finger, string> = {
  'l-pinky': 'bg-rose-200',
  'l-ring': 'bg-amber-200',
  'l-middle': 'bg-emerald-200',
  'l-index': 'bg-sky-200',
  'r-index': 'bg-indigo-200',
  'r-middle': 'bg-emerald-200',
  'r-ring': 'bg-amber-200',
  'r-pinky': 'bg-rose-200',
  thumb: 'bg-slate-200',
}

export const fingerNames: Record<Finger, string> = {
  'l-pinky': 'Left Pinky',
  'l-ring': 'Left Ring',
  'l-middle': 'Left Middle',
  'l-index': 'Left Index',
  'r-index': 'Right Index',
  'r-middle': 'Right Middle',
  'r-ring': 'Right Ring',
  'r-pinky': 'Right Pinky',
  thumb: 'Thumb',
}

export const keyboardRows: KeyDef[][] = [
  [
    { label: '`', shift: '~', code: '`', finger: 'l-pinky' },
    { label: '1', shift: '!', code: '1', finger: 'l-pinky' },
    { label: '2', shift: '@', code: '2', finger: 'l-ring' },
    { label: '3', shift: '#', code: '3', finger: 'l-middle' },
    { label: '4', shift: '$', code: '4', finger: 'l-index' },
    { label: '5', shift: '%', code: '5', finger: 'l-index' },
    { label: '6', shift: '^', code: '6', finger: 'r-index' },
    { label: '7', shift: '&', code: '7', finger: 'r-index' },
    { label: '8', shift: '*', code: '8', finger: 'r-middle' },
    { label: '9', shift: '(', code: '9', finger: 'r-ring' },
    { label: '0', shift: ')', code: '0', finger: 'r-pinky' },
    { label: '-', shift: '_', code: '-', finger: 'r-pinky' },
    { label: '=', shift: '+', code: '=', finger: 'r-pinky' },
    { label: 'Backspace', code: 'Backspace', finger: 'r-pinky', width: 2 },
  ],
  [
    { label: 'Tab', code: 'Tab', finger: 'l-pinky', width: 1.5 },
    { label: 'q', code: 'q', finger: 'l-pinky' },
    { label: 'w', code: 'w', finger: 'l-ring' },
    { label: 'e', code: 'e', finger: 'l-middle' },
    { label: 'r', code: 'r', finger: 'l-index' },
    { label: 't', code: 't', finger: 'l-index' },
    { label: 'y', code: 'y', finger: 'r-index' },
    { label: 'u', code: 'u', finger: 'r-index' },
    { label: 'i', code: 'i', finger: 'r-middle' },
    { label: 'o', code: 'o', finger: 'r-ring' },
    { label: 'p', code: 'p', finger: 'r-pinky' },
    { label: '[', shift: '{', code: '[', finger: 'r-pinky' },
    { label: ']', shift: '}', code: ']', finger: 'r-pinky' },
    { label: '\\', shift: '|', code: '\\', finger: 'r-pinky', width: 1.5 },
  ],
  [
    { label: 'Caps', code: 'CapsLock', finger: 'l-pinky', width: 1.75 },
    { label: 'a', code: 'a', finger: 'l-pinky', home: true },
    { label: 's', code: 's', finger: 'l-ring', home: true },
    { label: 'd', code: 'd', finger: 'l-middle', home: true },
    { label: 'f', code: 'f', finger: 'l-index', home: true },
    { label: 'g', code: 'g', finger: 'l-index' },
    { label: 'h', code: 'h', finger: 'r-index' },
    { label: 'j', code: 'j', finger: 'r-index', home: true },
    { label: 'k', code: 'k', finger: 'r-middle', home: true },
    { label: 'l', code: 'l', finger: 'r-ring', home: true },
    { label: ';', shift: ':', code: ';', finger: 'r-pinky', home: true },
    { label: "'", shift: '"', code: "'", finger: 'r-pinky' },
    { label: 'Enter', code: 'Enter', finger: 'r-pinky', width: 2.25 },
  ],
  [
    { label: 'Shift', code: 'ShiftLeft', finger: 'l-pinky', width: 2.25 },
    { label: 'z', code: 'z', finger: 'l-pinky' },
    { label: 'x', code: 'x', finger: 'l-ring' },
    { label: 'c', code: 'c', finger: 'l-middle' },
    { label: 'v', code: 'v', finger: 'l-index' },
    { label: 'b', code: 'b', finger: 'l-index' },
    { label: 'n', code: 'n', finger: 'r-index' },
    { label: 'm', code: 'm', finger: 'r-index' },
    { label: ',', shift: '<', code: ',', finger: 'r-middle' },
    { label: '.', shift: '>', code: '.', finger: 'r-ring' },
    { label: '/', shift: '?', code: '/', finger: 'r-pinky' },
    { label: 'Shift', code: 'ShiftRight', finger: 'r-pinky', width: 2.75 },
  ],
  [
    { label: 'Ctrl', code: 'ControlLeft', finger: 'l-pinky', width: 1.5 },
    { label: 'Alt', code: 'AltLeft', finger: 'thumb', width: 1.5 },
    { label: 'Space', code: ' ', finger: 'thumb', width: 7 },
    { label: 'Alt', code: 'AltRight', finger: 'thumb', width: 1.5 },
    { label: 'Ctrl', code: 'ControlRight', finger: 'r-pinky', width: 1.5 },
  ],
]

// Map a typed character to the key code + which finger should press it.
const charIndex: Record<string, { code: string; finger: Finger; shift: boolean }> = {}
for (const row of keyboardRows) {
  for (const k of row) {
    if (k.code.length === 1 || k.code === ' ') {
      charIndex[k.code] = { code: k.code, finger: k.finger, shift: false }
      if (/[a-z]/.test(k.code)) {
        charIndex[k.code.toUpperCase()] = { code: k.code, finger: k.finger, shift: true }
      }
    }
    if (k.shift) {
      charIndex[k.shift] = { code: k.code, finger: k.finger, shift: true }
    }
  }
}

export function lookupChar(ch: string) {
  return charIndex[ch] || charIndex[ch.toLowerCase()] || null
}
