














































import { levelBuilder } from './dsl.js';

const BOSS = 'L16-boss-1';
const DEED = 'L16-intel-2';

export function buildL16() {
  const L = levelBuilder({
    id: 16,
    name: 'The Deep Burrow',
    pitCost: 'heart',
    height: 272,
    descent: true,
    dark: true,
    darkTint: 'umber',
  });
  
  const dirt = (x0, x1, y0, y1) => L.carve(x0, x1, y0, y1).soil(x0, x1, y0, y1);
  
  const line = (step, x0, x1, y0, y1) => L.putAt('cameo', (x0 + x1) / 2, y0, { event: 'burrowLine', step, zone: { x0, x1, y0, y1 } });

  L.wall(0, 110, 0, 272); 
  L.slick(0, 110, 0, 272); 

  
  L.carve(8, 16, 262, 270); 
  L.moonAt(8, 16); 
  L.carve(4, 34, 258, 262); 
  L.spawnAt(12, 258);
  const kit = [
    ['double', 'Thruster coil'],
    ['pound', 'Pound plates'],
    ['dash', 'Dash spring'],
    ['glide', 'Broad leaf'],
    ['wall', 'Wax grips'],
    ['tether', 'Paperclip hook'],
    ['lantern', 'Firefly Lantern'],
  ];
  for (const [i, [grant, name]] of kit.entries()) L.putAt('ability', 13 + 0.5 * i, 258, { grant, name });
  L.putAt('cameo', 31, 259, {
    name: 'spade claws and a tiara glint',
    event: 'burrowLine',
    step: 0,
    zone: { x0: 18, x1: 24, y0: 257, y1: 259 },
  });
  L.landmarkAt('The fallen rim', 12, 266, 'back');

  
  L.putAt('ability', 24, 258, { grant: 'drill', name: 'Screw-drill' });
  dirt(34, 40, 258, 262); 
  L.carve(40, 60, 258, 262); 
  L.lampAt(46, 261);
  L.landmarkAt('The Vast screw', 24, 261, 'mid');
  line(1, 28, 34, 257, 259);

  
  L.carve(56, 62, 258, 266); 
  L.carve(62, 78, 254, 268); 
  L.tower(61.5, 259, 6, { id: 'T1', lean: 1, foot: [61, 62, 258, 259], use: 'M1' });
  L.putAt('guard', 65, 254, { dozing: true, motif: 'collapse', use: 'M1' });
  L.putAt('guard', 66.6, 254, { dozing: true, motif: 'collapse', use: 'M1' });
  L.lampAt(70, 266);
  L.landmarkAt('The first tower', 61.5, 262, 'back');

  
  dirt(72, 74, 214, 254); 
  dirt(78, 80, 214, 254);
  L.carve(74, 78, 214, 254); 
  L.soil(74, 78, 242, 244).soil(74, 78, 230, 232).soil(74, 78, 218, 220); 
  dirt(78, 86, 226, 236); 
  L.carve(81, 85, 230, 233); 
  L.carve(78, 78.5, 231, 231.5); 
  L.putAt('nymph', 83, 230, {
    specimen: true,
    name: 'Singing Nymph',
    pocket: [80.5, 85.5, 230, 233],
    signals: ['visual:azure-funnel', 'audio:nymph-chirp'],
    seenFrom: 'plug 1 and the shaft fall, through the slit in the east wall',
  });
  L.beaconAt(76, 214); 
  L.lampAt(76, 224);
  L.landmarkAt('Root shaft', 76, 236, 'back');

  
  L.carve(20, 80, 214, 219); 
  L.tower(60.5, 215, 4, { id: 'T2a', lean: -1, foot: [60, 61, 214, 215], use: 'M2' });
  L.tower(57, 215, 4, { id: 'T2b', lean: -1, foot: [56.5, 57.5, 214, 215], use: 'M2' });
  for (const x of [52.75, 54.25, 55.75]) L.putAt('pillbug', x, 214, { wake: 4, wakeY: 2, motif: 'collapse', use: 'M2' });
  L.carve(20, 24, 194, 214); 
  L.lampAt(56, 218);
  L.landmarkAt('Pillbug gallery', 50, 216, 'back');

  
  L.carve(14, 28, 190, 194); 
  dirt(28, 62, 186, 198); 
  L.wall(40, 46, 187.5, 198); 
  L.carve(46, 62, 190, 194); 
  L.carve(62, 74, 190, 194); 
  L.lampAt(64, 193);
  L.beaconAt(66, 190); 
  L.landmarkAt('The clay heart', 36, 192, 'back');
  line(2, 36, 40, 189, 191);

  
  L.carve(74, 106, 182, 196); 
  L.wall(74, 78, 182, 188).wall(78, 82, 182, 186).wall(82, 86, 182, 184); 
  L.tower(77.5, 189, 5, { id: 'T3a', lean: 1, foot: [77, 78, 188, 189], use: 'M3' });
  L.tower(80, 187, 5, { id: 'T3b', lean: 1, foot: [79.5, 80.5, 186, 187], use: 'M3' });
  L.tower(84, 185, 6, { id: 'T3c', lean: 1, foot: [83.5, 84.5, 184, 185], use: 'M3' });
  L.putAt('guard', 86.5, 182, { dozing: true, wakeWhen: { x: 86, dir: 1 }, motif: 'collapse', use: 'M3' });
  L.putAt('pillbug', 88, 182, { dozing: true, motif: 'collapse', use: 'M3' });
  L.putAt('guard', 89.5, 182, { dozing: true, wakeWhen: { x: 86, dir: 1 }, motif: 'collapse', use: 'M3' });
  L.carve(102, 106, 146, 182); 
  L.lampAt(80, 192).lampAt(95, 186);
  L.landmarkAt('The stone stair', 80, 190, 'back');

  
  L.carve(56, 108, 132, 160); 
  L.wall(90, 108, 132, 146).wall(78, 90, 132, 143).wall(66, 78, 132, 140).wall(56, 66, 132, 138); 
  dirt(56, 64, 142, 148); 
  L.carve(59, 61, 143, 145); 
  L.putAt('intel', 60, 143, {
    secret: 'cache',
    name: "A Vast kid's time capsule",
    signals: ['visual:gold-glint', 'audio:music-box'],
    seenFrom: "the horn's high end, 40 u east",
  });
  L.lampAt(100, 156).lampAt(84, 154).lampAt(70, 150);
  L.beaconAt(64, 138); 
  L.landmarkAt('The singing horn', 82, 150, 'back');

  
  dirt(58, 62, 117, 138); 
  L.carve(24, 62, 112, 117); 
  dirt(28, 62, 104, 112); 
  L.putAt('guard', 36, 112, { patrol: [34, 50] });
  L.putAt('guard', 48, 112, { patrol: [34, 50] });
  L.carve(24, 28, 84, 112); 
  L.lampAt(30, 116);
  L.landmarkAt('The barracks', 42, 115, 'back');
  line(3, 57, 63, 137, 139);

  
  L.carve(24, 70, 84, 88); 
  dirt(28, 70, 88, 90); 
  L.putAt('guard', 62, 84, { dozing: true, facing: -1, wakeWhen: { x: 40, dir: 1 } });
  dirt(66, 70, 64, 84); 
  L.carve(30, 76, 60, 64); 
  dirt(30, 76, 64, 66); 
  L.putAt('guard', 36, 60, { dozing: true, facing: 1, wakeWhen: { x: 58, dir: -1 } });
  L.putAt('guard', 74, 60, { dozing: true, facing: -1, wakeWhen: { x: 44, dir: -1 } });
  dirt(30, 34, 44, 60); 
  L.carve(26, 40, 40, 44); 
  L.beaconAt(34, 40); 
  L.lampAt(46, 87).lampAt(52, 63).lampAt(34, 43);
  L.landmarkAt('Guard tunnels', 48, 86, 'back');
  line(4, 38, 42, 83, 85);

  
  L.carve(32, 36, 28, 40); 
  L.carve(30, 66, 6, 28); 
  dirt(30, 36, 6, 12); 
  dirt(62, 66, 6, 14); 
  dirt(36, 60, 3, 6); 
  L.carve(46, 50, 28, 34); 
  L.lampAt(48, 10, { r: 9 }); 
  L.lampAt(33, 14).lampAt(64, 16);
  L.beaconAt(34, 12, { phase: `${BOSS}:1` });
  L.beaconAt(64, 14, { phase: `${BOSS}:2` });
  L.landmarkAt("Trowel's den", 48, 16, 'back');
  
  L.tower(43, 7, 6, { id: 'TW', lean: -1, foot: [42.5, 43.5, 6, 7], refill: 3, use: 'M4' });
  L.tower(53, 7, 6, { id: 'TE', lean: 1, foot: [52.5, 53.5, 6, 7], refill: 3, use: 'M4' });
  L.tower(64, 15, 4, { id: 'T5a', lean: -1, foot: [63.5, 64.5, 14, 15], refill: 3, use: 'M5', hidden: true });
  L.tower(61, 12, 5, { id: 'T5b', lean: -1, foot: [60.5, 61.5, 11, 12], refill: 3, use: 'M5', hidden: true });
  L.tower(57, 9, 5, { id: 'T5c', lean: -1, foot: [56.5, 57.5, 8, 9], refill: 3, use: 'M5', hidden: true });
  L.tower(53, 7, 6, { id: 'T5d', lean: -1, foot: [52.5, 53.5, 6, 7], refill: 3, use: 'M5', hidden: true });
  L.putAt('intel', 64, 14, {
    id: DEED,
    alive: false,
    secret: 'deed',
    name: "The Duchess's monogrammed riding gloves",
    condition: { noDamageInPhase: 2 },
    signals: ['visual:gold-glint', 'audio:glint-chime'],
    seenFrom: "the den: they arc onto the east shelf on the Underground Ambush's last hit",
  });
  const respawnW = { x: 34, y: 12 };
  const respawnE = { x: 64, y: 14 };
  L.putAt('boss', 48, 6, {
    id: BOSS,
    type: 'duchessMounted',
    name: 'Duchess Mandibella (and Trowel)',
    w: 5,
    h: 4.5,
    arena: { x0: 30, x1: 66, y0: 6, y1: 28 },
    respawn: respawnW,
    escape: true,
    faces: { west: 36, east: 62 },
    floorSoil: { x0: 36, x1: 60, y0: 3, y1: 6, lane: [3, 4.5] },
    heap: [
      [54, 58, 6, 8],
      [58, 62, 6, 11],
    ],
    heapFace: 54,
    hole: { x: 48 },
    hitstopS: 0.12,
    contactDamage: 1,
    phases: [
      {
        name: 'Grand Re-entrance',
        hp: 2,
        use: 'M4',
        motif: 'collapse',
        towers: ['TW', 'TE'],
        intro: 2.5,
        spawn: respawnW,
        weakness: ['collapse', 'stomp', 'pound'],
        attacks: [
          { name: 'spadeRush', telegraph: 0.8, active: 2.0, recover: 3.0 },
          { name: 'glitterFan', telegraph: 0.7, active: 0.6, recover: 0.8 },
        ],
      },
      {
        name: 'Underground Ambush',
        hp: 3,
        deed: DEED,
        intro: 1.5,
        spawn: respawnW,
        weakness: ['stomp', 'pound'],
        attacks: [
          { name: 'tunnelRun', telegraph: 1.0, active: 12, recover: 2.5 },
          { name: 'glitterFan', telegraph: 0.7, active: 0.6, recover: 0.8 },
        ],
      },
      {
        name: 'The Spoil Heap',
        hp: 1,
        use: 'M5',
        motif: 'collapse',
        towers: ['T5a', 'T5b', 'T5c', 'T5d'],
        intro: 1.5,
        spawn: respawnE,
        weakness: ['collapse', 'stomp', 'pound'],
        attacks: [{ name: 'grandRush', telegraph: 0.8, active: 30, recover: 3.0 }],
      },
    ],
  });

  
  L.putAt('finish', 48, 7, { axis: 'y', alive: false, bossGate: BOSS, delay: 1.5, name: "The ship's power cell" });

  const level = L.build();
  level.waypoints = ROUTE;
  
  level.towerChains = [
    ['T2a', 'T2b'],
    ['T3a', 'T3b', 'T3c'],
    ['T5a', 'T5b', 'T5c', 'T5d'],
  ];
  
  level.drillSeals = [
    { name: 'the plug (B1)', from: { x: 30, y: 258 }, goal: { x0: 40.5, x1: 60, y0: 258, y1: 262 } },
    { name: 'the sill (B5)', from: { x: 22, y: 190 }, goal: { x0: 46.5, x1: 62, y0: 190, y1: 194 } },
    { name: "the specimen's pocket (B3)", from: { x: 76, y: 232 }, goal: { x0: 80.5, x1: 85.5, y0: 230, y1: 233 } },
  ];
  return level;
}


const ROUTE = [
  { x: 24, y: 258, move: 'walk' }, 
  { x: 34, y: 258, move: 'walk' },
  { x: 40.5, y: 258, move: 'drill', via: { dir: 'right' } }, 
  { x: 60.5, y: 258, move: 'walk' },
  { x: 61.75, y: 258, move: 'drill', via: { dir: 'right' }, tol: 0.15 }, 
  { x: 72.5, y: 254, move: 'walk', via: { hop: true } },
  { x: 76, y: 214, move: 'dig' }, 
  { x: 61.5, y: 214, move: 'walk' },
  { x: 60.2, y: 214, move: 'drill', via: { dir: 'left' }, tol: 0.15 }, 
  { x: 60.25, y: 214, move: 'walk', via: { after: 'collapse:T2b' } },
  { x: 22, y: 190, move: 'walk', via: { hop: true } }, 
  { x: 39.5, y: 190, move: 'drill', via: { dir: 'right', refuse: true } }, 
  { x: 39.75, y: 186, move: 'dig' },
  { x: 47, y: 186, move: 'drill', via: { dir: 'right' } }, 
  { x: 49, y: 190, move: 'breach' }, 
  { x: 66, y: 190, move: 'walk' }, 
  { x: 75.5, y: 188, move: 'drop' },
  { x: 77.8, y: 188, move: 'drill', via: { dir: 'right' }, tol: 0.15 }, 
  { x: 92, y: 182, move: 'walk', via: { after: 'collapse:T3c', hop: true } }, 
  { x: 104, y: 146, move: 'walk' }, 
  { x: 64, y: 138, move: 'walk' }, 
  { x: 60, y: 138, move: 'walk' },
  { x: 60, y: 108, move: 'dig' }, 
  { x: 26, y: 84, move: 'drill', via: { dir: 'left' } }, 
  { x: 41, y: 84, move: 'walk' }, 
  { x: 41, y: 84, move: 'drill', via: { dir: 'up', dodge: true } }, 
  { x: 68, y: 84, move: 'walk' },
  { x: 68, y: 60, move: 'dig' }, 
  { x: 55, y: 60, move: 'walk' }, 
  { x: 55, y: 60, move: 'drill', via: { dir: 'up', dodge: true } }, 
  { x: 32, y: 60, move: 'walk' },
  { x: 32, y: 40, move: 'dig' }, 
  { x: 34, y: 12, move: 'drop' }, 
  { x: 48, y: 7, move: 'boss' }, 
];
