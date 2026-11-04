


import { TRANSLATIONS } from './translations.js';

export const T = Object.freeze({
  title: 'Fossick',
  titleSub: 'or, the careful hand',
  cabinet: 'The cabinet',
  labelWon: '{name}, freed by your own hand',
  labelCollapse: 'The block gave way and took the specimen',
  labelBroken: 'Three cracks, and the specimen came apart',
  complete: 'The cabinet is full',

  titleBlurb: 'Twelve specimens, each held fast in its own block of rock. Tap them free a cube at a time, and turn each block gently, because its weight shifts as you dig.',
  imprint: 'Printed for the patient, at the bench.',
  drawerNotes: {
    chalk: 'Soft rock. Tap, turn and mind the weight.',
    limestone: 'Harder beds, and a mallet for those in a hurry.',
    slate: 'Brittle seams and long overhangs.',
    survey: 'No colour to guide you. Each face counts what lies behind it.',
  },

  open: 'Open the cabinet',
  back: 'Leave the bench',
  soundOn: 'Sound on',
  soundOff: 'Sound off',
  again: 'Try it again',
  next: 'Open the next block',
  toCabinet: 'Go back to the cabinet',

  cabinetSub: 'Choose a drawer. Free a specimen to open the next.',
  hintStart: 'Drag to turn the block. Tap a cube to strike it.',
  hintKeys: 'Turn with the arrows or WASD, and roll with Q and E. Shift steadies, Space strikes and R levels out.',
  hintStrain: 'Turn slowly or dig elsewhere first, because red hatching means that rock is tiring.',

  hintTreasure: 'That is the specimen. Three cracks break it.',
  hintCreak: 'That creak is a warning. Stop and look.',

  home: 'Magestican Studios',
  locked: 'Not yet',
  unsolved: 'Not freed',
  plate: 'Plate {n}',
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

  drawers: { chalk: 'Chalk', limestone: 'Limestone', slate: 'Slate', survey: 'Survey' },
  names: {
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
