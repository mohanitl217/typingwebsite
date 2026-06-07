import type { Lesson } from './lessons'

/**
 * KrutiDev / DevLys are legacy "glyph" fonts: each Latin character maps to a
 * Devanagari glyph. The learner presses the SAME physical QWERTY keys as the
 * English course, so finger guidance and key highlighting are identical — only
 * the rendered glyphs (via the KrutiDev/DevLys font) are Hindi.
 *
 * Drills below are stored as the raw ASCII the user types; when shown in the
 * KrutiDev font they appear as Devanagari (e.g. "d" renders as क).
 */
export const hindiLessons: Lesson[] = [
  {
    id: 'kd-home-1',
    title: 'Home Row Keys (a s d f j k l ;)',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
    instructions: [
      'Place your left fingers on A S D F and right fingers on J K L ; — the home row.',
      'In KrutiDev/DevLys each key prints a Devanagari glyph. Press the key shown on the keyboard.',
      'Keep your eyes on the screen and let your fingers learn the positions.',
      'Return each finger to its home key after every stroke.',
    ],
    drills: [
      'dd kk dd kk ddkk kkdd dkdk kdkd dd kk ll ;;',
      'ff jj ff jj ffjj jjff fjfj jfjf aa ;; ss ll',
      'dk dk fj fj sl sl a; a; dkfj sla; dkdk fjfj',
      ';l ;l kj kj df df sa sa ;lkj dfsa ;l kj df sa',
    ],
    words: [
      'dd', 'kk', 'dk', 'kd', 'dkd', 'kdk', 'dkk', 'kdd',
      'fj', 'jf', 'sl', 'ls', 'a;', ';a', 'fjf', 'sls',
    ],
    paragraphs: [
      'dkd dkk kdd dk kd ll ;; ss aa dkdk kkdd dkdj jkdj',
      'fj sl a; df kj ;l fjsl a;df kj;l fjfj slsl a;a; dfdf',
    ],
  },
  {
    id: 'kd-home-2',
    title: 'Home Row + g and h',
    keys: ['g', 'h'],
    instructions: [
      'Reach the left index finger to G and the right index finger to H.',
      'Bring each finger back to F and J after pressing.',
      'Mix the new keys with the home row you already know.',
    ],
    drills: [
      'fg fg jh jh fg jh gh hg fghj jhgf gh hg fg jh',
      'gh gh hg hg ghgh hghg gghh hhgg fgfg jhjh ghjk',
      'dg dg hk hk gd dg kh hk dghk dg hk gd kh dghk',
    ],
    words: [
      'gh', 'hg', 'dg', 'gd', 'hk', 'kh', 'gha', 'hga',
      'fgh', 'jhg', 'ghk', 'hkd', 'dgh', 'hgd', 'ghj', 'hjg',
    ],
    paragraphs: [
      'gh hg dg gd hk kh ghgh hghg dghk fghj jhgf ghjk hkdg',
      'fg jh gh hg dghk ghjk dgdg hkhk ghgh hghg fghj jhgf',
    ],
  },
  {
    id: 'kd-upper',
    title: 'Upper Row (q w e r t y u i o p)',
    keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    instructions: [
      'Reach up from the home row to the top letters and back.',
      'Each of these keys prints a Devanagari glyph in the KrutiDev/DevLys font.',
      'Start slowly; accuracy first, speed later.',
    ],
    drills: [
      'qw we er rt ty yu ui io op qwer tyui op qwerty uiop',
      'qa qa wp wp eo eo ri ri qawp eori qawp eori qawp',
      'we er rt ty we er rt ty wert tywe wert tywe wert',
    ],
    words: [
      'we', 'er', 'rt', 'ty', 'yu', 'ui', 'io', 'op',
      'wer', 'rty', 'tyu', 'uio', 'iop', 'qwe', 'ert', 'rty',
    ],
    paragraphs: [
      'qw we er rt ty yu ui io op qwer tyui qwerty uiop qwert',
      'we er rt ty wert tyui qawp eori qwerty uiop wert tyui qw',
    ],
  },
  {
    id: 'kd-lower',
    title: 'Lower Row (z x c v b n m)',
    keys: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    instructions: [
      'Reach down from the home row to the bottom letters and back.',
      'Keep the home-row fingers anchored as much as possible.',
      'These keys add more Devanagari consonants and signs.',
    ],
    drills: [
      'zx xc cv vb bn nm zxcv bnm zxcvbnm mnbvcxz zxcv bnm',
      'zn zn xm xm cb cb vv vv znxm cbvv znxm cbvv znxm',
      'cv cv bn bn mm mm cvbn mmbn cvbn mmbn cvbn mmbn cv',
    ],
    words: [
      'cv', 'bn', 'nm', 'zx', 'xc', 'vb', 'cvb', 'bnm',
      'zxc', 'xcv', 'vbn', 'nmz', 'mnb', 'bvc', 'cxz', 'znm',
    ],
    paragraphs: [
      'zx xc cv vb bn nm zxcv bnm zxcvbnm cvbn bnm zxc xcv vbn',
      'cv bn nm zxcv bnm cvbn mmbn znxm cbvv zxcvbnm mnbvcxz cv',
    ],
  },
  {
    id: 'kd-all',
    title: 'All Keys Together',
    keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    instructions: [
      'Combine the home, upper and lower rows you have practised.',
      'Type steadily with a smooth rhythm and minimal errors.',
      'Watch the highlighted next key on the keyboard if you get stuck.',
    ],
    drills: [
      'asdf ghjkl qwert yuiop zxcvb nm asdf ghjkl qwert',
      'dkd ghk wert cvbn asdf jkl; qwer tyui zxcv bnm op',
      'the home row then top row then bottom row asdf jkl;',
    ],
    words: [
      'asdf', 'ghjk', 'qwer', 'tyui', 'zxcv', 'bnml', 'dkfj', 'slgh',
      'wert', 'cvbn', 'opiu', 'mnbv', 'lkjh', 'gfds', 'poiu', 'trew',
    ],
    paragraphs: [
      'asdf ghjkl qwert yuiop zxcvb nm asdf ghjkl qwert yuiop zxcv',
      'dkd ghk wert cvbn asdf jkl; qwer tyui zxcv bnm op dkfj slgh',
    ],
  },
  {
    id: 'kd-matra-shift',
    title: 'Matras & Shift Keys',
    keys: ['ShiftLeft', 'ShiftRight', 'f', 'd', 'k', 'a'],
    instructions: [
      'Hold Shift with the opposite hand to type the upper glyph on a key.',
      'KrutiDev places matras (vowel signs) and half-letters on the shifted keys.',
      'Combine letters with matras to build full Hindi syllables.',
    ],
    drills: [
      'Df Df Kf Kf Df Kf DfKf KfDf Df Kf Df Kf DfKf KfDf',
      'Aa Ss Dd Ff Aa Ss Dd Ff AaSs DdFf AaSs DdFf AaSs',
      'Jk Jk Lk Lk Jk Lk JkLk LkJk Jk Lk Jk Lk JkLk LkJk',
    ],
    words: [
      'Df', 'Kf', 'Aa', 'Ss', 'Dd', 'Ff', 'Jk', 'Lk',
      'DfK', 'KfD', 'AaS', 'SsD', 'DdF', 'FfA', 'JkL', 'LkJ',
    ],
    paragraphs: [
      'Df Kf Aa Ss Dd Ff Jk Lk DfKf AaSs DdFf JkLk DfKf AaSs DdFf',
      'Aa Ss Dd Ff DfKf JkLk AaSs DdFf practice the shifted glyphs slowly',
    ],
  },
]

export function getHindiLesson(id: string) {
  return hindiLessons.find((l) => l.id === id)
}
