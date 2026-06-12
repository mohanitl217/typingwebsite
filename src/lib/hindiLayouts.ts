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
  /**
   * Remington behaviour: the short-i matra (ि, U+093F) is keyed BEFORE its
   * consonant (on the typewriter it visually sits to the left of the letter).
   * When true, the input hook "floats" a pressed ि and attaches it after the
   * next consonant cluster — producing correct Unicode order (e.g. ि then क →
   * कि) — and the on-screen key hint guides the learner to press ि first.
   */
  shortIBeforeConsonant?: boolean
}

const V = '\u094D' // virama / halant
const SHORT_I = '\u093F' // ि — short-i matra (rendered to the LEFT of its consonant)
const AA = '\u093E' // ा — aa-matra, also the inherent-vowel completer on Remington

/** True if `ch` is a Devanagari consonant (incl. nukta consonants). */
export function isConsonant(ch: string | undefined): boolean {
  if (!ch) return false
  const c = ch.charCodeAt(0)
  return (c >= 0x0915 && c <= 0x0939) || (c >= 0x0958 && c <= 0x095f)
}

/**
 * True if `s` is a single dependent vowel sign (matra) other than the आ-matra
 * `ा`, or one of the combining marks anusvara/visarga/candrabindu. These are the
 * signs that, when typed right after a Remington half consonant, drop the virama
 * and attach to the now-full consonant (e.g. श् + ु → शु). The आ-matra is handled
 * separately (it acts as the inherent-vowel completer, giving the bare full
 * consonant), and the virama itself (U+094D) is intentionally excluded.
 */
export function isMatra(s: string | undefined): boolean {
  if (!s || s.length !== 1) return false
  const c = s.charCodeAt(0)
  return (
    (c >= 0x093f && c <= 0x094c) || // ि ी ु ू ृ ॄ ॅ ॆ े ै ॉ ॊ ो ौ
    c === 0x0901 || // ँ
    c === 0x0902 || // ं
    c === 0x0903 // ः
  )
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
  BracketLeft: { def: '\u0916' + V, shift: '\u0915\u094D\u0937' }, // ख् / क्ष
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
  Quote: { def: '\u0936' + V, shift: '\u0937' }, // श् / ष

  KeyZ: { def: V + '\u0930', shift: '\u0930' + V }, // ्र (rakar) / र् (reph)
  KeyX: { def: '\u0917', shift: '\u0917' + V }, // ग / ग्
  KeyC: { def: '\u092C', shift: '\u092C' + V }, // ब / ब्
  KeyV: { def: '\u0905', shift: '\u091F' }, // अ / ट
  KeyB: { def: '\u0907', shift: '\u0920' }, // इ / ठ
  KeyN: { def: '\u0926', shift: '\u091B' }, // द / छ
  KeyM: { def: '\u0909', shift: '\u0921' }, // उ / ड
  Comma: { def: '\u090F', shift: '\u0922' }, // ए / ढ
  Period: { def: '\u0923' + V, shift: '\u091D' }, // ण् / झ
  Slash: { def: '\u0927' + V, shift: '\u0918' + V }, // ध् / घ्
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
  { prev: '\u0928', trigger: '\u093C', out: '\u0928\u093C' }, // ऩ
  { prev: '\u0930', trigger: '\u093C', out: '\u0930\u093C' }, // ऱ
  { prev: '\u0933', trigger: '\u093C', out: '\u0933\u093C' }, // ऴ
  { prev: '\u0915', trigger: '\u093C', out: '\u0915\u093C' }, // क़
  { prev: '\u0916', trigger: '\u093C', out: '\u0916\u093C' }, // ख़
  { prev: '\u0917', trigger: '\u093C', out: '\u0917\u093C' }, // ग़
  { prev: '\u091C', trigger: '\u093C', out: '\u091C\u093C' }, // ज़
  { prev: '\u0921', trigger: '\u093C', out: '\u0921\u093C' }, // ड़
  { prev: '\u0922', trigger: '\u093C', out: '\u0922\u093C' }, // ढ़
  { prev: '\u092B', trigger: '\u093C', out: '\u092B\u093C' }, // फ़
  { prev: '\u092F', trigger: '\u093C', out: '\u092F\u093C' }, // य़
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
    shortIBeforeConsonant: true,
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
    shortIBeforeConsonant: true,
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

  // Remington half-consonant model: these layouts emit certain consonants as
  // their half form (consonant + virama). The next vowel "completes" them:
  //   • the ा / inherent-vowel key drops the virama, leaving the bare full
  //     consonant with its inherent 'a'  (e.g. ध् + ा-key → ध);
  //   • any other matra drops the virama and attaches            (श् + ु → शु);
  //   • another consonant keeps the virama, forming a conjunct   (भ् + य → भ्य).
  if (
    layout.dropViramaOnAA &&
    typed.endsWith(V) &&
    isConsonant(typed[typed.length - 2])
  ) {
    if (base === '\u093E') return { remove: 1, insert: '' }
    if (isMatra(base)) return { remove: 1, insert: base }
  }

  // Contextual combining (independent vowels, matras, nukta).
  for (const rule of layout.combines) {
    if (rule.trigger === base && typed.endsWith(rule.prev)) {
      return { remove: rule.prev.length, insert: rule.out }
    }
  }

  return { remove: 0, insert: base }
}

/** Length of the common prefix of two strings. */
function commonPrefixLen(a: string, b: string): number {
  const n = Math.min(a.length, b.length)
  let i = 0
  while (i < n && a[i] === b[i]) i++
  return i
}

/**
 * Length of the consonant cluster at the start of `s` IF that cluster is
 * immediately followed by the short-i matra ि, otherwise 0. A cluster is a
 * consonant, optionally extended by further virama-joined consonants
 * (e.g. क, क्ष, श्र). On Remington layouts the short-i matra is keyed BEFORE
 * this cluster, so a non-zero result marks a "matra-first" syllable.
 */
export function shortIClusterLen(s: string): number {
  if (!isConsonant(s[0])) return 0
  let i = 1
  while (s[i] === V && isConsonant(s[i + 1])) i += 2
  return s[i] === SHORT_I ? i : 0
}

/**
 * Set of consonants this layout produces ONLY in half form (consonant + virama)
 * — there is a key for `C्` but none for the bare full `C`. Such a consonant is
 * typed as the half form followed by the ा / inherent-vowel completer (which
 * drops the virama, see `dropViramaOnAA`). Cached per layout.
 */
const halfOnlyCache = new WeakMap<HindiLayout, Set<string>>()
function halfOnlySet(layout: HindiLayout): Set<string> {
  const cached = halfOnlyCache.get(layout)
  if (cached) return cached
  const full = new Set<string>()
  const half = new Set<string>()
  for (const k of Object.values(layout.keys)) {
    for (const out of [k.def, k.shift, k.altgr, k.shiftAltgr]) {
      if (!out) continue
      if (out.length === 1 && isConsonant(out)) full.add(out)
      if (out.length === 2 && out[1] === V && isConsonant(out[0])) half.add(out[0])
    }
  }
  const set = new Set([...half].filter((c) => !full.has(c)))
  halfOnlyCache.set(layout, set)
  return set
}

/**
 * True if `ch` is a full consonant that this layout can only enter via its half
 * form + ा completer (e.g. ण, थ, श, ख, ध, भ, घ on Remington GAIL). Typing it is
 * therefore a two-step sequence: press the half-form key, then the ा completer.
 */
export function isHalfOnlyConsonant(layout: HindiLayout, ch: string | undefined): boolean {
  if (!ch || !layout.dropViramaOnAA) return false
  return halfOnlySet(layout).has(ch)
}

/**
 * The target index the on-screen cursor should sit on, honouring the Remington
 * rule that the short-i matra ि is keyed BEFORE its consonant cluster:
 *  - "matra-first" (the ि has not been pressed yet): point at the ि cell, which
 *    sits just after its consonant cluster in the Unicode text;
 *  - "pending" (the ि is floating, waiting for its consonant): point back at the
 *    start of the consonant cluster the learner must type next.
 * For every other layout / position this is just the end of the typed text.
 */
export function typingCursorIndex(
  layout: HindiLayout,
  typed: string,
  target: string,
  pending: boolean,
): number {
  const pos = typed.length
  if (!layout.shortIBeforeConsonant || pending) return pos
  const len = shortIClusterLen(target.slice(pos))
  return len > 0 ? pos + len : pos
}

/**
 * Index of the short-i matra ि that is currently "floating" (its key has been
 * pressed but its consonant has not yet been typed), or null when nothing is
 * floating. Used to render the held matra while pending.
 */
export function floatedMatraIndex(
  layout: HindiLayout,
  typed: string,
  target: string,
): number | null {
  if (!layout.shortIBeforeConsonant) return null
  const pos = typed.length
  const len = shortIClusterLen(target.slice(pos))
  return len > 0 ? pos + len : null
}

/**
 * The order in which the target's codepoints should be DISPLAYED on a typing
 * strip for layouts where the short-i matra ि is keyed before its consonant:
 * each ि is moved to just BEFORE its consonant cluster, so the strip reads in
 * the same order it is typed (ि then र for रि). Returns an array of target
 * indices; the underlying text/comparison is unchanged. For every other layout
 * this is the identity order [0, 1, 2, …].
 */
export function displayOrder(layout: HindiLayout, target: string): number[] {
  const n = target.length
  const order: number[] = []
  if (!layout.shortIBeforeConsonant) {
    for (let i = 0; i < n; i++) order.push(i)
    return order
  }
  let i = 0
  while (i < n) {
    const len = shortIClusterLen(target.slice(i))
    if (len > 0) {
      order.push(i + len) // the ि comes first…
      for (let k = 0; k < len; k++) order.push(i + k) // …then its consonant cluster
      i += len + 1
    } else {
      order.push(i)
      i++
    }
  }
  return order
}

/* -------------------------------------------------------------------------- */
/* Image-style strip segmentation                                             */
/* -------------------------------------------------------------------------- */

/** A Devanagari combining mark (matra, virama, nukta, anusvara/visarga, etc.). */
function isDevCombining(ch: string): boolean {
  const c = ch.charCodeAt(0)
  return (
    (c >= 0x0900 && c <= 0x0903) ||
    c === 0x093c ||
    (c >= 0x093e && c <= 0x094f) ||
    (c >= 0x0951 && c <= 0x0957) ||
    c === 0x0962 ||
    c === 0x0963
  )
}

/** A dependent vowel sign / anusvara-class mark that is typed as its OWN key
 *  AFTER the consonant (so it can be split out as a separate cell). The virama
 *  and nukta are excluded — they belong to the consonant (half forms / नुक्ता). */
function isMatraOrSign(ch: string): boolean {
  const c = ch.charCodeAt(0)
  return (
    (c >= 0x093e && c <= 0x094c) || // vowel signs ा ि ी ु … ौ (not virama 094D)
    (c >= 0x0900 && c <= 0x0903) || // ँ ं ः
    (c >= 0x0951 && c <= 0x0957) ||
    c === 0x0962 ||
    c === 0x0963
  )
}

/**
 * Split the target into orthographic clusters (aksharas): a base letter plus
 * its following matras / virama-joined consonants / signs. Non-Devanagari
 * characters (space, punctuation, digits) are their own single-character
 * clusters. Returns an array of clusters, each a list of target indices.
 */
export function splitAksharas(target: string): number[][] {
  const groups: number[][] = []
  let cur: number[] = []
  for (let i = 0; i < target.length; i++) {
    if (cur.length === 0) {
      cur = [i]
      continue
    }
    const prev = target.charCodeAt(i - 1)
    if (isDevCombining(target[i]) || prev === 0x094d) {
      cur.push(i) // a sign attaches, or a consonant after virama continues a conjunct
    } else {
      groups.push(cur)
      cur = [i]
    }
  }
  if (cur.length) groups.push(cur)
  return groups
}

export interface StripSegment {
  /** text to render in the cell (a whole cluster, or one component while typing) */
  text: string
  status: 'done' | 'wrong' | 'current' | 'floated' | 'partial' | 'upcoming'
  /** scroll anchor (the active cell) */
  anchor?: boolean
}

/**
 * Build the cells for the image-style typing strip. Completed and upcoming
 * aksharas render as a single COMBINED cell (so जी shows the real ligature, not
 * ज + ◌ी). The akshara currently being typed is SPLIT into its typing units —
 * the consonant cluster and each following matra/sign as separate cells — so the
 * learner can see the steps. On Remington layouts the short-i matra ि is keyed
 * first, so within the current akshara it is shown before its consonant.
 */
export function buildTypingStrip(
  layout: HindiLayout,
  target: string,
  typed: string,
  pending: boolean,
  pendingHalf: string | null = null,
): StripSegment[] {
  const pos = typed.length
  const cur = typingCursorIndex(layout, typed, target, pending)
  const floated = pending ? floatedMatraIndex(layout, typed, target) : null
  const segs: StripSegment[] = []

  const rangeText = (idxs: number[]) => target.slice(idxs[0], idxs[idxs.length - 1] + 1)
  // Status of a unit WITHIN the current (still-incomplete) akshara. A unit that
  // is fully typed and correct is shown as 'partial' (yellow) rather than green,
  // so the learner sees the syllable is started but not finished yet.
  const statusFor = (idxs: number[]): StripSegment['status'] => {
    if (idxs.some((k) => k === cur)) return 'current'
    if (idxs.some((k) => k === floated)) return 'floated'
    if (idxs.every((k) => k < pos)) {
      return idxs.every((k) => typed[k] === target[k]) ? 'partial' : 'wrong'
    }
    return 'upcoming'
  }

  for (const g of splitAksharas(target)) {
    const start = g[0]
    const end = g[g.length - 1]

    if (pos > end || pos < start) {
      // Fully typed or fully upcoming → one combined cell (real ligature).
      const correct = g.every((k) => typed[k] === target[k])
      segs.push({
        text: rangeText(g),
        status: pos > end ? (correct ? 'done' : 'wrong') : 'upcoming',
      })
      continue
    }

    // Current akshara → split into typing units: the consonant cluster, then
    // each matra/sign. The short-i matra is pulled to the front.
    const baseIdx: number[] = []
    const signIdx: number[] = []
    let inSigns = false
    for (const idx of g) {
      if (isMatraOrSign(target[idx])) inSigns = true
      ;(inSigns ? signIdx : baseIdx).push(idx)
    }
    const shortIdx = layout.shortIBeforeConsonant
      ? signIdx.find((idx) => target.charCodeAt(idx) === 0x093f)
      : undefined

    // A standalone half-only consonant (e.g. ण) that has not been entered yet is
    // shown as TWO steps: its half form (ण्) then the ा completer that turns it
    // into the full letter — mirroring how it is actually keyed on Remington.
    const ci = baseIdx[0]
    const decomposeHalf =
      shortIdx === undefined &&
      baseIdx.length === 1 &&
      ci === pos &&
      isHalfOnlyConsonant(layout, target[ci])

    if (shortIdx !== undefined) {
      const s = statusFor([shortIdx])
      segs.push({ text: target[shortIdx], status: s, anchor: s === 'current' })
    }
    if (decomposeHalf) {
      const held = pendingHalf === target[ci]
      segs.push({ text: target[ci] + V, status: held ? 'partial' : 'current', anchor: !held })
      segs.push({ text: AA, status: held ? 'current' : 'upcoming', anchor: held })
    } else if (baseIdx.length) {
      const s = statusFor(baseIdx)
      segs.push({ text: rangeText(baseIdx), status: s, anchor: s === 'current' })
    }
    for (const idx of signIdx) {
      if (idx === shortIdx) continue
      const s = statusFor([idx])
      segs.push({ text: target[idx], status: s, anchor: s === 'current' })
    }
  }
  return segs
}

/**
 * For the plain (non-image) typing surfaces: the start index of the akshara
 * currently being typed when it is only PARTIALLY typed (a consonant has been
 * entered but its matra / rest of the cluster has not). Returns null when the
 * cursor sits on an akshara boundary (nothing of the next akshara typed yet) or
 * the text is finished. Typed characters at or after this index belong to an
 * unfinished syllable and can be shown in yellow.
 */
export function incompleteAksharaStart(target: string, pos: number): number | null {
  if (pos <= 0 || pos >= target.length) return null
  for (const g of splitAksharas(target)) {
    const start = g[0]
    const end = g[g.length - 1]
    if (pos >= start && pos <= end) return start < pos ? start : null
    if (start > pos) break
  }
  return null
}

/**
 * Can the still-uncommitted buffer suffix `tail` evolve — purely through the
 * layout's contextual combine rules — into something that begins the target
 * text we still need (`need`)? Used to prune the keystroke search so we only
 * explore combine-relevant key presses (e.g. अ → आ → ओ).
 */
function tailLeadsTo(layout: HindiLayout, tail: string, need: string): boolean {
  if (tail === '') return true
  const seen = new Set<string>()
  const stack = [tail]
  while (stack.length) {
    const s = stack.pop()!
    if (seen.has(s)) continue
    seen.add(s)
    if (need.startsWith(s)) return true
    for (const rule of layout.combines) {
      if (rule.prev === s && !seen.has(rule.out)) stack.push(rule.out)
    }
    // Remington: a trailing half consonant (…consonant + virama) can be completed
    // into the bare full consonant by pressing the ा / inherent-vowel key, so the
    // search must treat the virama-less form as reachable too (e.g. ध् → ध, which
    // then begins "धर"). Without this the BFS would prune the half consonant and
    // never suggest the key that completes it.
    if (
      layout.dropViramaOnAA &&
      s.endsWith(V) &&
      isConsonant(s[s.length - 2]) &&
      !seen.has(s.slice(0, -1))
    ) {
      stack.push(s.slice(0, -1))
    }
  }
  return false
}

/** All (code, shift) key presses applied to `buffer`, with their new buffers.
 *  Unshifted presses are listed first so that, when two keys produce the same
 *  output, the search prefers the simpler (no-Shift) key. */
function pressAll(
  layout: HindiLayout,
  buffer: string,
): Array<{ code: string; shift: boolean; nb: string }> {
  const list: Array<{ code: string; shift: boolean; nb: string }> = []
  for (const shift of [false, true]) {
    for (const code of Object.keys(layout.keys)) {
      const res = processLayoutKey(layout, buffer, code, shift, false)
      if (!res) continue
      list.push({ code, shift, nb: buffer.slice(0, buffer.length - res.remove) + res.insert })
    }
  }
  return list
}

/**
 * Suggest the next physical key (and Shift) the learner should press, given the
 * text they have typed so far and the full target.
 *
 * This simulates the layout's actual input-method engine instead of naively
 * prefix-matching key outputs against the remaining text. That matters for:
 *  - matras / independent vowels built from combine rules (e.g. आ = अ + ा,
 *    ओ = अ + ा + े, ो = ा + े) where the FIRST key to press is the start of the
 *    sequence, not the final matra; and
 *  - half consonants / conjuncts, which are matched as whole keystrokes.
 */
export function nextKeyToward(
  layout: HindiLayout,
  typed: string,
  target: string,
  pendingShortI = false,
  pendingHalf: string | null = null,
): { code: string; shift: boolean } | null {
  if (!target || typed === target) return null

  // A half-only consonant (e.g. ण) whose half form has been pressed is waiting
  // for its ा completer — point the learner straight at that key.
  if (pendingHalf) return findKeyForNext(layout, AA)

  // Guidance must FOLLOW THE CURSOR. With "Move on Error" enabled, a wrong
  // keystroke is committed into `typed`, so commonPrefixLen() would freeze at
  // the first mistake and keep suggesting the key for that stale position. To
  // avoid that, guide from a clean prefix ending at the cursor (typed.length),
  // which advances even after mistakes. The exception is when the buffer is
  // genuinely mid-combine — its uncommitted tail is a valid IME intermediate
  // that can still combine into the target (e.g. अ before pressing ा for आ) —
  // in which case we keep the real buffer so the combine is suggested.
  const matched = commonPrefixLen(typed, target)
  const midCombine =
    matched < typed.length &&
    tailLeadsTo(layout, typed.slice(matched), target.slice(matched))
  const effTyped = midCombine
    ? typed
    : target.slice(0, Math.min(typed.length, target.length))

  if (effTyped === target) return null

  // Remington: the short-i matra ि is keyed BEFORE its consonant. If the next
  // syllable is <consonant cluster> + ि and that matra has not been pressed yet
  // (pendingShortI === false), point the learner at the ि key first. The BFS
  // below would otherwise prune the standalone ि and suggest the consonant —
  // the wrong order for this layout. Once ि is held (pendingShortI === true),
  // we fall through so the search guides them to the consonant next.
  if (layout.shortIBeforeConsonant && !pendingShortI) {
    const sm = commonPrefixLen(effTyped, target)
    if (shortIClusterLen(target.slice(sm)) > 0) {
      return findKeyForNext(layout, SHORT_I)
    }
  }

  const startMatch = commonPrefixLen(effTyped, target)
  const committed = target.slice(0, startMatch)
  const need = target.slice(startMatch)

  // Breadth-first search over key presses. We look for the shortest keystroke
  // sequence that turns the current buffer into a strictly LONGER correct prefix
  // of `target`. Every accepted state must itself be a prefix of `target` (so a
  // key never "overshoots" by inserting an unwanted conjunct), while in-progress
  // combine states (e.g. क + ा before pressing े to get को) are allowed to pass
  // through as long as they can still reach the needed text.
  interface Node {
    buffer: string
    first: { code: string; shift: boolean } | null
    depth: number
  }
  const seen = new Set<string>([effTyped])
  const queue: Node[] = [{ buffer: effTyped, first: null, depth: 0 }]
  let result: { first: { code: string; shift: boolean }; len: number; depth: number } | null = null
  let resultDepth = Infinity
  let iter = 0

  while (queue.length && iter++ < 8000) {
    const node = queue.shift()!
    if (node.depth >= resultDepth) continue
    for (const { code, shift, nb } of pressAll(layout, node.buffer)) {
      const first = node.first ?? { code, shift }
      // Never disturb the part of the text already typed correctly.
      if (nb.slice(0, startMatch) !== committed) continue

      if (target.startsWith(nb) && (nb.length > startMatch || nb === target)) {
        // Correct forward progress (or exact completion). The `nb === target`
        // case also covers Remington word-final half consonants: the buffer
        // briefly overshoots (e.g. "ईख्") and the inherent-vowel key trims the
        // trailing virama back to the exact target ("ईख") without adding length.
        // Preference order:
        //   1) shortest keystroke path,
        //   2) a next key that needs NO Shift (when two keys produce the same
        //      output, e.g. the ा-matra sits on both `k` and Shift+`a` — always
        //      suggest the simpler unshifted `k`),
        //   3) the press that advances the most (whole conjuncts beat singles).
        const depth = node.depth + 1
        const cand = { first, len: nb.length, depth }
        const better =
          !result ||
          cand.depth < result.depth ||
          (cand.depth === result.depth && !cand.first.shift && result.first.shift) ||
          (cand.depth === result.depth &&
            cand.first.shift === result.first.shift &&
            cand.len > result.len)
        if (better) {
          result = cand
          resultDepth = depth
        }
        continue
      }

      // In-progress combine excursion — keep it only if it can still get us there.
      if (seen.has(nb)) continue
      if (nb.length > target.length + 4) continue
      if (!tailLeadsTo(layout, nb.slice(startMatch), need)) continue
      seen.add(nb)
      queue.push({ buffer: nb, first, depth: node.depth + 1 })
    }
  }

  if (result) return result.first

  // Fallback: longest direct prefix match on the remaining text.
  return findKeyForNext(layout, need)
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
        // Longest match wins; on a tie prefer the key that needs NO Shift (e.g.
        // the ा-matra is on both `k` and Shift+`a` — suggest the unshifted `k`).
        if (
          !best ||
          out.length > best.len ||
          (out.length === best.len && best.shift && !shift)
        ) {
          best = { code, shift, len: out.length }
        }
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
