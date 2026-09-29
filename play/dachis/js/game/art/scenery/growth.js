












import { S, form, lin, mixLin, jit } from './kit.js';
import { fbm3 } from '../../../vendor/fml/moon/noise.js';
import { stoneForm } from './rocks.js';



const BARK = lin('#b0a466'), BARK_DARK = lin('#8a8250'), CHERRY_BARK = lin('#88765c');
const LEAF_LO = lin('#2f7a34'), LEAF_HI = lin('#8fd05a'), JUNGLE_LO = lin('#1d5a34'), JUNGLE_HI = lin('#5fae4a');
const PINK_LO = lin('#e88ab0'), PINK_HI = lin('#ffd6e6');
const lumps = (s, amp, seed) => (x, y, z) => (fbm3(x * s, y * s, z * s, { seed, octaves: 2 }) - 0.5) * amp;

const crownPaint = (lo, hi, y0, y1, seed) => (x, y, z) => {
  const t = Math.max(0, Math.min(1, (y - y0) / (y1 - y0)));
  const n = fbm3(x * 7, y * 7, z * 7, { seed, octaves: 2 });
  return mixLin(lo, hi, Math.max(0, Math.min(1, t * 0.85 + (n - 0.5) * 0.5)));
};

function broadleaf(pink) {
  const trunk = S.paint(S.union(0.06,
    S.roundCone([0, 0, 0], [0, 1.15, 0], 0.13, 0.08),
    S.roundCone([0, 0.85, 0], [0.32, 1.3, 0.1], 0.06, 0.04),
    S.roundCone([0, 0.95, 0], [-0.28, 1.35, -0.12], 0.055, 0.035),
    S.roundCone([0, 0.05, 0], [0.2, -0.02, 0.08], 0.08, 0.04)), { color: pink ? CHERRY_BARK : BARK, material: 'bark' });
  const puffs = S.union(0.18,
    S.sphere([0, 1.62, 0], 0.55), S.sphere([0.36, 1.42, 0.12], 0.42),
    S.sphere([-0.34, 1.45, -0.1], 0.44), S.sphere([0.05, 1.45, 0.38], 0.4), S.sphere([-0.05, 1.95, -0.05], 0.36));
  const crown = S.paint(S.displace(puffs, lumps(4.5, 0.16, pink ? 5 : 3), 0.09), {
    material: pink ? 'blossom' : 'leaf',
    color: pink ? crownPaint(PINK_LO, PINK_HI, 1.0, 2.2, 9) : crownPaint(LEAF_LO, LEAF_HI, 1.0, 2.2, 4),
  });
  return S.union(0.03, trunk, crown);
}
export const treeForm = () => form('tree', () => broadleaf(false), { min: [-1, -0.08, -1], max: [1, 2.45, 1], cell: 0.05, tris: 520 });
export const blossomForm = () => form('blossom', () => broadleaf(true), { min: [-1, -0.08, -1], max: [1, 2.45, 1], cell: 0.05, tris: 520 });

function jungleTree() {
  const roots = [0, 1, 2, 3, 4].map((k) => {
    const a = k * 1.26 + 0.3, x = Math.sin(a), z = Math.cos(a);
    return S.roundCone([x * 0.08, 0.55, z * 0.08], [x * 0.5, -0.02, z * 0.5], 0.08, 0.035);
  });
  const trunk = S.paint(S.union(0.1, S.roundCone([0, 0, 0], [0.05, 2.5, -0.03], 0.18, 0.1), ...roots,
    S.roundCone([0.03, 2.1, 0], [0.55, 2.6, 0.2], 0.07, 0.045), S.roundCone([0.03, 2.2, 0], [-0.5, 2.55, -0.25], 0.07, 0.045)), {
    material: 'bark', color: (x, y, z) => mixLin(BARK_DARK, BARK, Math.min(1, y / 2.2) * (0.7 + fbm3(x * 9, y * 3, z * 9, { seed: 6, octaves: 2 }) * 0.5)),
  });
  const canopy = S.union(0.25,
    S.ellipsoid([0, 2.75, 0], [1.1, 0.42, 1.05]), S.ellipsoid([0.55, 2.62, 0.35], [0.6, 0.32, 0.55]),
    S.ellipsoid([-0.5, 2.66, -0.4], [0.62, 0.34, 0.6]), S.sphere([0.05, 3.05, 0], 0.45));
  const vines = S.union(0.02, ...[[0.7, 0.3], [-0.6, 0.5], [0.2, -0.8], [-0.3, -0.5], [0.85, -0.3]].map(([x, z], k) =>
    S.capsule([x, 2.5, z], [x * 1.02, 1.55 + jit(k, 3) * 0.5, z * 1.02], 0.025)));
  const leaves = S.paint(S.union(0.03, S.displace(canopy, lumps(3.8, 0.2, 12), 0.1), vines), {
    material: 'leaf', color: crownPaint(JUNGLE_LO, JUNGLE_HI, 1.6, 3.3, 13),
  });
  return S.union(0.03, trunk, leaves);
}
export const jungleTreeForm = () => form('jtree', jungleTree, { min: [-1.35, -0.08, -1.35], max: [1.35, 3.55, 1.35], cell: 0.065, tris: 700 });

function palm() {
  
  const segs = [], pts = [];
  for (let k = 0; k <= 7; k++) { const t = k / 7; pts.push([Math.pow(t, 2) * 0.55, t * 1.75, 0]); }
  for (let k = 0; k < 7; k++) segs.push(S.roundCone(pts[k], pts[k + 1], 0.1 - k * 0.006, 0.094 - k * 0.006));
  const trunk = S.paint(S.union(0.02, ...segs), {
    material: 'bark', color: (x, y) => (Math.abs(((y / 1.75) * 7) % 1 - 0.5) > 0.38 ? lin('#8a6a44') : lin('#c09c6c')),
  });
  const top = pts[7];
  const fronds = [0, 1, 2, 3, 4, 5, 6].map((k) => {
    const a = k / 7 * Math.PI * 2 + 0.3, dx = Math.sin(a), dz = Math.cos(a);
    const mid = [top[0] + dx * 0.45, top[1] + 0.14, top[2] + dz * 0.45], tip = [top[0] + dx * 0.95, top[1] - 0.35, top[2] + dz * 0.95];
    return S.union(0.06, S.roundCone(top, mid, 0.05, 0.075), S.roundCone(mid, tip, 0.075, 0.015));
  });
  const leaves = S.paint(S.union(0.04, ...fronds.map((f) => S.transform(f, { scale: [1, 0.55, 1], translate: [0, top[1] * 0.45, 0] }))), {
    material: 'leaf', color: (x, y, z) => mixLin(LEAF_LO, lin('#b4e070'), Math.max(0, Math.min(1, (y - 1.55) * 2 + (fbm3(x * 8, y * 8, z * 8, { seed: 2 }) - 0.5)))),
  });
  const nuts = S.paint(S.union(0.01, S.sphere([top[0] + 0.1, top[1] - 0.1, 0.08], 0.07), S.sphere([top[0] - 0.02, top[1] - 0.12, -0.1], 0.07), S.sphere([top[0] - 0.1, top[1] - 0.08, 0.06], 0.065)), { color: lin('#5a3a1c'), material: 'wood' });
  return S.union(0.02, trunk, leaves, nuts);
}
export const palmForm = () => form('palm', palm, { min: [-1.1, -0.08, -1.1], max: [1.7, 2.3, 1.1], cell: 0.045, tris: 520 });

function bush() {
  const balls = S.union(0.14, S.sphere([0, 0.32, 0], 0.4), S.sphere([0.34, 0.24, 0.12], 0.3), S.sphere([-0.32, 0.25, -0.08], 0.32), S.sphere([0.05, 0.22, 0.32], 0.28), S.sphere([-0.1, 0.24, -0.33], 0.27));
  return S.paint(S.displace(balls, lumps(6, 0.14, 21), 0.08), { material: 'leaf', color: crownPaint(LEAF_LO, LEAF_HI, 0, 0.75, 22) });
}
export const bushForm = () => form('bush', bush, { min: [-0.85, -0.1, -0.85], max: [0.85, 0.85, 0.85], cell: 0.045, tris: 260 });

function fern() {
  const fronds = [0, 1, 2, 3, 4, 5, 6].map((k) => {
    const a = k / 7 * Math.PI * 2 + jit(k, 1), dx = Math.sin(a), dz = Math.cos(a), L = 0.5 + jit(k, 2) * 0.2;
    return S.union(0.04, S.roundCone([0, 0.02, 0], [dx * L * 0.5, 0.36, dz * L * 0.5], 0.02, 0.06), S.roundCone([dx * L * 0.5, 0.36, dz * L * 0.5], [dx * L, 0.12, dz * L], 0.06, 0.012));
  });
  return S.paint(S.transform(S.union(0.03, ...fronds), { scale: [1, 1, 1] }), { material: 'leaf', color: crownPaint(JUNGLE_LO, lin('#7cc452'), 0, 0.4, 31) });
}
export const fernForm = () => form('fern', fern, { min: [-0.8, -0.05, -0.8], max: [0.8, 0.5, 0.8], cell: 0.035, tris: 220 });

function flowers() {
  const heads = [[0, 0.2, 0], [0.13, 0.15, 0.07], [-0.1, 0.13, -0.09]].map(([x, y, z], k) => {
    const petals = [0, 1, 2, 3, 4].map((p) => { const a = p / 5 * Math.PI * 2 + k; return S.sphere([x + Math.sin(a) * 0.04, y, z + Math.cos(a) * 0.04], 0.032); });
    return S.paint(S.union(0.01, ...petals), { color: [1, 1, 1], material: 'petal' });
  });
  const middles = S.paint(S.union(0.01, ...[[0, 0.215, 0], [0.13, 0.165, 0.07], [-0.1, 0.145, -0.09]].map((p) => S.sphere(p, 0.022))), { color: lin('#ffd84a'), material: 'petal' });
  const stems = S.paint(S.union(0.01, S.capsule([0, 0, 0], [0, 0.19, 0], 0.012), S.capsule([0.05, 0, 0.02], [0.13, 0.14, 0.07], 0.011), S.capsule([-0.03, 0, -0.02], [-0.1, 0.12, -0.09], 0.011)), { color: LEAF_LO, material: 'leaf' });
  return S.union(0.005, stems, ...heads, middles);
}
export const flowerForm = () => form('flowers', flowers, { min: [-0.2, -0.03, -0.2], max: [0.25, 0.28, 0.2], cell: 0.016, tris: 160 });


const tintOf = (hex) => lin(hex);
const BUSH_TINT = { coast: { leaf: [1.05, 1.12, 0.8] }, jungle: { leaf: [0.72, 0.9, 0.85] }, shrine: { leaf: [1, 1.05, 0.95] } };

export function placeGrowth(batch, W) {
  const G = (o) => W.groundAt(o.x, o.y);
  for (const o of W.objects) {
    const at = { x: o.x, h: G(o) - 0.03, y: o.y, rot: o.rot || 0, s: o.s || 1 };
    switch (o.kind) {
      case 'tree': batch.add(treeForm(), at); break;
      case 'blossom': batch.add(blossomForm(), at); break;
      case 'jtree': batch.add(jungleTreeForm(), at); break;
      case 'palm': batch.add(palmForm(), { ...at, tilt: [0, 0] }); break;
      case 'bush': batch.add(bushForm(), at, BUSH_TINT[o.flavor] || {}); break;
      case 'fern': batch.add(fernForm(), at); break;
      case 'flower': batch.add(flowerForm(), { ...at, s: 1.4 }, { petal: tintOf(o.c) }); break;
      case 'crag': batch.add(stoneForm(o.v, 'dark'), { ...at, h: G(o) - 0.15 * o.s, s: [o.s * 1.1, o.s * 0.9, o.s] }); break;
      case 'rock': batch.add(stoneForm(Math.floor(o.rot * 3) % 4, o.dark ? 'dark' : 'grey'), { ...at, h: G(o) - 0.05 * o.s, s: [o.s, o.s * 0.8, o.s * 0.9] }); break;
      default: break;
    }
  }
}
