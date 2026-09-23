



































import { SeededRng } from '../../rng/seededRng.js';
import { roomPlan, SPECIES } from './villagerHome.mjs';

export { SPECIES };

export const INTERIOR = Object.freeze({
  minW: 8.0,
  minD: 6.2,
  
  cutH: 0.52,
  
  partT: 0.12,
  
  doorwayW: 0.95,
  doorwayHeadM: 0.14,
  doorwayMaxH: 2.0,
  
  minSideW: 2.6,
  
  floorInset: 0.22,
  
  doorwayClearM: 0.9,
  
  outerWallM: 0.25,
});

export const ROOM_NAMES = Object.freeze(['hall', 'kitchen', 'bathroom', 'bedroom']);



export const ROOM_FIXTURES = Object.freeze({
  hall: ['door', 'window', 'rug', 'lamp'],
  kitchen: ['stove', 'sink', 'counter', 'table', 'stool', 'stool', 'shelf'],
  bathroom: ['tub', 'basin', 'mirror', 'towelRail', 'window'],
  bedroom: ['bed', 'wardrobe', 'bedside', 'rug'],
});


export const FIXTURE_SIZE = Object.freeze({
  stove: { w: 0.8, d: 0.62, h: 0.85 },
  counter: { w: 1.5, d: 0.6, h: 0.88 },
  shelf: { w: 1.0, d: 0.26, h: 0.3 },
  table: { w: 1.15, d: 0.72, h: 0.74 },
  stool: { w: 0.4, d: 0.4, h: 0.46 },
  tub: { w: 1.55, d: 0.74, h: 0.58 },
  basin: { w: 0.56, d: 0.44, h: 0.86 },
  mirror: { w: 0.5, d: 0.05, h: 0.62 },
  towelRail: { w: 0.62, d: 0.1, h: 0.5 },
  bed: { w: 1.25, d: 2.0, h: 0.9 },
  wardrobe: { w: 1.0, d: 0.56, h: 1.8 },
  bedside: { w: 0.44, d: 0.38, h: 0.52 },
  lamp: { w: 0.26, d: 0.26, h: 1.5 },
  window: { w: 0.6, d: 0.08, h: 0.7 },
  rug: { w: 1.6, d: 1.1, h: 0.02 },
});

const r3 = (v) => Math.round(v * 1000) / 1000;
const TURN = Object.freeze({ '0,1': 0, '0,-1': Math.PI, '1,0': Math.PI / 2, '-1,0': -Math.PI / 2 });


function rect(name, x0, x1, z0, z1) {
  return Object.freeze({ name, x0: r3(x0), x1: r3(x1), z0: r3(z0), z1: r3(z1), x: r3((x0 + x1) / 2), z: r3((z0 + z1) / 2), hx: r3((x1 - x0) / 2), hz: r3((z1 - z0) / 2) });
}







function against(kind, room, n, face, along, size, extra = {}) {
  const { w, d } = size;
  const rotY = TURN[`${n[0]},${n[1]}`];
  const alongZ = n[0] !== 0;
  const x = alongZ ? face + n[0] * d / 2 : along;
  const z = alongZ ? along : face + n[1] * d / 2;
  return Object.freeze({
    kind, room, x: r3(x), z: r3(z), rotY, w, d, h: size.h,
    hx: r3(alongZ ? d / 2 : w / 2), hz: r3(alongZ ? w / 2 : d / 2), y: 0, onWall: false, ...extra,
  });
}

function free(kind, room, x, z, size, rotY = 0, extra = {}) {
  const c = Math.abs(Math.cos(rotY)), s = Math.abs(Math.sin(rotY));
  return Object.freeze({
    kind, room, x: r3(x), z: r3(z), rotY, w: size.w, d: size.d, h: size.h,
    hx: r3((size.w * c + size.d * s) / 2), hz: r3((size.w * s + size.d * c) / 2), y: 0, onWall: false, ...extra,
  });
}


export function interiorPlan({ seed = 1, species = 'human' } = {}) {
  if (!SPECIES.includes(species)) throw new Error(`unknown house species '${species}' (species: ${SPECIES.join(', ')})`);
  const I = INTERIOR;
  const p = roomPlan({ seed, species });
  const rng = new SeededRng(seed).child(`interiorPlan-${species}`);
  const door = p.door;
  const aspect = p.hx / p.hz;
  const PT = I.partT, H = p.wallH;

  
  const D = r3(I.minD + rng.rangeF(0, 0.5));
  const hallW = rng.rangeF(2.2, 2.55);
  
  
  
  const minOff = door.w / 2 + 0.3, maxOff = hallW - door.w / 2 - 0.3;
  const off = minOff + (maxOff - minOff) * rng.rangeF(0.15, 0.85);
  let W = Math.max(I.minW + rng.rangeF(0, 0.35), D * aspect * 1.04);
  
  
  
  W = Math.max(W, 2 * (I.minSideW + off - door.x + PT / 2), 2 * (I.minSideW + hallW + PT / 2 - off + door.x));
  W = r3(W);
  const hx = r3(W / 2), hz = r3(D / 2);
  const xa = r3(door.x - off);             
  const xb = r3(xa + hallW);               

  
  const k = rng.next() < 0.5 ? -1 : 1;
  const bathD = rng.rangeF(2.3, 2.65);
  const hall = rect('hall', xa + PT / 2, xb - PT / 2, -hz, hz);
  const kitchen = k < 0 ? rect('kitchen', -hx, xa - PT / 2, -hz, hz) : rect('kitchen', xb + PT / 2, hx, -hz, hz);
  const sx0 = k < 0 ? xb + PT / 2 : -hx, sx1 = k < 0 ? hx : xa - PT / 2;
  const zs = r3(-hz + bathD);              
  const bathroom = rect('bathroom', sx0, sx1, -hz, zs - PT / 2);
  const bedroom = rect('bedroom', sx0, sx1, zs + PT / 2, hz);
  const rooms = Object.freeze({ hall, kitchen, bathroom, bedroom });

  
  const kWall = k < 0 ? xa : xb;           
  const sWall = k < 0 ? xb : xa;           
  const kOut = k * hx, sOut = -k * hx;     
  const nK = [-k, 0], nS = [k, 0];         
  const S = FIXTURE_SIZE;
  const fx = [];

  
  
  
  const stoveFirst = rng.next() < 0.5;
  const cW = r3(Math.min(S.counter.w + rng.rangeF(-0.2, 0.15), kitchen.hx * 2 - S.stove.w - 0.35));
  const counterS = { ...S.counter, w: cW };
  const inward = -k;                        
  const a0 = kOut + inward * 0.04;
  const first = stoveFirst ? S.stove : counterS, second = stoveFirst ? counterS : S.stove;
  const c1 = a0 + inward * first.w / 2, c2 = a0 + inward * (first.w + 0.05 + second.w / 2);
  const stoveX = stoveFirst ? c1 : c2, counterX = stoveFirst ? c2 : c1;
  fx.push(against('stove', 'kitchen', [0, 1], -hz, stoveX, S.stove));
  const sinkAt = r3(rng.rangeF(-0.18, 0.18) * cW);
  fx.push(against('counter', 'kitchen', [0, 1], -hz, counterX, counterS, { sinkAt }));
  fx.push(against('sink', 'kitchen', [0, 1], -hz, counterX + sinkAt, { w: 0.5, d: 0.4, h: counterS.h }, { part: 'counter' }));
  fx.push(against('shelf', 'kitchen', [0, 1], -hz, counterX + rng.rangeF(-0.1, 0.1), S.shelf, { onWall: true, y: r3(Math.min(1.35, H - 0.4)) }));
  const tz = r3(hz - 1.15 - rng.rangeF(0, 0.35));
  const tx = r3(kitchen.x + rng.rangeF(-0.12, 0.12));
  const tableTurn = rng.rangeF(-0.06, 0.06);
  fx.push(free('table', 'kitchen', tx, tz, S.table, tableTurn));
  const sGap = S.table.w / 2 + 0.24;
  
  fx.push(free('stool', 'kitchen', tx - sGap - rng.rangeF(0, 0.06), tz + rng.rangeF(-0.12, 0.05), S.stool, 0, { spin: rng.rangeF(0, 1) }));
  fx.push(free('stool', 'kitchen', tx + sGap + rng.rangeF(0, 0.08), tz + rng.rangeF(-0.05, 0.14), S.stool, 0, { spin: rng.rangeF(0, 1) }));

  
  
  const tubZ = -hz + 0.04 + S.tub.w / 2;
  fx.push(against('tub', 'bathroom', nS, sOut, tubZ, S.tub));
  fx.push(against('window', 'bathroom', nS, sOut, tubZ + rng.rangeF(-0.15, 0.15), { ...S.window, w: 0.46, h: 0.5 }, { onWall: true, y: r3(Math.min(1.25, H - 0.62)) }));
  const bIn = k;                             
  const railX = sOut + bIn * (S.tub.d + 0.12 + S.towelRail.w / 2 + rng.rangeF(0, 0.12));
  fx.push(against('towelRail', 'bathroom', [0, 1], -hz, railX, S.towelRail, { onWall: true, y: 0.55 }));
  const basinX = sWall - bIn * (PT / 2 + 0.12 + S.basin.w / 2 + rng.rangeF(0, 0.1));
  fx.push(against('basin', 'bathroom', [0, 1], -hz, basinX, S.basin));
  fx.push(against('mirror', 'bathroom', [0, 1], -hz, basinX + rng.rangeF(-0.04, 0.04), S.mirror, { onWall: true, y: r3(Math.min(1.12, H - 0.72)) }));

  
  
  
  const bedZ = zs + PT / 2 + 0.08 + S.bed.w / 2 + rng.rangeF(0, 0.1);
  const bed = against('bed', 'bedroom', nS, sOut, bedZ, S.bed);
  fx.push(bed);
  fx.push(against('bedside', 'bedroom', nS, sOut, bedZ + S.bed.w / 2 + 0.06 + S.bedside.w / 2, S.bedside));
  const wardH = Math.min(S.wardrobe.h, H - 0.12);
  
  
  
  const wardZ = Math.min(hz - 0.1 - S.wardrobe.w / 2, bedZ + S.bed.w / 2 + 0.06 + S.bedside.w + 0.12 + S.wardrobe.w / 2 + rng.rangeF(0, 0.1));
  fx.push(against('wardrobe', 'bedroom', nS, sOut, wardZ, { ...S.wardrobe, h: r3(wardH) }));
  
  
  const rugTurn = rng.rangeF(-0.25, 0.25);
  const rug0 = free('rug', 'bedroom', 0, 0, { ...S.rug, w: 1.2, d: 0.9 }, rugTurn, { flat: true });
  const clampIn = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rugX = clampIn(sOut + bIn * (S.bed.d + 0.1), bedroom.x0 + rug0.hx + 0.05, bedroom.x1 - rug0.hx - 0.05);
  const rugZ = clampIn(bedZ + 0.2, bedroom.z0 + rug0.hz + 0.05, bedroom.z1 - rug0.hz - 0.05);
  fx.push(free('rug', 'bedroom', rugX, rugZ, { ...S.rug, w: 1.2, d: 0.9 }, rugTurn, { flat: true }));

  
  
  const dl = door.x - door.w / 2, dr = door.x + door.w / 2;
  const gapL = dl - hall.x0, gapR = hall.x1 - dr;
  const winX = gapR >= gapL ? (dr + hall.x1) / 2 : (hall.x0 + dl) / 2;
  const winW = Math.min(0.62, Math.max(gapL, gapR) - 0.3);
  fx.push(against('window', 'hall', [0, 1], -hz, winX, { ...S.window, w: r3(winW) }, { onWall: true, y: r3(Math.min(0.85, H - 0.9)) }));
  fx.push(free('rug', 'hall', r3(hall.x + rng.rangeF(-0.12, 0.12)), r3(rng.rangeF(-0.2, 0.5)), { ...S.rug, w: Math.min(S.rug.w, hall.hx * 2 - 0.5), d: 1.2 }, Math.PI / 2 + rng.rangeF(-0.2, 0.2), { flat: true }));
  
  
  fx.push(against('lamp', 'hall', nK, kWall + nK[0] * PT / 2, hz - 0.55 - rng.rangeF(0, 0.3), S.lamp));

  
  const dW = I.doorwayW, half = dW / 2;
  const dH = r3(Math.min(I.doorwayMaxH, H - I.doorwayHeadM));
  const between = (lo, hi) => r3(lo + (hi - lo) * rng.rangeF(0.2, 0.8));
  const table = fx.find((f) => f.kind === 'table');
  const kLo = -hz + S.counter.d + 0.12 + half, kHi = Math.min(table.z - table.hz - 0.45 - half, hz - 0.2 - half);
  const bLo = -hz + S.basin.d + 0.12 + half, bHi = zs - PT / 2 - 0.08 - half;
  const edLo = bedZ + S.bed.w / 2 + 0.1 + half, edHi = hz - 0.25 - half;
  const doorways = Object.freeze([
    Object.freeze({ rooms: ['hall', 'kitchen'], at: kWall, z: between(kLo, kHi), w: dW, h: dH }),
    Object.freeze({ rooms: ['hall', 'bathroom'], at: sWall, z: between(bLo, bHi), w: dW, h: dH }),
    Object.freeze({ rooms: ['hall', 'bedroom'], at: sWall, z: between(edLo, edHi), w: dW, h: dH }),
  ]);

  
  
  const JAMB = 0.07;
  const dGap0 = door.x - door.w / 2 - JAMB, dGap1 = door.x + door.w / 2 + JAMB;
  const runs = [];
  const run = (kind, axis, at, a0, a1, h, n) => { if (a1 - a0 > 0.02) runs.push(Object.freeze({ kind, axis, at: r3(at), a0: r3(a0), a1: r3(a1), h: r3(h), n })); };
  run('outer', 'z', -hz, -hx, dGap0, H, [0, 1]);
  run('outer', 'z', -hz, dGap1, hx, H, [0, 1]);
  run('cut', 'z', hz, -hx, hx, I.cutH, [0, -1]);
  run('outer', 'x', -hx, -hz, hz, H, [1, 0]);
  run('outer', 'x', hx, -hz, hz, H, [-1, 0]);
  for (const at of [xa, xb]) {
    const gaps = doorways.filter((d) => d.at === at).map((d) => [d.z - half, d.z + half]).sort((a, b) => a[0] - b[0]);
    let from = -hz;
    for (const [g0, g1] of gaps) { run('partition', 'x', at, from, g0, H, null); from = g1; }
    run('partition', 'x', at, from, hz, H, null);
  }
  run('low', 'z', zs, sx0, sx1, I.cutH, null);

  const inset = I.floorInset;
  const floor = Object.freeze(ROOM_NAMES.map((name) => {
    const r = rooms[name];
    return Object.freeze({ room: name, x: r.x, z: r.z, hx: r3(Math.max(0.3, r.hx - inset)), hz: r3(Math.max(0.3, r.hz - inset)) });
  }));

  return Object.freeze({
    species, seed, W, D, hx, hz, wallH: H,
    door, doorways, rooms, runs: Object.freeze(runs), fixtures: Object.freeze(fx), floor,
    kitchenSide: k, partitions: Object.freeze({ xa, xb, zs }),
    windowSide: p.windowSide, style: p.style,
  });
}


export function roomAt(plan, x, z) {
  for (const name of ROOM_NAMES) {
    const r = plan.rooms[name];
    if (x >= r.x0 - 1e-9 && x <= r.x1 + 1e-9 && z >= r.z0 - 1e-9 && z <= r.z1 + 1e-9) return name;
  }
  return null;
}

const box = (module, x, z, hx, hz) => Object.freeze({
  shape: 'box', module, x: r3(x), z: r3(z), cos: 1, sin: 0, hx: r3(hx), hz: r3(hz), reach: Math.hypot(hx, hz),
});








export function wallsOf(plan) {
  const t = INTERIOR.outerWallM, ht = INTERIOR.partT / 2;
  const { hx, hz } = plan;
  const out = [
    box('houseWall', 0, -hz - t, hx + t * 2, t),
    box('houseWall', 0, hz + t, hx + t * 2, t),
    box('houseWall', -hx - t, 0, t, hz + t * 2),
    box('houseWall', hx + t, 0, t, hz + t * 2),
  ];
  for (const r of plan.runs) {
    if (r.kind !== 'partition' && r.kind !== 'low') continue;
    const mid = (r.a0 + r.a1) / 2, len = (r.a1 - r.a0) / 2;
    out.push(r.axis === 'x' ? box('partition', r.at, mid, ht, len) : box('partition', mid, r.at, len, ht));
  }
  for (const f of plan.fixtures) {
    if (f.onWall || f.flat || f.part || f.kind === 'lamp') continue;
    out.push(box('fixture', f.x, f.z, f.hx, f.hz));
  }
  return Object.freeze(out);
}
