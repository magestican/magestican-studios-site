
























import * as S from '../../../mesh/sdf.mjs';
import { linear } from '../../../palette/seasons.mjs';
import { valueNoise3, fbm3 } from '../../../noise.mjs';
import { buildItem, mix, scl, smooth, TAU, norm } from './core.mjs';

const formIndex = (seed, rng) => (seed >= 1 && seed <= 3 ? seed - 1 : rng.rangeI(0, 2));
const both = (a, b) => Math.hypot(Math.max(a, 0), Math.max(b, 0)) + Math.min(Math.max(a, b), 0);




function sector(y, z, a0, a1) {
  const c0 = Math.cos(a0) * z - Math.sin(a0) * y;
  const c1 = y * Math.sin(a1) - z * Math.cos(a1);
  return Math.max(-c0, -c1);
}

const ROUND = 0.0015;



function logPiece({ len, R, a0 = null, a1 = null, ns, woodC, ringC, barkC, barkDark }) {
  const half = len / 2;
  const radius = (x) => R * (1 - 0.06 * (x / half) + 0.025 * Math.sin(x * 31 + ns));
  const sec = (y, z) => (a0 === null ? -1 : sector(y, z, a0, a1));
  const off = [R * 0.12 * Math.sin(ns), R * 0.1 * Math.cos(ns * 1.7)]; 
  const wood = S.field((x, y, z) => both(both(Math.hypot(y, z) - radius(x), sec(y, z)), Math.abs(x) - half) - ROUND);
  const furrow = (x, y, z) => Math.abs(Math.sin(Math.atan2(z, y) * 11 + 2.5 * valueNoise3(x * 40, y * 40, z * 40, ns)));
  const bark = S.field((x, y, z) => both(both(Math.hypot(y, z) - radius(x) - 0.0026 + 0.0011 * furrow(x, y, z), sec(y, z) + 0.004), Math.abs(x) - (half - 0.0018)) - ROUND);
  return S.union(0.0006,
    S.paint(wood, {
      material: 'wood',
      color: (x, y, z) => {
        const end = smooth(half - 0.005, half + 0.001, Math.abs(x));
        const r = Math.hypot(y - off[0], z - off[1]);
        const rings = 0.5 + 0.5 * Math.sin((r / 0.0042) * TAU + 1.5 * valueNoise3(y * 60, z * 60, x, ns));
        const grain = valueNoise3(x * 18, y * 260, z * 260, ns + 5);
        return mix(woodC, ringC, end * (0.25 + 0.4 * rings) + (1 - end) * 0.3 * grain);
      },
    }),
    S.paint(bark, { material: 'bark', color: (x, y, z) => mix(barkC, barkDark, 0.55 * (1 - furrow(x, y, z))) }));
}


function twineLoop(xb, cy, ay, az, r) {
  return S.field((x, y, z) => Math.hypot(x - xb, (Math.hypot((y - cy) / ay, z / az) - 1) * Math.min(ay, az)) - r);
}

const H = Math.PI / 2;
const WOOD_FORMS = [
  { wood: '#f3d7ab', ring: '#d9b27f', bark: '#b98f6f', pieces: [
    { len: 0.2, R: 0.04, a: [-H, H], at: [0.004, 0, -0.043], rot: [0, 0.05, 0] },
    { len: 0.215, R: 0.037, a: [-H, H], at: [-0.006, 0, 0.038], rot: [0, -0.04, 0] },
    { len: 0.225, R: 0.047, a: [Math.PI * 0.75, Math.PI * 1.25], at: [0.01, 0.087, 0], rot: [0, 0.1, 0] },
  ], loops: [] },
  { wood: '#f5dcb4', ring: '#dcb688', bark: '#a98468', pieces: [
    { len: 0.23, R: 0.029, a: null, at: [0.006, 0.029, -0.036], rot: [0, 0.03, 0] },
    { len: 0.205, R: 0.038, a: [-H, H], at: [-0.004, 0, 0.03], rot: [0, -0.05, 0] },
    { len: 0.215, R: 0.043, a: [Math.PI * 0.72, Math.PI * 1.22], at: [0, 0.084, -0.004], rot: [0, 0.02, 0] },
  ], loops: [{ x: -0.055, cy: 0.04, ay: 0.052, az: 0.074 }, { x: 0.058, cy: 0.041, ay: 0.051, az: 0.072, knot: true }] },
  { wood: '#f1d3a4', ring: '#d4aa78', bark: '#bf9a78', pieces: [
    { len: 0.18, R: 0.04, a: [0, H], at: [0, 0, -0.045], rot: [0, 0.06, 0] },
    { len: 0.17, R: 0.036, a: [H, Math.PI], at: [0.01, 0, 0.042], rot: [0, -0.1, 0] },
    { len: 0.2, R: 0.037, a: [-H * 0.5, H * 0.5], at: [-0.03, 0.038, 0], rot: [0, H + 0.25, 0.05] },
    { len: 0.185, R: 0.034, a: [-H * 0.6, H * 0.4], at: [0.045, 0.036, 0.004], rot: [0, H - 0.35, -0.04] },
  ], loops: [] },
];

export function wood(ctx) {
  const { lod, rng, key, name, seed } = ctx;
  const form = WOOD_FORMS[formIndex(seed, rng)];
  const woodC = linear(form.wood), ringC = linear(form.ring), barkC = linear(form.bark), barkDark = scl(linear(form.bark), 0.72);
  const pieces = form.pieces.map((p, i) => {
    const jit = rng.rangeF(-0.04, 0.04);
    const piece = logPiece({ len: p.len, R: p.R, a0: p.a ? p.a[0] : null, a1: p.a ? p.a[1] : null, ns: rng.rangeI(1, 1e6) + i, woodC, ringC, barkC, barkDark });
    return S.transform(piece, { translate: p.at, rotate: [p.rot[0], p.rot[1] + jit, p.rot[2]] });
  });
  const logs = S.intersect(0.002, S.union(0.0012, pieces), S.plane([0, -1, 0], 0));
  const parts = [
    { key: `${key}|logs`, node: logs, min: [-0.14, -0.008, -0.12], max: [0.14, 0.15, 0.12], cell: 0.0027, share: form.loops.length && lod < 2 ? 0.8 : 1, material: 'wood', uvScale: 0.08, maxCoarsen: 3 },
  ];
  if (lod < 2) {
    const twine = linear('#f0d79a');
    for (const [i, l] of form.loops.entries()) {
      let loop = twineLoop(l.x, l.cy, l.ay, l.az, 0.0034);
      if (l.knot) loop = S.union(0.003, loop, S.ellipsoid([l.x, l.cy + l.ay + 0.002, 0.01], [0.007, 0.006, 0.009]));
      parts.push({ key: `${key}|loop${i}`, node: S.paint(loop, { material: 'cloth', color: (x, y, z) => scl(twine, 0.9 + 0.1 * Math.sin((y + z) * 900)) }), min: [l.x - 0.02, l.cy - l.ay - 0.012, -l.az - 0.012], max: [l.x + 0.02, l.cy + l.ay + 0.02, l.az + 0.012], cell: 0.0017, share: 0.1, material: 'cloth', uvScale: 0.03, lodCell: [1, 1.9, 2.2], maxCoarsen: 3 });
    }
  }
  return buildItem({ name, lod, parts, reach: 0.03 });
}



function pebble(c, radii, rot, ns, amp = 0.0028) {
  const lumpy = S.displace(S.ellipsoid([0, 0, 0], radii), (x, y, z) => amp * (fbm3(x * 16, y * 16, z * 16, { octaves: 2, seed: ns }) - 0.5) * 2, amp);
  return S.transform(lumpy, { translate: c, rotate: rot });
}

export function stone(ctx) {
  const { lod, rng, key, name, seed } = ctx;
  const form = formIndex(seed, rng);
  const ns = rng.rangeI(1, 1e6);
  let node, box, cell;
  if (form === 0) {
    const cols = ['#ddd3c5', '#bfc9d2', '#e6ddcd'].map(linear);
    const vein = linear('#f7f3ea');
    const specs = [
      { c: [0, 0.024, 0], r: [0.056, 0.027, 0.046], rot: [0.04, rng.rangeF(0, TAU), -0.03] },
      { c: [0.006, 0.063, -0.004], r: [0.041, 0.019, 0.034], rot: [-0.06, rng.rangeF(0, TAU), 0.09] },
      { c: [0.058, 0.02, 0.03], r: [0.029, 0.018, 0.024], rot: [0.2, 0.6, 0.45] },
    ];
    const veinN = norm([0.3, 1, 0.5]);
    const stones = specs.map((s, i) => S.paint(pebble(s.c, s.r, s.rot, ns + i), {
      material: 'stone',
      color: (x, y, z) => {
        let c = scl(cols[i], 0.93 + 0.07 * valueNoise3(x * 50, y * 50, z * 50, ns + 10 + i));
        if (i === 1) c = mix(c, vein, 0.8 * smooth(0.0032, 0.0012, Math.abs((x - s.c[0]) * veinN[0] + (y - s.c[1]) * veinN[1] + (z - s.c[2]) * veinN[2] - 0.004)));
        return c;
      },
    }));
    node = S.union(0.0025, stones);
    box = { min: [-0.075, -0.01, -0.07], max: [0.1, 0.1, 0.07] };
    cell = 0.0024;
  } else if (form === 1) {
    const base = linear('#bcc6cf'), band = linear('#d8dee3'), deep = linear('#9eaab5');
    const C = [0, 0.046, 0];
    let block = S.ellipsoid(C, [0.062, 0.05, 0.052]);
    for (let i = 0; i < 7; i++) {
      const th = i === 0 ? 0.05 : rng.rangeF(0.5, 1.45), ph = (i * TAU) / 6 + rng.rangeF(-0.3, 0.3);
      const n = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
      const reach = (i === 0 ? 0.036 : rng.rangeF(0.034, 0.046));
      block = S.intersect(0.0035, block, S.plane(n, n[0] * C[0] + n[1] * C[1] + n[2] * C[2] + reach));
    }
    block = S.intersect(0.004, block, S.plane([0, -1, 0], 0));
    
    
    const chipN = norm([0.6, 0.55, 0.58]);
    block = S.subtract(0.004, block, S.plane(chipN.map((v) => -v), -0.072));
    const chip = pebble([0.066, 0.009, 0.036], [0.017, 0.01, 0.013], [0.1, 0.8, 0.2], ns + 4, 0.0015);
    const strata = (x, y, z) => 0.5 + 0.5 * Math.sin(y * 150 + 2 * valueNoise3(x * 25, y * 25, z * 25, ns));
    node = S.union(0.002, S.paint(S.union(0.001, block, chip), {
      material: 'stone',
      color: (x, y, z) => mix(mix(base, band, 0.45 * smooth(0.55, 0.9, strata(x, y, z))), deep, 0.25 * smooth(0.02, 0, y)),
    }));
    box = { min: [-0.075, -0.01, -0.07], max: [0.09, 0.1, 0.07] };
    cell = 0.0022;
  } else {
    const cols = ['#c3d1c9', '#b7c6c3', '#d3ded7'].map(linear);
    const slabs = [
      { c: [0, 0.007, 0], hx: 0.068, hz: 0.052, th: 0.007, yaw: 0.1, tilt: [0.02, 0, -0.02] },
      { c: [0.01, 0.021, 0.006], hx: 0.056, hz: 0.046, th: 0.0065, yaw: 0.55, tilt: [-0.04, 0, 0.05] },
      { c: [-0.006, 0.034, -0.004], hx: 0.046, hz: 0.036, th: 0.006, yaw: -0.4, tilt: [0.07, 0, 0.03] },
    ].map((s, i) => {
      const edges = Array.from({ length: 7 }, (_, k) => {
        const a = (k * TAU) / 7 + rng.rangeF(-0.2, 0.2);
        return [Math.cos(a), Math.sin(a), Math.hypot(s.hx * Math.cos(a), s.hz * Math.sin(a)) * rng.rangeF(0.86, 1.0)];
      });
      const slab = S.field((x, y, z) => {
        let d2 = -1;
        for (const [ca, sa, r] of edges) d2 = Math.max(d2, x * ca + z * sa - r);
        return both(d2, Math.abs(y) - s.th + 0.0015) - 0.0015;
      });
      const lines = (x, y, z) => smooth(0.6, 0.95, Math.abs(Math.sin(y * 1400 + valueNoise3(x * 30, 0, z * 30, ns + i) * 3)));
      return S.transform(S.paint(slab, { material: 'stone', color: (x, y, z) => mix(scl(cols[i], 0.95 + 0.05 * valueNoise3(x * 40, 0, z * 40, ns + i)), scl(cols[i], 0.8), 0.35 * lines(x, y, z) * smooth(s.th * 0.4, s.th, Math.abs(y) + 0.004)) }), { translate: s.c, rotate: [s.tilt[0], s.yaw, s.tilt[2]] });
    });
    node = S.union(0.0012, slabs);
    box = { min: [-0.085, -0.012, -0.08], max: [0.09, 0.055, 0.08] };
    cell = 0.0019;
  }
  const parts = [{ key: `${key}|stone`, node: S.intersect(0.002, node, S.plane([0, -1, 0], 0)), ...box, cell, share: 1, material: 'stone', uvScale: 0.07, maxCoarsen: 3 }];
  return buildItem({ name, lod, parts, reach: 0.02 });
}
