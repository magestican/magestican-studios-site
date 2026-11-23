








export const T = Object.freeze({
  title: 'ABC Jam',
  bookLetters: 'Letters',
  bookWords: 'Words',
  bookPrizes: 'Prizes',
  bookDinos: 'Dinosaurs',
  bookPuzzles: 'Puzzles',

  play: 'Play',
  home: 'Home',
  sayAgain: 'Say it again',
  kbToAbc: 'ABC',
  kbToKeys: 'Keyboard',
  resetAsk: 'Start again',
  resetSure: 'Clear all stickers',
  towerAgain: 'Build again',
  
  
  voiceTeacher: 'Teacher',
  voiceWizard: 'Wizard',
  voiceLabel: 'Voice',

  freeJam: 'Free Jam',
  wordBuilder: 'Word Builder',
  letterRain: 'Letter Rain',
  stickerBook: 'Sticker Book',
  dinoEggs: 'Dino Eggs',
  dinoMatch: 'Dino Match',
  blockTower: 'Block Tower',
  abcPuzzles: 'ABC Puzzles',

  kbToAbcSpoken: 'Keys in ABC order',
  kbToKeysSpoken: 'Keys like a keyboard',
  stepWords: '{n} letter words',
  balloon: 'Balloon {letter}',
  letterNotYet: '{letter}, not yet',
  wordNotYet: 'Not yet',
  progressOf: '{n} of {total}',
  prizeAlphabet: 'The whole alphabet',
  prizeBalloons: '{n} balloons',
  prizeBook: 'The full sticker book',
  prizeDinos: 'Every dinosaur egg',
  prizeFound: '{n} dinosaurs found',
  towerLevel: 'Level {n}',
  towerPoints: '{n} points',
  towerBest: 'Best {n}',
  towerBomb: 'Bomb',
  prizePuzzles: 'Every puzzle',
  puzzlePiece: 'Piece {letter}',
  
  puzzleNames: Object.freeze({ unicorn: 'Unicorn', dino: 'Dinosaur', princess: 'Princess', dino_family: 'Dinosaur family', party: 'Birthday picnic' }),
  
  puzzleMade: Object.freeze({
    unicorn: 'You made the unicorn!', dino: 'You made the dinosaur!', princess: 'You made the princess!',
    dino_family: 'You made the dinosaur family!', party: 'You made the birthday picnic!',
  }),

  find: 'Find the letter {letter}!',
  jamStart: 'Press any letter!',
  pickWords: 'Pick your words!',
  spell: "Let's spell {word}!",
  rainTap: 'Pop the balloons! Tap them!',
  rainKeys: 'Pop the balloons! Press their letters!',
  bookEmpty: 'Play to fill your sticker book!',

  letterEnds: '{letter} is at the end of {word}',
  letterFor: '{letter} is for {word}',
  hooray: 'Hooray!',
  letterParty: 'Well done! You found {letter}!',
  alphabetDone: 'Hooray! You sang the whole alphabet!',
  jamParty: 'Wow! What a song!',
  wordsDone: 'Hooray! You built all the words!',
  prizeWon: 'Hooray! A new prize!',
  bookCount: Object.freeze({ one: 'You have 1 sticker!', other: 'You have {n} stickers!' }),
  dinoHello: 'Hello, {dino}!',
  dinoWhere: 'Where is {dino}?',
  dinoYes: 'Yes! That is {dino}!',
  eggsDone: 'Hooray! You hatched every dinosaur!',
  matchDone: 'Hooray! You found all the dinosaurs!',
  towerOops: 'Oh! Try again!',
  towerDone: 'Hooray! Up we go!',

  noScript: 'Turn on JavaScript to play ABC Jam.',
});


export function fill(text, vals = {}) {
  return String(text).replace(/\{(\w+)\}/g, (m, k) => (k in vals ? String(vals[k]) : m));
}


export const count = (table, n) => fill(n === 1 ? table.one : table.other, { n });
