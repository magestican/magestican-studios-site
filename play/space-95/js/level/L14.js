































import { levelBuilder } from './dsl.js';

const PAD = (L, x, y, id, opts = {}) => L.bloomAt(x, y, { id, ...opts });

export function buildL14() {
  const L = levelBuilder({
    id: 14,
    name: 'Night Bloom',
    height: 44,
    pitCost: 'heart',
    pitReturn: 'ground',
    dark: true,
    moon: { clouds: { fromX: 280, every: 6, cover: 2, warn: 1 } },
  });
  const ids = {};
  const tag = (name, e) => {
    ids[name] = e.id;
    e.tag = name;
    return e;
  };
  
  L.wall(0, 892, 0, 10).wall(0, 4, 10, 40).carve(880, 892, 0, 26);

  
  L.spawnAt(5.5, 10);
  const kit = [
    ['double', 'Thruster coil'],
    ['pound', 'Pound plates'],
    ['dash', 'Dash spring'],
    ['glide', 'Broad leaf'],
    ['wall', 'Wax grips'],
    ['tether', 'Paperclip hook'],
  ];
  kit.forEach(([grant, name], i) => {
    L.putAt('ability', 6 + 0.5 * i, 10, { grant, name });
  });
  L.putAt('cameo', 4, 10, { name: 'Cat flap', swing: 0.6, event: 'flapSwing', zone: { x0: 4, x1: 30, y0: 9, y1: 12 } });
  L.lampAt(2, 40, { id: 'SEC', security: true, cover: [0, 140], on: 3.0, sensor: [0, 24], cooldown: 10, r: 0 });
  L.putAt('ability', 9.5, 10, { grant: 'lantern', name: 'Firefly Lantern' });
  L.landmarkAt('Security light', 2, 40, 'back');

  
  L.wall(32, 48, 19, 20); 
  L.ivy(45.5, 46.5, 10, 19);
  PAD(L, 57.5, 12, 'PA', { raiseOnly: true });
  L.wall(60, 61, 10, 14).wall(61, 165, 10, 14); 

  
  tag(
    'M1',
    L.putAt('bud', 70, 14, {
      flies: 5,
      burst: 9,
      motif: 'flock',
      use: 'M1',
      perches: [
        [89, 14.5],
        [95, 14.5],
        [101, 14.5],
      ],
    }),
  );
  L.putAt('aphid', 73.5, 14, { advance: 1, facing: 1, motif: 'flock', use: 'M1' });
  L.putAt('aphid', 75.5, 14, { advance: 1, facing: 1, motif: 'flock', use: 'M1' });
  L.carve(86, 104, 12.5, 14);
  PAD(L, 89, 14, 'C1');
  PAD(L, 95, 14, 'C2');
  PAD(L, 101, 14, 'C3');
  L.landmarkAt('Moonflower bed', 84, 14, 'back');

  
  L.spark(110, 152, 14, 14.5, { skin: 'thorn' }).moonAt(108, 160);
  ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'].forEach((id, i) => {
    PAD(L, 113 + 6.5 * i, 15.5, id);
  });
  L.landmarkAt('Rose bed', 130, 14, 'back');

  
  L.wall(172, 180, 10, 12).wall(186, 195, 10, 13); 
  L.putAt('aphid', 189, 13, {});
  L.putAt('aphid', 192, 13, {});
  L.beaconAt(208, 10);
  L.landmarkAt('Garden hose', 190, 13, 'back');

  
  tag(
    'M2',
    L.putAt('bud', 230, 10, {
      flies: 8,
      burst: 10,
      motif: 'flock',
      use: 'M2',
      perches: [
        [251, 10.5],
        [257.75, 10.5],
        [264.5, 10.5],
        [271.25, 10.5],
      ],
    }),
  );
  for (const x of [236, 238.5, 241]) L.putAt('aphid', x, 10, { advance: 1.5, facing: -1, motif: 'flock', use: 'M2' });
  
  L.carve(248, 277, 0, 10).slick(277, 277.5, 0, 10);
  ['H1', 'H2', 'H3', 'H4'].forEach((id, i) => {
    PAD(L, 251 + 6.75 * i, 10, id);
  });
  L.landmarkAt('Hydrangea', 240, 10, 'back');

  
  L.moonAt(286, 336).carve(296, 328, 8.5, 10);
  ['L1', 'L2', 'L3', 'L4', 'L5'].forEach((id, i) => {
    PAD(L, 299 + 6.5 * i, 10, id);
  });
  L.landmarkAt('Apple-tree gap', 311, 10, 'back');

  
  L.wall(336, 475, 10, 26).carve(336, 387, 10, 24).carve(387, 393, 10, 26);
  L.ledge(356, 363, 14.5).ledge(362, 370, 19);
  const m3 = (name, x, y, perch) => tag(name, L.putAt('bud', x, y, { flies: 6, burst: 8, motif: 'flock', use: 'M3', perches: [perch] }));
  m3('M3a', 352, 10, [389.5, 14.5]);
  m3('M3b', 358, 14.5, [390.5, 18.5]);
  m3('M3c', 364, 19, [389.5, 22.5]);
  for (const [x, y] of [
    [355, 10],
    [357, 10],
    [361, 14.5],
    [367, 19],
    [369, 19],
  ])
    L.putAt('aphid', x, y, { motif: 'flock', use: 'M3' });
  PAD(L, 389.5, 14, 'K1');
  PAD(L, 390.5, 18, 'K2');
  PAD(L, 389.5, 22, 'K3');
  L.beaconAt(396, 26);
  L.landmarkAt('Privet hedge', 360, 26, 'back');

  
  L.moonAt(393, 475);
  tag('S1', L.putAt('sprite', 430, 29, {}));
  L.carve(452, 458, 14, 26).carve(452, 475, 10, 14);
  tag('S2', L.putAt('sprite', 466, 29.5, {}));
  L.putAt('sprite', 465, 10.8, {
    ghost: true,
    specimen: true,
    name: 'Blue Ghost',
    patrol: [453, 474],
    signals: ['visual:azure-glow', 'audio:ghost-hum'],
    seenFrom: 'the hedge top, looking down through the gap (x 452-458)',
  });

  
  L.wall(478, 495, 10, 20).slick(478, 495, 10, 20);
  L.wall(498, 508, 10, 15); 
  
  L.carve(508, 537, 0, 10).wall(537, 541, 10, 15).slick(537, 537.5, 0, 15);
  L.moonAt(500, 541);
  ['G1', 'G2', 'G3', 'G4'].forEach((id, i) => {
    PAD(L, 511.5 + 6.75 * i, 14, id);
  });
  L.beaconAt(552, 10);
  L.landmarkAt('Watering can', 486, 20, 'back');

  
  tag(
    'M4',
    L.putAt('bud', 566, 10, {
      flies: 12,
      burst: 12,
      motif: 'flock',
      use: 'M4',
      perches: [
        [675, 14.5],
        [681, 14.5],
      ],
    }),
  );
  for (const x of [572, 574.5, 577]) L.putAt('aphid', x, 10, { advance: 1.5, facing: -1, motif: 'flock', use: 'M4' });
  L.putAt('sprite', 573, 13.5, { motif: 'flock', use: 'M4' });
  L.putAt('sprite', 576, 14, { motif: 'flock', use: 'M4' });
  L.wall(586, 606, 10, 12.5).slick(586, 606, 10, 12.5); 
  PAD(L, 590, 16.5, 'D1', { raiseOnly: true });
  PAD(L, 595, 21, 'D2', { raiseOnly: true });
  PAD(L, 590, 25.5, 'D3', { raiseOnly: true });
  PAD(L, 595, 30, 'D4', { raiseOnly: true });
  L.wall(598, 602, 34, 34.5).slick(598, 602, 34, 34.5); 
  L.putAt('intel', 600, 34.5, {
    secret: 'deed',
    name: 'A glow-in-the-dark star sticker',
    signals: ['visual:gold-glint', 'audio:glint-chime'],
    seenFrom: "the lawn at the gnome's feet (x 580-586)",
  });
  L.landmarkAt('Garden gnome', 596, 12.5, 'back');

  
  L.carve(620, 649, 0, 10).slick(649, 649.5, 0, 10); 
  tag('T1', L.putAt('hook', 627, 19.5, { name: 'rod tip ring', required: true }));
  tag('T2', L.putAt('hook', 637, 19.5, { name: 'line swivel', required: true }));
  L.landmarkAt('Pond', 634, 10, 'back');

  
  L.wall(660, 672, 10, 14); 
  L.spark(672, 684, 10, 10.5, { skin: 'thorn' });
  PAD(L, 675, 14, 'Q1');
  PAD(L, 681, 14, 'Q2');
  L.wall(684, 700, 10, 18).carve(684, 688, 14, 17); 
  L.ivy(684, 684.5, 14, 17, { id: 'IVY-CACHE' });
  L.putAt('intel', 686.5, 14, {
    secret: 'cache',
    name: 'A Vast seed packet: MOONFLOWER - sow after dark',
    ivy: 'IVY-CACHE',
    signals: ['visual:gold-glint', 'audio:hollow-knock'],
    seenFrom: "the pond swing (T1-T2), the glint in tier B's left face",
  });
  L.spark(700, 724, 10, 10.5, { skin: 'thorn' });
  L.lampAt(704, 19, { id: 'L704', r: 5.5 });
  L.lampAt(718, 19, { id: 'L718', r: 5.5, flicker: { on: 1.4, off: 1.4 } });
  ['F1', 'F2', 'F3', 'F4'].forEach((id, i) => {
    PAD(L, 703 + 6 * i, 18, id);
  });
  L.wall(724, 760, 10, 20.5); 
  L.lampAt(740, 23, { id: 'L740', r: 5.5 });
  L.beaconAt(756, 20.5);
  L.landmarkAt('Rockery', 700, 20, 'back');

  
  L.wall(760, 772, 10, 24.5).carve(772, 818, 0, 24.5).moonAt(770, 820);
  ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7'].forEach((id, i) => {
    PAD(L, 775 + 6.5 * i, 24.5, id);
  });
  tag('G1', L.putAt('sprite', 786, 28, {}));
  tag('G2', L.putAt('sprite', 803, 28, {}));
  L.wall(818, 892, 10, 24.5).slick(818, 818.5, 0, 24.5); 

  
  L.wall(840, 880, 10, 26);
  for (const [x, y] of [
    [862, 29],
    [865, 31],
    [868, 32.5],
    [874, 31],
    [877, 29],
  ])
    L.putAt('sprite', x, y, { motif: 'flock', use: 'M5' });
  const gate = tag(
    'GATE',
    L.putAt('bloomGate', 872, 26, { call: 858, burst: 14, motif: 'flock', use: 'M5', w: 8, h: 12, name: 'Giant moonflower' }),
  );
  L.putAt('finish', 872, 26, { alive: false, bloomGate: gate.id, name: 'Nav lamp' });
  L.landmarkAt('Giant moonflower', 872, 26);

  const level = L.build();
  level.waypoints = route(ids);
  level.flockTags = ids;
  
  level.padBeats = [
    { name: 'the M2 pit row', from: { x: 247.6, y: 10 }, goal: { x0: 277, y: 10, dir: 1 } },
    { name: 'the watering-can gutter', from: { x: 507.6, y: 15 }, goal: { x0: 537, y: 15, dir: 1 } },
    { name: 'the crest crevice', from: { x: 771.6, y: 24.5 }, goal: { x0: 818, y: 24.5, dir: 1 } },
  ];
  return level;
}


function route(I) {
  const J = (x, y, via, at) => ({ x, y, move: 'jump', ...(via ? { via } : {}), ...(at !== undefined ? { at } : {}) });
  return [
    J(62, 14, { double: true }), 
    { x: 70, y: 14, move: 'pop', bud: I.M1 }, 
    J(89, 14),
    J(95, 14),
    J(101, 14),
    J(106, 14),
    ...[113, 119.5, 126, 132.5, 139, 145.5].map((x) => J(x, 15.5)), 
    J(153, 14, undefined, 147.2), 
    J(176, 12), 
    J(187.5, 13),
    { x: 200, y: 10, move: 'jump', via: { hopFoes: 'any', waitMax: 1.2 } }, 
    { x: 230, y: 10, move: 'pop', bud: I.M2 }, 
    ...[251, 257.75, 264.5, 271.25].map((x) => J(x, 10)), 
    J(279, 10, undefined, 272.9), 
    ...[299, 305.5, 312, 318.5, 325].map((x) => J(x, 10)), 
    J(330, 10),
    { x: 352, y: 10, move: 'pop', bud: I.M3a }, 
    { x: 386, y: 10, move: 'walk' },
    J(389.5, 14, { double: true }), 
    J(390.5, 18, { double: true }),
    J(389.5, 22, { double: true }),
    J(395, 26, { double: true }), 
    { x: 450, y: 26, move: 'walk' }, 
    J(460, 26, { double: true }, 451.6), 
    { x: 479, y: 20, move: 'walk' }, 
    J(500, 15), 
    ...[511.5, 518.25, 525, 531.75].map((x) => J(x, 14)), 
    J(539, 15, undefined, 533.4), 
    { x: 566, y: 10, move: 'pop', bud: I.M4 }, 
    J(596, 12.5, undefined, 584.5), 
    { x: 612, y: 10, move: 'walk' },
    {
      x: 0,
      y: 0,
      move: 'tether',
      hook: I.T1,
      at: 620,
      next: I.T2,
      beat: { from: { x: 619.6, y: 10 }, goal: { x0: 649, y: 10, dir: 1 } },
    }, 
    { x: 650, y: 10, move: 'tether', hook: I.T2 },
    J(666, 14, { double: true }, 658.6), 
    J(675, 14),
    J(681, 14),
    J(690, 18, { double: true }, 682.6), 
    ...[703, 709, 715, 721].map((x) => J(x, 18)), 
    J(728, 20.5),
    J(765, 24.5, { double: true }, 758.6), 
    ...[775, 781.5, 788, 794.5, 801, 807.5, 814].map((x) => J(x, 24.5, { raise: 'cloud' })), 
    J(822, 24.5, undefined, 815.4), 
    J(845, 26, undefined, 838.5),
    { x: 876, y: 26, move: 'walk' }, 
  ];
}
