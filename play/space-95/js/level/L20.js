













































































































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
const WEST_BRACKETS = [67, 76, 85]; 
const EAST_BRACKETS = [62.5, 71.5, 80.5, 89.5]; 
const TRAIN = 'L20-train';

const BOWL = 32; 
const RAFT_X = 186.5; 
const BOX_E = 196; 
const BOX_TOP = 35;
const TOWER_X = 205.5; 
const FLANK = [206, 210]; 
const FLANK_PHASE = 0.9; 
const HULL_X = 217.5; 
const HULL_TOP = 37;
const BLOCK_U = 1.5; 

const STAIR = [
  [213.25, SILL],
  [214.75, SILL],
  [214.75, SILL + 1.5],
  [216.25, SILL],
  [216.25, SILL + 1.5],
  [216.25, SILL + 3],
];
const DEED = 'L20-intel-2';


const P3_INTRO = 4.9;
const P3_POST = { x: 193, y: SILL + 7 }; 

const SKY_END = 800;

const MOTH_PATH = [
  [290, 58],
  [340, 60],
  [400, 62],
  [460, 64],
  [520, 66],
  [560, 66],
];
const SPECIMEN = { x: 370, y: 61 - 0.35 }; 
const CADETS = [
  [610, 67.65],
  [640, 68.65],
  [670, 69.65],
]; 
const P4_POST = { x: 300, y: 60 }; 
const FLEE_TO = { x: 720, y: 70 }; 
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
  
  
  { x: 141, y: SILL, move: 'jump', at: 131, via: { double: true, defeat: `${BOSS}:0:1` }, maxS: 6 },
  
  { x: 148, y: SILL, move: 'jump', at: 142.8, via: { keep: { id: 'L20-fruitlet-2', x: 145.5 } }, maxS: 4 },
  { x: 141, y: SILL, move: 'jump', at: 147.5, via: { weak: BOSS, defeat: `${BOSS}:0` }, maxS: 8 },
  { x: 150.5, y: SILL, move: 'walk', maxS: 12 },
  
  { x: 157, y: 35.5, move: 'jump' },
  { x: 162, y: 40.5, move: 'jump' },
  { x: 166, y: 45, move: 'jump' }, 
  
  { x: 152, y: 45, move: 'jump', via: { defeat: 'L20-wasp-1' }, maxS: 6 },
  
  { x: 153, y: 49.5, move: 'jump', via: { double: true } },
  { x: 162, y: 58, move: 'pump', via: { web: 'L20-web-1' }, maxS: 8 },
  
  { x: 169.5, y: 58, move: 'jump', yank: 'L20-plug-1' },
  
  
  { x: 167.5, y: 62.5, move: 'jump', via: { double: true } },
  ...[67, 71.5, 76, 80.5, 85, 89.5].map((y, i) =>
    i % 2 ? { x: 166.5, y, move: 'jump', at: 158.6, via: { double: true } } : { x: 156, y, move: 'jump', at: 164.4, via: { double: true } },
  ),
  
  { x: 169.5, y: AWNING, move: 'jump', via: { double: true }, bud: 'L20-bud-1' },
  
  
  { x: RAFT_X, y: BOWL + 0.5, move: 'walk', maxS: 12 },
  
  { x: 190, y: BOX_TOP, move: 'jump' },
  { x: BOX_E - 1.5, y: BOX_TOP, move: 'walk' },
  { x: BOX_E - 1.5, y: BOX_TOP, move: 'pound', via: { defeat: 'L20-wasp-8' } },
  
  { x: TOWER_X, y: SILL, move: 'pound' },
  
  
  { x: 207.5, y: SILL + 0.75, move: 'walk' },
  { x: 200.5, y: SILL + 0.5, move: 'jump', at: 207.5, via: { double: true, defeat: `${BOSS}:2` }, maxS: 10 },
  
  { x: 212.5, y: SILL, move: 'walk' },
  { x: STAIR[0][0], y: SILL + BLOCK_U, move: 'jump' },
  { x: STAIR[1][0], y: SILL + 2 * BLOCK_U, move: 'jump' },
  { x: STAIR[3][0], y: SILL + 3 * BLOCK_U, move: 'jump' },
  { x: HULL_X + 2, y: HULL_TOP, move: 'jump', via: { double: true } },
  
  { x: 222.5, y: HULL_TOP, move: 'surf' },
];


const PLANE_PLAN = [
  { x: 262, y: 56, move: 'fly' }, 
  { x: 274, y: 57, move: 'fly' },
  { move: 'loop', via: { when: 'moth<=4' } }, 
  ...MOTH_PATH.map(([x, y]) => ({ x, y, move: 'fly' })), 
  { x: 600, y: 67.5, move: 'fly' }, 
  { x: FLEE_TO.x + 2, y: FLEE_TO.y + 0.9, move: 'fly' },
  { x: SKY_END - 20, y: FLEE_TO.y + 1, move: 'clear' }, 
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
  L.putAt('fruitlet', 145.5, SILL, CB('B6'));
  L.putAt('boss', 52, SILL, {
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
        
        
        intro: 0.3,
        spike: 3.0, 
        
        
        perches: [
          { at: 40, x: 52, y: SILL },
          { at: 47, x: 76, y: SILL, fan: true },
          { at: 71, x: 100, y: SILL, fan: true },
          { at: 95, x: 124, y: SILL + 1, fan: true },
        ],
        land: { at: 121, x: 138, y: SILL }, 
        attacks: [atk('Glitter Fan', 'hover', 0.8, 0.5, 0.6), atk('Horn Charge', 'charge', 0.9, 0.6, 0.8)],
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
      {
        
        
        
        name: 'P3',
        hp: 2,
        intro: P3_INTRO,
        post: P3_POST,
        arena: { x0: 174, x1: 224, y0: 28, y1: 60 },
        weakness: ['callback', 'stomp'],
        callbacks: ['collapseHit', 'heaveLaunch'],
        windowY: SILL + 1, 
        deed: DEED,
        attacks: [atk('Cadet Volley', 'hover', 0.8, 0.5, 0.8), atk('Crown Swoop', 'swoop', 1.0, 0.7, 1.0)],
      },
      {
        
        
        
        
        
        name: 'P4',
        hp: 1,
        box: 4,
        intro: 3,
        post: P4_POST,
        arena: { x0: 174, x1: SKY_END - 10, y0: 28, y1: 105 },
        weakness: ['callback'],
        callbacks: ['turret'],
        flee: { at: 270, speed: 12, to: FLEE_TO, lead: 16 },
        outro: true,
        attacks: [atk('Cadet Screen', 'hover', 1.0, 0.5, 0.8)],
      },
    ],
  });
  L.beaconAt(151, SILL, { phase: `${BOSS}:1`, boxes: 1 }); 
  climb(L);
  L.beaconAt(176, SILL, { phase: `${BOSS}:2`, boxes: 2 }); 
  arena(L);
  sky(L);

  const level = L.build();
  level.waypoints = ROUTE;
  level.planePlan = PLANE_PLAN;
  
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
  
  
  for (const y of WEST_BRACKETS) L.ledge(151, 159, y);
  for (const y of EAST_BRACKETS) L.ledge(164, 171, y);
  for (const y of [...WEST_BRACKETS, ...EAST_BRACKETS].sort((a, b) => a - b).slice(1)) L.putAt('seed', 161, y + 0.5);
  
  L.putAt('wasp', CROWN_POST.x, CROWN_POST.y - 1, {
    id: 'L20-crowncadet-1',
    wake: 999,
    wakeY: 999,
    crown: { boss: BOSS, phase: 1, every: 3, tel: 0.9, fromY: 60, toY: AWNING - 1 },
  });

  
  
  const line = (step, x0, x1, y) => L.putAt('cameo', (x0 + x1) / 2, y, { event: 'sillLine', step, zone: { x0, x1, y0: y - 2, y1: y + 1 } });
  line(3, 150.5, 160, 49.5); 
  line(4, 151, 159, 67); 

  
  
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
}





function arena(L) {
  
  
  L.wall(178, 179, SILL, BOWL + 1).wall(188, 189, SILL, BOWL + 1); 
  L.water(179, 188, BOWL);
  L.putAt('raft', RAFT_X, BOWL + 0.5, { mode: 'pad', w: 2.5 });
  for (const x of [180.5, 182.5, 184.5]) L.putAt('skiff', x, BOWL, { w: 1.5, skin: 'petal', dozing: true, anchored: true, ...CB('B12') });

  
  
  L.wall(189, BOX_E, SILL, BOX_TOP); 
  L.soil(BOX_E, BOX_E + 2, BOX_TOP - 1, BOX_TOP);
  for (const [x, y] of [
    [BOX_E + 0.5, BOX_TOP],
    [BOX_E + 1.5, BOX_TOP],
    [BOX_E + 0.5, BOX_TOP + 1],
    [BOX_E + 1.5, BOX_TOP + 1],
  ])
    L.putAt('clod', x, y, { foes: ['wasp'], ...CB('B13') });
  for (const [x, y] of [
    [BOX_E + 0.5, SILL + 0.5],
    [BOX_E + 1.5, SILL + 0.5],
    [BOX_E + 0.5, SILL + 2],
    [BOX_E + 1.5, SILL + 2],
  ])
    L.putAt('wasp', x, y, { wake: -1, ...CB('B13') }); 

  
  
  L.tower(TOWER_X, SILL + 1, 6, { id: 'PT', lean: -1, foot: [TOWER_X - 0.5, TOWER_X + 0.5, SILL, SILL + 1], ...CB('B14') });

  
  
  L.heaveAt(FLANK[0], FLANK[1], SILL, 1.5, FLANK_PHASE, { period: 1.5, taper: [1, 1], ...CB('B15') });
  L.putAt('intel', STAIR[0][0], STAIR[0][1] + BLOCK_U + 0.3, {
    id: DEED,
    alive: false,
    secret: 'deed',
    name: "Mandibella's royal decree",
    condition: { noDamageInPhase: 2 },
    signals: ['visual:gold-glint', 'audio:paper-flutter'],
    seenFrom: 'P3: she drops it at hit 2 if no heart was lost; it lands on the first ice stair',
  });

  
  
  
  L.wall(HULL_X, 226, SILL, HULL_TOP);
  L.cold(STAIR[5][0] - 0.75, STAIR[5][0] + 0.75, STAIR[5][1], STAIR[5][1] + BLOCK_U); 
  L.putAt('freezeButton', 212, SILL, {
    openAt: 207, 
    seconds: 2,
    zone: { x0: 211, x1: 219, y0: 37.5, y1: 42 },
    slots: STAIR,
    ...CB('B16'),
  });
  for (const [x, y] of [
    [212, 38.5],
    [213.5, 39.5],
    [215, 38.5],
    [216.5, 39.5],
    [218, 38.5],
    [214.25, 40.8],
  ])
    L.putAt('wasp', x, y, { wake: -1, ...CB('B16') });
  L.putAt('hatch', HULL_X + 2, HULL_TOP, { box: 3, name: "The ship's fuel hatch" });

  
  
  L.putAt('board', 222.5, HULL_TOP, { surf: true, needBoxes: 3, name: 'The ship' });
}









function sky(L) {
  L.wall(226, SKY_END, 0, 2); 
  
  
  L.beaconAt(262, 56, { phase: `${BOSS}:3`, mode: 'plane', boxes: 3 });
  
  L.putAt('moth', 258, 52, {
    tail: { wakeWhen: { x: 266 }, speed: 13, hold: 3 },
    path: MOTH_PATH,
    speed: 11,
    motif: 'callback',
    use: 'B18',
  });
  
  
  L.putAt('wasp', SPECIMEN.x, SPECIMEN.y, {
    asleep: true,
    hp: 9,
    wingman: true,
    specimen: true,
    name: 'The Crown Jewel Wasp',
    signals: ['visual:gold-glint', 'audio:glint-chime'],
    seenFrom: "the boarding pad (T3): it sparkles on the crown's top",
    ...CB('B18'),
  });
  
  L.beaconAt(560, 66, { phase: `${BOSS}:3`, mode: 'plane', boxes: 3 });
  
  for (const [x, y] of CADETS) L.putAt('wasp', x, y, { asleep: true, hp: 9, wingman: true, ...CB('B19') });
  
  L.putAt('finish', FLEE_TO.x - 20, FLEE_TO.y, {
    alive: false,
    bossGate: BOSS,
    delay: 3,
    flyPast: true,
    name: 'Home: the end of shift 20',
  });
}
