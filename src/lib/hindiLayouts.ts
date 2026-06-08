/**
 * Hindi Unicode (Mangal / Devanagari) keyboard layouts + a small input-method
 * engine.
 *
 * Unlike KrutiDev/DevLys (legacy glyph fonts where ASCII keystrokes are simply
 * rendered as Hindi), these layouts produce REAL Unicode Devanagari. Each
 * physical key (by KeyboardEvent.code, so it is independent of the user's OS
 * keyboard language) maps to a Devanagari output string. A few layouts also
 * need light contextual combining (e.g. typing the independent vowel अ then the
 * आ-matra key produces आ).
 *
 * Sources:
 * - Remington GAIL: ported from the open-source Keyman keyboard
 *   `remington_gail.kmn` (© SIL Global). Re-implemented in TypeScript; only the
 *   factual key→codepoint mapping is reused.
 * - InScript: the Government-of-India standard Devanagari InScript layout
 *   (cross-checked against the Keyman `devanagari_inscript` layout data).
 * - Remington CBI: a Remington-family layout. No authoritative machine-readable
 *   source was available, so it is provided on the Remington (GAIL) base; the
 *   data-driven design below makes per-key corrections trivial.
 *
 * Content was rephrased/re-implemented for compliance with licensing
 * restrictions.
 */

export interface LayoutKey {
  /** output with no modifier */
  def?: string
  /** output with Shift */
  shift?: string
  /** output with AltGr (Right Alt) */
  altgr?: string
  /** output with Shift+AltGr */
  shiftAltgr?: string
}

export interface CombineRule {
  /** the Unicode the typed buffer must currently end with */
  prev: string
  /** the base output the pressed key would otherwise produce */
  trigger: string
  /** the replacement (the `prev` suffix is removed and this inserted) */
  out: string
}

export interface HindiLayout {
  id: string
  /** URL slug */
  slug: string
  label: string
  description: string
  /** key map, keyed by KeyboardEvent.code */
  keys: Record<string, LayoutKey>
  /** contextual combining rules (checked before the plain key output) */
  combines: CombineRule[]
  /**
   * Remington behaviour: pressing the आ-matra key right after a half consonant
   * (consonant + virama) turns it back into the full consonant (drops virama).
   */
  dropViramaOnAA?: boolean
}

const V = '\u094D' // virama / halant

/** True if `ch` is a Devanagari consonant (incl. nukta consonants). */
export function isConsonant(ch: string | undefined): boolean {
  if (!ch) return false
  const c = ch.charCodeAt(0)
  return (c >= 0x0915 && c <= 0x0939) || (c >= 0x0958 && c <= 0x095f)
}

/* -------------------------------------------------------------------------- */
/* Remington GAIL                                                             */
/* -------------------------------------------------------------------------- */

const remingtonGailKeys: Record<string, LayoutKey> = {
  Backquote: { def: '\u093C', shift: '\u0926\u094D\u092F' }, // ़ / द्य
  Digit1: { def: '1', shift: '\u0964' }, // । danda
  Digit2: { def: '2', shift: '/' },
  Digit3: { def: '3', shift: '\u0903' }, // ः
  Digit4: { def: '4', shift: '*' },
  Digit5: { def: '5', shift: '-' },
  Digit6: { def: '6', shift: '\u2018' },
  Digit7: { def: '7', shift: '\u2019' },
  Digit8: { def: '8', shift: '\u0926\u094D\u0927' }, // द्ध
  Digit9: { def: '9', shift: '\u0924\u094D\u0930' }, // त्र
  Digit0: { def: '0', shift: '\u090B' }, // ऋ
  Minus: { def: ';', shift: '.' },
  Equal: { def: '\u0943', shift: V }, // ृ / virama

  KeyQ: { def: '\u0941', shift: '\u092B' }, // ु / फ
  KeyW: { def: '\u0942', shift: '\u0945' }, // ू / ॅ
  KeyE: { def: '\u092E', shift: '\u092E' + V }, // म / म्
  KeyR: { def: '\u0924', shift: '\u0924' + V }, // त / त्
  KeyT: { def: '\u091C', shift: '\u091C' + V }, // ज / ज्
  KeyY: { def: '\u0932', shift: '\u0932' + V }, // ल / ल्
  KeyU: { def: '\u0928', shift: '\u0928' + V }, // न / न्
  KeyI: { def: '\u092A', shift: '\u092A' + V }, // प / प्
  KeyO: { def: '\u0935', shift: '\u0935' + V }, // व / व्
  KeyP: { def: '\u091A', shift: '\u091A' + V }, // च / च्
  BracketLeft: { def: '\u0916' + V, shift: '\u0915\u094D\u0937' + V }, // ख् / क्ष्
  BracketRight: { def: ',', shift: '\u0926\u094D\u0935' }, // , / द्व
  Backslash: { def: '(', shift: ')' },

  KeyA: { def: '\u0902', shift: '\u093E' }, // ं / ा
  KeyS: { def: '\u0947', shift: '\u0948' }, // े / ै
  KeyD: { def: '\u0915', shift: '\u0915' + V }, // क / क्
  KeyF: { def: '\u093F', shift: '\u0925' + V }, // ि / थ्
  KeyG: { def: '\u0939', shift: '\u0933' }, // ह / ळ
  KeyH: { def: '\u0940', shift: '\u092D' + V }, // ी / भ्
  KeyJ: { def: '\u0930', shift: '\u0936\u094D\u0930' }, // र / श्र
  KeyK: { def: '\u093E', shift: '\u091C\u094D\u091E' }, // ा / ज्ञ
  KeyL: { def: '\u0938', shift: '\u0938' + V }, // स / स्
  Semicolon: { def: '\u092F', shift: '\u0930\u0942' }, // य / रू
  Quote: { def: '\u0936' + V, shift: '\u0937' + V }, // श् / ष्

  KeyZ: { def: V + '\u0930', shift: '\u0930' + V }, // ्र (rakar) / र् (reph)
  KeyX: { def: '\u0917', shift: '\u0917' + V }, // ग / ग्
  KeyC: { def: '\u092C', shift: '\u092C' + V }, // ब / ब्
  KeyV: { def: '\u0905', shift: '\u091F' }, // अ / ट
  KeyB: { def: '\u0907', shift: '\u0920' }, // इ / ठ
  KeyN: { def: '\u0926', shift: '\u091B' }, // द / छ
  KeyM: { def: '\u0909', shift: '\u0921' }, // उ / ड
  Comma: { def: '\u090F', shift: '\u0922' }, // ए / ढ
  Period: { def: '\u0923' + V, shift: '\u091D' }, // ण् / झ
  Slash: { def: '\u0927' + V, shift: '?' }, // ध् / ?
  Space: { def: ' ' },
}

// Independent-vowel + matra combinations and nukta joins (from the Keyman rules).
const remingtonGailCombines: CombineRule[] = [
  { prev: '\u0905', trigger: '\u093E', out: '\u0906' }, // अ + ा → आ
  { prev: '\u0906', trigger: '\u0945', out: '\u0911' }, // आ + ॅ → ऑ
  { prev: '\u0906', trigger: '\u0947', out: '\u0913' }, // आ + े → ओ
  { prev: '\u0906', trigger: '\u0948', out: '\u0914' }, // आ + ै → औ
  { prev: '\u0907', trigger: '\u0930' + V, out: '\u0908' }, // इ + र् → ई
  { prev: '\u0909', trigger: '\u0941', out: '\u090A' }, // उ + ु → ऊ
  { prev: '\u090F', trigger: '\u0945', out: '\u090D' }, // ए + ॅ → ऍ
  { prev: '\u090F', trigger: '\u0947', out: '\u0910' }, // ए + े → ऐ
  { prev: '\u093E', trigger: '\u0945', out: '\u0949' }, // ा + ॅ → ॉ
  { prev: '\u093E', trigger: '\u0947', out: '\u094B' }, // ा + े → ो
  { prev: '\u093E', trigger: '\u0948', out: '\u094C' }, // ा + ै → ौ
  { prev: '\u0902', trigger: '\u0945', out: '\u0901' }, // ं + ॅ → ँ
  { prev: '\u0945', trigger: '\u093E', out: '\u0901' }, // ॅ + ा → ँ
  { prev: '\u0964', trigger: '\u0964', out: '\u0965' }, // । + । → ॥
  { prev: '\u0943', trigger: '\u0943', out: '\u0944' }, // ृ + ृ → ॄ
  // nukta consonants
  { prev: '\u0928', trigger: '\u093C', out: '\u0929' }, // ऩ
  { prev: '\u0930', trigger: '\u093C', out: '\u0931' }, // ऱ
  { prev: '\u0933', trigger: '\u093C', out: '\u0934' }, // ऴ
  { prev: '\u0915', trigger: '\u093C', out: '\u0958' }, // क़
  { prev: '\u0916', trigger: '\u093C', out: '\u0959' }, // ख़
  { prev: '\u0917', trigger: '\u093C', out: '\u095A' }, // ग़
  { prev: '\u091C', trigger: '\u093C', out: '\u095B' }, // ज़
  { prev: '\u0921', trigger: '\u093C', out: '\u095C' }, // ड़
  { prev: '\u0922', trigger: '\u093C', out: '\u095D' }, // ढ़
  { prev: '\u092B', trigger: '\u093C', out: '\u095E' }, // फ़
  { prev: '\u092F', trigger: '\u093C', out: '\u095F' }, // य़
]

/* -------------------------------------------------------------------------- */
/* InScript (Government standard)                                             */
/* -------------------------------------------------------------------------- */

const inscriptKeys: Record<string, LayoutKey> = {
  Backquote: { def: '\u094A', shift: '\u0912' }, // ॊ / ऒ
  Digit1: { def: '1', shift: '\u090D' }, // ऍ
  Digit2: { def: '2', shift: '\u0945' }, // ॅ
  Digit3: { def: '3', shift: '\u094D\u0930' }, // ्र
  Digit4: { def: '4', shift: '\u0930\u094D' }, // र्
  Digit5: { def: '5', shift: '\u091C\u094D\u091E' }, // ज्ञ
  Digit6: { def: '6', shift: '\u0924\u094D\u0930' }, // त्र
  Digit7: { def: '7', shift: '\u0915\u094D\u0937' }, // क्ष
  Digit8: { def: '8', shift: '\u0936\u094D\u0930' }, // श्र
  Digit9: { def: '9', shift: '(' },
  Digit0: { def: '0', shift: ')' },
  Minus: { def: '-', shift: '\u0903' }, // ः
  Equal: { def: '\u0943', shift: '\u090B' }, // ृ / ऋ

  KeyQ: { def: '\u094C', shift: '\u0914' }, // ौ / औ
  KeyW: { def: '\u0948', shift: '\u0910' }, // ै / ऐ
  KeyE: { def: '\u093E', shift: '\u0906' }, // ा / आ
  KeyR: { def: '\u0940', shift: '\u0908' }, // ी / ई
  KeyT: { def: '\u0942', shift: '\u090A' }, // ू / ऊ
  KeyY: { def: '\u092C', shift: '\u092D' }, // ब / भ
  KeyU: { def: '\u0939', shift: '\u0919' }, // ह / ङ
  KeyI: { def: '\u0917', shift: '\u0918' }, // ग / घ
  KeyO: { def: '\u0926', shift: '\u0927' }, // द / ध
  KeyP: { def: '\u091C', shift: '\u091D' }, // ज / झ
  BracketLeft: { def: '\u0921', shift: '\u0922' }, // ड / ढ
  BracketRight: { def: '\u093C', shift: '\u091E' }, // ़ / ञ
  Backslash: { def: '\u0949', shift: '\u0911' }, // ॉ / ऑ

  KeyA: { def: '\u094B', shift: '\u0913' }, // ो / ओ
  KeyS: { def: '\u0947', shift: '\u090F' }, // े / ए
  KeyD: { def: '\u094D', shift: '\u0905' }, // ् / अ
  KeyF: { def: '\u093F', shift: '\u0907' }, // ि / इ
  KeyG: { def: '\u0941', shift: '\u0909' }, // ु / उ
  KeyH: { def: '\u092A', shift: '\u092B' }, // प / फ
  KeyJ: { def: '\u0930', shift: '\u0931' }, // र / ऱ
  KeyK: { def: '\u0915', shift: '\u0916' }, // क / ख
  KeyL: { def: '\u0924', shift: '\u0925' }, // त / थ
  Semicolon: { def: '\u091A', shift: '\u091B' }, // च / छ
  Quote: { def: '\u091F', shift: '\u0920' }, // ट / ठ

  KeyZ: { def: '\u0946', shift: '\u090E' }, // ॆ / ऎ
  KeyX: { def: '\u0902', shift: '\u0901' }, // ं / ँ
  KeyC: { def: '\u092E', shift: '\u0923' }, // म / ण
  KeyV: { def: '\u0928', shift: '\u0929' }, // न / ऩ
  KeyB: { def: '\u0935', shift: '\u0934' }, // व / ऴ
  KeyN: { def: '\u0932', shift: '\u0933' }, // ल / ळ
  KeyM: { def: '\u0938', shift: '\u0936' }, // स / श
  Comma: { def: ',', shift: '\u0937' }, // , / ष
  Period: { def: '.', shift: '\u0964' }, // . / ।
  Slash: { def: '\u092F', shift: '\u095F' }, // य / य़
  Space: { def: ' ' },
}

/* -------------------------------------------------------------------------- */
/* Remington CBI (Remington-family, GAIL-compatible base)                     */
/* -------------------------------------------------------------------------- */
// No authoritative machine-readable CBI mapping was available; this reuses the
// Remington (GAIL) base so the layout is fully usable for practice. Adjust
// individual keys here if an official CBI chart is provided.
const remingtonCbiKeys: Record<string, LayoutKey> = remingtonGailKeys
const remingtonCbiCombines: CombineRule[] = remingtonGailCombines

/* -------------------------------------------------------------------------- */

export const hindiLayouts: HindiLayout[] = [
  {
    id: 'remington-gail',
    slug: 'remington-gail',
    label: 'Remington GAIL',
    description: 'Unicode Devanagari • Remington GAIL typewriter layout',
    keys: remingtonGailKeys,
    combines: remingtonGailCombines,
    dropViramaOnAA: true,
  },
  {
    id: 'inscript',
    slug: 'inscript',
    label: 'INSCRIPT',
    description: 'Unicode Devanagari • Government-standard InScript layout',
    keys: inscriptKeys,
    combines: [],
  },
  {
    id: 'remington-cbi',
    slug: 'remington-cbi',
    label: 'Remington CBI',
    description: 'Unicode Devanagari • Remington CBI typewriter layout',
    keys: remingtonCbiKeys,
    combines: remingtonCbiCombines,
    dropViramaOnAA: true,
  },
]

export function getHindiLayout(slug: string | undefined): HindiLayout | undefined {
  return hindiLayouts.find((l) => l.slug === slug)
}

/** Unicode Devanagari font stack used to render Mangal / Unicode Hindi. */
export const MANGAL_FONT =
  "'Noto Sans Devanagari', 'Mangal', 'Nirmala UI', 'Annapurna SIL', sans-serif"

export interface KeyOutput {
  remove: number
  insert: string
}

/** Resolve the raw (pre-combine) output a key produces for the given mods. */
export function rawKeyOutput(
  layout: HindiLayout,
  code: string,
  shift: boolean,
  altgr: boolean,
): string | undefined {
  const k = layout.keys[code]
  if (!k) return undefined
  if (altgr) return shift ? k.shiftAltgr : k.altgr
  return shift ? k.shift : k.def
}

/**
 * Given the current typed buffer and a physical key press, return how to update
 * the buffer: how many trailing chars to remove and what to insert. Returns
 * null when the key is not part of the layout (so the caller can ignore it).
 */
export function processLayoutKey(
  layout: HindiLayout,
  typed: string,
  code: string,
  shift: boolean,
  altgr: boolean,
): KeyOutput | null {
  const base = rawKeyOutput(layout, code, shift, altgr)
  if (base == null) return null

  // Remington: half-consonant + आ-matra key → full consonant (drop virama).
  if (
    layout.dropViramaOnAA &&
    base === '\u093E' &&
    typed.endsWith(V) &&
    isConsonant(typed[typed.length - 2])
  ) {
    return { remove: 1, insert: '' }
  }

  // Contextual combining (independent vowels, matras, nukta).
  for (const rule of layout.combines) {
    if (rule.trigger === base && typed.endsWith(rule.prev)) {
      return { remove: rule.prev.length, insert: rule.out }
    }
  }

  return { remove: 0, insert: base }
}

/**
 * For the on-screen keyboard / finger guidance: find which physical key (and
 * whether Shift is needed) produces the start of `remaining`. Returns the
 * longest-matching key so multi-codepoint keys (conjuncts) win over single ones.
 */
export function findKeyForNext(
  layout: HindiLayout,
  remaining: string,
): { code: string; shift: boolean } | null {
  if (!remaining) return null
  let best: { code: string; shift: boolean; len: number } | null = null
  for (const [code, k] of Object.entries(layout.keys)) {
    const candidates: Array<[string | undefined, boolean]> = [
      [k.def, false],
      [k.shift, true],
    ]
    for (const [out, shift] of candidates) {
      if (out && remaining.startsWith(out)) {
        if (!best || out.length > best.len) best = { code, shift, len: out.length }
      }
    }
  }
  // Fall back to combine rules (e.g. आ produced by अ + ा): point at the trigger key.
  if (!best) {
    for (const rule of layout.combines) {
      if (remaining.startsWith(rule.out)) {
        for (const [code, k] of Object.entries(layout.keys)) {
          if (k.def === rule.trigger) return { code, shift: false }
          if (k.shift === rule.trigger) return { code, shift: true }
        }
      }
    }
  }
  return best ? { code: best.code, shift: best.shift } : null
}
