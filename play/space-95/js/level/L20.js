

















































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
const AWNING = 94; 
const CROWN_POST = { x: 164, y: AWNING + 2.5 }; 
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
  { x: 127, y: SILL, move: 'packet', lane: TRAIN, board: 1, via: { jumps: [0, 8, 16] }, maxS: 14 }, 
  { x: 133, y: SILL, move: 'walk' }, 
  
  { x: 150.5, y: SILL, move: 'walk', maxS: 12 },
  
  { x: 157, y: 35.5, move: 'jump' },
  { x: 162, y: 40.5, move: 'jump' },
  { x: 166, y: 45, move: 'jump' }, 
  
  { x: 152, y: 45, move: 'jump', via: { defeat: 'L20-wasp-1' }, maxS: 6 },
  
  { x: 153, y: 49.5, move: 'jump', via: { double: true } },
  { x: 162, y: 58, move: 'pump', via: { web: 'L20-web-1' }, maxS: 8 },
  
  { x: 169.5, y: 58, move: 'jump', yank: 'L20-plug-1' },
  
  ...[62.5, 67, 71.5, 76, 80.5, 85, 89.5].map((y) => ({ x: 168, y, move: 'jump', via: { double: true } })),
  
  { x: 169.5, y: AWNING, move: 'jump', via: { double: true }, bud: 'L20-bud-1' },
  
  { x: 190, y: SILL, move: 'walk', maxS: 12 },
];

export function buildL20() {
  const L = levelBuilder({
    id: 20,
    name: 'Swarm Sovereign',
    pitCost: 'heart',
    height: 110,
    checklist: ['Clear the pad', 'Get the cell back', 'Fuel up', 'Take off'],
  });
  L.wall(0, 226, 0, SILL); 
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
    { speed: 8, period: 5, offset: 2.4, w: 4, plough: true, motif: 'callback', use: 'B5' },
  );
  
  L.putAt('guard', 114, SILL, { dozing: true, wakeWhen: { x: 104, dir: 1 }, facing: -1, ...CB('B5') });
  L.putAt('guard', 119, SILL, { dozing: true, wakeWhen: { x: 104, dir: 1 }, facing: -1, ...CB('B5') });

  
  
  
  
  L.putAt('fruitlet', 127.5, SILL, CB('B6'));
  L.putAt('fruitlet', 147, SILL, CB('B6'));
  L.putAt('boss', 148.8, SILL, {
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
      {
        
        
        name: 'P2',
        hp: 1,
        box: 2,
        crown: true,
        intro: 3,
        post: CROWN_POST,
        arena: { x0: 146, x1: 180, y0: 28, y1: 104 },
        weakness: ['callback', 'stomp'],
        callbacks: ['flockBurst'],
        attacks: [atk('Cadet Dive', 'hover', 0.9, 0.5, 0.8)],
      },
    ],
  });
  L.beaconAt(151, SILL, { phase: `${BOSS}:1` }); 
  climb(L);

  const level = L.build();
  level.waypoints = ROUTE;
  
  level.webBeats = [{ name: 'B9 web -> F3', from: { x: 153, y: 49.5 }, goal: { x0: 160.5, y: 58, dir: 1 } }];
  return level;
}


function climb(L) {
  
  L.wall(172, 175, SILL, 90).slick(172, 175, SILL, 90);

  
  
  const dew = (x, y) => L.putAt('dew', x, y, { w: 1.5, ...CB('B7') });
  dew(154.5, SILL);
  L.ledge(155.5, 160.5, 35.5);
  dew(159.5, 35.5);
  L.ledge(161, 165.5, 40.5);
  dew(164.5, 40.5);

  
  
  
  L.ledge(150, 171, 45);
  L.putAt('antColumn', 160.5, 45, { x0: 150, x1: 171, speed: -4, foes: ['wasp'], ...CB('B8') });
  L.putAt('wasp', 160, 49.5, { ...CB('B8') });

  
  L.web(150.5, 49.5, 160, 49.5, { use: 'B9', motif: 'callback' });
  L.putAt('intel', 159.5, 58.5, {
    secret: 'cache',
    name: "The Vast's window-cleaning schedule",
    signals: ['visual:amber-glint', 'audio:hollow-knock'],
    seenFrom: 'the dew ledges (B7), below it',
  });
  L.ledge(160.5, 171, 58); 

  
  
  L.putAt('plug', 170.5, 62.5, { circuit: 'L20-lights', name: 'Fairy lights plug', ...CB('B10') });
  L.circuit('L20-lights', [
    [170.5, 62.5],
    [168, 66],
    [151, 68],
  ]);
  for (const [x, y] of [
    [163, 66.6],
    [159, 66.9],
    [155, 67.3],
  ])
    L.putAt('wasp', x, y, { lead: true, circuit: 'L20-lights', wakeY: 4, ...CB('B10') });
  for (const y of [62.5, 67, 71.5, 76, 80.5, 85, 89.5]) L.ledge(165, 171, y); 

  
  
  const line = (step, x0, x1, y) => L.putAt('cameo', (x0 + x1) / 2, y, { event: 'sillLine', step, zone: { x0, x1, y0: y - 2, y1: y + 1 } });
  line(3, 150.5, 160, 49.5); 
  line(4, 165, 171, 67); 

  
  
  L.ledge(148, 178, AWNING);
  L.putAt('bud', 169.5, AWNING, { burst: 9, skin: 'jar', ...CB('B11') });

  
  for (const [x, y] of [
    [178.5, 91],
    [180, 86],
    [181, 79],
    [182, 70],
    [183, 60],
    [184, 50],
    [185, 41],
    [186, 33],
  ])
    L.putAt('seed', x, y);
  L.putAt('finish', 190, SILL, { alive: false, bossGate: BOSS, name: 'TEMPORARY end of the P2 greybox' });
}
