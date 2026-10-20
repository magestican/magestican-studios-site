





















































import { levelBuilder } from './dsl.js';

export function buildL17() {
  const L = levelBuilder({ id: 17, name: 'Dragonfly Dogfight', mode: 'plane', camDist: 28, pitCost: 'heart', height: 80 });
  L.wall(0, 930, 0, 2); 

  
  L.spawnAt(8, 2);
  const kit = [
    ['double', 'Thruster coil'],
    ['pound', 'Pound plates'],
    ['dash', 'Dash spring'],
    ['glide', 'Broad leaf'],
    ['wall', 'Wax grips'],
    ['tether', 'Paperclip hook'],
    ['lantern', 'Firefly Lantern'],
    ['drill', 'Screw-drill'],
  ];
  for (const [i, [grant, name]] of kit.entries()) L.putAt('ability', 8 + 0.15 * i, 2, { grant, name });
  L.putAt('cameo', 12, 2, { name: 'the patched ship-plane' }); 
  L.landmarkAt('The wreck', 8, 4, 'mid');

  
  L.landmarkAt('T1 trunk', 35, 8, 'mid'); 
  L.wall(26, 48, 14, 22); 
  L.wall(76, 78, 2, 22); 
  L.wall(70, 92, 22, 30); 
  L.landmarkAt('Purple trunks', 60, 18, 'back');

  
  L.wall(92, 134, 20, 31); 
  L.wall(98, 134, 36, 40); 
  L.wall(98, 134, 40, 80); 
  for (const x of [108, 111, 114]) L.putAt('wasp', x, 34, { asleep: true, hang: true, motif: 'wingman', use: 'M1' });
  L.putAt('cameo', 96, 33, { event: 'skyLine', step: 0, zone: { x0: 94, x1: 100, y0: 0, y1: 80 } });
  L.landmarkAt('The canopy gap', 115, 38, 'mid');

  
  L.putAt('moth', 136, 42, {
    tail: { wakeWhen: { x: 140 }, speed: 13, hold: 3 },
    path: [
      [150, 40],
      [200, 42],
      [240, 44],
    ],
    speed: 11,
    motif: 'callback',
  });
  L.beaconAt(200, 42); 

  
  L.wall(214, 215, 2, 34);
  L.wall(234, 235, 2, 38);
  L.wall(254, 255, 2, 36); 
  L.fluff(209, 220, 34, 46, { drift: [0.6, 0.3] });
  L.fluff(229, 240, 38, 50, { drift: [0.6, 0.3] });
  L.fluff(249, 260, 36, 48, { drift: [0.6, 0.3] });
  L.putAt('cameo', 205, 42, { event: 'skyLine', step: 1, zone: { x0: 203, x1: 208, y0: 0, y1: 80 } });
  L.wall(280, 306, 2, 36); 
  L.putAt('ace', 310, 37, {
    perch: true,
    wakeWhen: { x: 262 },
    headOn: { y: 40.5, from: 318, to: 200 },
    chase: true,
    motif: 'wingman',
    use: 'M2',
  });
  L.putAt('ace', 313, 37, {
    perch: true,
    wakeWhen: { x: 262 },
    headOn: { y: 43.5, from: 318, to: 200 },
    chase: true,
    motif: 'wingman',
    use: 'M2',
  });
  L.putAt('cameo', 262, 42, { event: 'skyLine', step: 2, zone: { x0: 262, x1: 267, y0: 0, y1: 80 } });
  L.landmarkAt('Dandelion meadow', 235, 40, 'mid');
  L.landmarkAt('The hedge', 293, 30, 'mid');

  
  L.wall(352, 360, 2, 14); 
  L.putAt('ace', 356, 14.5, { perch: true, wakeWhen: { x: 362 }, chase: true, motif: 'wingman', use: 'M3' });
  L.putAt('cameo', 362, 22, { event: 'skyLine', step: 3, zone: { x0: 362, x1: 367, y0: 0, y1: 80 } });
  L.wall(405, 407, 2, 6); 
  L.updraft(398, 414, 6, 44, { lift: 5, pulse: { on: 2, off: 1 } }); 
  L.putAt('ace', 406, 6.5, { perch: true, wakeWhen: { x: 384 }, approach: 'high', chase: true, motif: 'wingman', use: 'M3' });
  L.beaconAt(460, 42); 
  L.landmarkAt('The gnome', 356, 10, 'mid');
  L.landmarkAt('The sprinkler', 406, 20, 'mid');

  
  L.landmarkAt('Washing pole', 469, 26, 'mid'); 
  L.landmarkAt('Washing pole', 553, 26, 'mid');
  L.wall(470, 552, 51.5, 52); 
  L.soft(476, 484, 38, 51.5, { skin: 'cloth' });
  L.soft(490, 498, 40, 51.5, { skin: 'cloth' });
  L.soft(504, 514, 36, 51.5, { skin: 'cloth', double: true });
  L.soft(520, 528, 39, 51.5, { skin: 'cloth' });
  L.soft(534, 542, 37, 51.5, { skin: 'cloth' });
  L.gust(470, 552, 24, 35, { vx: 3 });
  L.putAt('intel', 509, 43, {
    secret: 'cache',
    name: "A Vast kid's paper plane",
    signals: ['visual:sheet-shadow', 'audio:paper-flutter'],
    seenFrom: "CK2's climb, 40 u ahead and below",
  });
  L.putAt('cameo', 472, 30, { event: 'skyLine', step: 4, zone: { x0: 470, x1: 476, y0: 0, y1: 80 } });
  L.beaconAt(560, 30); 
  L.landmarkAt('The washing line', 510, 50, 'mid');

  
  L.landmarkAt('Pergola post', 571, 18, 'mid'); 
  L.wall(570, 705, 34, 37); 
  L.wall(570, 705, 37, 50); 
  L.wall(570, 705, 50, 80); 
  L.wall(656, 672, 2, 12); 
  L.wall(678, 684, 2, 8); 
  for (const y of [22, 23.5, 25, 26.5, 28, 29.5]) L.putAt('wasp', 650, y, { hp: 5, motif: 'wingman', use: 'M4' });
  L.putAt('ace', 664, 12.5, { perch: true, wakeWhen: { x: 668 }, chase: true, motif: 'wingman', use: 'M4' });
  L.putAt('ace', 681, 8.5, { perch: true, wakeWhen: { x: 682 }, chase: true, motif: 'wingman', use: 'M4' });
  L.putAt('cameo', 636, 25, { event: 'skyLine', step: 5, zone: { x0: 634, x1: 639, y0: 0, y1: 80 } });
  L.landmarkAt('The pergola', 640, 35, 'mid');

  
  L.soft(715, 815, 2, 20, { skin: 'fur' }); 
  L.soft(800, 822, 2, 26, { skin: 'fur' }); 
  L.updraft(824, 842, 18, 60, { lift: 5, pulse: { on: 1.6, off: 2.4 } }); 
  L.putAt('glasswing', 790, 38, {
    specimen: true,
    name: 'Glasswing',
    signals: ['visual:azure-prism', 'audio:glass-whistle'],
    seenFrom: "the pergola's exit, through the gap at the balcony's end",
  });
  L.putAt('cameo', 716, 28, { event: 'skyLine', step: 6, zone: { x0: 716, x1: 722, y0: 0, y1: 80 } });
  L.beaconAt(848, 52); 
  L.landmarkAt('Ruuma', 765, 14, 'mid');

  
  L.wall(930, 960, 2, 80); 
  L.wall(918, 930, 64, 65.5); 
  L.wall(880, 960, 76, 78); 
  const sq = { perch: true, squadron: 'aerodrome', scrambleX: 848, motif: 'wingman', use: 'M5' };
  L.putAt('ace', 920, 65.5, { ...sq, role: 'A1' });
  L.putAt('ace', 922, 65.5, { ...sq, role: 'A2' });
  L.putAt('ace', 924, 65.5, { ...sq, role: 'leader', leader: true, name: 'Wing Commander Whirr', hp: 6 });
  L.putAt('ace', 926, 65.5, { ...sq, role: 'W1', formation: { lead: 'leader', slot: [-2, 1.5] } });
  L.putAt('ace', 928, 65.5, { ...sq, role: 'W2', formation: { lead: 'leader', slot: [-2, -1.5] } });
  L.putAt('cameo', 905, 78, { name: 'Duchess Mandibella', at: 'M5:done', lines: 'aerodrome' }); 
  L.putAt('intel', 921, 66, {
    alive: false,
    secret: 'deed',
    name: "Wing Commander Whirr's flight goggles",
    condition: { noHurtFrom: 'CK4' },
    signals: ['visual:gold-glint', 'audio:glint-chime'],
    seenFrom: 'the sill: they tumble onto the runway as the V goes down',
  });
  L.landmarkAt('The aerodrome', 900, 70, 'mid');

  
  L.putAt('finish', 924, 65.5, {
    alive: false,
    gate: 'aerodrome',
    landing: { x0: 918, x1: 930, y: 65.5 },
    name: 'The Vast kitchen windowsill',
  });
  const level = L.build();
  
  level.planePlan = [
    { move: 'spawn' },
    { x: 48, y: 9, move: 'fly' },
    { x: 70, y: 32, move: 'fly' },
    { x: 92, y: 33, move: 'fly' },
    { x: 134, y: 33, move: 'fly' },
    { x: 146, y: 40, move: 'fly' },
    { move: 'loop', via: { when: 'moth<=4' } },
    { x: 200, y: 42, move: 'fly' },
    { x: 240, y: 42, move: 'roll', via: { when: 'x>=207' } },
    { x: 250, y: 42, move: 'roll', via: { when: 'x>=227' } },
    { x: 262, y: 42, move: 'roll', via: { when: 'x>=247' } },
    { x: 300, y: 42, move: 'fly' },
    { x: 345, y: 22, move: 'fly' },
    { x: 375, y: 22, move: 'fly' },
    { x: 400, y: 26, move: 'fly' },
    { x: 406, y: 40, move: 'fly' },
    { x: 460, y: 42, move: 'fly' },
    { x: 472, y: 30, move: 'fly' },
    { x: 552, y: 30, move: 'fly' },
    { x: 560, y: 30, move: 'fly' },
    { x: 640, y: 25.25, move: 'fly' },
    { x: 660, y: 25.25, move: 'roll', via: { when: 'x>=645' } },
    { x: 690, y: 22, move: 'fly' },
    { x: 705, y: 24, move: 'fly' },
    { x: 820, y: 28, move: 'fly' },
    { x: 833, y: 40, move: 'fly' },
    { x: 848, y: 52, move: 'fly' },
    { move: 'aerodrome', via: { x0: 858, x1: 906, y: 54 } },
    { x: 906, y: 68, move: 'fly' },
    { x: 922, y: 65.9, move: 'land' },
  ];
  return level;
}
