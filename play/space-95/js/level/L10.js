



































import { levelBuilder } from './dsl.js';

const BOSS = 'L10-boss-1';
const DEED = 'L10-intel-2';
const SAG = 'L10-heave-1';


const LIMB_SEGS = 2;
const LIMB = 24 * LIMB_SEGS;
const X = (x) => x + LIMB;


const LOFT_CHIMNEY = false;
const LOFT = LOFT_CHIMNEY ? 15 : 0;
const Y = (y) => y + LOFT;

export function buildL10() {
  const L = levelBuilder({ id: 10, name: 'The Gardener Mantis', pitCost: 'heart', height: Y(132), soilLook: 'rottenBark' });

  
  L.putAt('ability', 4.4, 2, { grant: 'double', name: 'Thruster coil' });
  L.putAt('ability', 4.8, 2, { grant: 'pound', name: 'Pound plates' });
  L.putAt('ability', 5.2, 2, { grant: 'dash', name: 'Dash spring' });
  L.putAt('ability', 5.6, 2, { grant: 'glide', name: 'Broad leaf' });
  L.putAt('ability', 6.0, 2, { grant: 'wall', name: 'Wax grips' });

  
  L.spawnAt(4, 2);
  L.wall(0, 1, 0, 30).wall(1, 34, 0, 2);
  L.landmarkAt('Vast kite', 18, 2, 'mid').landmarkAt('Windfalls', 26, 2, 'back');

  
  L.putAt('fruitlet', 10, 2, { motif: 'kicked-apple', use: 'M1' });
  L.putAt('ladybot', 18, 2, { facing: 1, motif: 'kicked-apple', use: 'M1' });

  
  L.ledge(36, 41, 4.5).ledge(43, 48, 7).wall(50, 58.5, 7.5, 9.5);

  
  L.wall(55.5, 56, 12, 31.5).wall(58.5, 70, 9.5, 31.5);
  L.bark(64, 67, 31.5, 41.5).ledge(62, 70, 41.5);
  L.wall(69.5, 70, 44, 63.5).wall(72.5, 80, 41.5, 63.5).wall(70, 72.5, 39.5, 41.5);
  L.carve(73, 79, 58, 62.5).carve(72.5, 73, 58, 59.5).soil(75, 76, 62.5, 63.5);
  L.putAt('intel', 76, 58, {
    secret: 'cache',
    name: 'A Vast seed-packet corner',
    signals: ['visual:amber-glint', 'audio:hollow-knock'],
    seenFrom: 'scar chimney S2 through the slot (x 72.5-73, y 58-59.5)',
  });
  L.beaconAt(78, 63.5);
  L.landmarkAt('Storm scar', 64, 31.5);

  
  L.wall(80, 128, 61.5, 63.5).wall(135, 160, 61.5, 63.5).wall(160, X(190), 63.5, 65.5).wall(X(190), X(213), 65.5, 67.5);
  L.wall(122, 141, 52, 54).bark(133.5, 135, 54, 63.5); 
  L.putAt('twigDrop', 95, 63.5, { zone: { x0: 92, x1: 98 } });
  L.putAt('twigDrop', 140, 63.5, { zone: { x0: 138, x1: 143 } });
  L.putAt('twigDrop', X(182), 65.5, { zone: { x0: X(180), x1: X(185) } });
  
  for (let k = 0; k < LIMB_SEGS; k++) L.putAt('twigDrop', 191.5 + 24 * k, 65.5, { zone: { x0: 188.5 + 24 * k, x1: 194.5 + 24 * k } });
  L.putAt('ladybot', 112, 63.5, { facing: -1 });
  L.putAt('ladybot', 165, 65.5, { facing: -1 });
  L.landmarkAt('Long limb', 100, 63.5);

  
  L.putAt('fruitlet', 171, 65.5, { motif: 'kicked-apple', use: 'M2' });
  L.putAt('mantisArm', 177, 65.5, { motif: 'kicked-apple', use: 'M2', catch: { x0: 175.5, x1: 178.5, y0: 65.5, y1: 68 } });

  
  L.putAt('cameo', X(187), 65.5, { who: 'duchess', zone: { x0: X(184), x1: X(190), y0: 64, y1: 70 } });
  L.ledge(X(196), X(209.5), 76);
  L.putAt('pillbug', X(202), 76, {
    specimen: true,
    topiary: true,
    name: 'Topiary Pillbug',
    signals: ['visual:leaf-clippings', 'audio:tumble-clunk'],
    seenFrom: 'the limb x 196-209 (y 67.5), looking up',
  });
  L.cameraHint(X(190), X(213), { dy: 3, y0: 63, y1: 70 });

  
  L.wall(X(209.5), X(210), 70, 82.5).wall(X(213), X(218), 67.5, 82.5).wall(X(213), X(241), 80.5, 82.5);
  L.landmarkAt('Potting bench', X(225), 82.5);

  
  L.wall(X(237.5), X(238), 85, 97.5).wall(X(241), X(246), 82.5, 97.5).ledge(X(228), X(238), 97.5);
  
  
  if (LOFT_CHIMNEY) L.wall(X(232.5), X(233), 100, 112.5).wall(X(236), X(236.5), 100, 112.5).ledge(X(228), X(233), 112.5);
  L.wall(X(227), X(228), 97.5, Y(112))
    .wall(X(231), X(231.5), 100 + LOFT, Y(112))
    .ledge(X(228), X(231), Y(112));
  L.beaconAt(X(229.5), Y(112));

  
  L.wall(X(226), X(227), Y(110), Y(128)).wall(X(257), X(258), Y(110), Y(118)).wall(X(227), X(257), Y(128), Y(129));
  L.wall(X(227), X(228), Y(110), Y(112)).wall(X(231), X(238), Y(110), Y(112)).wall(X(246), X(257), Y(110), Y(112));
  L.ledge(X(227), X(231), Y(116.5)).ledge(X(253), X(257), Y(116.5));
  L.wall(X(237), X(238), Y(104), Y(110)).wall(X(246), X(247), Y(104), Y(110)).wall(X(237), X(247), Y(102), Y(104));
  L.bark(X(238), X(238.5), Y(106), Y(112)).bark(X(245.5), X(246), Y(106), Y(112));
  
  
  L.arenaPiece('nest', X(238), X(246), Y(110), Y(112), { at: { 0: Y(110), 1: Y(104), 2: Y(104) } });
  L.arenaPiece('hangBough', X(236), X(248), Y(121.5), Y(122.5), { at: { 0: Y(121.5), 1: Y(121.5) } });
  L.heaveAt(X(238), X(246), Y(112), -1.5, 0, { id: SAG, group: 'sag', phases: [2], taper: [4, 4] }); 
  L.landmarkAt('Crown loft', X(242), Y(112));
  
  L.putAt('intel', X(229), Y(116.5), {
    id: DEED,
    alive: false,
    secret: 'deed',
    name: 'A Vast plant label',
    condition: { noDamageInPhase: 2 },
    signals: ['visual:gold-glint', 'audio:glint-chime'],
    seenFrom: 'the arena: it falls onto the left perch during the P2 -> P3 topping',
  });
  const hatch = { x: X(229.5), y: Y(112) };
  const bough = { x: X(231), y: Y(112) };
  L.putAt('boss', X(252), Y(112), {
    id: BOSS,
    type: 'mantis',
    name: 'The Gardener Mantis',
    w: 3,
    h: 6,
    arena: { x0: X(227), x1: X(257), y0: Y(111.5), y1: Y(128) },
    respawn: hatch,
    dish: { x: X(254), y: Y(126) },
    sagId: SAG,
    phases: [
      {
        name: 'Thinning',
        hp: 4, 
        use: 'M3',
        motif: 'kicked-apple',
        shape: 0,
        spawn: hatch,
        weakness: 'stomp',
        attacks: [
          { name: 'thinSnip', telegraph: 0.6, active: 0.4, recover: 0.6 },
          { name: 'shearSweep', telegraph: 0.9, active: 0.35, recover: 0.8 },
        ],
      },
      {
        name: 'Pruning',
        hp: 3,
        use: 'M4',
        motif: 'kicked-apple',
        deed: DEED,
        shape: 1,
        intro: 2.5,
        spawn: bough,
        weakness: 'stomp',
        attacks: [
          { name: 'thinSnip', telegraph: 0.6, active: 0.4, recover: 0.6 },
          { name: 'shearStrike', telegraph: 0.9, active: 0.4, recover: 1.2 },
          { name: 'twigFling', telegraph: 0.7, active: 0.6, recover: 0.8 },
        ],
      },
      {
        name: 'Topping',
        hp: 2,
        use: 'M5',
        motif: 'kicked-apple',
        shape: 2,
        intro: 2.5,
        spawn: bough,
        weakness: 'stomp',
        attacks: [
          { name: 'windfall', telegraph: 0.8, active: 0.6, recover: 0.6 },
          { name: 'scissorSweep', telegraph: 1.0, active: 0.4, recover: 0.8 },
        ],
      },
    ],
  });
  
  L.beaconAt(bough.x, bough.y, { phase: `${BOSS}:1` });
  L.beaconAt(bough.x, bough.y, { phase: `${BOSS}:2` });
  
  L.cameraHint(X(226), X(258), { y0: Y(100), y1: Y(130), frame: { x0: X(226), x1: X(258), y0: Y(104), y1: Y(122) } });

  
  L.putAt('finish', X(252), Y(112), { axis: 'y', alive: false, bossGate: BOSS, name: 'Antenna dish', delay: 1.5 });

  const level = L.build();
  level.waypoints = ROUTE;
  return level;
}


const ROUTE = [
  { x: 33, y: 2, move: 'walk' }, 
  { x: 38, y: 4.5, move: 'jump' },
  { x: 45, y: 7, move: 'jump' },
  { x: 54, y: 9.5, move: 'jump', at: 47.5 },
  { x: 60, y: 31.5, move: 'wall', via: { x: 57.25 } }, 
  { x: 65.5, y: 41.5, move: 'climb' }, 
  { x: 68, y: 41.5, move: 'walk' }, 
  { x: 76, y: 63.5, move: 'wall', via: { x: 71.25 } }, 
  { x: 100, y: 63.5, move: 'walk' }, 
  { x: 118, y: 63.5, move: 'jump', at: 105 }, 
  { x: 126, y: 63.5, move: 'walk' },
  { x: 137, y: 63.5, move: 'glide', at: 127.5 }, 
  { x: 161, y: 65.5, move: 'jump' }, 
  { x: 167, y: 65.5, move: 'jump', at: 161 }, 
  { x: 179, y: 65.5, move: 'walk' }, 
  { x: 179.5 + LIMB / 2, y: 65.5, move: 'walk' }, 
  { x: X(179.5), y: 65.5, move: 'walk' },
  { x: X(191), y: 67.5, move: 'jump', at: X(188.5) }, 
  { x: X(215), y: 82.5, move: 'wall', via: { x: X(211.5) } }, 
  { x: X(236), y: 82.5, move: 'walk' }, 
  { x: X(233), y: 97.5, move: 'wall', via: { x: X(239.5) } }, 
  ...(LOFT_CHIMNEY ? [{ x: X(230.5), y: 112.5, move: 'wall', via: { x: X(234.5) } }] : []), 
  { x: X(229.5), y: Y(112), move: 'wall', via: { x: X(229.5) } }, 
  { x: X(252), y: Y(112), move: 'boss' }, 
];
