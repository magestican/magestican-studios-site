









import { levelBuilder } from './dsl.js';

const BOSS = 'L04-boss-1';
const DEED = 'L04-intel-2';





const STRETCH = [
  [60, 32],
  [140, 32],
  [235, 32],
  [245, 32],
  [330, 24],
  [445, 20],
  [455, 20],
];
const X = (x) => x + STRETCH.reduce((d, [at, du]) => (x > at ? d + du : d), 0);


function stretched(B) {
  
  const L = {};
  
  const box = (name) => (a, b, c, d) => {
    B[name](X(a), X(b), c, d);
    return L;
  };
  for (const name of ['wall', 'carve', 'soil', 'bark']) L[name] = box(name);
  L.ledge = (a, b, y) => {
    B.ledge(X(a), X(b), y);
    return L;
  };
  L.putAt = (kind, x, y, props) => B.putAt(kind, X(x), y, props);
  L.beaconAt = (x, y) => {
    B.beaconAt(X(x), y);
    return L;
  };
  L.spawnAt = (x, y) => {
    B.spawnAt(X(x), y);
    return L;
  };
  L.landmarkAt = (name, x, y, layer) => {
    B.landmarkAt(name, X(x), y, layer);
    return L;
  };
  L.cameraHint = (a, b, o) => {
    B.cameraHint(X(a), X(b), o.lock ? { lock: { ...o.lock, x: X(o.lock.x) } } : o);
    return L;
  };
  L.build = () => B.build();
  return L;
}

export function buildL04() {
  const L = stretched(levelBuilder({ id: 4, name: 'Seed Vault', pitCost: 'none', height: 100 }));
  
  const dirt = (x0, x1, y0, y1) => L.carve(x0, x1, y0, y1).soil(x0, x1, y0, y1);
  const clod = (x, y, use, props = {}) => L.putAt('clod', x, y, { motif: 'cave-in', use, ...props });

  L.wall(0, 510, 0, 100); 
  L.spawnAt(3, 92);
  
  L.putAt('ability', 3, 92, { grant: 'double' });

  
  L.carve(1, 32, 92, 100).carve(26, 30, 84, 92);
  L.landmarkAt('ant-trail-sinkhole', 28, 92);

  
  L.carve(20, 82, 80, 84);
  L.putAt('ability', 36, 80, { grant: 'pound' });

  
  dirt(48, 52, 79, 80);

  
  dirt(70, 76, 79, 80);
  L.carve(70, 76, 71, 79);

  
  L.carve(64, 100, 66, 71);
  dirt(92, 100, 65, 66);
  clod(99.5, 66, 'M1');
  L.cameraHint(88, 100, { dy: -3 });

  
  L.carve(86, 136, 58, 65);
  L.putAt('aphid', 99.5, 58, { dozing: true });
  L.putAt('ladybot', 110, 58, { facing: -1 });
  dirt(118, 122, 57, 58);
  L.carve(118, 122, 50, 57);
  dirt(118, 122, 49, 50);
  L.carve(118, 122, 47, 49);
  L.putAt('intel', 120, 50, {
    secret: 'cache',
    name: "Giant's lost button",
    signals: ['visual:pearl-glint', 'audio:hollow-thump'],
    seenFrom: `the dig-drop shaft (x ${X(128)}-${X(132)}, y 48-57)`,
  });

  
  dirt(128, 132, 57, 58);
  L.carve(128, 132, 53, 57);
  dirt(128, 132, 52, 53);
  L.carve(128, 132, 48, 52);
  dirt(128, 132, 47, 48);

  
  L.carve(108, 172, 40, 47);
  L.carve(112, 114, 47, 58).bark(112, 114, 40, 58).ledge(112, 114, 58);
  L.landmarkAt('tree-a-taproot', 113, 40);
  L.beaconAt(146, 40);

  
  L.putAt('pillbug', 154, 40, { facing: -1 });
  dirt(160, 168, 39, 40);
  clod(161.5, 40, 'M2');
  clod(166.5, 40, 'M2');
  L.cameraHint(156, 172, { dy: -4 });

  
  L.carve(150, 270, 30, 39);
  L.landmarkAt('vast-coin', 215, 35, 'bg');
  L.putAt('ladybot', 161.5, 30, { dozing: true });
  L.putAt('ladybot', 166.5, 30, { dozing: true });
  L.putAt('pillbug', 182, 30, { facing: -1 });
  L.wall(192, 196, 30, 32);
  L.putAt('aphid', 206, 30);
  L.putAt('aphid', 210.5, 30); 
  L.putAt('ladybot', 226, 30, { facing: -1 });

  
  dirt(263, 270, 29, 30);
  for (const x of [267.5, 268.5, 269.5]) for (const y of [30, 31]) clod(x, y, 'M3');
  L.cameraHint(258, 270, { dy: -3 });

  
  L.carve(260, 352, 22, 29);
  L.putAt('pillbug', 267.5, 22, { dozing: true, curled: true });
  L.putAt('ladybot', 269.5, 22, { dozing: true });

  
  L.carve(282, 284, 20.5, 22);
  L.putAt('pillbug', 283, 20.5, { dozing: true, curled: true });
  L.beaconAt(298, 22);
  L.wall(290, 324, 25, 29);
  L.putAt('pillbug', 304, 22, { facing: -1 });
  L.putAt('pillbug', 316, 22, { facing: -1 });

  
  dirt(346, 350, 21, 22);
  L.carve(344, 364, 18, 21);
  L.putAt('aphid', 354, 18);
  dirt(358, 362, 17, 18);
  L.carve(356, 376, 14, 17);
  dirt(370, 374, 13, 14);
  L.cameraHint(340, 380, { dy: -5 });

  
  L.carve(340, 380, 8.5, 13);
  L.putAt('aphid', 344, 8.5, {
    specimen: true,
    stompProof: true,
    variant: 'glassback',
    name: 'Glassback aphid',
    signals: ['visual:crystal-sparkle', 'audio:glass-chime'],
    seenFrom: `stair-dig tunnel b (x ${X(344)}-${X(364)}, y 18)`,
    defeatBy: 'pound',
    hop: 2,
  });
  L.carve(380, 428, 8.5, 18);
  L.putAt('ladybot', 388, 8.5, { facing: -1 });
  L.putAt('ladybot', 396, 8.5, { facing: -1, phase: 1 });
  L.wall(404, 410, 8.5, 11);
  L.putAt('pillbug', 407, 11, { facing: -1 });
  L.putAt('aphid', 416, 8.5);
  L.putAt('aphid', 420.5, 8.5); 
  L.ledge(412, 418, 13.5);

  
  L.carve(428, 486, 8.5, 14);
  L.landmarkAt('vast-garden-hose', 457, 8.5);
  L.beaconAt(482, 8.5);

  
  L.carve(486, 508, 2, 14);
  L.landmarkAt('seed-vault', 497, 2);
  L.cameraHint(486, 508, { lock: { x: 497, y: 8 } });
  
  L.wall(486, 488.5, 7.5, 8.5);
  dirt(488.5, 491, 7.5, 8.5);
  clod(489, 8.5, 'M4', { refill: 3 });
  clod(490, 8.5, 'M4', { refill: 3 });
  dirt(503, 505.5, 7.5, 8.5);
  L.wall(505.5, 508, 7.5, 8.5);
  clod(504, 8.5, 'M4', { refill: 3 });
  clod(505, 8.5, 'M4', { refill: 3 });
  L.ledge(491.5, 494, 4.5).ledge(500, 502.5, 4.5);
  dirt(494.5, 499.5, 7.5, 8.5);
  clod(496, 8.5, 'M5', { refill: 3 });
  clod(496, 9.5, 'M5', { refill: 3 });
  clod(498, 8.5, 'M5', { refill: 3 });

  
  L.putAt('intel', 493, 2, {
    id: DEED,
    alive: false,
    secret: 'deed',
    name: "A Vast child's marble",
    condition: { noDamageInPhase: 2 },
    signals: ['visual:lunchbox-glint', 'audio:lunch-rattle'],
    seenFrom: "the Foreman's back during phase 2",
  });

  const respawn = { x: X(487.25), y: 8.5 }; 
  L.putAt('boss', 502, 2, {
    id: BOSS,
    type: 'foreman',
    name: 'Foreman Burrowbeetle',
    w: 4,
    h: 2,
    arena: { x0: X(486), x1: X(508), y0: 2, y1: 14 },
    keystoneX: X(497),
    respawn,
    contactDamage: 1,
    phases: [
      {
        name: 'Shift Start',
        hp: 2,
        weakness: 'cave-in',
        spawn: respawn,
        attacks: [
          { name: 'shovelCharge', telegraph: 0.8, active: 1.6, recover: 3.0 },
          { name: 'mudToss', telegraph: 0.7, active: 0.6, recover: 0.8 },
        ],
      },
      {
        name: 'Overtime',
        hp: 2,
        weakness: 'pound',
        spawn: respawn,
        deed: DEED,
        attacks: [
          { name: 'burrowAmbush', telegraph: 0.9, active: 0.5, recover: 2.0 },
          { name: 'mudTossDouble', telegraph: 0.7, active: 0.8, recover: 0.8 },
        ],
      },
      {
        name: 'Clock-out',
        hp: 1,
        weakness: 'cave-in',
        spawn: respawn,
        
        attacks: [
          { name: 'warningStomp', telegraph: 0.8, active: 0.3, recover: 0.6 },
          { name: 'quakeStomp', telegraph: 0.8, active: 0.3, recover: 0.6 },
          { name: 'dizzyWobble', telegraph: 0.6, active: 1.0, recover: 3.0, harmless: true },
          ...[1, 2, 3, 4, 5, 6].flatMap(() => [
            { name: 'quakeStomp', telegraph: 0.8, active: 0.3, recover: 0.6 },
            { name: 'quakeStomp', telegraph: 0.8, active: 0.3, recover: 0.6 },
            { name: 'quakeStomp', telegraph: 0.8, active: 0.3, recover: 0.6 },
            { name: 'dizzyWobble', telegraph: 0.6, active: 1.0, recover: 3.0, harmless: true },
          ]),
        ],
      },
    ],
  });
  L.putAt('finish', 497, 2, { alive: false, bossGate: BOSS });

  const level = L.build();
  level.waypoints = ROUTE.map(([x, y, move]) => ({ x: X(x), y, move }));
  return level;
}



const ROUTE = [
  [28, 80, 'drop'],
  [36, 80, 'walk'],
  [60, 80, 'walk'], 
  [72, 80, 'walk'],
  [72, 66, 'pound'],
  [98.5, 66, 'walk'],
  [98.5, 58, 'pound'],
  [97, 58, 'walk'], 
  [101.5, 58, 'jump'],
  [108.5, 58, 'jump'],
  [130, 58, 'walk'],
  [130, 40, 'pound'], 
  [140, 40, 'walk'],
  [146, 40, 'walk'],
  [153.5, 40, 'jump'],
  [164, 40, 'jump'], 
  [164, 30, 'pound'],
  [162.75, 30, 'walk'], 
  [168.5, 30, 'jump'], 
  [180, 30, 'jump'],
  [193, 32, 'jump'],
  [203.5, 30, 'walk'],
  [208.25, 30, 'jump'],
  [213, 30, 'jump'], 
  [224, 30, 'jump'],
  [240, 30, 'walk'],
  [250, 30, 'walk'],
  [266.75, 30, 'walk'],
  [266.75, 22, 'pound'],
  [265.25, 22, 'walk'], 
  [270.5, 22, 'jump'], 
  [283, 20.5, 'pound'],
  [286, 22, 'jump'],
  [298, 22, 'walk'],
  [302, 22, 'jump'],
  [314, 22, 'jump'],
  [332, 22, 'walk'],
  [348, 22, 'walk'],
  [348, 18, 'pound'],
  [357, 18, 'jump'],
  [360, 18, 'walk'],
  [360, 14, 'pound'],
  [372, 14, 'walk'],
  [372, 8.5, 'pound'],
  [386, 8.5, 'jump'],
  [394, 8.5, 'jump'],
  [405, 11, 'jump'],
  [409.5, 11, 'jump'], 
  [418.25, 8.5, 'jump'],
  [423, 8.5, 'jump'], 
  [450, 8.5, 'walk'],
  [482, 8.5, 'walk'],
  [487.5, 8.5, 'walk'],
  [487.5, 8.5, 'boss'],
];
