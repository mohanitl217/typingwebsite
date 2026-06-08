/**
 * Unicode (Mangal / Devanagari) → KrutiDev legacy-glyph encoder.
 *
 * KrutiDev / DevLys are legacy "glyph" fonts: each Latin/ASCII slot is replaced
 * by a Devanagari glyph (e.g. "d" → "क"). To make a piece of real Unicode Hindi
 * typeable/renderable through such a font we must re-encode it into the ASCII
 * sequence whose glyphs visually reproduce the same Devanagari. This lets the
 * KrutiDev typing test show readable Hindi in the exercise AND accept the same
 * QWERTY keystrokes the user presses (which render as Hindi via the font).
 *
 * Mapping table + algorithm ported to TypeScript from the well-known KrutiDev
 * encoding used by the open-source converter:
 *   https://github.com/JujuAdams/KrutidevDevanagari
 * The mapping is a font-encoding table (the de-facto KrutiDev 010 layout).
 * Content was rephrased/re-implemented for compliance with licensing
 * restrictions; only the factual code-point mapping is preserved.
 */

const VIRAMA = 0x094d // ् (halant)
const NUKTA = 0x093c // ़
const VOWEL_SIGN_I = 0x093f // ि (short-i matra, visually precedes its consonant)
const RA = 0x0930 // र

// Unicode sequences to find (longest matches are tried first).
const UNICODE_SOURCE: string[] = [
  '‘', '’', '“', '”', '(', ')', '{', '}', '=', '।', '?', '-', 'µ', '॰', ',', '.',
  '०', '१', '२', '३', '४', '५', '६', '७', '८', '९', 'x',

  'फ़्', 'क़', 'ख़', 'ग़', 'ज़्', 'ज़', 'ड़', 'ढ़', 'फ़', 'य़', 'ऱ', 'ऩ',
  'त्त्', 'त्त', 'क्त', 'दृ', 'कृ',

  'ह्न', 'ह्य', 'हृ', 'ह्म', 'ह्र', 'ह्', 'द्द', 'क्ष्', 'क्ष', 'त्र्', 'त्र', 'ज्ञ',
  'छ्य', 'ट्य', 'ठ्य', 'ड्य', 'ढ्य', 'द्य', 'द्व',
  'श्र', 'ट्र', 'ड्र', 'ढ्र', 'छ्र', 'क्र', 'फ्र', 'द्र', 'प्र', 'ग्र', 'रु', 'रू',
  '्र',

  'ओ', 'औ', 'आ', 'अ', 'ई', 'इ', 'उ', 'ऊ', 'ऐ', 'ए', 'ऋ',

  'क्', 'क', 'क्क', 'ख्', 'ख', 'ग्', 'ग', 'घ्', 'घ', 'ङ',
  'चै', 'च्', 'च', 'छ', 'ज्', 'ज', 'झ्', 'झ', 'ञ',

  'ट्ट', 'ट्ठ', 'ट', 'ठ', 'ड्ड', 'ड्ढ', 'ड', 'ढ', 'ण्', 'ण',
  'त्', 'त', 'थ्', 'थ', 'द्ध', 'द', 'ध्', 'ध', 'न्', 'न',

  'प्', 'प', 'फ्', 'फ', 'ब्', 'ब', 'भ्', 'भ', 'म्', 'म',
  'य्', 'य', 'र', 'ल्', 'ल', 'ळ', 'व्', 'व',
  'श्', 'श', 'ष्', 'ष', 'स्', 'स', 'ह',

  'ऑ', 'ॉ', 'ो', 'ौ', 'ा', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै',
  'ं', 'ँ', 'ः', 'ॅ', 'ऽ', '\u094d',
]

// Matching KrutiDev ASCII replacements (parallel to UNICODE_SOURCE).
const KRUTIDEV_SOURCE: string[] = [
  '^', '*', 'Þ', 'ß', '¼', '½', '¿', 'À', '¾', 'A', '\\', '&', '&', 'Œ', ']', '-',
  'å', 'ƒ', '„', '…', '†', '‡', 'ˆ', '‰', 'Š', '‹', 'Û',

  '¶', 'd', '[k', 'x', 'T', 't', 'M+', '<+', 'Q', ';', 'j', 'u',
  'Ù', 'Ùk', 'Dr', '–', '—',

  'à', 'á', 'â', 'ã', 'ºz', 'º', 'í', '{', '{k', '«', '=', 'K',
  'Nî', 'Vî', 'Bî', 'Mî', '<î', '|', '}',
  'J', 'Vª', 'Mª', '<ªª', 'Nª', 'Ø', 'Ý', 'æ', 'ç', 'xz', '#', ':',
  'z',

  'vks', 'vkS', 'vk', 'v', 'bZ', 'b', 'm', 'Å', ',s', ',', '_',

  'D', 'd', 'ô', '[', '[k', 'X', 'x', '?', '?k', '³',
  'pkS', 'P', 'p', 'N', 'T', 't', '÷', '>', '¥',

  'ê', 'ë', 'V', 'B', 'ì', 'ï', 'M', '<', '.', '.k',
  'R', 'r', 'F', 'Fk', ')', 'n', '/', '/k', 'U', 'u',

  'I', 'i', '¶', 'Q', 'C', 'c', 'H', 'Hk', 'E', 'e',
  '¸', ';', 'j', 'Y', 'y', 'G', 'O', 'o',
  "'", "'k", '"', '"k', 'L', 'l', 'g',

  'v‚', '‚', 'ks', 'kS', 'k', 'h', 'q', 'w', '`', 's', 'S',
  'a', '¡', '%', 'W', '·', '~',
]

// Devanagari matras whose presence we skip past when relocating a reph (र्).
const MATRA_SET = new Set<number>([
  58, // legacy guard
  0x0901, 0x0902, 0x093e, 0x093f, 0x0940, 0x0941, 0x0942, 0x0943,
  0x0945, 0x0947, 0x0948, 0x094b, 0x094c,
])

// Precomposed nukta letters that must be decomposed into base + U+093C.
const NUKTA_DECOMPOSE: Record<number, number> = {
  0x0929: 0x0928, // ऩ → न
  0x0931: 0x0930, // ऱ → र
  0x0958: 0x0915, // क़ → क
  0x0959: 0x0916, // ख़ → ख
  0x095a: 0x0917, // ग़ → ग
  0x095b: 0x091c, // ज़ → ज
  0x095c: 0x0921, // ड़ → ड
  0x095d: 0x0922, // ढ़ → ढ
  0x095e: 0x092b, // फ़ → फ
  0x095f: 0x092f, // य़ → य
}

let lookup: Map<string, number[]> | null = null
let maxKeyLen = 1

function buildLookup(): Map<string, number[]> {
  if (lookup) return lookup
  const map = new Map<string, number[]>()
  for (let i = 0; i < UNICODE_SOURCE.length; i++) {
    const key = UNICODE_SOURCE[i]
    const value = KRUTIDEV_SOURCE[i]
    map.set(key, Array.from(value, (c) => c.charCodeAt(0)))
    if (key.length > maxKeyLen) maxKeyLen = key.length
  }
  lookup = map
  return map
}

/** True if the string contains any Devanagari (Unicode Hindi) code point. */
export function hasDevanagari(text: string): boolean {
  return /[\u0900-\u097f]/.test(text)
}

/**
 * Convert a Unicode Devanagari string into the KrutiDev ASCII encoding. Any
 * non-Devanagari characters (spaces, Latin, punctuation already in ASCII) pass
 * through unchanged.
 */
export function unicodeToKrutidev(input: string): string {
  if (!input) return input
  const map = buildLookup()

  // Char-code working buffer.
  const arr: number[] = Array.from(input, (c) => c.charCodeAt(0))

  // 1) Alternating quote marks + decompose precomposed nukta letters.
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < arr.length; i++) {
    const c = arr[i]
    if (c === 0x27 /* ' */) {
      inSingle = !inSingle
      arr[i] = (inSingle ? '^' : '*').charCodeAt(0)
    } else if (c === 0x22 /* " */) {
      inDouble = !inDouble
      arr[i] = (inDouble ? 'ß' : 'Þ').charCodeAt(0)
    } else if (NUKTA_DECOMPOSE[c] !== undefined) {
      arr[i] = NUKTA_DECOMPOSE[c]
      arr.splice(i + 1, 0, NUKTA)
      i++
    }
  }

  // 2) Move the short-i matra (ि) to the front of its consonant cluster as "f".
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === VOWEL_SIGN_I) {
      let j = i - 1
      // Walk back over conjuncts joined by virama.
      while (j >= 1 && arr[j - 1] === VIRAMA) j -= 2
      arr.splice(i, 1) // remove ि
      arr.splice(j, 0, 'f'.charCodeAt(0)) // insert f before the cluster
    }
  }

  // 3) Relocate reph: र् (ra + virama) renders as a mark after the cluster + matras.
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === RA && arr[i + 1] === VIRAMA) {
      let pos = i + 3 // skip the consonant the reph rides on
      while (pos < arr.length && MATRA_SET.has(arr[pos])) pos++
      arr.splice(pos, 0, 'Z'.charCodeAt(0))
      arr.splice(i, 2) // remove र and virama
      i-- // re-check current index after the shift
    }
  }

  // 4) Greedy longest-match find/replace against the encoding table.
  let i = 0
  while (i < arr.length) {
    let replaced = false
    const limit = Math.min(maxKeyLen, arr.length - i)
    for (let len = limit; len >= 1; len--) {
      const key = String.fromCharCode(...arr.slice(i, i + len))
      const rep = map.get(key)
      if (rep) {
        arr.splice(i, len, ...rep)
        i += rep.length
        replaced = true
        break
      }
    }
    if (!replaced) i++
  }

  return String.fromCharCode(...arr)
}

/**
 * Convenience: convert only if the text actually contains Devanagari, otherwise
 * return it untouched (so text already authored as KrutiDev ASCII is preserved).
 */
export function toKrutidevIfNeeded(text: string): string {
  return hasDevanagari(text) ? unicodeToKrutidev(text) : text
}
