























import { levelBuilder } from './dsl.js';

const SEA = 2; 
const DECK = 2.5; 
const ripple = (use, props = {}) => ({ motif: 'ripple', use, ...props });

export function buildL09() {
  const L = levelBuilder({ id: 9, name: 'Puddle Sea', pitCost: 'none', height: 32 });

  
  L.putAt('ability', 3.4, 4, { grant: 'double', name: 'Thruster coil' });
  L.putAt('ability', 3.8, 4, { grant: 'pound', name: 'Pound plates' });
  L.putAt('ability', 4.2, 4, { grant: 'dash', name: 'Dash spring' });
  L.putAt('ability', 4.6, 4, { grant: 'glide', name: 'Broad leaf' });
  L.putAt('ability', 5.0, 4, { grant: 'wall', name: 'Wax grips' });

  
  L.spawnAt(3, 4).wall(0, 20, 0, 4).landmarkAt('Flooded camp', 9, 4);
  const cameo = (step, x) => L.putAt('cameo', x, 0, { event: 'dishCameo', step, zone: { x0: x, x1: 2000, y0: -10, y1: 100 } });
  cameo(0, 0);

  
  L.water(20, 46, SEA);
  L.putAt('raft', 23, DECK, { mode: 'ferry', w: 4, to: 43, speed: 4, wait: 1.0, startOnBoard: true });
  L.putAt('skiff', 31, SEA, ripple('M1', { dozing: true, anchored: true }));

  
  L.wall(46, 70, 0, 3.5);
  L.putAt('snailknight', 60, 3.5, { facing: -1 });
  L.beaconAt(66, 3.5);

  
  L.water(70, 152, SEA);
  L.putAt('raft', 72, DECK, { mode: 'lane', w: 4, to: 150, speed: 5, every: 3.2, trigger: 64 });
  L.wall(95, 95.5, 3, 3.5).wall(125, 125.5, 3, 3.5);
  L.putAt('skiff', 146, SEA, ripple('M2', { wakeWhen: { x: 112, dir: 1 } }));
  L.putAt('skiff', 151, SEA, ripple('M2', { wakeWhen: { x: 112, dir: 1 } }));

  
  L.wall(152, 178, 0, 4).ledge(174, 178, 6.5).wall(178, 238, 0, 9);
  L.carve(222, 237.5, 4.5, 8).carve(237.5, 238, 4.5, 6.5);
  L.putAt('intel', 225, 4.5, {
    secret: 'cache',
    name: 'A Vast crayon stub',
    signals: ['visual:amber-glint', 'audio:hollow-knock'],
    seenFrom: 'the Paper Boat deck above the hold (x 222-237.5, y 9)',
  });
  L.landmarkAt('Paper Boat', 205, 9);
  cameo(1, 200);
  L.beaconAt(232, 9);

  
  L.water(238, 304, SEA);
  L.putAt('raft', 241.25, DECK, { mode: 'pad', w: 2.5 });
  for (const x of [246.25, 251.25, 256.75, 262.25, 267.25, 272.75, 278.25, 283.25, 288.75, 294.25, 299.25])
    L.putAt('raft', x, DECK, { mode: 'pad', w: 2.5, sinks: { after: 1.2, back: 2.5 } });
  L.putAt('strider', 300, SEA, ripple('M3', { wakeWhen: { x: 250, dir: 1 } }));
  L.putAt('strider', 302, SEA, ripple('M3', { wakeWhen: { x: 262, dir: 1 } }));
  L.putAt('strider', 303, SEA, ripple('M3', { wakeWhen: { x: 276, dir: 1 } }));

  
  L.wall(304, 318, 0, 3.5).water(318, 326, SEA);
  L.putAt('raft', 320.75, DECK, { mode: 'pad', w: 2.5 });
  L.putAt('skiff', 323.5, SEA, { big: true, empty: true, anchored: true, toy: true, w: 2.5 });
  L.wall(326, 332, 0, 3.5).landmarkAt('Root arch', 318, 3.5);

  
  L.ledge(334, 338, 6).ledge(341.5, 345.5, 7.5).ledge(349.5, 353.5, 6).ledge(357, 361, 7.5).ledge(364.5, 368.5, 6);
  L.water(332, 371, SEA);
  L.putAt('raft', 335, DECK, { mode: 'ferry', w: 4, to: 347, speed: 4, wait: 0.6 });
  L.wall(350, 353, 0, 3.5);
  L.putAt('raft', 358, DECK, { mode: 'ferry', w: 4, to: 368, speed: 4, wait: 0.6, startOnBoard: true });
  L.wall(371, 384, 0, 3.5).beaconAt(377, 3.5);

  
  L.ledge(378, 383, 7.5).wall(384, 410, 10.5, 11).water(384, 410, SEA);
  for (const x of [391.25, 398.25, 405.75]) L.putAt('raft', x, DECK, { mode: 'pad', w: 2.5 });
  L.wall(410, 410.5, 0, 3.5);
  L.putAt('strider', 395, SEA, {
    specimen: true,
    commodore: true,
    name: 'Commodore Skimmer',
    signals: ['visual:petal-hat-glint', 'audio:shanty-whistle'],
    seenFrom: 'the reed blade above the cove (x 386-408, y 11)',
    signalRange: 12,
  });
  L.putAt('dew', 400.75, 11);
  L.putAt('raft', 394.25, 15.5, { mode: 'pad', w: 3.5, floats: false, sinks: { after: 0.6, back: 2.5 } });
  L.ledge(386, 390, 17);
  L.putAt('intel', 388, 17, {
    secret: 'deed',
    name: "A giant's lost button",
    signals: ['visual:gold-glint', 'audio:glint-chime'],
    seenFrom: 'the reed blade (x 384-392, y 11): a leaf 6 u above',
    signalRange: 9,
  });
  L.landmarkAt('Reed', 395, 11);

  
  L.water(410.5, 480, SEA);
  L.putAt('raft', 414, DECK, { mode: 'lane', w: 6, to: 476, speed: 6, startOnBoard: true });
  for (const x of [422, 427, 432, 437]) L.putAt('skiff', x, SEA, ripple('M4', { anchored: true }));
  cameo(2, 440);

  
  L.wall(480, 524, 0, 4).landmarkAt('Lily Harbour', 500, 4).beaconAt(521, 4);

  
  L.water(524, 734, SEA);
  L.putAt('raft', 527.5, DECK, { mode: 'motor', w: 6, to: 730, cruise: 7, chase: 11, leash: 12 });
  L.wall(548, 548.5, 3, 3.5).wall(566, 580, 5, 5.5).wall(573, 573.5, 3, 3.5);
  L.wall(598, 606, 3, 3.5);
  L.putAt('snailknight', 603, 3.5, { facing: -1 });
  L.wall(628, 628.5, 3, 3.5).wall(640, 640.5, 3, 3.5);
  L.cameraHint(524, 664, { ahead: 3 });

  
  L.ledge(666, 670, 6.5).ledge(673, 677, 10).wall(679, 690, 12, 12.5).wall(690.5, 692, 5, 16);
  L.landmarkAt('Tallest apple tree', 700, 12.5);
  L.putAt('skiff', 698, SEA, ripple('M5', { anchored: true }));
  L.putAt('skiff', 705, SEA, ripple('M5', { big: true, galleon: true, w: 6, ramWithin: 12 }));
  for (const x of [712, 717, 722]) L.putAt('skiff', x, SEA, ripple('M5', { anchored: true }));

  
  L.wall(734, 790, 0, 4);
  cameo(3, 750);
  L.putAt('finish', 762, 4, { name: 'Root flare' });

  const level = L.build();
  level.waypoints = ROUTE;
  return level;
}


const ROUTE = [
  { x: 20, y: 4, move: 'walk' }, 
  { x: 22.5, y: DECK, move: 'raft', via: { dx: 1.5, until: 37.5 }, maxS: 10 }, 
  { x: 47, y: 3.5, move: 'jump', at: 41 }, 
  { x: 58, y: 3.5, move: 'walk' },
  { x: 62.5, y: 3.5, move: 'jump' }, 
  { x: 72, y: DECK, move: 'raft', via: { dx: 1.5, until: 146 }, waitMax: 3, maxS: 22 }, 
  { x: 153, y: 4, move: 'jump', at: 148 }, 
  { x: 176, y: 6.5, move: 'jump' },
  { x: 181, y: 9, move: 'jump' }, 
  { x: 237, y: 9, move: 'walk' }, 
  { x: 241.25, y: DECK, move: 'walk' }, 
  ...[246.25, 251.25, 256.75, 262.25, 267.25, 272.75, 278.25, 283.25, 288.75, 294.25, 299.25].map((x) => ({ x, y: DECK, move: 'jump' })), 
  { x: 305, y: 3.5, move: 'jump' }, 
  { x: 320.75, y: DECK, move: 'jump' }, 
  { x: 327, y: 3.5, move: 'jump' }, 
  { x: 336, y: 6, move: 'jump' },
  { x: 343.5, y: 7.5, move: 'jump', at: 337.5 }, 
  { x: 351.5, y: 6, move: 'jump', at: 345 },
  { x: 359, y: 7.5, move: 'jump', at: 353 },
  { x: 366.5, y: 6, move: 'jump', at: 360.5 },
  { x: 372, y: 3.5, move: 'jump' }, 
  { x: 380, y: 7.5, move: 'glide', at: 376 }, 
  { x: 386, y: 11, move: 'glide', at: 381 }, 
  { x: 409.5, y: 11, move: 'walk' },
  { x: 413, y: DECK, move: 'raft', via: { dx: 2, until: 471 }, maxS: 14 }, 
  { x: 481, y: 4, move: 'jump', at: 474 }, 
  { x: 525, y: DECK, move: 'raft', via: { dx: 1, until: 596, tap: [573] }, maxS: 16 }, 
  { x: 600, y: 3.5, move: 'jump' }, 
  { x: 605.5, y: 3.5, move: 'jump' }, 
  { x: 608, y: DECK, move: 'raft', via: { dx: 1, until: 664 }, maxS: 12 }, 
  { x: 668, y: 6.5, move: 'glide', at: 663 },
  { x: 675, y: 10, move: 'glide', at: 669.5 },
  { x: 681, y: 12.5, move: 'jump' }, 
  { x: 690, y: 12.5, move: 'walk' },
  { x: 690.25, y: DECK, move: 'pound' }, 
  { x: 690.25, y: DECK, move: 'raft', via: { dx: 3, until: 724 }, maxS: 10 },
  { x: 735, y: 4, move: 'jump', at: 727 }, 
  { x: 762, y: 4, move: 'walk' }, 
];
