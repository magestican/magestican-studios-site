











import { S, form, lin, jit } from './kit.js';
import { fbm3 } from '../../../vendor/fml/moon/noise.js';

const C = {
  basalt: lin('#3a3438'), basaltHi: lin('#56484c'), ash: lin('#8a8486'), glass: lin('#1a1424'), glassHi: lin('#4a3a6a'),
  stone: lin('#8a7466'), stoneDk: lin('#5a463c'), iron: lin('#4a4450'), ironDk: lin('#2e2a34'), rust: lin('#8a4a2a'),
  wood: lin('#7a4e2c'), woodDk: lin('#4a2e1a'), coal: lin('#ff7a1a'), coalHi: lin('#ffd060'), red: lin('#d8283a'), white: lin('#f2ece0'),
  crust: lin('#2a2226'), crustDk: lin('#16101a'), crack: lin('#ff6a1a'),
};
const P = (node, color, material) => S.paint(node, { color, material });
const lumps = (s, amp, seed) => (x, y, z) => (fbm3(x * s, y * s, z * s, { seed, octaves: 2 }) - 0.5) * amp;

function forge() {
  const base = P(S.displace(S.roundBox([0, 0.45, 0], [0.95, 0.45, 0.75], 0.08), lumps(5, 0.06, 7), 0.04), (x, y) => (y > 0.82 ? C.stoneDk : C.stone), 'stone');
  const mouth = S.roundBox([0, 0.42, 0.72], [0.45, 0.24, 0.2], 0.08);
  const coals = P(S.displace(S.ellipsoid([0, 0.26, 0.5], [0.4, 0.1, 0.22]), lumps(12, 0.06, 9), 0.04), (x, y, z) => (fbm3(x * 9, y * 9, z * 9, { seed: 3 }) > 0.5 ? C.coalHi : C.coal), 'fire');
  const hood = P(S.roundCone([0, 0.9, -0.05], [0, 1.35, -0.15], 0.75, 0.32), C.iron, 'metal');
  const chimney = P(S.roundCone([0, 1.3, -0.15], [0, 2.6, -0.3], 0.3, 0.24), C.stoneDk, 'stone');
  const bellows = P(S.union(0.02, S.ellipsoid([-1.05, 0.4, 0.1], [0.18, 0.12, 0.4]), S.capsule([-1.05, 0.4, 0.5], [-0.9, 0.38, 0.7], 0.04)), C.woodDk, 'wood');
  return S.union(0.02, S.subtract(0.04, base, mouth), coals, hood, chimney, bellows);
}
export const forgeForm = () => form('magma-forge', forge, { min: [-1.3, -0.05, -1.0], max: [1.1, 2.75, 1.0], cell: 0.035, tris: 700 });

function anvil() {
  const stump = P(S.roundCylinder([0, 0.2, 0], 0.25, 0.22, 0.2, 0.03), C.woodDk, 'bark');
  const body = P(S.union(0.03, S.roundBox([0, 0.5, 0], [0.12, 0.1, 0.1], 0.02), S.roundBox([0, 0.64, 0], [0.26, 0.05, 0.12], 0.02), S.roundCone([0.26, 0.64, 0], [0.48, 0.66, 0], 0.07, 0.02)), C.iron, 'metal');
  const tongs = P(S.union(0.01, S.capsule([-0.3, 0.02, 0.22], [-0.1, 0.62, 0.12], 0.02), S.capsule([-0.26, 0.02, 0.26], [-0.08, 0.62, 0.16], 0.02)), C.ironDk, 'metal');
  return S.union(0.01, stump, body, tongs);
}
export const anvilForm = () => form('magma-anvil', anvil, { min: [-0.45, -0.05, -0.35], max: [0.6, 0.75, 0.4], cell: 0.018, tris: 320 });

function basalt() {
  const cols = [];
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * Math.PI * 2, d = k ? 0.32 : 0, h = 0.5 + jit(k, 1) * 0.5 + (k ? 0 : 0.5);
    const px = Math.cos(a) * d * (k ? 1 : 0), pz = Math.sin(a) * d * (k ? 1 : 0);
    cols.push(S.roundCylinder([px, h / 2, pz], 0.17, 0.16, h / 2, 0.02));
  }
  return P(S.union(0.01, ...cols), (x, y) => (y > 0.85 ? C.basaltHi : C.basalt), 'stone');
}
export const basaltForm = () => form('magma-basalt', basalt, { min: [-0.6, -0.05, -0.6], max: [0.6, 1.1, 0.6], cell: 0.025, tris: 360 });

function obsidian() {
  const heap = P(S.intersect(0.02, S.displace(S.ellipsoid([0, 0, 0], [0.45, 0.16, 0.38]), lumps(6, 0.08, 21), 0.04), S.plane([0, 1, 0], 0.02)), C.ash, 'soil');
  const shards = [];
  for (let k = 0; k < 4; k++) { const a = k * 1.7 + 0.3, r = 0.12 + jit(k, 2) * 0.12, h = 0.35 + jit(k, 3) * 0.4; shards.push(S.roundCone([Math.cos(a) * r, 0.05, Math.sin(a) * r], [Math.cos(a) * (r + 0.12), h, Math.sin(a) * (r + 0.12)], 0.09, 0.01)); }
  return S.union(0.01, heap, P(S.union(0.005, ...shards), (x, y) => (y > 0.4 ? C.glassHi : C.glass), 'gem'));
}
export const obsidianForm = () => form('magma-obsidian', obsidian, { min: [-0.6, -0.05, -0.55], max: [0.6, 0.85, 0.55], cell: 0.02, tris: 320 });


function rail() {
  const rails = P(S.union(0.005, S.roundBox([-0.22, 0.49, 0], [0.025, 0.03, 0.5], 0.008), S.roundBox([0.22, 0.49, 0], [0.025, 0.03, 0.5], 0.008)), C.iron, 'metal');
  const sleepers = P(S.union(0.005, ...[-0.33, 0, 0.33].map((z) => S.roundBox([0, 0.43, z], [0.34, 0.03, 0.07], 0.01))), C.woodDk, 'wood');
  const posts = P(S.union(0.01, S.capsule([-0.28, 0.42, 0], [-0.3, -0.2, 0], 0.045), S.capsule([0.28, 0.42, 0], [0.3, -0.2, 0], 0.045), S.capsule([-0.28, 0.2, 0], [0.28, 0.2, 0], 0.025)), C.basalt, 'stone');
  return S.union(0.005, rails, sleepers, posts);
}
export const railForm = () => form('magma-rail', rail, { min: [-0.42, -0.25, -0.55], max: [0.42, 0.56, 0.55], cell: 0.018, tris: 260 });

function lever() {
  const frame = P(S.union(0.01, S.roundBox([0, 0.08, 0], [0.22, 0.08, 0.14], 0.02), S.capsule([0, 0.12, 0], [0.12, 0.95, 0], 0.03)), C.iron, 'metal');
  const disc = P(S.transform(S.roundCylinder([0, 0, 0], 0.16, 0.16, 0.02, 0.005), { translate: [0.13, 1.05, 0], rotate: [Math.PI / 2, 0, 0] }), (x) => (x > 0.13 ? C.red : C.white), 'wood');
  return S.union(0.01, frame, disc);
}
export const leverForm = () => form('magma-lever', lever, { min: [-0.3, -0.05, -0.25], max: [0.35, 1.25, 0.25], cell: 0.016, tris: 260 });

function valve() {
  const pipe = P(S.union(0.02, S.roundCylinder([0, 0.3, 0], 0.1, 0.1, 0.3, 0.02), S.roundCylinder([0, 0.04, 0], 0.18, 0.18, 0.04, 0.01)), C.rust, 'metal');
  const wheel = P(S.union(0.01, S.torus([0, 0.64, 0], 0.22, 0.03), S.capsule([-0.22, 0.64, 0], [0.22, 0.64, 0], 0.02), S.capsule([0, 0.64, -0.22], [0, 0.64, 0.22], 0.02)), C.iron, 'metal');
  return S.union(0.01, pipe, wheel);
}
export const valveForm = () => form('magma-valve', valve, { min: [-0.3, -0.05, -0.3], max: [0.3, 0.72, 0.3], cell: 0.016, tris: 300 });

function cart(wreck) {
  const tub = S.subtract(0.02, S.roundBox([0, 0.42, 0], [0.32, 0.22, 0.45], 0.05), S.roundBox([0, 0.55, 0], [0.26, 0.2, 0.39], 0.03));
  const ore = P(S.displace(S.ellipsoid([0, 0.55, 0], [0.24, 0.08, 0.34]), lumps(9, 0.08, 31), 0.04), C.basaltHi, 'stone');
  const wheels = P(S.union(0.01, ...[[-0.3, -0.28], [0.3, -0.28], [-0.3, 0.28], [0.3, 0.28]].map(([x, z]) => S.transform(S.roundCylinder([0, 0, 0], 0.12, 0.12, 0.03, 0.01), { translate: [x, 0.14, z], rotate: [0, 0, Math.PI / 2] }))), C.ironDk, 'metal');
  const g = S.union(0.01, P(tub, (x, y) => (y > 0.6 ? C.rust : C.iron), 'metal'), ore, wheels);
  return wreck ? S.transform(g, { translate: [0, 0.3, 0], rotate: [0, 0, 1.35] }) : g;
}
export const cartForm = () => form('magma-cart', () => cart(false), { min: [-0.42, -0.02, -0.55], max: [0.42, 0.72, 0.55], cell: 0.02, tris: 420 });
export const wreckForm = () => form('magma-wreck', () => cart(true), { min: [-0.8, -0.05, -0.55], max: [0.6, 0.75, 0.55], cell: 0.02, tris: 420 });


function plate() {
  const slab = S.displace(S.roundBox([0, -0.06, 0], [0.98, 0.06, 0.98], 0.03), lumps(3, 0.04, 41), 0.02);
  return P(slab, (x, y) => (y > -0.03 ? C.crust : C.crustDk), 'soil'); 
}
export const plateForm = () => form('magma-plate', plate, { min: [-1.05, -0.15, -1.05], max: [1.05, 0.05, 1.05], cell: 0.04, tris: 400 });


function column() {
  const shaft = S.roundCylinder([0, -0.7, 0], 0.95, 0.9, 0.7, 0.04);
  const top = S.displace(shaft, lumps(4, 0.04, 51), 0.02);
  return P(top, (x, y) => (y > -0.08 ? C.basaltHi : C.basalt), 'stone');
}
export const columnForm = () => form('magma-column', column, { min: [-1.0, -1.45, -1.0], max: [1.0, 0.06, 1.0], cell: 0.04, tris: 360 });

export const MAGMA_KINDS = ['forge', 'anvil', 'basalt', 'obsidian', 'rail', 'lever', 'valve', 'cart'];
export function placeMagma(batch, W) {
  
  if (W.hazard) { plateForm(); columnForm(); }
  if (W.rails) cartForm();
  for (const o of W.objects) {
    if (!MAGMA_KINDS.includes(o.kind)) continue;
    const g = W.groundAt(o.x, o.y), at = { x: o.x, h: g - 0.03, y: o.y, rot: o.rot || 0, s: o.s || 1 };
    if (o.kind === 'forge') batch.add(forgeForm(), at);
    else if (o.kind === 'anvil') batch.add(anvilForm(), at);
    else if (o.kind === 'basalt') batch.add(basaltForm(), { ...at, h: g - 0.1 });
    else if (o.kind === 'obsidian') batch.add(obsidianForm(), at);
    else if (o.kind === 'rail') batch.add(railForm(), { ...at, h: (o.h || 0.5) - 0.5 + 0.12, s: [1, 1, o.s || 1] });
    else if (o.kind === 'lever') batch.add(leverForm(), at);
    else if (o.kind === 'valve') batch.add(valveForm(), at);
    else if (o.kind === 'cart') batch.add(o.wreck ? wreckForm() : cartForm(), at);
  }
}
