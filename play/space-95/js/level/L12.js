




















































import { levelBuilder } from './dsl.js';

const SURGE = { motif: 'surge' };
const CREW = (circuit, use, extra = {}) => ({ crew: true, lead: true, circuit, ...SURGE, use, ...extra });

export function buildL12() {
  const L = levelBuilder({ id: 12, name: 'Inside the Machine', pitCost: 'heart', pitReturn: 'ground', height: 300, descent: true });
  
  const ids = {};
  const tag = (t, e) => {
    ids[t] = e.id;
    return e;
  };

  
  L.wall(0, 1, 0, 300).slick(0, 1, 0, 300);
  L.wall(45, 46, 0, 52).wall(45, 46, 58, 72).wall(45, 46, 78, 300);
  L.slick(45, 46, 0, 52).slick(45, 46, 58, 72).slick(45, 46, 78, 300);
  L.wall(46, 49, 0, 52).wall(46, 49, 92, 300);
  L.wall(49, 50, 0, 300); 
  L.wall(1, 45, 298, 300);

  L.circuit('cpu-fan', [
    [33, 270],
    [33, 250],
    [8, 250],
  ]);
  L.circuit('fan-hub', [
    [37, 198],
    [4, 198],
  ]);
  L.circuit(
    'gpu-power',
    [
      [10, 120],
      [10, 108],
      [1, 108],
    ],
    [
      [10, 108],
      [23, 108],
      [39, 112],
      [43.5, 112],
      [43.5, 72],
    ],
  );

  
  const kit = [
    ['double', 'Thruster coil'],
    ['pound', 'Pound plates'],
    ['dash', 'Dash spring'],
    ['glide', 'Broad leaf'],
    ['wall', 'Wax grips'],
    ['tether', 'Paperclip hook'],
  ];
  for (const [i, [grant, name]] of kit.entries()) L.putAt('ability', 26.6 + 0.5 * i, 292, { grant, name });

  
  L.spawnAt(26.2, 292);
  L.wall(25.5, 30.5, 291.5, 292);
  L.fanAt(16, 40, 291.5, 292, { axis: 'x', hub: [25.5, 30.5], blade: 3, gap: 2, speed: 5, id: 'F1' });
  L.landmarkAt('Top fan', 28, 292, 'back');

  
  L.wall(1, 31, 258, 280).slick(1, 31, 258, 280);
  L.wall(35, 45, 262, 284).slick(35, 45, 262, 284);
  tag('P1', L.putAt('plug', 33, 270, { tag: 'P1', circuit: 'cpu-fan', name: 'CPU fan plug', ...SURGE, use: 'M1' }));
  L.landmarkAt('CPU cooler', 18, 280);

  
  L.wall(31, 45, 246, 250);
  L.wall(6, 31, 244, 248).spark(6, 31, 248, 248.5);
  for (const [x0, x1, top] of [
    [27, 29, 251],
    [22.5, 24, 253],
    [18, 19.5, 252],
    [13, 14.5, 254],
    [8.5, 10, 252],
  ])
    L.wall(x0, x1, 248, top).slick(x0, x1, 248, top);
  L.wall(3.5, 6, 244, 250);
  L.putAt('dustmite', 23.2, 253, CREW('cpu-fan', 'M1', { facing: -1, patrol: [22.5, 24] }));
  L.putAt('dustmite', 13.7, 254, CREW('cpu-fan', 'M1', { facing: -1, patrol: [13, 14.5] }));

  
  L.wall(1, 9, 222, 232).wall(9, 39, 220, 222).wall(39, 41, 220, 232).slick(39, 41, 220, 232);
  L.packetLane(
    'L12-L1',
    [
      [9, 232],
      [40.5, 232],
    ],
    { speed: 6.5, period: 2.0, w: 3 },
  );
  L.packetLane(
    'L12-L2',
    [
      [39, 235],
      [9, 235],
    ],
    { speed: 5, period: 2.0, w: 3 },
  );
  L.putAt('dustmite', 39, 235, {
    specimen: true,
    name: 'Packet Rider',
    rides: 'L12-L2',
    every: 4,
    lead: false,
    signals: ['visual:gold-packet', 'audio:tiny-whee'],
    seenFrom: 'riding lane L1: she passes 3 u overhead the other way',
  });
  L.beaconAt(40, 232);
  L.landmarkAt('Memory bus', 23, 232, 'back');

  
  L.wall(1, 41, 198, 222);

  
  L.wall(4, 45, 181, 192); 
  tag('P2', L.putAt('plug', 37, 196.5, { tag: 'P2', circuit: 'fan-hub', name: 'Fan hub plug', ...SURGE, use: 'M2' }));
  for (const x of [30, 24, 18]) L.putAt('dustmite', x, 192, CREW('fan-hub', 'M2', { facing: 1 }));
  L.landmarkAt('Break room', 10, 192, 'back');

  
  L.wall(1, 5, 174, 178);
  L.wall(5, 40, 170, 174).spark(5, 40, 174, 174.5);
  L.wall(22, 24, 174, 178).slick(22, 24, 174, 178);
  L.packetLane(
    'L12-L3',
    [
      [5, 178],
      [23.5, 178],
    ],
    { speed: 7.5, period: 1.6, w: 3 },
  );
  L.packetLane(
    'L12-L4',
    [
      [24, 178],
      [41.5, 178],
    ],
    { speed: 7.5, period: 1.6, offset: 0.8, w: 3 },
  );
  L.wall(40, 43, 170, 178).slick(40, 43, 170, 178); 
  L.beaconAt(41.5, 178);

  
  L.wall(40, 45, 161, 166);
  L.wall(1, 8, 148, 170);
  L.wall(8, 40, 148, 152).spark(8, 40, 152, 152.5);
  L.packetLane(
    'L12-S1',
    [
      [40, 166],
      [8, 166],
    ],
    { speed: 7.5, period: 1.8, w: 3 },
  );
  L.packetLane(
    'L12-S2',
    [
      [8, 159],
      [43, 159],
    ],
    { speed: 7.5, period: 1.8, offset: 0.9, w: 3 },
  );
  L.cameraHint(8, 45, { dy: -3, y0: 150, y1: 170 });
  L.landmarkAt('Switchboard', 24, 160, 'back');

  
  L.wall(1, 45, 124, 132).slick(1, 45, 124, 132);
  L.carve(3, 9, 124, 132).fanAt(3, 9, 131.5, 132, { axis: 'x', blade: 3, gap: 2, speed: 3, id: 'F2', stopOn: 'gpu-power' });
  L.carve(11, 17, 124, 132).fanAt(11, 17, 131.5, 132, { axis: 'x', blade: 2.5, gap: 2, speed: 6, id: 'F3', stopOn: 'gpu-power' });
  L.landmarkAt('Graphics card', 24, 132);
  tag('P3', L.putAt('plug', 10, 120, { tag: 'P3', circuit: 'gpu-power', name: 'GPU power plug', ...SURGE, use: 'M3' }));
  L.wall(1, 23, 104, 108);
  L.putAt('dustmite', 4, 108, CREW('gpu-power', 'M3', { facing: -1, patrol: [1, 9] }));
  L.putAt('dustmite', 20, 108, CREW('gpu-power', 'M3', { facing: 1, patrol: [16, 23] }));
  L.putAt('dustmite', 40, 112, CREW('gpu-power', 'M3', { facing: -1, patrol: [39, 41] }));
  L.putAt('dustmite', 42.5, 72, CREW('gpu-power', 'M3', { facing: 1, patrol: [39.5, 44.5] }));

  
  L.wall(23, 39, 96, 100).spark(23, 39, 100, 100.5);
  tag('T1', L.putAt('hook', 28, 115, { tag: 'T1', name: 'cable tie', required: true }));
  tag('T2', L.putAt('hook', 33.5, 116, { tag: 'T2', name: 'cable tie', required: true }));
  tag('T3', L.putAt('hook', 38.5, 117, { tag: 'T3', name: 'cable tie', required: true }));
  L.wall(39, 41, 108, 112).slick(39, 41, 108, 112); 

  
  L.wall(1, 39, 72, 96);
  L.packetLane(
    'L12-D',
    [
      [42, 112],
      [43.5, 112],
      [43.5, 95],
      [40.5, 92],
      [40.5, 86],
      [43.5, 83],
      [43.5, 72],
    ],
    { speed: 6.5, period: 2.2, w: 2 },
  );
  L.spark(39, 42, 95.5, 96.5).spark(42, 45, 88, 89).spark(39, 42, 80.5, 81.5);
  L.wall(39, 45, 68, 72);
  L.beaconAt(41, 72);
  L.cameraHint(39, 46, { dy: -3, y0: 72, y1: 112 });

  
  L.fanAt(45, 46, 72, 78, { axis: 'y', blade: 3, gap: 3, speed: 3, id: 'F5' });
  L.fanAt(45, 46, 52, 58, { axis: 'y', blade: 3, gap: 3, speed: 3, id: 'F6' });
  L.wall(48, 49, 73.5, 74);
  L.putAt('intel', 48.5, 74, {
    secret: 'cache',
    name: 'A torn Vast warranty sticker',
    signals: ['visual:amber-glint', 'audio:hollow-knock'],
    seenFrom: 'the chute ride, through the upper front fan F7 (y 82-92)',
  });
  L.landmarkAt('Front cavity', 47.5, 70, 'mid');

  
  L.wall(30, 45, 46, 52).slick(30, 45, 46, 52);
  L.spin(30, 45, 52, { vx: -5 });
  L.putAt('readArm', 44, 52, { x0: 44, x1: 31, speed: 8, w: 0.8, h: 0.6, shove: 6 });
  L.landmarkAt('Hard drive', 37, 52);

  
  L.wall(20, 26, 45.5, 46).slick(20, 26, 45.5, 46);
  L.wall(26, 45, 24, 46);
  L.wall(10, 20, 41.5, 42).slick(10, 20, 41.5, 42);
  L.wall(2, 8, 36, 40).slick(2, 8, 36, 40);
  L.putAt('dustmite', 27, 46, { crew: true, lead: false, patrol: [20, 30] });
  L.putAt('dustmite', 23, 46, { crew: true, lead: false, patrol: [20, 30] });
  L.putAt('dustmite', 15, 42, { crew: true, lead: false, patrol: [10, 20] });
  L.putAt('hook', 15, 54, { tag: 'K1', name: 'crane hook' });
  L.landmarkAt('Crew site', 15, 46, 'back');

  
  const shrouds = [
    [9, 11, 36],
    [12.5, 14.5, 33],
    [16, 18, 30],
    [19.5, 21.5, 27],
    [23, 25, 24],
  ];
  for (const [x0, x1, top] of shrouds) L.wall(x0, x1, 20, top).slick(x0, x1, 20, top);
  L.spark(8, 25, 20, 20.5);
  for (const [i, [x0, x1]] of [
    [11, 12.5],
    [14.5, 16],
    [18, 19.5],
    [21.5, 23],
  ].entries())
    L.spark(x0, x1, 20.5, shrouds[i + 1][2] + 3, { pulse: { on: 0.6, off: 1.0, phase: 0.4 * i } });
  L.wall(1, 45, 16, 20);
  L.wall(36, 45, 2, 24);
  L.putAt('plug', 31, 23.5, { dud: true, name: 'Power switch header' }); 
  L.beaconAt(28, 20);

  
  L.carve(30, 36, 16, 20).fanAt(30, 36, 19.5, 20, { axis: 'x', blade: 3, gap: 2, speed: 4, id: 'F4' });
  L.cameraHint(1, 36, { frame: { x0: 1, x1: 36, y0: 2, y1: 16 }, y0: 2, y1: 16 });

  
  L.wall(1, 36, 0, 2);
  L.wall(1, 12, 2, 6).slick(1, 12, 2, 6);
  L.fanAt(13.5, 18.5, 1.5, 2, { axis: 'x', blade: 0.8, gap: 0.4, speed: 6, id: 'FB' });
  const cable = (k, x, y) => {
    const circuit = `L12-cable-${k.toLowerCase()}`;
    L.circuit(circuit, [
      [x, y],
      [x, 3.5],
    ]);
    const plug = L.putAt('plug', x, y, { tag: k, circuit, name: k === 'MAIN' ? 'MAIN 24-pin' : `Cable ${k} joint`, reseat: 2.5 });
    return { x, plug: plug.id, circuit };
  };
  const cables = { A: cable('A', 20, 12.5), B: cable('B', 24.5, 12.5), C: cable('C', 29, 12.5), MAIN: cable('MAIN', 33, 13) };
  const DEED = 'L12-intel-2';
  L.putAt('intel', 6, 6, {
    id: DEED,
    alive: false,
    secret: 'deed',
    name: "The crew's safety board",
    condition: { noDamageInPhase: 1 },
    signals: ['visual:gold-glint', 'audio:glint-chime'],
    seenFrom: 'the F4 drop into the arena (the board on the PSU)',
  });
  L.putAt('boss', 23, 2, {
    type: 'matriarch',
    name: 'Dustmite Matriarch',
    w: 3.5,
    h: 3,
    arena: { x0: 1, x1: 36, y0: 2, y1: 16 },
    respawn: { x: 31, y: 2 },
    cables,
    fan: { x0: 13.5, x1: 18.5 },
    nest: 23,
    psu: 12,
    bolt: { x: 6, y: 12 },
    floor: 2,
    phases: [
      {
        name: 'Hard Hat Area',
        hp: 3,
        use: 'M4',
        ...SURGE,
        spawn: { x: 31, y: 2 },
        attacks: [
          { name: 'plugIn', telegraph: 0.8, active: 3.0, recover: 0.8 },
          { name: 'dustRoll', telegraph: 0.8, active: 2.2, recover: 0.8 },
        ],
        order: ['A', 'C', 'B'],
        weakness: 'stomp',
      },
      {
        name: 'Dust Storm',
        hp: 3,
        deed: DEED,
        intro: 1.5,
        spawn: { x: 31, y: 2 },
        attacks: [
          { name: 'bigRoll', telegraph: 0.9, active: 1.6, recover: 2.5 },
          { name: 'bunnyToss', telegraph: 0.7, active: 0.6, recover: 0.8 },
        ],
        weakness: 'stomp',
      },
      {
        name: 'Lights Out',
        hp: 1,
        use: 'M5',
        ...SURGE,
        intro: 1.5,
        spawn: { x: 31, y: 2 },
        attacks: [{ name: 'fullPower', telegraph: 1.2, active: 1.4, recover: 0.6 }],
        weakness: 'stomp',
      },
    ],
  });
  L.beaconAt(31, 2, { phase: 'L12-boss-1:1' });
  L.beaconAt(31, 2, { phase: 'L12-boss-1:2' });
  L.landmarkAt('Basement', 18, 2);

  
  L.putAt('finish', 23, 2, { alive: false, bossGate: 'L12-boss-1', axis: 'y', delay: 1.5, name: 'Flight recorder' });

  const level = L.build();
  level.waypoints = route(ids);
  level.plugTags = ids;
  
  level.packetBeats = [
    { name: 'the memory bus', from: { x: 8.5, y: 232 }, goal: { x0: 39, y: 232, dir: 1 } },
    { name: 'the PCIe tunnel (latch to chip)', from: { x: 4.5, y: 178 }, goal: { x0: 22, y: 178, dir: 1 } },
    { name: 'the PCIe tunnel (chip to ledge)', from: { x: 23.5, y: 178 }, goal: { x0: 40, y: 178, dir: 1 } },
  ];
  
  level.drops = [
    { name: 'F1 into the cooler slot', x: 33, y: 291.5 },
    { name: 'the forest rear hole', x: 2.2, y: 248 },
    { name: 'the bus lane end', x: 40.5, y: 232 },
    { name: 'down the RAM side', x: 43, y: 231 },
    { name: 'the break room rear hole', x: 2.5, y: 191 },
    { name: 'the PCIe ledge end', x: 44, y: 177 },
    { name: 'the switchboard exit chute', x: 42.5, y: 158 },
    { name: 'F2', x: 6, y: 131.5 },
    { name: 'F3', x: 14, y: 131.5 },
    { name: 'the chute end', x: 43, y: 72.5 },
    { name: 'through F5 down the cavity', x: 47.5, y: 72 },
    { name: 'the header row into the door room', x: 26, y: 23.9, w: 0.75 }, 
    { name: 'F4 into the basement', x: 33, y: 16 },
  ];
  return level;
}


function route(I) {
  const T = (t, at, x, y, extra = {}) => ({ x, y, move: 'tether', hook: I[t], ...(at !== null ? { at } : {}), ...extra });
  const chain = (t, next) => ({ hook: I[t], next: I[next] });
  const beat = (fx, fy, x0, y) => ({ beat: { from: { x: fx, y: fy }, goal: { x0, y, dir: 1 } } });
  return [
    { x: 30.2, y: 292, move: 'walk' }, 
    { x: 33, y: 250, move: 'drop', at: 30.2, yank: I.P1 }, 
    { x: 28, y: 251, move: 'jump' }, 
    { x: 23.2, y: 253, move: 'jump' },
    { x: 18.7, y: 252, move: 'jump' },
    { x: 13.7, y: 254, move: 'jump' },
    { x: 9.2, y: 252, move: 'jump' },
    { x: 4.5, y: 250, move: 'jump' },
    { x: 2.2, y: 232, move: 'walk' }, 
    { x: 40, y: 232, move: 'packet', lane: 'L12-L1', at: 8.5, board: 1 }, 
    { x: 43, y: 192, move: 'walk' }, 
    { x: 38.5, y: 192, move: 'jump', yank: I.P2 }, 
    { x: 2.5, y: 178, move: 'walk' }, 
    { x: 23, y: 178, move: 'packet', lane: 'L12-L3', at: 4.5, board: 1 }, 
    { x: 41.5, y: 178, move: 'packet', lane: 'L12-L4', at: 23.2, board: 1 }, 
    { x: 43.5, y: 166, move: 'walk' }, 
    {
      x: 30,
      y: 159,
      move: 'packet',
      lane: 'L12-S1',
      at: 41.5,
      board: -1,
      leave: 'search',
      toLane: 'L12-S2',
      via: { leaveMax: 4.2, dx: [0] },
    },
    { x: 42, y: 132, move: 'packet', lane: 'L12-S2', board: 1 }, 
    { x: 17.4, y: 132, move: 'walk' }, 
    { x: 14, y: 108, move: 'drop', at: 17.4, yank: I.P3 }, 
    { ...T('T1', 22.6, 0, 0, beat(22.6, 108, 39, 112)), ...chain('T1', 'T2') }, 
    { ...T('T2', null, 0, 0), ...chain('T2', 'T3') },
    T('T3', null, 40, 112),
    { x: 41, y: 72, move: 'packet', lane: 'L12-D', at: 40.6, board: 1, maxS: 12 }, 
    { x: 47.5, y: 52, move: 'drop', at: 44.6, via: { waitMax: 2.1 } }, 
    { x: 44, y: 52, move: 'drop', at: 46.4, via: { waitMax: 2.1 } }, 
    { x: 30.5, y: 52, move: 'walk' }, 
    { x: 21, y: 46, move: 'jump', via: { hopFoes: true } }, 
    { x: 11, y: 42, move: 'jump', via: { hopFoes: true } },
    { x: 5, y: 40, move: 'jump' },
    { x: 10, y: 36, move: 'jump' }, 
    { x: 13.5, y: 33, move: 'drop', at: 10.7, via: { waitMax: 1.6 } },
    { x: 17, y: 30, move: 'drop', at: 14.2, via: { waitMax: 1.6 } },
    { x: 20.5, y: 27, move: 'drop', at: 17.7, via: { waitMax: 1.6 } },
    { x: 24, y: 24, move: 'drop', at: 21.2, via: { waitMax: 1.6 } },
    { x: 28, y: 20, move: 'walk' }, 
    { x: 33, y: 2, move: 'drop', at: 29.7 }, 
    { x: 23, y: 2, move: 'boss' }, 
  ];
}
