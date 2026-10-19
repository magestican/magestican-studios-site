












































import { levelBuilder } from './dsl.js';

const COW = { motif: 'cow-catcher' };

export function buildL13() {
  const L = levelBuilder({ id: 13, name: 'Crumb Express', mode: 'train', floor: { w: 285, h: 150 }, pitCost: 'heart' });
  const hx = 150 / 170;
  const hy = -80 / 170;
  const nx = -hy; 
  const ny = hx;
  const add = (p, k, d = [hx, hy]) => [p[0] + k * d[0], p[1] + k * d[1]];

  
  
  L.rail('ST', [0, 130], ['line', 48, 130]);
  L.rail('ST-low', [22, 130], ['line', 26, 126, 9], ['line', 34, 126, 9], ['line', 38, 130]);
  
  const sq = Math.SQRT1_2;
  const m = (10 - 6 * sq) / -hy;
  const sbA = 75 - m * hx - 6 * sq;
  L.rail('ST2', [48, 130], ['line', sbA, 130, 6], ['line', sbA + 6 * sq, 130 - 6 * sq, 6], ['line', 75, 120]);
  
  L.rail('D1', [75, 120], ['line', 225, 40]);
  const R = 32;
  const ec = [225 + R * nx, 40 + R * ny];
  L.rail('E', [225, 40], ['arc', ec[0], ec[1], 180 + (2 * (Math.atan2(80, 150) * 180)) / Math.PI]);
  const d2s = [225, 40 + 2 * R * ny];
  L.rail('D2', d2s, ['line', d2s[0] - 150, d2s[1] - 80]);
  const d2e = [d2s[0] - 150, d2s[1] - 80];
  
  
  const tl1 = add(d2e, 8, [-hx, hy]);
  const tlEnd = add([75, 120], -10);
  L.rail(
    'TL',
    d2e,
    ['line', tl1[0], tl1[1], 10],
    ['line', 24, tl1[1], 6],
    ['line', 24, 84, 6],
    ['line', 32, 92, 6],
    ['line', 32, tlEnd[1], 8],
    ['line', tlEnd[0], tlEnd[1], 10],
    ['line', 75, 120],
  );
  
  
  const sp1 = add([225, 40], 22);
  L.rail('SP', [225, 40], ['line', sp1[0], sp1[1], 12], ['line', 277, sp1[1]], { buffer: true });
  
  const eAt = (s) => L.onRail('E', s);
  const inward = (s, k) => {
    const [px, py] = eAt(s);
    const d = Math.hypot(ec[0] - px, ec[1] - py);
    return [px + ((ec[0] - px) * k) / d, py + ((ec[1] - py) * k) / d];
  };
  const by1 = inward(31, 4);
  const by2 = inward(42, 4);
  const byEnd = eAt(52);
  L.rail('E-by', eAt(21), ['line', by1[0], by1[1], 6], ['line', by2[0], by2[1], 6], ['line', byEnd[0], byEnd[1]]);
  
  const ringC = inward(79, 15);
  const ringIn = eAt(68);
  const ringOut = eAt(90);
  const a0 = Math.atan2(ringIn[1] - ringC[1], ringIn[0] - ringC[0]);
  const corner = (deg) => [ringC[0] + 10 * Math.cos(a0 - (deg * Math.PI) / 180), ringC[1] + 10 * Math.sin(a0 - (deg * Math.PI) / 180)];
  const [rc1, rc2, rc3] = [corner(50), corner(150), corner(250)];
  L.rail(
    'RING',
    ringIn,
    ['line', rc1[0], rc1[1], 7],
    ['line', rc2[0], rc2[1], 7],
    ['line', rc3[0], rc3[1], 7],
    ['line', ringOut[0], ringOut[1]],
  );
  
  const campIn = eAt(112);
  const campM = [campIn[0] - 12, campIn[1] + 1.5];
  const campOut = L.onRail('D2', 14);
  L.rail('CAMP', campIn, ['line', campM[0], campM[1], 10], ['line', campOut[0], campOut[1]]);
  
  const sid = (s, k) => add(L.onRail('D1', s), k, [nx, ny]);
  const sd1 = sid(68, 6);
  const sd2 = sid(78, 6);
  const sdEnd = L.onRail('D1', 84);
  L.rail('D1-sid', L.onRail('D1', 62), ['line', sd1[0], sd1[1], 7], ['line', sd2[0], sd2[1], 7], ['line', sdEnd[0], sdEnd[1]]);

  
  L.points('J0', { rail: 'ST', s: 22, a: 'ST', b: 'ST-low', set: 'a' });
  L.points('J7', { rail: 'D1', s: 62, a: 'D1', b: 'D1-sid', set: 'a', knock: true, lever: true }); 
  L.points('J3', { rail: 'D1', s: 170, a: 'E', b: 'SP', set: 'a' });
  L.points('J5', { rail: 'E', s: 21, a: 'E', b: 'E-by', set: 'a' });
  L.points('J8', { rail: 'E', s: 68, a: 'E', b: 'RING', set: 'a' });
  L.points('J6', { rail: 'E', s: 112, a: 'CAMP', b: 'E', set: 'a' });
  L.diamond('X', { a: 'D1', b: 'D2' });
  L.signal('S-J3', { points: 'J3', lockUntil: 'hopper', set: 'b', sign: 'BACK DOOR - CLOSED - PARTS FIRST' });
  L.trainAt('ST', 12);
  L.station('DJ', 'ST', 12, { beacon: false, sign: 'DESK JUNCTION' });

  
  const kit = [
    ['double', 'Thruster coil'],
    ['pound', 'Pound plates'],
    ['dash', 'Dash spring'],
    ['glide', 'Broad leaf'],
    ['wall', 'Wax grips'],
    ['tether', 'Paperclip hook'],
  ];
  for (const [i, [grant, name]] of kit.entries()) L.putAt('ability', 9.5 + 0.2 * i, 129.6, { grant, name });
  L.prop('pcTower', 0, 24, 134, 150, { z: 60, dark: true });
  L.prop('crayonMap', 12, 16, 132, 134, { z: 0.1, text: 'KITCHEN -> TABLE -> BACK DOOR' });
  L.landmarkAt('PC tower', 12, 142);

  
  L.prop('eraser', 27, 33, 127, 129, { z: 2 });
  L.putAt('windupKey', ...L.onRail('ST-low', 9.5), { rail: 'ST-low', s: 9.5, name: 'Wind-up Key' });

  
  L.prop('threshold', 46, 50, 100, 150, { z: 0.3, look: 'brass' });
  L.landmarkAt('Door', 48, 130);

  
  L.chevrons('ST2', 6, 22);

  
  for (const s of [20, 24]) L.putAt('bandit', ...L.onRail('D1', s), { rail: 'D1', s, stance: 'stand', facing: 'away', ...COW, use: 'M1' });
  L.prop('crumb', 97, 99, 107, 109, { z: 0.6 });

  
  const p1 = L.onRail('D1', 48);
  L.pea('P1', { from: add(p1, -3.5, [nx, ny]), to: add(p1, 12, [nx, ny]), speed: 3, start: 'D1:s30' });
  const lv = add(L.onRail('D1', 54), -3.3, [nx, ny]);
  L.putAt('hook', lv[0], lv[1], { lever: 'J7', name: 'siding lever' });
  L.prop('sugarCanister', 128, 140, 104, 114, { z: 14 });

  
  L.prop('cerealSpill', 150, 194, 52, 88, { z: 1.5, flakes: 24 });
  L.landmarkAt('Cereal spill', 172, 68);

  
  L.putAt('pillbug', ...L.onRail('D1', 165), { rail: 'D1', s: 165, roll: { toward: 'train', speed: 4, wakeTrack: 32 }, ...COW, use: 'M2' });
  for (const s of [158, 162]) L.putAt('bandit', ...L.onRail('D1', s), { rail: 'D1', s, stance: 'bowler', ...COW, use: 'M2' });

  
  L.putAt('windupKey', ...L.onRail('D1', 135), { rail: 'D1', s: 135, name: 'Wind-up Key' });
  L.putAt('bandit', ...add(L.onRail('D1', 146), 4, [nx, ny]), { stance: 'hopAt', lands: 'behind' });
  L.prop('backDoor', 281, 285, 16, 56, { z: 80, catFlap: [28, 44] });
  L.prop('fireflyJar', 278, 280, 40, 42, { z: 3 });
  L.landmarkAt('Back door', 283, 36);

  
  L.station('CK1', 'E', 8, { sign: 'TILE STATION' });

  
  L.debris('E', 38, 41, { id: 'fork', name: 'fork', mark: 'crayonX', rerail: 'E-by:s20' });
  L.chevrons('E-by', 0, 34);

  
  L.prop('doughnut', ringC[0] - 6, ringC[0] + 6, ringC[1] - 6, ringC[1] + 6, { z: 4 });
  const far = L.onRail('RING', L.railLength('RING') / 2); 
  L.putAt('intel', far[0], far[1], {
    rail: 'RING',
    secret: 'deed',
    name: 'The Golden Ticket',
    signals: ['visual:gold-glint', 'audio:glint-chime'],
    signalRange: 15,
    seenFrom: 'the east curve start (E s 0-30): across the infield',
  });
  const pr = corner(200);
  L.pea('PR', { from: add(pr, -4, [1, 0]), to: add(pr, 4, [1, 0]), speed: 3, period: 2.0 }); 
  L.landmarkAt('Doughnut', ringC[0], ringC[1]);

  
  for (const s of [16, 19, 22, 25]) L.putAt('bandit', ...L.onRail('CAMP', s), { rail: 'CAMP', s, stance: 'sit', ...COW, use: 'M3' });
  L.prop('sugarCubes', 214, 230, 106, 112, { z: 6 });

  
  L.putAt('shellShield', ...L.onRail('D2', 32), { rail: 'D2', s: 32, name: 'Shell Shield' });

  
  const k = 80 / 150; 
  const xd = (120 - d2s[1] + 300 * k) / (2 * k);
  const yd = 120 - k * (xd - 75);
  L.pea('P2', { from: [xd, yd + 10], to: [xd, yd - 16], speed: 3, period: 2.4, phase: 1.917, count: 5, start: 'D2:s20' });
  L.prop('peaBowl', xd - 4, xd + 4, 79, 84, { z: 3, tipped: true });

  
  L.station('CK2', 'D2', 110, { sign: 'DIAMOND HALT' });

  
  L.putAt('cricket', 45, 8.7, {
    specimen: true,
    name: 'The Caboose Cricket',
    scan: { maxSpeed: 4 },
    signals: ['audio:fiddle-tune', 'visual:gold-cap'],
    signalRange: 30,
    seenFrom: 'the end of D2 (s 140-170): her tune and cap across the floor',
  });
  L.prop('caboose', 42, 48, 5, 8.7, { z: 3 });

  
  for (const [x0, y0] of [
    [27, 16],
    [62, 16],
    [26, 110],
    [62, 110],
  ])
    L.prop('tableLeg', x0, x0 + 5, y0, y0 + 5, { z: 120 }); 
  L.prop('tableShadow', 10, 72, 10, 126, { shade: 0.35 });
  L.putAt('windupKey', ...L.onRail('TL', 22), { rail: 'TL', s: 22, name: 'Wind-up Key' });
  L.landmarkAt('Kitchen table', 42, 72);

  
  const cj = 108; 
  L.station('CJ', 'TL', cj, { beacon: false, sign: 'CRUMB JUNCTION' });
  L.putAt('hopper', ...L.onRail('TL', cj), { id: 'L13-hopper-1', rail: 'TL', s: cj, couple: true, name: 'Ship parts' });

  
  L.chevrons('TL', 46, 58).chevrons('TL', 117, 135);
  L.putAt('bandit', 19, 88, { stance: 'hopAt', ...COW, use: 'M4' });
  L.putAt('bandit', 37, 97, { stance: 'hopAt', ...COW, use: 'M4' });
  L.prop('chairLeg', 14, 18, 84, 94, { z: 90 });
  L.prop('chairLeg', 37, 41, 90, 100, { z: 90 });

  
  const m4 = 139; 
  for (let i = 0; i < 5; i++) {
    const s = m4 + 1.5 * i;
    L.putAt('bandit', ...L.onRail('TL', s), {
      rail: 'TL',
      s,
      stance: 'stand',
      facing: 'train',
      ...(i === 0 ? { sign: 'STOP' } : {}),
      ...COW,
      use: 'M4',
    });
  }
  L.prop('wantedPoster', 26, 30, 112, 118, { text: 'WANTED: THE CRUMB EXPRESS' });

  
  L.station('CK3', 'TL', 176, { sign: 'TABLE HALT', coupled: true, passes: { D1: 1 } });

  
  L.putAt('sparkWheels', ...L.onRail('D1', 86), { rail: 'D1', s: 86, pass: 2, name: 'Spark Wheels' }); 
  const cache = add(L.onRail('D1', 73), 6, [nx, ny]);
  L.putAt('intel', cache[0], cache[1], {
    rail: 'D1-sid',
    secret: 'cache',
    name: "The kid's crayon timetable",
    signals: ['visual:amber-glint', 'audio:hollow-knock'],
    signalRange: 14,
    seenFrom: 'lap one on D1 (s 45-70): the glint behind the canister and the hollow knock at J7',
  });
  L.pea('P3', { from: [xd, yd + 10], to: [xd, yd - 16], speed: 3, period: 1.8, count: 8, start: 'D1:s20:2' });

  
  for (const s of [20, 21.5, 23, 27, 28.5, 30])
    L.putAt('bandit', ...L.onRail('SP', s), { rail: 'SP', s, stance: 'stand', facing: 'train', ...COW, use: 'M5' });
  L.putAt('handcar', ...L.onRail('SP', 25), { rail: 'SP', s: 25, ...COW, use: 'M5' });
  L.prop('cerealBoxes', 248, 256, 33, 40, { z: 8, breakable: true });

  
  const end = L.railLength('SP') - 1;
  L.putAt('finish', ...L.onRail('SP', end), { rail: 'SP', s: end, name: 'Back Door station', bufferStop: true });

  const level = L.build();
  
  level.trainPlan = { points: { J0: 'b', J7: 'a', J5: 'b', J8: 'a', J6: 'a', J3: 'b' }, boost: 'auto' };
  return level;
}
