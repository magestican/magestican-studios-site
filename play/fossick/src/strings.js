


import { TRANSLATIONS } from './translations.js';

export const T = Object.freeze({
  title: 'Fossick',
  titleSub: 'or, the careful hand',
  cabinet: 'The dig',
  labelWon: '{name}, freed by your own hand',
  labelCollapse: 'The block gave way and took the treasure',
  labelBroken: 'Three cracks, and the treasure came apart',
  complete: 'Every treasure is free',

  titleBlurb: 'A little treasure waits in every block of rock. Tap it free a cube at a time, and turn the block gently, because its weight shifts as you dig.',
  imprint: 'Made for careful hands.',
  drawerNotes: {
    chalk: 'Soft rock. Tap, turn and mind the weight.',
    limestone: 'Harder beds, and a mallet for those in a hurry.',
    slate: 'Brittle seams and long overhangs.',
    survey: 'No colour to guide you. Each face counts what lies behind it.',
  },

  open: 'Start digging',
  back: 'Back',
  soundOn: 'Sound on',
  soundOff: 'Sound off',
  again: 'Try it again',
  next: 'Dig the next block',
  toCabinet: 'Back to the dig',

  cabinetSub: 'Choose a layer. Free a treasure to open the next.',
  hintStart: 'Drag to turn the block. Tap a cube to strike it.',
  hintKeys: 'Turn with the arrows or WASD, and roll with Q and E. Shift steadies, Space strikes and R levels out.',
  hintStrain: 'Turn slowly or dig elsewhere first, because red hatching means that rock is tiring.',

  hintTreasure: 'That is the treasure. Three cracks break it.',
  hintCreak: 'That creak is a warning. Stop and look.',

  home: 'Magestican Studios',
  locked: 'Not yet',
  unsolved: 'Not freed',
  plate: 'Block {n}',
  rockLeft: ['{n} rock cube left', '{n} rock cubes left'],
  toolPick: 'Pick',
  toolMallet: 'Mallet',
  toolPickNote: 'One cube at a time',
  toolMalletNote: 'Takes neighbours and jars the block',
  steady: 'Steady',
  steadyNote: 'Quarter speed',
  seismoNote: 'Strain',
  sealsLabel: '{n} of 3 cracks',
  grades: { mint: 'Mint', fine: 'Fine', worn: 'Worn' },
  fallen: 'Fallen',
  broken: 'Broken',
  statBlows: ['{n} blow', '{n} blows'],
  statCracks: ['{n} crack', '{n} cracks'],
  statFell: ['Largest fall {n} cube', 'Largest fall {n} cubes'],

  collections: { favourites: 'Favourites', fossils: 'Fossils' },
  drawers: { chalk: 'Soft rock', limestone: 'Hard rock', slate: 'Brittle rock', survey: 'Hidden treasure' },
  names: {
    heart: 'Heart', duck: 'Rubber duck', icecream: 'Ice cream',
    cat: 'Cat', cupcake: 'Cupcake', teddy: 'Teddy bear',
    butterfly: 'Butterfly', flower: 'Flower', bunny: 'Bunny',
    star: 'Star', puppy: 'Puppy', panda: 'Panda',
    cockle: 'Cockle', ammonite: 'Ammonite', tooth: "Shark's tooth",
    trilobite: 'Trilobite', seahorse: 'Sea horse', wishbone: 'Wishbone',
    fern: 'Fern', dragonfly: 'Dragonfly', crab: 'Crab',
    starfish: 'Starfish', whelk: 'Whelk', serpent: 'Serpent',
  },
});

export const STRINGS = Object.freeze({ en: T, ...TRANSLATIONS });


export const stringsFor = (lang) => STRINGS[lang] ?? T;


export const fill = (line, values = {}) => String(line).replace(/\{(\w+)\}/g, (all, k) => (k in values ? values[k] : all));


export const count = (pair, n) => fill(pair[n === 1 ? 0 : 1], { n });
