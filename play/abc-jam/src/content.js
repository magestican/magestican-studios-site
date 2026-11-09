









export const LETTERS = Object.freeze([
  { ch: 'A', word: 'apple', pic: '🍎', say: 'ay' },
  { ch: 'B', word: 'bear', pic: '🐻', say: 'bee' },
  { ch: 'C', word: 'cat', pic: '🐱', say: 'see' },
  { ch: 'D', word: 'dog', pic: '🐶', say: 'dee' },
  { ch: 'E', word: 'egg', pic: '🥚', say: 'ee' },
  { ch: 'F', word: 'fish', pic: '🐟', say: 'eff' },
  { ch: 'G', word: 'grapes', pic: '🍇', say: 'jee' },
  { ch: 'H', word: 'hat', pic: '🎩', say: 'aitch' },
  { ch: 'I', word: 'ice cream', pic: '🍦', say: 'eye' },
  { ch: 'J', word: 'juice', pic: '🧃', say: 'jay' },
  { ch: 'K', word: 'key', pic: '🔑', say: 'kay' },
  { ch: 'L', word: 'lion', pic: '🦁', say: 'ell' },
  { ch: 'M', word: 'moon', pic: '🌙', say: 'em' },
  { ch: 'N', word: 'nose', pic: '👃', say: 'en' },
  { ch: 'O', word: 'octopus', pic: '🐙', say: 'oh' },
  { ch: 'P', word: 'pig', pic: '🐷', say: 'pee' },
  { ch: 'Q', word: 'queen', pic: '👸', say: 'cue' },
  { ch: 'R', word: 'rainbow', pic: '🌈', say: 'ar' },
  { ch: 'S', word: 'sun', pic: '🌞', say: 'ess' },
  { ch: 'T', word: 'tiger', pic: '🐯', say: 'tee' },
  { ch: 'U', word: 'umbrella', pic: '☂️', say: 'you' },
  { ch: 'V', word: 'violin', pic: '🎻', say: 'vee' },
  { ch: 'W', word: 'whale', pic: '🐳', say: 'double you' },
  
  { ch: 'X', word: 'fox', pic: '🦊', say: 'ex', ends: true },
  { ch: 'Y', word: 'yarn', pic: '🧶', say: 'why' },
  { ch: 'Z', word: 'zebra', pic: '🦓', say: 'zee' },
]);

export const LETTER = Object.freeze(Object.fromEntries(LETTERS.map((l) => [l.ch, l])));


export function letterPhrase(ch) {
  const l = LETTER[String(ch).toUpperCase()];
  if (!l) return '';
  return l.ends ? `${l.say} is at the end of ${l.word}` : `${l.say} is for ${l.word}`;
}



export const WORD_STEPS = Object.freeze([
  {
    id: 'three', size: 3, words: Object.freeze([
      ['cat', '🐱'], ['dog', '🐶'], ['sun', '🌞'], ['bus', '🚌'], ['pig', '🐷'], ['hat', '🎩'],
      ['cup', '☕'], ['bee', '🐝'], ['cow', '🐮'], ['egg', '🥚'], ['owl', '🦉'], ['car', '🚗'],
      ['bed', '🛏️'], ['fox', '🦊'], ['ant', '🐜'], ['map', '🗺️'],
    ]),
  },
  {
    id: 'four', size: 4, words: Object.freeze([
      ['fish', '🐟'], ['frog', '🐸'], ['star', '⭐'], ['cake', '🎂'], ['duck', '🦆'], ['moon', '🌙'],
      ['ball', '⚽'], ['bear', '🐻'], ['boat', '⛵'], ['tree', '🌳'], ['lion', '🦁'], ['milk', '🥛'],
      ['kite', '🪁'], ['shoe', '👟'], ['corn', '🌽'], ['bird', '🐦'],
    ]),
  },
  {
    id: 'five', size: 5, words: Object.freeze([
      ['apple', '🍎'], ['horse', '🐴'], ['tiger', '🐯'], ['zebra', '🦓'], ['train', '🚂'], ['house', '🏠'],
      ['pizza', '🍕'], ['panda', '🐼'], ['robot', '🤖'], ['snake', '🐍'], ['whale', '🐳'], ['sheep', '🐑'],
      ['piano', '🎹'], ['clock', '⏰'], ['heart', '❤️'], ['mouse', '🐭'],
    ]),
  },
]);


export const COLOURS = Object.freeze([
  '#ff4f6d', '#ff8c1a', '#f5b700', '#38b000', '#00a6ed', '#7b5cff', '#e040fb', '#ff5e8a', '#00b894',
  '#2e86de', '#fd7e14', '#9b59b6', '#e84393',
]);

export const colourFor = (ch) => {
  const i = String(ch).toUpperCase().charCodeAt(0) - 65;
  return COLOURS[((i % COLOURS.length) + COLOURS.length) % COLOURS.length];
};
