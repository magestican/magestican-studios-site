









import { levelBuilder } from './dsl.js';

const MOTIF = 'slipstream';

export function buildL06() {
  const L = levelBuilder({ id: 6, name: 'Windward', pitCost: 'heart', height: 44 });
  
  const seedsAlong = (pts, n) => {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const len = cum[cum.length - 1];
    for (let k = 0; k < n; k++) {
      const s = (len * (k + 0.5)) / n;
      let i = 1;
      while (i < pts.length - 1 && cum[i] < s) i++;
      const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1]);
      const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t;
      const y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t;
      L.putAt('seed', Math.round(x * 100) / 100, Math.round(y * 100) / 100);
    }
  };
  
  const moth = (x, y, use, path, opts = {}, seeds = 10) => {
    L.putAt('moth', x, y, { path, speed: 11, motif: MOTIF, use, ...opts });
    seedsAlong(path.slice(1), seeds);
  };

  
  L.step(6, 14);
  L.spawnAt(1.5, 8);
  
  
  L.putAt('ability', 1, 8, { grant: 'double', name: 'Thruster coil' });
  L.putAt('ability', 1.6, 8, { grant: 'pound', name: 'Pound plates' });
  L.putAt('ability', 2.2, 8, { grant: 'dash', name: 'Dash spring' });
  L.landmarkAt('Ruuma ear', 6, 8);
  L.putAt('seedRide', 10, 8, {
    path: [
      [10, 9],
      [24, 13],
      [40, 17],
      [56, 19],
      [72, 17.5],
    ],
    speed: 9,
  });
  
  L.step(-6, 286);

  
  L.ledge(64, 84, 16).bark(72, 75, 2, 15.5);
  L.putAt('ability', 78, 16, { grant: 'glide', name: 'Broad leaf', memo: 'jump, then jump again and hold' });
  
  L.ledge(100, 116, 13).wall(106, 109, 0, 12.5).updraft(88, 97, 2, 15);
  seedsAlong(
    [
      [87, 19],
      [90, 20.5],
      [94, 19.5],
      [98, 17.5],
      [102, 15],
    ],
    6,
  );
  
  L.updraft(118, 127, 2, 25).ledge(130, 146, 21).wall(136, 139, 0, 20.5);
  for (const y of [16, 19, 22]) L.putAt('seed', 122.5, y);
  
  L.gust(146, 206, 10, 28, { vx: 5 }).ledge(204, 222, 14).wall(212, 215, 0, 13.5).updraft(190, 198, 2, 20);
  seedsAlong(
    [
      [152, 25],
      [170, 23],
      [188, 20],
      [202, 16.5],
    ],
    8,
  );
  
  moth(
    218,
    14,
    'M1',
    [
      [219, 15.5],
      [240, 17],
      [262, 17.5],
      [284, 16],
      [300, 15.2],
    ],
    { trigger: 218 },
  );
  L.ledge(238, 248, 12).wall(242, 245, 0, 11.5).updraft(262, 270, 2, 22);
  L.ledge(288, 322, 14).wall(300, 306, 0, 13.5).beaconAt(304, 14);
  L.landmarkAt('Lantern Tree', 305, 14);

  
  L.wall(306, 336, 7.5, 8);
  L.putAt('wasp', 329, 11.5, { practice: { x: 324, y: 8 } });
  
  L.ledge(352, 366, 8).wall(357, 360, 0, 7.5);
  L.putAt('wasp', 372, 15);
  L.ledge(380, 398, 9).wall(388, 391, 0, 8.5);
  L.putAt('wasp', 420, 16);
  L.ledge(412, 428, 10).wall(418, 421, 0, 9.5);
  
  
  
  L.wall(432, 436, 0, 8).wall(432, 436, 22, 30);
  L.wall(446, 450, 0, 29.5).updraft(436, 446, 0, 34).ledge(446, 474, 30);
  L.ledge(428, 432, 18).wall(428, 432, 20.5, 21);
  L.putAt('intel', 430, 18, {
    secret: 'cache',
    name: "A Vast child's paper aeroplane",
    signals: ['visual:amber-glint', 'audio:hollow-knock'],
    seenFrom: 'inside the Chimney while rising (x 436-446, y 14-22)',
  });
  L.cameraHint(428, 450, { dy: 4 });
  L.landmarkAt('Twin Trunks', 441, 30);

  
  moth(
    470,
    30,
    'M2',
    [
      [473, 31],
      [484, 34],
      [496, 37],
      [512, 38],
      [528, 35],
      [541, 30.5],
    ],
    { trigger: 472 },
  );
  L.ledge(492, 504, 26).wall(497, 500, 0, 25.5).updraft(512, 520, 0, 34);

  
  L.wall(536, 600, 25, 26).wall(604, 616, 25, 26).wall(540, 544, 0, 25).beaconAt(544, 26);
  L.landmarkAt('Kite', 600, 44, 'far');
  L.wall(556, 616, 17.5, 18).wall(554, 556, 18, 25).wall(614, 616, 18, 25).updraft(600, 604, 18, 32);
  L.putAt('wasp', 574, 22.5, {
    specimen: true,
    double: true,
    name: 'Pinstripe Cadet',
    signals: ['visual:leaf-shadow', 'audio:two-tone-buzz'],
    seenFrom: 'walking the Sunshelf above the hall (x 560-590)',
  });
  L.ledge(566, 570, 31).ledge(578, 582, 35).ledge(590, 594, 38).ledge(598, 604, 41);
  L.updraft(560, 566, 26, 34, { pulse: { on: 1.5, off: 1.5, phase: 0 } });
  L.updraft(572, 578, 31, 38, { pulse: { on: 1.5, off: 1.5, phase: 1 } });
  L.updraft(584, 590, 35, 41, { pulse: { on: 1.5, off: 1.5, phase: 2 } });
  L.putAt('intel', 601, 41, {
    secret: 'deed',
    name: "The kite's name tag",
    signals: ['visual:gold-glint', 'audio:glint-chime'],
    seenFrom: "M2's apex (x 496-512, y 37-38) and the Sunshelf",
  });

  
  L.gust(616, 690, 12, 32, { vx: 5 }).ledge(680, 696, 18).wall(686, 689, 0, 17.5);
  seedsAlong(
    [
      [624, 29],
      [646, 27],
      [668, 23],
      [684, 19.5],
    ],
    8,
  );
  
  moth(
    692,
    18,
    'M3',
    [
      [695, 19],
      [710, 23],
      [728, 25],
      [746, 24],
      [762, 21],
      [773, 19],
    ],
    { trigger: 694 },
  );
  L.ledge(708, 720, 12).wall(713, 716, 0, 11.5).ledge(736, 748, 12).wall(741, 744, 0, 11.5).updraft(752, 760, 0, 24);
  L.putAt('wasp', 714, 18);
  L.putAt('wasp', 730, 17);
  L.putAt('wasp', 744, 18);
  L.ledge(770, 786, 18).wall(776, 779, 0, 17.5);
  
  L.gust(786, 800, 14, 26, { vx: 6, pulse: { on: 1.2, off: 1.8, phase: 0 } });
  L.ledge(800, 816, 18).wall(806, 809, 0, 17.5).beaconAt(810, 18);
  
  L.gust(816, 846, 8, 30, { vx: -4, pulse: { on: 1.0, off: 2.0, phase: 0 } });
  L.ledge(836, 848, 16).wall(841, 844, 0, 15.5);
  L.putAt('wasp', 846, 22);
  L.updraft(852, 860, 0, 32, { pulse: { on: 2.0, off: 1.0, phase: 0 } });
  L.ledge(866, 892, 26).wall(876, 879, 0, 25.5);
  
  
  L.gust(892, 1010, 18, 34, { vx: -5 }).updraft(900, 1020, 0, 17);
  const m4 = { relay: true };
  moth(
    890,
    26,
    'M4',
    [
      [891, 27],
      [910, 28.5],
      [930, 27],
    ],
    { trigger: 890, ...m4 },
    5,
  );
  moth(
    932,
    26,
    'M4',
    [
      [933, 26.5],
      [952, 26],
      [972, 22],
    ],
    m4,
    5,
  );
  moth(
    974,
    20.75,
    'M4',
    [
      [975, 21],
      [994, 19],
      [1012, 16],
      [1030, 14.5],
    ],
    m4,
    5,
  );
  L.landmarkAt('kite string', 960, 22);
  
  L.wall(1026, 1068, 0, 13);
  L.putAt('finish', 1058, 13);
  L.landmarkAt('Gatepost', 1046, 13);

  const level = L.build();
  level.waypoints = ROUTE;
  return level;
}



const ROUTE = [
  { x: 72, y: 16, move: 'ride', at: 10, maxS: 10 },
  { x: 83, y: 16, move: 'walk' },
  { x: 108, y: 13, move: 'glide', at: 84 },
  { x: 140, y: 21, move: 'updraft', at: 116, via: { x: 122.5, y: 23.5 } },
  { x: 220, y: 14, move: 'glide', at: 146 },
  { x: 304, y: 14, move: 'moth', at: 222, maxS: 12 },
  { x: 328, y: 8, move: 'walk' },
  { x: 362, y: 8, move: 'glide', at: 336 },
  { x: 394, y: 9, move: 'glide', at: 366 },
  { x: 426, y: 10, move: 'glide', at: 398 },
  { x: 458, y: 30, move: 'updraft', at: 428, via: { x: 441, y: 32.5 } },
  { x: 544, y: 26, move: 'moth', at: 474, maxS: 12 },
  { x: 614, y: 26, move: 'glide', at: 600, maxS: 12 },
  { x: 690, y: 18, move: 'glide', at: 616 },
  { x: 780, y: 18, move: 'moth', at: 696, maxS: 12 },
  { x: 812, y: 18, move: 'glide', at: 786 },
  { x: 842, y: 16, move: 'glide', at: 816, waitMax: 3 },
  { x: 888, y: 26, move: 'updraft', at: 848, via: { x: 856, y: 30 }, waitMax: 1, maxS: 10 },
  { x: 1058, y: 13, move: 'moth', at: 892, maxS: 18 },
];
