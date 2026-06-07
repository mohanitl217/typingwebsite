export interface Lesson {
  id: string
  title: string
  /** keys introduced/highlighted in this lesson */
  keys: string[]
  instructions: string[]
  /** key drills (stage 2) */
  drills: string[]
  /** word practice (stage 3) */
  words: string[]
  /** paragraph practice (stage 4) */
  paragraphs: string[]
}

export const lessons: Lesson[] = [
  {
    id: 'home-row-1',
    title: 'Home Row: a s d f j k l ;',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
    instructions: [
      'Place your left fingers on A S D F and right fingers on J K L ;',
      'Your index fingers rest on F and J — feel for the small bumps.',
      'Keep your wrists relaxed and look at the screen, not the keyboard.',
      'Tap each key with the correct finger and return it to the home position.',
    ],
    drills: [
      'asdf jkl; asdf jkl; ffjj ddkk sslll aaa;;;',
      'ddkk dkdj jkdj ddkk kkdd dkdj jkdj ssss llll',
      ';;;; ssss llll dddd kkkk ffff jjjj aaaa ;;;;',
      'fj fj dk dk sl sl a; a; fj dk sl a; fjdk slap',
    ],
    words: [
      'add', 'ask', 'dad', 'fall', 'flask', 'glass', 'salad', 'lad',
      'half', 'jak', 'all', 'fad', 'flak', 'lass', 'safe', 'sad',
    ],
    paragraphs: [
      'a sad lad asks dad for a salad; dad adds a glass of milk and a flask.',
      'all flasks fall; a lass asks a lad; dad adds salad as all ask for jam.',
    ],
  },
  {
    id: 'home-row-2',
    title: 'Home Row + G and H',
    keys: ['g', 'h'],
    instructions: [
      'Reach your left index finger to G and bring it back to F.',
      'Reach your right index finger to H and bring it back to J.',
      'Keep the other fingers resting on their home keys.',
    ],
    drills: [
      'fg fg jh jh fg jh ghgh hghg fgh jhg fghj hjgf',
      'gh gh hg hg ghgh hghg gghh hhgg fgfg jhjh ghjk',
      'gas had hall gash dash flag glad shall hash gala',
    ],
    words: [
      'gas', 'had', 'hall', 'flag', 'glad', 'gash', 'shall', 'hash',
      'gala', 'half', 'high', 'sigh', 'gash', 'haka', 'lash', 'gaff',
    ],
    paragraphs: [
      'a glad lad had a flag; dad had gas; all shall dash as a gala falls.',
      'half a glass; a hall had a flag; ask dad as all lads gash a hash.',
    ],
  },
  {
    id: 'upper-row',
    title: 'Upper Row: q w e r t y u i o p',
    keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    instructions: [
      'Reach up from the home row to the letters above each finger.',
      'After each key, bring your finger back to its home key.',
      'Start slowly and focus on accuracy over speed.',
    ],
    drills: [
      'qw we er rt ty yu ui io op qwer tyui op qwerty uiop',
      'we are out top tip rope quit wire type pour quiet',
      'tree pour quit wire your tour type quote power riot',
    ],
    words: [
      'we', 'were', 'tree', 'quit', 'type', 'your', 'tour', 'power',
      'quote', 'water', 'paper', 'pretty', 'report', 'output', 'router', 'tooltip',
    ],
    paragraphs: [
      'we type a quote at the top; pour water to your pretty quiet tree.',
      'your report power is out; we quit at two; type the route to the tower.',
    ],
  },
  {
    id: 'lower-row',
    title: 'Lower Row: z x c v b n m',
    keys: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    instructions: [
      'Reach down from the home row to the bottom letters.',
      'Keep your eyes on the text and let your fingers find the keys.',
      'Return each finger to the home row after pressing.',
    ],
    drills: [
      'zx xc cv vb bn nm zxcv bnm zxcvbnm mnbvcxz zxcv bnm',
      'can van man box mix nab cab zinc vibe numb climb',
      'zebra mango cabin novel maze brave vivid bench climb',
    ],
    words: [
      'can', 'van', 'box', 'mix', 'cab', 'zinc', 'numb', 'climb',
      'zebra', 'mango', 'cabin', 'novel', 'brave', 'vivid', 'bench', 'maze',
    ],
    paragraphs: [
      'a brave man can climb; mix zinc in a box; move the van by the bench.',
      'seven zebras came by; nab the mango; a vivid novel can move my mind.',
    ],
  },
  {
    id: 'all-letters',
    title: 'All Letters Together',
    keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    instructions: [
      'Combine everything you have learned so far.',
      'Type full words and short sentences with correct finger placement.',
      'Aim for steady rhythm and fewer errors.',
    ],
    drills: [
      'the quick brown fox jumps over the lazy dog again',
      'pack my box with five dozen liquor jugs and move on',
      'how vexingly quick daft zebras jump over a fence',
    ],
    words: [
      'about', 'people', 'because', 'thought', 'through', 'between', 'another', 'example',
      'keyboard', 'practice', 'sentence', 'accuracy', 'language', 'computer', 'document', 'progress',
    ],
    paragraphs: [
      'The quick brown fox jumps over the lazy dog while five wizards box.',
      'Practice every day to build speed and accuracy on your keyboard, and your progress will show.',
    ],
  },
  {
    id: 'capitals-punctuation',
    title: 'Capitals & Punctuation',
    keys: ['ShiftLeft', 'ShiftRight', ',', '.', ';', "'"],
    instructions: [
      'Use the opposite hand Shift key while pressing a letter to make a capital.',
      'Press a comma and period with the right hand without leaving the home row.',
      'Add a space after punctuation, just like in real writing.',
    ],
    drills: [
      'The Sun Rises. The Moon Sets. We Read, Write, and Type.',
      'Hello, World! It is a Good Day. Keep Calm, and Type On.',
      'Anna, Ben, and Carl Went Home. They Were Happy, Indeed.',
    ],
    words: [
      'India,', 'Hello,', 'World.', 'Today,', 'Mr.', 'Dr.', "don't", "it's",
      'Monday,', 'Friday.', 'Yes,', 'No.', 'Maybe,', 'Okay.', 'Sir,', 'Thanks.',
    ],
    paragraphs: [
      'Hello, friend! Today is Monday, and we will practice typing with care.',
      'Mr. Rao said, "Practice daily, and you will improve." It is good advice, indeed.',
    ],
  },
]

export function getLesson(id: string) {
  return lessons.find((l) => l.id === id)
}
