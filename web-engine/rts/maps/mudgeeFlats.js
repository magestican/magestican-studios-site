
































import { buildMap } from './mapFormat.js';


const TOP = [
  'aaaaaabbbbbbccccccdddddd',
  'aaaaaaabbbbbcccccccddddd',
  'aaaaaabbbbbbbcccccdddddd',
  'aaaaabbbbbbbcccccddddddd',
  'eeeeeffffffffgggggghhhhh',
  'eeeeeeffffffgggggghhhhhh',
  'eeeeeeeffffffgggggghhhhh',
  'eeeeeeffffffgggggggghhhh',
  'iiiiiijjjjjjkkkkkkllllll',
  'iiiiijjjjjjjkkkkkkklllll',
  'iiiiiijjjjjjkkkkklllllll',
];









const RIVER = 'mmmmmnnnnnooooopppppqqqq';







const HALF = {
  a: 'C', b: 'B', c: 'A', d: 'z',
  e: 'y', f: 'x', g: 'w', h: 'v',
  i: 'u', j: 't', k: 's', l: 'r',
  m: 'q', n: 'p', o: 'o', p: 'n', q: 'm',
};










const PARTNER = (() => {
  const out = { ...HALF };
  for (const k of Object.keys(HALF)) out[HALF[k]] = k;
  return out;
})();


const rotate = (row) => [...row].reverse().map((ch) => PARTNER[ch]).join('');

const SKETCH = [
  ...TOP,
  RIVER,
  rotate(RIVER),
  ...TOP.map(rotate).reverse(),
];








const land = (yieldPct) => ({ kind: 'land', yieldPct });
const water = (yieldPct) => ({ kind: 'water', yieldPct });

const SECTORS = {
  
  a: land(90), b: land(110), c: land(110), d: land(90),
  
  e: land(120), f: land(95), g: land(95), h: land(120),
  
  i: land(85), j: land(130), k: land(130), l: land(85),
  
  
  
  m: water(100), n: water(100), o: water(100), p: water(100), q: water(100),
  
  r: land(85), s: land(130), t: land(130), u: land(85),
  
  v: land(120), w: land(95), x: land(95), y: land(120),
  
  z: land(90), A: land(110), B: land(110), C: land(90),
};

export default buildMap({
  id: 'mudgeeFlats',
  name: 'Mudgee Flats',
  intent: 'Can you hold the river? The teaching map: one idea, no elevation, no keystone.',
  players: 2,
  sketch: SKETCH,
  sectors: SECTORS,
  
  
  symmetry: PARTNER,
  spawns: [
    { seat: 0, sector: 'b' },
    { seat: 1, sector: 'B' },
  ],
});
