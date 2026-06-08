// KrutiDev / DevLys (legacy Remington ASCII) -> Unicode Devanagari converter.
//
// In the Hindi typing test the user presses the KrutiDev keyboard keys (which
// arrive as ASCII characters). This module converts that ASCII stream into
// proper Unicode Devanagari so the typed text appears in Hindi script and can
// be matched against Unicode passages.
//
// Ported from the widely-used open-source Kruti Dev <-> Unicode converter
// (TGNYC/Kriti-Dev-to-Unicode). Content/algorithm reused under its terms;
// reformatted for TypeScript. Content was rephrased for compliance.

const ARRAY_ONE: string[] = [
  'ñ', 'Q+Z', 'sas', 'aa', ')Z', 'ZZ', '‘', '’', '“', '”',
  'å', 'ƒ', '„', '…', '†', '‡', 'ˆ', '‰', 'Š', '‹',
  '¶+', 'd+', '[+k', '[+', 'x+', 'T+', 't+', 'M+', '<+', 'Q+', ';+', 'j+', 'u+',
  'Ùk', 'Ù', 'ä', '–', '—', 'é', '™', '=kk', 'f=k',
  'à', 'á', 'â', 'ã', 'ºz', 'º', 'í', '{k', '{', '=', '«',
  'Nî', 'Vî', 'Bî', 'Mî', '<î', '|', 'K', '}',
  'J', 'Vª', 'Mª', '<ªª', 'Nª', 'Ø', 'Ý', 'nzZ', 'æ', 'ç', 'Á', 'xz', '#', ':',
  'v‚', 'vks', 'vkS', 'vk', 'v', 'b±', 'Ã', 'bZ', 'b', 'm', 'Å', ',s', ',', '_',
  'ô', 'd', 'Dk', 'D', '[k', '[', 'x', 'Xk', 'X', 'Ä', '?k', '?', '³',
  'pkS', 'p', 'Pk', 'P', 'N', 't', 'Tk', 'T', '>', '÷', '¥',
  'ê', 'ë', 'V', 'B', 'ì', 'ï', 'M+', '<+', 'M', '<', '.k', '.',
  'r', 'Rk', 'R', 'Fk', 'F', ')', 'n', '/k', 'èk', '/', 'Ë', 'è', 'u', 'Uk', 'U',
  'i', 'Ik', 'I', 'Q', '¶', 'c', 'Ck', 'C', 'Hk', 'H', 'e', 'Ek', 'E',
  ';', '¸', 'j', 'y', 'Yk', 'Y', 'G', 'o', 'Ok', 'O',
  "'k", "'", '"k', '"', 'l', 'Lk', 'L', 'g',
  'È', 'z',
  'Ì', 'Í', 'Î', 'Ï', 'Ñ', 'Ò', 'Ó', 'Ô', 'Ö', 'Ø', 'Ù', 'Ük', 'Ü',
  '‚', 'ks', 'kS', 'k', 'h', 'q', 'w', '`', 's', 'S',
  'a', '¡', '%', 'W', '•', '·', '∙', '·', '~j', '~', '\\', '+', ' ः',
  '^', '*', 'Þ', 'ß', '(', '¼', '½', '¿', 'À', '¾', 'A', '-', '&', '&', 'Œ', ']', '~ ', '@',
]

const ARRAY_TWO: string[] = [
  '॰', 'QZ+', 'sa', 'a', 'र्द्ध', 'Z', '"', '"', "'", "'",
  '०', '१', '२', '३', '४', '५', '६', '७', '८', '९',
  'फ़्', 'क़', 'ख़', 'ख़्', 'ग़', 'ज़्', 'ज़', 'ड़', 'ढ़', 'फ़', 'य़', 'ऱ', 'ऩ',
  'त्त', 'त्त्', 'क्त', 'दृ', 'कृ', 'न्न', 'न्न्', '=k', 'f=',
  'ह्न', 'ह्य', 'हृ', 'ह्म', 'ह्र', 'ह्', 'द्द', 'क्ष', 'क्ष्', 'त्र', 'त्र्',
  'छ्य', 'ट्य', 'ठ्य', 'ड्य', 'ढ्य', 'द्य', 'ज्ञ', 'द्व',
  'श्र', 'ट्र', 'ड्र', 'ढ्र', 'छ्र', 'क्र', 'फ्र', 'र्द्र', 'द्र', 'प्र', 'प्र', 'ग्र', 'रु', 'रू',
  'ऑ', 'ओ', 'औ', 'आ', 'अ', 'ईं', 'ई', 'ई', 'इ', 'उ', 'ऊ', 'ऐ', 'ए', 'ऋ',
  'क्क', 'क', 'क', 'क्', 'ख', 'ख्', 'ग', 'ग', 'ग्', 'घ', 'घ', 'घ्', 'ङ',
  'चै', 'च', 'च', 'च्', 'छ', 'ज', 'ज', 'ज्', 'झ', 'झ्', 'ञ',
  'ट्ट', 'ट्ठ', 'ट', 'ठ', 'ड्ड', 'ड्ढ', 'ड़', 'ढ़', 'ड', 'ढ', 'ण', 'ण्',
  'त', 'त', 'त्', 'थ', 'थ्', 'द्ध', 'द', 'ध', 'ध', 'ध्', 'ध्', 'ध्', 'न', 'न', 'न्',
  'प', 'प', 'प्', 'फ', 'फ्', 'ब', 'ब', 'ब्', 'भ', 'भ्', 'म', 'म', 'म्',
  'य', 'य्', 'र', 'ल', 'ल', 'ल्', 'ळ', 'व', 'व', 'व्',
  'श', 'श्', 'ष', 'ष्', 'स', 'स', 'स्', 'ह',
  'ीं', '्र',
  'द्द', 'ट्ट', 'ट्ठ', 'ड्ड', 'कृ', 'भ', '्य', 'ड्ढ', 'झ्', 'क्र', 'त्त्', 'श', 'श्',
  'ॉ', 'ो', 'ौ', 'ा', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै',
  'ं', 'ँ', 'ः', 'ॅ', 'ऽ', 'ऽ', 'ऽ', 'ऽ', '्र', '्', '?', '़', ':',
  '‘', '’', '“', '”', ';', '(', ')', '{', '}', '=', '।', '.', '-', 'µ', '॰', ',', '् ', '/',
]

const MATRAS = 'ािीुूृेैोौं:ँॅ'

/** True if the text already contains Unicode Devanagari characters. */
export function isDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text)
}

/** Convert a KrutiDev/DevLys (legacy ASCII) string to Unicode Devanagari. */
export function krutiDevToUnicode(input: string): string {
  if (!input) return ''
  let s = input

  // Replace every legacy glyph sequence with its Unicode equivalent (in order;
  // longer multi-char sequences are listed before their shorter prefixes).
  const n = Math.min(ARRAY_ONE.length, ARRAY_TWO.length)
  for (let i = 0; i < n; i++) {
    if (ARRAY_ONE[i] === '') continue
    s = s.split(ARRAY_ONE[i]).join(ARRAY_TWO[i])
  }

  // Special composite glyphs.
  s = s.split('±').join('Zं')
  s = s.split('Æ').join('र्f')

  // Reorder the chhoti-i matra: legacy puts "f" before the consonant; Unicode
  // puts "ि" after it.
  s = reorderShortI(s, 'f', 'ि', 1)
  s = s.split('Ç').join('fa')
  s = s.split('É').join('र्fa')
  s = reorderShortI(s, 'fa', 'िं', 2)
  s = s.split('Ê').join('ीZ')

  // Remove an i-matra that wrongly landed on a half letter.
  {
    let pos = s.indexOf('ि्')
    while (pos !== -1) {
      const cons = s.charAt(pos + 2)
      s = s.replace('ि्' + cons, '्' + cons + 'ि')
      pos = s.indexOf('ि्', pos + 2)
    }
  }

  // Move the reph "Z" (र्) to the correct position before its cluster.
  s = placeReph(s)

  return s
}

/** Move a leading short-i style marker after its following consonant cluster. */
function reorderShortI(text: string, marker: string, matra: string, span: number): string {
  let s = text
  let pos = s.indexOf(marker)
  while (pos !== -1) {
    const nextCh = s.charAt(pos + span)
    s = s.replace(marker + nextCh, nextCh + matra)
    pos = s.indexOf(marker, pos + 1)
  }
  return s
}

/** Eliminate the reph code "Z" and place "र्" before the relevant cluster. */
function placeReph(text: string): string {
  let s = text
  let posR = s.indexOf('Z')
  let guard = 0
  while (posR > 0 && guard++ < 10000) {
    let p = posR - 1
    while (p >= 0 && MATRAS.indexOf(s.charAt(p)) !== -1) p--
    if (p < 0) p = 0
    const cluster = s.substr(p, posR - p)
    s = s.replace(cluster + 'Z', 'र्' + cluster)
    posR = s.indexOf('Z')
  }
  // Drop any stray reph markers we could not place.
  return s.split('Z').join('')
}
