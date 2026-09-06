
















































































import { buildMap } from './mapFormat.js';
import {
  ellipse, triangle, poly, pie, band, organic, intersect, union, without,
  MIRRORED, seedOf,
} from './shapes.js';


const wu = (v) => Math.round(v * 1000);

const AMP_MM = wu(40);
const WAVE_MM = wu(215);


const shape = (letter, r) => organic(r, {
  seed: seedOf('bindiRidge:' + letter), ampMm: AMP_MM, waveMm: WAVE_MM,
});

















const PLATEAU = organic(band([
  [wu(-80), wu(600)], [wu(340), wu(576)], [wu(760), wu(620)], [wu(1280), wu(592)],
], wu(130)), { seed: seedOf('bindiRidge:scarp'), ampMm: wu(40), waveMm: wu(285) });


















const GATES = union(
  band([[wu(300), wu(330)], [wu(300), wu(640)]], wu(88)),
  band([[wu(900), wu(330)], [wu(900), wu(640)]], wu(88)),
);























const below = (letter, r) => without(shape(letter, r), PLATEAU);
const above = (letter, r) => intersect(shape(letter, r), PLATEAU);

export default buildMap({
  id: 'bindiRidge',
  name: 'Bindi Ridge',
  intent: 'Which gate do you take, and can you hold the one you took?',
  players: 2,
  
  playable: false,

  regions: [
    
    
    
    { letter: 'a', region: below('a', ellipse(wu(126), wu(66), wu(246), wu(158), 3560)) },
    
    { letter: 'b', region: below('b', triangle([wu(196), wu(-136)], [wu(760), wu(-118)], [wu(462), wu(300)])) },
    
    { letter: 'c', region: below('c', pie(wu(842), wu(-40), wu(268), 0, 2048)) },
    { letter: 'd', region: below('d', ellipse(wu(1112), wu(70), wu(218), wu(166), 820)) },

    
    
    
    {
      letter: 'e',
      region: below('e', poly([
        [wu(-140), wu(150)], [wu(176), wu(206)], [wu(252), wu(300)],
        [wu(140), wu(392)], [wu(-140), wu(378)],
      ])),
    },
    { letter: 'f', region: below('f', ellipse(wu(462), wu(244), wu(236), wu(122), 3904)) },
    { letter: 'g', region: below('g', triangle([wu(700), wu(146)], [wu(1046), wu(286)], [wu(680), wu(400)])) },
    { letter: 'h', region: below('h', pie(wu(1268), wu(298), wu(300), 1024, 3072)) },

    
    
    
    
    { letter: 'n', region: below('n', ellipse(wu(292), wu(452), wu(356), wu(78), 20)) },
    { letter: 'o', region: below('o', ellipse(wu(908), wu(456), wu(356), wu(78), 4076)) },

    
    
    
    
    
    
    
    
    
    
    
    
    { letter: 'i', region: above('i', ellipse(wu(300), wu(548), wu(176), wu(236), 132)) },
    { letter: 'j', region: above('j', ellipse(wu(30), wu(536), wu(206), wu(150), 0)) },
    
    
    
    
    { letter: 'k', region: above('k', ellipse(wu(600), wu(548), wu(196), wu(128), 40)) },
    { letter: 'l', region: above('l', ellipse(wu(1170), wu(536), wu(206), wu(150), 0)) },
    { letter: 'm', region: above('m', ellipse(wu(900), wu(548), wu(176), wu(236), 3964)) },

    
    { letter: 'A', region: MIRRORED },
    { letter: 'B', region: MIRRORED },
    { letter: 'C', region: MIRRORED },
    { letter: 'D', region: MIRRORED },
    { letter: 'E', region: MIRRORED },
    { letter: 'F', region: MIRRORED },
    { letter: 'G', region: MIRRORED },
    { letter: 'H', region: MIRRORED },
    { letter: 'I', region: MIRRORED },
    { letter: 'J', region: MIRRORED },
  ],

  






















  elevation: {
    baseDm: 15,
    baseWaveMm: wu(250),
    features: [
      { region: without(PLATEAU, GATES), peakDm: 190, rise: 'mesa' },
      { region: intersect(PLATEAU, GATES), peakDm: 190, rampMm: wu(165), rise: 'dome' },
      
      
      {
        region: organic(ellipse(wu(600), wu(-60), wu(700), wu(280), 0),
          { seed: seedOf('bindiRidge:back'), ampMm: wu(30), waveMm: wu(300) }),
        peakDm: 40,
        rampMm: wu(280),
        rise: 'dome',
      },
    ],
  },

  












  sectors: {
    a: { kind: 'land', yieldPct: 128 },
    b: { kind: 'land', yieldPct: 116 },
    c: { kind: 'land', yieldPct: 122 },
    d: { kind: 'land', yieldPct: 134 },
    e: { kind: 'land', yieldPct: 104 },
    f: { kind: 'land', yieldPct: 88 },
    g: { kind: 'land', yieldPct: 92 },
    h: { kind: 'land', yieldPct: 110 },
    n: { kind: 'water', yieldPct: 100 },
    o: { kind: 'water', yieldPct: 100 },
    
    
    i: { kind: 'keystone', yieldPct: 72 },
    j: { kind: 'land', yieldPct: 80 },
    k: { kind: 'water', yieldPct: 100 },
    l: { kind: 'land', yieldPct: 80 },
    m: { kind: 'keystone', yieldPct: 72 },
    
    A: { kind: 'land', yieldPct: 110 },
    B: { kind: 'land', yieldPct: 92 },
    C: { kind: 'land', yieldPct: 88 },
    D: { kind: 'land', yieldPct: 104 },
    E: { kind: 'land', yieldPct: 134 },
    F: { kind: 'land', yieldPct: 122 },
    G: { kind: 'land', yieldPct: 116 },
    H: { kind: 'land', yieldPct: 128 },
    I: { kind: 'water', yieldPct: 100 },
    J: { kind: 'water', yieldPct: 100 },
  },

  symmetry: {
    a: 'H', b: 'G', c: 'F', d: 'E',
    e: 'D', f: 'C', g: 'B', h: 'A',
    n: 'I', o: 'J',
    i: 'm', j: 'l', k: 'k', l: 'j', m: 'i',
    A: 'h', B: 'g', C: 'f', D: 'e',
    E: 'd', F: 'c', G: 'b', H: 'a',
    I: 'n', J: 'o',
  },
  mirror: 'rot180',

  spawns: [
    { seat: 0, sector: 'b' },
    { seat: 1, sector: 'G' },
  ],
});
