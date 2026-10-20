

























import { levelBuilder } from './dsl.js';

const KIT = [
  ['double', 'Thruster coil'],
  ['pound', 'Pound plates'],
  ['dash', 'Dash spring'],
  ['glide', 'Broad leaf'],
  ['wall', 'Wax grips'],
  ['tether', 'Paperclip hook'],
  ['lantern', 'Firefly Lantern'],
  ['drill', 'Screw-drill'],
];
const SILL = 30; 
const BOSS = 'L20-boss-1';
const TRAIN = 'L20-train';
const CB = (use) => ({ motif: 'callback', use });
const atk = (name, kind, telegraph, active, recover) => ({ name, kind, telegraph, active, recover });


const ROUTE = [
  { x: 24, y: SILL, move: 'walk' }, 
  { x: 33, y: SILL, move: 'walk' }, 
  { x: 43, y: SILL + 0.5, move: 'jump' }, 
  { x: 46.5, y: SILL + 0.5, move: 'jump' },
  { x: 50, y: SILL + 0.5, move: 'jump' },
  { x: 66, y: SILL, move: 'walk' }, 
  { x: 69.9, y: SILL, move: 'pound', via: { defeat: 'L20-guard-3' } }, 
  { x: 93, y: SILL, move: 'walk' }, 
  { x: 127, y: SILL, move: 'packet', lane: TRAIN, at: 96, board: 1, via: { jumps: [0, 8, 16] }, maxS: 14 }, 
  { x: 133, y: SILL, move: 'walk' }, 
  
  { x: 156, y: SILL, move: 'drop', at: 134.5, via: { waitMax: 2 }, maxS: 12 },
];

export function buildL20() {
  const L = levelBuilder({ id: 20, name: 'Swarm Sovereign', pitCost: 'heart', height: 110 });
  L.wall(0, 170, 0, SILL); 
  L.spawnAt(4, SILL); 
  for (const [i, [grant, name]] of KIT.entries()) L.putAt('ability', 5 + 0.4 * i, SILL, { grant, name });

  
  for (const [x, dy] of [
    [11, 0.5],
    [13, 0.5],
    [15, 0.5],
    [17, 0.5],
    [19, 0.5],
  ])
    L.putAt('seed', x, SILL + dy);
  L.beaconAt(22, SILL); 

  
  L.putAt('pebble', 27, SILL, CB('B1'));
  L.putAt('guard', 36, SILL, { dozing: true, facing: -1, ...CB('B1') });

  
  for (const [x, letter] of [
    [43, 'J'],
    [46.5, 'O'],
    [50, 'B'],
  ])
    L.putAt('typeKey', x, SILL, { letter, w: 3, rise: 1, mode: 'one', reach: 16, screen: 'phone', ...CB('B2') });
  L.putAt('guard', 56, SILL, { dozing: true, facing: -1, ...CB('B2') });

  
  L.honey(62, 70, SILL, { use: 'B3', motif: 'callback', skin: 'jam' });
  L.putAt('guard', 74, SILL, { dozing: true, wakeWhen: { x: 58, dir: 1 }, facing: -1, ...CB('B3') });

  
  L.putAt('guard', 92, SILL, { dozing: true, facing: -1, ...CB('B4') });
  L.shoeBeat(80, { lane: 'back', x: 92, radius: 6, use: 'B4', motif: 'callback' });
  L.shoeBeat(86, { lane: 'back', x: 92, radius: 6, use: 'B4', motif: 'callback' });

  
  L.packetLane(
    TRAIN,
    [
      [98, SILL + 1],
      [126, SILL + 1],
    ],
    { speed: 8, period: 5, offset: 0, w: 4, plough: true, motif: 'callback', use: 'B5' },
  );
  
  L.putAt('guard', 114, SILL, { dozing: true, wakeWhen: { x: 104, dir: 1 }, facing: -1, ...CB('B5') });
  L.putAt('guard', 119, SILL, { dozing: true, wakeWhen: { x: 104, dir: 1 }, facing: -1, ...CB('B5') });

  
  L.putAt('fruitlet', 130, SILL, CB('B6'));
  L.putAt('fruitlet', 136, SILL, CB('B6'));
  L.putAt('boss', 146, SILL, {
    id: BOSS,
    type: 'sovereign',
    name: 'Mandibella',
    arena: { x0: 126, x1: 150 },
    
    phases: [
      {
        name: 'P1',
        hp: 2,
        box: 1,
        weakness: ['callback', 'stomp'],
        callbacks: ['fruitletCaught'],
        attacks: [atk('Horn Charge', 'charge', 0.9, 0.6, 0.8), atk('Glitter Fan', 'hover', 0.8, 0.5, 0.6)],
      },
    ],
  });
  
  
  L.putAt('finish', 156, SILL, { alive: false, bossGate: BOSS, name: 'TEMPORARY end of the P1 greybox' });

  const level = L.build();
  level.waypoints = ROUTE;
  return level;
}
