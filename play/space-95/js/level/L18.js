




















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

const SIG = (a, b) => [a, b];


const ROUTE = [
  { x: 29.5, y: 48, move: 'walk' }, 
  { x: 50, y: 30, move: 'drop' }, 
  { x: 60.25, y: 31.5, move: 'jump' }, 
  { x: 78.75, y: 31.5, move: 'jump' }, 
  { x: 80.25, y: 33, move: 'jump' },
  { x: 85, y: 35.5, move: 'jump' }, 
  { x: 90, y: 40, move: 'jump', via: { double: true } }, 
  { x: 108, y: 43, move: 'jump' }, 
  { x: 117, y: 40, move: 'drop', at: 116, via: { waitMax: 2.5 } }, 
  { x: 120.5, y: 41.5, move: 'jump' }, 
  { x: 133, y: 46, move: 'jump', via: { double: true } }, 
  { x: 145, y: 46, move: 'walk' }, 
  { x: 155, y: 46, move: 'jump', via: { waitMax: 2, double: true } }, 
  { x: 166, y: 40, move: 'drop' },
  { x: 196, y: 40, move: 'glide', at: 172 }, 
  { x: 199, y: 44, move: 'jump', via: { double: true } }, 
  { x: 220, y: 56, move: 'updraft', at: 202, via: { x: 203, y: 58 }, waitMax: 5, maxS: 14 }, 
  { x: 302, y: 40, move: 'drop', via: { waitMax: 7 }, maxS: 20 }, 
  { x: 308, y: 44, move: 'jump', via: { double: true } }, 
  { x: 317, y: 48, move: 'jump', via: { double: true } }, 
  { x: 327, y: 40, move: 'walk' }, 
  { x: 339, y: 40, move: 'walk', tol: 0.15 }, 
  { x: 341, y: 41.5, move: 'jump', via: { until: 'frozen:M3>=3' }, maxS: 12 }, 
  { x: 350, y: 46, move: 'jump', via: { double: true } }, 
  { x: 388, y: 46, move: 'walk' }, 
  { x: 409.5, y: 46, move: 'walk' }, 
  { x: 415.25, y: 49, move: 'jump', via: { double: true } }, 
  { x: 414.75, y: 49, move: 'walk', tol: 0.1 }, 
  { x: 409, y: 53.5, move: 'jump', at: 414.75, via: { double: true } }, 
  { x: 336, y: 53.5, move: 'walk', maxS: 14 }, 
  { x: 335, y: 57.75, move: 'jump', via: { double: true } }, 
  { x: 350, y: 62.5, move: 'jump', at: 337.6, via: { double: true } }, 
  { x: 419, y: 66, move: 'jump', via: { double: true, hopFoes: 'any' }, maxS: 14 }, 
  { x: 412, y: 69.5, move: 'jump', at: 418, via: { double: true } }, 
  { x: 335, y: 73, move: 'jump', via: { double: true }, maxS: 14 }, 
  { x: 348, y: 76.5, move: 'jump', at: 337.6, via: { double: true } }, 
  { x: 395, y: 76.5, move: 'pound', via: { done: 'fastFreeze' }, maxS: 12 }, 
  { x: 412.75, y: 78, move: 'jump' }, 
  { x: 414.25, y: 79.5, move: 'jump' },
  { x: 415.75, y: 81, move: 'jump' },
  { x: 422, y: 84.5, move: 'jump', at: 415.9, via: { double: true } }, 
];

export function buildL18() {
  const L = levelBuilder({ id: 18, name: 'Kitchen of the Vast', pitCost: 'heart', height: 112 });
  
  const line = (step, x0, x1, y0, y1) => L.putAt('cameo', (x0 + x1) / 2, y0, { event: 'kitchenLine', step, zone: { x0, x1, y0, y1 } });

  L.wall(0, 330, 0, 40); 
  L.wall(0, 1, 40, 112); 

  
  L.wall(0, 30, 40, 48);
  L.spawnAt(4, 48);
  for (const [i, [grant, name]] of KIT.entries()) L.putAt('ability', 5 + 0.5 * i, 48, { grant, name });
  L.landmarkAt('The window', 10, 58, 'back');
  L.landmarkAt('The iced glass', 24, 52, 'mid');
  L.landmarkAt('The fridge', 381, 70, 'back');
  line(0, 2, 12, 47, 49);

  
  L.carve(30, 88, 30, 40);
  L.slick(28, 90, 28, 48); 
  L.cold(44, 88, 30, 35, { source: 'glass' });
  L.putAt('weevil', 60, 30, { patrol: [52, 70], wake: 40, wakeY: 20, motif: 'chill', use: 'M1' });
  L.putAt('weevil', 78.75, 30, { frozen: true, motif: 'chill', use: 'M1' });
  L.putAt('weevil', 80.25, 30, { frozen: true, motif: 'chill', use: 'M1' });
  L.putAt('weevil', 80.25, 31.5, { frozen: true, motif: 'chill', use: 'M1' });
  L.ledge(82, 88, 35.5); 
  L.putAt('hook', 82, 38.5, { name: 'the cold tap' }); 
  L.carve(40, 42, 27, 30).soil(40, 42, 29.5, 30); 
  L.putAt('intel', 41, 27, {
    secret: 'cache',
    name: 'A bottle cap with alien DNA',
    signals: SIG('visual:gold-glint', 'audio:drip-echo'),
    seenFrom: 'the sill, looking down into the sink',
  });
  L.landmarkAt('The sink', 60, 36, 'mid');
  line(1, 44, 70, 29, 31);

  
  L.wall(104, 112, 40, 43); 
  L.cold(96, 122, 40, 45, { source: 'peas' });
  L.putAt('weevil', 127, 40, { patrol: [124, 129], charge: true, motif: 'chill', use: 'M2' });
  L.wall(130, 146, 40, 46); 
  L.putAt('weevil', 138, 46, {
    specimen: true,
    name: 'Sugar Weevil',
    signals: SIG('visual:azure-sparkle', 'audio:sugar-crunch'),
    seenFrom: 'the counter by the frozen peas',
  });
  L.beaconAt(144, 46); 
  L.landmarkAt('The bread bin', 138, 50, 'mid');
  line(2, 96, 104, 39, 41);

  
  L.wall(152, 164, 40, 46);
  L.hob(152, 164, 46, { period: 4, on: 2, at: 0, skin: 'toaster' });
  L.heat(152, 164, 46, 50, { source: 'toaster' });
  for (const x of [174, 181, 188]) L.putAt('hook', x, 48, { name: 'a hanging spoon' }); 
  
  
  L.carve(174, 188, 32, 40);
  L.putAt('weevil', 180, 32, { patrol: [176, 186] }); 
  L.wall(198, 208, 40, 44); 
  L.updraft(200, 206, 44, 64, { pulse: { on: 3, off: 2 } });
  L.heat(200, 206, 44, 64, { source: 'kettle', pulse: { on: 3, off: 2 } });
  L.wall(214, 226, 40, 56); 
  L.beaconAt(222, 56); 
  L.landmarkAt('The toaster', 158, 50, 'mid');
  L.landmarkAt('The kettle', 203, 52, 'mid');
  line(3, 146, 152, 45, 47);

  
  for (const [i, x0] of [230, 244, 258, 272, 286].entries()) L.hob(x0, x0 + 12, 40, { period: 7, on: 2, at: i, ring: i + 1 });
  for (const x of [236, 250, 264, 278, 292]) L.putAt('hook', x, 50, { name: 'the hood rail' });
  L.putAt('intel', 301, 40.25, {
    secret: 'deed',
    alive: false,
    condition: { from: 230, to: 300, under: 14 },
    name: "The Vast's egg timer",
    signals: SIG('visual:gold-glint', 'audio:timer-tick'),
    seenFrom: 'the hob, ticking at its far end',
  });
  
  L.wall(304, 312, 40, 44); 
  L.wall(314, 320, 40, 48); 
  L.beaconAt(326, 40); 
  L.landmarkAt('The hob', 257, 44, 'mid');
  line(4, 226, 230, 39, 41);

  
  
  
  L.wall(430, 434, 0, 112); 
  L.wall(330, 434, 0, 40); 
  L.wall(332, 430, 104, 106); 
  L.wall(346, 430, 40, 46); 
  L.cold(332, 346, 40, 49, { source: 'fridge' });
  L.putAt('wasp', 338, 51, { skin: 'fizzfly', wake: 4, wakeY: 20, motif: 'chill', use: 'M3' });
  L.putAt('wasp', 342, 51.5, { skin: 'fizzfly', wake: 4, wakeY: 20, motif: 'chill', use: 'M3' });
  L.putAt('wasp', 336, 52, { skin: 'fizzfly', wake: 4, wakeY: 20, motif: 'chill', use: 'M3' });
  L.putAt('hook', 333, 51, { name: 'a Galaxa Z Zoo magnet' });
  L.putAt('hook', 416, 55, { name: 'a pizza-shop magnet' }); 
  
  
  for (const x of [395, 397.5, 400, 402.5])
    L.putAt('weevil', x, 46, { march: 1, dozing: true, wakeWhen: { x: 330, dir: 1, dy: 10 }, motif: 'chill', use: 'M4' }); 
  L.cold(416, 430, 46, 52, { source: 'freezer' });
  L.wall(332, 411.5, 53, 53.5); 
  L.beaconAt(352, 53.5, { climb: true }); 
  L.ledge(332, 338, 57.75); 
  
  
  L.wall(346, 430, 62, 62.5); 
  L.putAt('weevil', 380, 62.5, { patrol: [360, 405] }); 
  L.wall(417, 421, 62.5, 66); 
  L.wall(332, 416, 69, 69.5); 
  L.ledge(332, 338, 73); 
  L.landmarkAt('The fridge light', 381, 60, 'mid');
  line(5, 330, 336, 39, 41);

  
  L.wall(346, 430, 76, 76.5); 
  L.beaconAt(352, 76.5, { climb: true }); 
  L.cold(332, 430, 76.5, 83.5, { source: 'freezer' });
  L.putAt('freezeButton', 395, 76.5, {
    zone: { x0: 332, x1: 430, y0: 76.5, y1: 104 },
    slots: [
      [412.75, 76.5],
      [414.25, 76.5],
      [414.25, 78],
      [415.75, 76.5],
      [415.75, 78],
      [415.75, 79.5],
    ],
  });
  for (const [x, y] of [
    [408, 92],
    [412, 95],
    [416, 92],
    [420, 95],
    [424, 92],
    [410, 98],
  ])
    L.putAt('wasp', x, y, { skin: 'fizzfly', wake: 10, wakeY: 22, motif: 'chill', use: 'M5' }); 
  L.wall(418, 430, 84, 84.5); 
  L.putAt('finish', 424, 84.5, { alive: false, gate: 'freezer', axis: 'y', name: 'The freezer drawer' });
  line(6, 346, 352, 75.5, 77.5);

  const level = L.build();
  level.waypoints = ROUTE;
  return level;
}
