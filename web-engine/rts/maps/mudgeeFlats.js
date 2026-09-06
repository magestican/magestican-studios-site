
































































import { buildMap } from './mapFormat.js';
import {
  ellipse, triangle, poly, pie, band, organic, without, intersect, disc,
  weight, MIRRORED, seedOf,
} from './shapes.js';


const wu = (v) => Math.round(v * 1000);

const AMP_MM = wu(38);
const WAVE_MM = wu(230);


































const shape = (letter, r) => organic(r, {
  seed: seedOf('mudgeeFlats:' + letter), ampMm: AMP_MM, waveMm: WAVE_MM,
});

























const RIVER = organic(band([
  [wu(-40), wu(596)], [wu(300), wu(578)], [wu(620), wu(612)],
  [wu(900), wu(586)], [wu(1240), wu(604)],
], wu(56)), { seed: seedOf('mudgeeFlats:river'), ampMm: wu(15), waveMm: wu(340) });


const dry = (letter, r) => without(shape(letter, r), RIVER);











const reach = (xWu) => intersect(RIVER, disc(wu(xWu), wu(596), wu(230)));

export default buildMap({
  id: 'mudgeeFlats',
  name: 'Mudgee Flats',
  intent: 'Can you hold the river? The teaching map: one idea, no keystone, no cliff.',
  players: 2,

  
  
  
  
  
  
  
  
  
  
  
  regions: [
    
    
    
    { letter: 'a', region: dry('a', ellipse(wu(124), wu(76), wu(242), wu(160), 3620)) },
    
    
    { letter: 'b', region: dry('b', triangle([wu(174), wu(-148)], [wu(766), wu(-126)], [wu(452), wu(322)])) },
    
    
    
    { letter: 'c', region: dry('c', pie(wu(786), wu(-34), wu(260), 0, 2048)) },
    { letter: 'd', region: dry('d', ellipse(wu(1044), wu(38), wu(232), wu(174), 760)) },

    
    
    
    {
      letter: 'e',
      region: dry('e', poly([
        [wu(-120), wu(126)], [wu(196), wu(190)], [wu(302), wu(304)],
        [wu(188), wu(424)], [wu(-120), wu(408)],
      ])),
    },
    { letter: 'f', region: dry('f', ellipse(wu(424), wu(266), wu(212), wu(150), 1320)) },
    
    
    
    { letter: 'g', region: dry('g', triangle([wu(672), wu(122)], [wu(1046), wu(300)], [wu(636), wu(456)])) },
    
    { letter: 'h', region: dry('h', pie(wu(1258), wu(278), wu(310), 1024, 3072)) },

    
    { letter: 'i', region: dry('i', ellipse(wu(118), wu(482), wu(236), wu(170), 380)) },
    
    
    
    { letter: 'j', region: dry('j', triangle([wu(206), wu(604)], [wu(714), wu(592)], [wu(468), wu(266)])) },
    {
      letter: 'k',
      region: dry('k', poly([
        [wu(646), wu(506)], [wu(744), wu(376)], [wu(962), wu(396)],
        [wu(1010), wu(556)], [wu(752), wu(588)],
      ])),
    },
    { letter: 'l', region: dry('l', ellipse(wu(1050), wu(486), wu(252), wu(188), 3380)) },

    
    
    
    
    
    
    
    
    { letter: 'm', region: weight(reach(112), wu(6)) },
    { letter: 'n', region: reach(356) },
    { letter: 'o', region: reach(600) },
    { letter: 'p', region: reach(844) },
    { letter: 'q', region: weight(reach(1088), wu(6)) },

    
    
    
    
    
    
    
    { letter: 'r', region: MIRRORED },
    { letter: 's', region: MIRRORED },
    { letter: 't', region: MIRRORED },
    { letter: 'u', region: MIRRORED },
    { letter: 'v', region: MIRRORED },
    { letter: 'w', region: MIRRORED },
    { letter: 'x', region: MIRRORED },
    { letter: 'y', region: MIRRORED },
    { letter: 'z', region: MIRRORED },
    { letter: 'A', region: MIRRORED },
    { letter: 'B', region: MIRRORED },
    { letter: 'C', region: MIRRORED },
  ],

  


























  elevation: {
    
    baseDm: 28,
    baseWaveMm: wu(260),
    features: [
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      {
        region: organic(band([
          [wu(-80), wu(392)], [wu(300), wu(368)], [wu(660), wu(404)], [wu(1040), wu(376)],
        ], wu(100)), { seed: seedOf('mudgeeFlats:rise'), ampMm: wu(34), waveMm: wu(290) }),
        peakDm: 215,
        rampMm: wu(100),
        rise: 'dome',
      },
      
      
      
      
      
      
      
      
      
      
      {
        region: organic(disc(wu(392), wu(474), wu(150)),
          { seed: seedOf('mudgeeFlats:knoll'), ampMm: wu(26), waveMm: wu(190) }),
        peakDm: 300,
        rampMm: wu(150),
        rise: 'dome',
      },
      
      
      {
        region: organic(ellipse(wu(600), wu(-120), wu(820), wu(330), 0),
          { seed: seedOf('mudgeeFlats:back'), ampMm: wu(40), waveMm: wu(340) }),
        
        
        
        
        
        peakDm: 100,
        rampMm: wu(150),
        rise: 'dome',
      },
    ],
  },

  
  
  
  
  
  
  
  
  sectors: {
    
    a: { kind: 'land', yieldPct: 90 },
    b: { kind: 'land', yieldPct: 110 },
    c: { kind: 'land', yieldPct: 110 },
    d: { kind: 'land', yieldPct: 90 },
    
    e: { kind: 'land', yieldPct: 120 },
    f: { kind: 'land', yieldPct: 95 },
    g: { kind: 'land', yieldPct: 95 },
    h: { kind: 'land', yieldPct: 120 },
    
    i: { kind: 'land', yieldPct: 85 },
    j: { kind: 'land', yieldPct: 130 },
    k: { kind: 'land', yieldPct: 130 },
    l: { kind: 'land', yieldPct: 85 },
    
    m: { kind: 'water', yieldPct: 100 },
    n: { kind: 'water', yieldPct: 100 },
    o: { kind: 'water', yieldPct: 100 },
    p: { kind: 'water', yieldPct: 100 },
    q: { kind: 'water', yieldPct: 100 },
    
    r: { kind: 'land', yieldPct: 85 },
    s: { kind: 'land', yieldPct: 130 },
    t: { kind: 'land', yieldPct: 130 },
    u: { kind: 'land', yieldPct: 85 },
    
    v: { kind: 'land', yieldPct: 120 },
    w: { kind: 'land', yieldPct: 95 },
    x: { kind: 'land', yieldPct: 95 },
    y: { kind: 'land', yieldPct: 120 },
    
    z: { kind: 'land', yieldPct: 90 },
    A: { kind: 'land', yieldPct: 110 },
    B: { kind: 'land', yieldPct: 110 },
    C: { kind: 'land', yieldPct: 90 },
  },

  









  symmetry: {
    a: 'C', b: 'B', c: 'A', d: 'z',
    e: 'y', f: 'x', g: 'w', h: 'v',
    i: 'u', j: 't', k: 's', l: 'r',
    m: 'q', n: 'p', o: 'o', p: 'n', q: 'm',
    r: 'l', s: 'k', t: 'j', u: 'i',
    v: 'h', w: 'g', x: 'f', y: 'e',
    z: 'd', A: 'c', B: 'b', C: 'a',
  },
  mirror: 'rot180',

  spawns: [
    { seat: 0, sector: 'b' },
    { seat: 1, sector: 'B' },
  ],
});
