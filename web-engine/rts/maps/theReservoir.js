




























import { buildMap } from './mapFormat.js';









const TOP = [
  'aaaaaaaabbbbbbbbcccccccc',
  'aaaaaaaabbbbbbbbcccccccc',
  'aaaaaaabbbbbbbbbbccccccc',
  'ddddddddeeeeeeeeffffffff',
  'ddddddddeeeeeeeeffffffff',
  'dddddddeeeeeeeeeefffffff',
  'gggggggghhhhhhhhiiiiiiii',
  'gggggggghhhhhhhhiiiiiiii',
  'ggggggghhhhhhhhhhiiiiiii',
  'jjjjjjjkkkkkkkkkkllllllll'.slice(0, 24),
  'jjjjjjjkkkkkkkkkkllllllll'.slice(0, 24),
];







const LAKE = 'mmmmmmmmoooooooopppppppp'.slice(0, 24);


const HALF = {
  a: 'x', b: 'w', c: 'v',
  d: 'u', e: 't', f: 's',
  g: 'r', h: 'q', i: 'n',
  j: 'C', k: 'B', l: 'A',
  m: 'p', o: 'o', p: 'm',
};


const PARTNER = (() => {
  const out = { ...HALF };
  for (const k of Object.keys(HALF)) out[HALF[k]] = k;
  return out;
})();

const rotate = (row) => [...row].reverse().map((ch) => PARTNER[ch]).join('');

const SKETCH = [
  ...TOP,
  LAKE,
  rotate(LAKE),
  ...TOP.map(rotate).reverse(),
];

const land = (yieldPct) => ({ kind: 'land', yieldPct });
const water = (yieldPct) => ({ kind: 'water', yieldPct });











const SECTORS = {
  
  
  
  
  
  
  
  
  
  
  
  
  
  a: land(84), b: land(92), c: land(87),
  
  d: land(95), e: land(102), f: land(98),
  
  g: land(93), h: land(104), i: land(90),
  
  j: land(86), k: land(100), l: land(89),
  
  
  
  m: water(100), o: water(100), p: water(100),
  
  
  
  n: land(90), q: land(104), r: land(93),
  s: land(98), t: land(102), u: land(95),
  v: land(87), w: land(92), x: land(84),
  A: land(89), B: land(100), C: land(86),
};

export default buildMap({
  id: 'theReservoir',
  name: 'The Reservoir',
  intent: 'Do you contest the middle, or starve slowly at the edge?',
  players: 2,
  
  
  
  
  
  
  
  
  
  
  playable: false,
  sketch: SKETCH,
  sectors: SECTORS,
  symmetry: PARTNER,
  spawns: [
    { seat: 0, sector: 'b' },
    { seat: 1, sector: 'w' },
  ],
});
