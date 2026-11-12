











import { T, fill } from './strings.js';

export const LETTERS = Object.freeze([
  { ch: 'A', word: 'apple', pic: 'apple', say: 'ay' },
  { ch: 'B', word: 'bear', pic: 'bear', say: 'bee' },
  { ch: 'C', word: 'cat', pic: 'cat', say: 'see' },
  { ch: 'D', word: 'dog', pic: 'dog', say: 'dee' },
  { ch: 'E', word: 'egg', pic: 'egg', say: 'ee' },
  { ch: 'F', word: 'fish', pic: 'fish', say: 'eff' },
  { ch: 'G', word: 'grapes', pic: 'grapes', say: 'jee' },
  { ch: 'H', word: 'hat', pic: 'hat', say: 'aitch' },
  { ch: 'I', word: 'ice cream', pic: 'ice_cream', say: 'eye' },
  { ch: 'J', word: 'juice', pic: 'juice', say: 'jay' },
  { ch: 'K', word: 'key', pic: 'key', say: 'kay' },
  { ch: 'L', word: 'lion', pic: 'lion', say: 'ell' },
  { ch: 'M', word: 'moon', pic: 'moon', say: 'em' },
  { ch: 'N', word: 'nose', pic: 'nose', say: 'en' },
  { ch: 'O', word: 'octopus', pic: 'octopus', say: 'oh' },
  { ch: 'P', word: 'pig', pic: 'pig', say: 'pee' },
  { ch: 'Q', word: 'queen', pic: 'queen', say: 'cue' },
  { ch: 'R', word: 'rainbow', pic: 'rainbow', say: 'ar' },
  { ch: 'S', word: 'sun', pic: 'sun', say: 'ess' },
  { ch: 'T', word: 'tiger', pic: 'tiger', say: 'tee' },
  { ch: 'U', word: 'umbrella', pic: 'umbrella', say: 'you' },
  { ch: 'V', word: 'violin', pic: 'violin', say: 'vee' },
  { ch: 'W', word: 'whale', pic: 'whale', say: 'double you' },
  
  { ch: 'X', word: 'fox', pic: 'fox', say: 'ex', ends: true },
  { ch: 'Y', word: 'yarn', pic: 'yarn', say: 'why' },
  { ch: 'Z', word: 'zebra', pic: 'zebra', say: 'zee' },
]);

export const LETTER = Object.freeze(Object.fromEntries(LETTERS.map((l) => [l.ch, l])));


export function letterPhrase(ch) {
  const l = LETTER[String(ch).toUpperCase()];
  if (!l) return '';
  return fill(l.ends ? T.letterEnds : T.letterFor, { letter: l.say, word: l.word });
}



export const WORD_STEPS = Object.freeze([
  {
    id: 'three', size: 3, words: Object.freeze([
      ['cat', 'cat'], ['dog', 'dog'], ['sun', 'sun'], ['bus', 'bus'], ['pig', 'pig'], ['hat', 'hat'],
      ['cup', 'cup'], ['bee', 'bee'], ['cow', 'cow'], ['egg', 'egg'], ['owl', 'owl'], ['car', 'car'],
      ['bed', 'bed'], ['fox', 'fox'], ['ant', 'ant'], ['map', 'map'],
    ]),
  },
  {
    id: 'four', size: 4, words: Object.freeze([
      ['fish', 'fish'], ['frog', 'frog'], ['star', 'star'], ['cake', 'cake'], ['duck', 'duck'], ['moon', 'moon'],
      ['ball', 'ball'], ['bear', 'bear'], ['boat', 'boat'], ['tree', 'tree'], ['lion', 'lion'], ['milk', 'milk'],
      ['kite', 'kite'], ['shoe', 'shoe'], ['corn', 'corn'], ['bird', 'bird'],
    ]),
  },
  {
    id: 'five', size: 5, words: Object.freeze([
      ['apple', 'apple'], ['horse', 'horse'], ['tiger', 'tiger'], ['zebra', 'zebra'], ['train', 'train'], ['house', 'house'],
      ['pizza', 'pizza'], ['panda', 'panda'], ['robot', 'robot'], ['snake', 'snake'], ['whale', 'whale'], ['sheep', 'sheep'],
      ['piano', 'piano'], ['clock', 'clock'], ['heart', 'heart'], ['mouse', 'mouse'],
    ]),
  },
]);






export const DINOS = Object.freeze([
  { id: 't_rex', name: 'T-Rex', ch: 'T', pic: 't_rex', spoken: 'Tee rex' },
  { id: 'triceratops', name: 'Triceratops', ch: 'T', pic: 'triceratops' },
  { id: 'stegosaurus', name: 'Stegosaurus', ch: 'S', pic: 'stegosaurus' },
  { id: 'brachiosaurus', name: 'Brachiosaurus', ch: 'B', pic: 'brachiosaurus' },
  { id: 'ankylosaurus', name: 'Ankylosaurus', ch: 'A', pic: 'ankylosaurus' },
  { id: 'velociraptor', name: 'Velociraptor', ch: 'V', pic: 'velociraptor' },
  { id: 'spinosaurus', name: 'Spinosaurus', ch: 'S', pic: 'spinosaurus' },
  { id: 'parasaurolophus', name: 'Parasaurolophus', ch: 'P', pic: 'parasaurolophus' },
].map(Object.freeze));

export const DINO = Object.freeze(Object.fromEntries(DINOS.map((d) => [d.id, d])));


export const COLOURS = Object.freeze([
  '#ff4f6d', '#ff8c1a', '#f5b700', '#38b000', '#00a6ed', '#7b5cff', '#e040fb', '#ff5e8a', '#00b894',
  '#2e86de', '#fd7e14', '#9b59b6', '#e84393',
]);

export const colourFor = (ch) => {
  const i = String(ch).toUpperCase().charCodeAt(0) - 65;
  return COLOURS[((i % COLOURS.length) + COLOURS.length) % COLOURS.length];
};
