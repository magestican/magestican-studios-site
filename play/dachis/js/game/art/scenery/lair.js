

















import { S, form, lin } from './kit.js';
import { fbm3 } from '../../../vendor/fml/moon/noise.js';
import { LAIR_KINDS } from '../../features/world/lairDressing.js';

const C = {
  bronze: lin('#b07a34'), bronzeDk: lin('#6a4620'), cloth: lin('#c8283a'), ash: lin('#8c8a88'), ashDk: lin('#5a5856'), char: lin('#2a2420'),
  stone: lin('#8a8478'), stoneDk: lin('#5e5a52'), sooty: lin('#3a3632'), clay: lin('#b8805a'), clayDk: lin('#7a4e34'),
  reed: lin('#d8b866'), reedDk: lin('#9a7a3a'), wood: lin('#8a5a36'), woodDk: lin('#5a3a22'), pale: lin('#e0c08a'), ring: lin('#b08a5a'),
  sand: lin('#e6d2a0'), shell: lin('#f4e8e0'), iron: lin('#5a5e66'), soil: lin('#5a3e2a'), violet: lin('#7a4ad8'), violetHi: lin('#b08aff'),
  leaf: lin('#3e8a3a'), paint: lin('#f2f0e6'), paintBlue: lin('#3a7ad8'), moss: lin('#5aa040'), mossHi: lin('#86c860'), petal: lin('#ffd84a'),
  black: lin('#151218'), quill: lin('#3a3040'), pool: lin('#120c14'), red: lin('#ff2a36'), glass: lin('#ffe9a0'),
};
const P = (node, color, material) => S.paint(node, { color, material });
const lumps = (s, amp, seed) => (x, y, z) => (fbm3(x * s, y * s, z * s, { seed, octaves: 2 }) - 0.5) * amp;
const flatBelow = (n) => S.intersect(0.01, n, S.plane([0, -1, 0], 0.0)); 

function clapper() {
  const ash = P(flatBelow(S.displace(S.ellipsoid([0, 0, 0], [0.42, 0.12, 0.34]), lumps(6, 0.08, 3), 0.05)), C.ash, 'soil');
  const rod = P(S.capsule([-0.28, 0.06, -0.05], [0.12, 0.2, 0.06], 0.035), C.bronzeDk, 'metal');
  const ball = P(S.sphere([0.16, 0.2, 0.07], 0.1), C.bronze, 'metal');
  const ringT = P(S.transform(S.torus([0, 0, 0], 0.05, 0.016), { translate: [-0.3, 0.06, -0.06], rotate: [Math.PI / 2, 0, 0.5] }), C.bronzeDk, 'metal');
  const cloth = P(S.roundBox([-0.12, 0.13, 0.0], [0.03, 0.04, 0.07], 0.01), C.cloth, 'wood');
  const tail = P(S.roundCone([-0.12, 0.12, 0.05], [-0.04, 0.03, 0.22], 0.03, 0.012), C.cloth, 'wood');
  return S.union(0.02, ash, rod, ball, ringT, cloth, tail);
}
export const clapperForm = () => form('lair-clapper', clapper, { min: [-0.5, -0.05, -0.42], max: [0.5, 0.36, 0.42], cell: 0.02, tris: 260 });

function hearth() {
  const stones = [];
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; stones.push(S.displace(S.ellipsoid([Math.sin(a) * 0.5, 0.07, Math.cos(a) * 0.5], [0.13, 0.1, 0.11]), lumps(9, 0.05, 40 + k), 0.03)); }
  const ring = P(S.union(0.02, ...stones), (x, y) => (y > 0.1 ? C.sooty : C.stoneDk), 'stone');
  const ash = P(flatBelow(S.displace(S.ellipsoid([0, 0, 0], [0.4, 0.08, 0.4]), lumps(7, 0.05, 9), 0.03)), (x, y, z) => (fbm3(x * 6, 0, z * 6, { seed: 2 }) > 0.55 ? C.ashDk : C.ash), 'soil');
  const log = P(S.capsule([-0.22, 0.08, -0.05], [0.2, 0.1, 0.08], 0.06), C.char, 'bark');
  const log2 = P(S.capsule([-0.05, 0.08, -0.22], [0.06, 0.11, 0.18], 0.05), C.char, 'bark');
  return S.union(0.02, ring, ash, log, log2);
}
export const hearthForm = () => form('lair-hearth', hearth, { min: [-0.7, -0.05, -0.7], max: [0.7, 0.3, 0.7], cell: 0.025, tris: 380 });

function offering() {
  const slab = P(S.displace(S.roundBox([0, 0.09, 0], [0.34, 0.09, 0.26], 0.04), lumps(5, 0.04, 7), 0.02), C.stone, 'stone');
  const bowl = S.subtract(0.01, S.roundCone([0, 0.19, 0], [0, 0.31, 0], 0.08, 0.15), S.sphere([0, 0.36, 0], 0.13));
  const crack = S.roundBox([0.12, 0.27, 0], [0.012, 0.05, 0.03], 0.002);
  return S.union(0.01, slab, P(S.subtract(0.005, bowl, crack), C.clay, 'wood'));
}
export const offeringForm = () => form('lair-offering', offering, { min: [-0.45, -0.05, -0.35], max: [0.45, 0.42, 0.35], cell: 0.02, tris: 240 });

function broom() {
  const rock = P(S.displace(S.ellipsoid([0.18, 0.16, 0], [0.24, 0.2, 0.2]), lumps(6, 0.06, 13), 0.04), C.stone, 'stone');
  const pole = P(S.capsule([-0.32, 0.04, 0], [0.12, 1.02, 0], 0.025), C.wood, 'wood');
  const head = P(S.displace(S.roundCone([-0.42, 0.02, 0], [-0.3, 0.26, 0], 0.16, 0.05), (x, y, z) => Math.sin(Math.atan2(x + 0.36, z) * 40) * 0.01, 0.02), (x, y) => (y > 0.2 ? C.reedDk : C.reed), 'wood');
  const tie = P(S.transform(S.torus([0, 0, 0], 0.06, 0.015), { translate: [-0.31, 0.25, 0], rotate: [0, 0, -0.4] }), C.reedDk, 'wood');
  return S.union(0.02, rock, pole, head, tie);
}
export const broomForm = () => form('lair-broom', broom, { min: [-0.62, -0.05, -0.3], max: [0.45, 1.1, 0.3], cell: 0.022, tris: 300 });

function namestone() {
  const slab = S.displace(S.roundBox([0, 0.42, 0], [0.32, 0.42, 0.08], 0.05), lumps(4, 0.05, 23), 0.03);
  const marks = [];
  for (let row = 0; row < 4; row++) for (let k = 0; k < 6; k++) marks.push(S.roundBox([-0.22 + k * 0.085 + (row % 2) * 0.03, 0.2 + row * 0.15, 0.085], [0.008, 0.05, 0.02], 0.003));
  return P(S.subtract(0.004, slab, S.union(0, ...marks)), (x, y, z) => (z > 0.07 && Math.abs(x) < 0.3 && y > 0.12 && y < 0.72 && Math.abs(Math.sin(x * 37)) < 0.18 ? C.stoneDk : C.stone), 'stone');
}
export const namestoneForm = () => form('lair-namestone', namestone, { min: [-0.42, -0.05, -0.18], max: [0.42, 0.92, 0.18], cell: 0.018, tris: 320 });

function sweepings() {
  const pile = P(flatBelow(S.displace(S.ellipsoid([0, 0, 0], [0.34, 0.16, 0.24]), lumps(8, 0.04, 31), 0.03)), C.sand, 'soil');
  const bits = [];
  for (let k = 0; k < 6; k++) { const a = k * 1.7; bits.push(S.ellipsoid([Math.sin(a) * 0.18, 0.1 + (k % 3) * 0.02, Math.cos(a) * 0.12], [0.05, 0.02, 0.04])); }
  return S.union(0.01, pile, P(S.union(0.01, ...bits), C.shell, 'stone'));
}
export const sweepingsForm = () => form('lair-sweepings', sweepings, { min: [-0.45, -0.05, -0.35], max: [0.45, 0.24, 0.35], cell: 0.02, tris: 200 });

function stump() {
  const trunk = S.displace(S.roundCone([0, 0, 0], [0, 0.6, 0], 0.34, 0.24), lumps(7, 0.05, 51), 0.03); 
  const roots = [];
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.3; roots.push(S.roundCone([0, 0.08, 0], [Math.sin(a) * 0.5, 0.0, Math.cos(a) * 0.5], 0.1, 0.03)); }
  const body = flatBelow(S.intersect(0.01, S.union(0.04, trunk, ...roots), S.plane([0, 1, 0], 0.36)));
  return P(body, (x, y, z) => (y > 0.34 ? (Math.sin(Math.hypot(x, z) * 60) > 0.2 ? C.pale : C.ring) : C.woodDk), 'bark');
}
export const stumpForm = () => form('lair-stump', stump, { min: [-0.6, -0.05, -0.6], max: [0.6, 0.42, 0.6], cell: 0.022, tris: 300 });

function shears() {
  const blades = [-1, 1].map((s) => S.roundCone([s * 0.02, 0.0, 0], [s * 0.05, 0.42, 0], 0.012, 0.03));
  const pivot = S.sphere([0, 0.44, 0], 0.035);
  const handles = [-1, 1].map((s) => S.capsule([s * 0.05, 0.46, 0], [s * 0.2, 0.86, 0.02], 0.028));
  const grips = [-1, 1].map((s) => S.capsule([s * 0.16, 0.76, 0.015], [s * 0.21, 0.88, 0.02], 0.038));
  const soil = P(flatBelow(S.ellipsoid([0, 0, 0], [0.2, 0.06, 0.18])), C.soil, 'soil');
  return S.union(0.01, soil, P(S.union(0.01, ...blades, pivot, ...handles), C.iron, 'metal'), P(S.union(0.01, ...grips), C.wood, 'wood'));
}
export const shearsForm = () => form('lair-shears', shears, { min: [-0.3, -0.05, -0.22], max: [0.3, 0.95, 0.22], cell: 0.016, tris: 240 });

function violets() {
  const bed = P(flatBelow(S.roundBox([0, 0.0, 0], [0.55, 0.06, 0.32], 0.05)), C.soil, 'soil');
  const edge = [];
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; edge.push(S.ellipsoid([Math.sin(a) * 0.6, 0.05, Math.cos(a) * 0.36], [0.08, 0.06, 0.07])); }
  const leaves = [], flowers = [];
  for (let k = 0; k < 14; k++) {
    const x = ((k * 37) % 90) / 90 * 0.9 - 0.45, z = ((k * 53) % 50) / 50 * 0.46 - 0.23;
    leaves.push(S.ellipsoid([x, 0.08, z], [0.07, 0.03, 0.06]));
    flowers.push(S.sphere([x + 0.02, 0.14, z - 0.01], 0.035));
  }
  return S.union(0.01, bed, P(S.union(0.01, ...edge), C.stone, 'stone'), P(S.union(0.02, ...leaves), C.leaf, 'leaf'), P(S.union(0.01, ...flowers), (x, y, z) => (Math.sin(x * 40 + z * 30) > 0 ? C.violet : C.violetHi), 'petal'));
}
export const violetsForm = () => form('lair-violets', violets, { min: [-0.72, -0.05, -0.46], max: [0.72, 0.2, 0.46], cell: 0.02, tris: 360 });

function floodpost() {
  const post = S.roundBox([0, 0.85, 0], [0.07, 0.85, 0.07], 0.02);
  const foot = S.displace(S.ellipsoid([0, 0.02, 0], [0.18, 0.08, 0.18]), lumps(8, 0.04, 61), 0.02);
  
  const band = (x, y) => [0.45, 0.82, 1.18, 1.52].some((h) => Math.abs(y - h) < 0.035) ? (y > 1.4 ? C.paintBlue : C.paint) : C.wood;
  return S.union(0.01, P(post, band, 'wood'), P(foot, C.stoneDk, 'stone'));
}
export const floodpostForm = () => form('lair-floodpost', floodpost, { min: [-0.22, -0.05, -0.22], max: [0.22, 1.75, 0.22], cell: 0.02, tris: 200 });

function spears() {
  const out = [];
  for (let k = 0; k < 3; k++) {
    const z = -0.16 + k * 0.16, y = 0.035;
    out.push(P(S.capsule([-0.75, y, z], [0.55, y, z + 0.02], 0.025), C.wood, 'wood'));
    out.push(P(S.roundCone([0.55, y, z + 0.02], [0.78, y, z + 0.025], 0.045, 0.006), C.iron, 'metal'));
    out.push(P(S.transform(S.torus([0, 0, 0], 0.03, 0.01), { translate: [0.5, y, z + 0.02], rotate: [0, 0, Math.PI / 2] }), C.cloth, 'wood'));
  }
  return S.union(0.01, ...out);
}
export const spearsForm = () => form('lair-spears', spears, { min: [-0.85, -0.05, -0.3], max: [0.85, 0.12, 0.3], cell: 0.016, tris: 300 });

function lamp(lit) {
  const base = S.roundBox([0, 0.12, 0], [0.16, 0.12, 0.16], 0.03);
  const col = S.roundBox([0, 0.5, 0], [0.06, 0.28, 0.06], 0.02);
  const head = S.subtract(0.01, S.roundBox([0, 0.88, 0], [0.16, 0.12, 0.16], 0.03), S.roundBox([0, 0.88, 0], [0.18, 0.07, 0.09], 0.01));
  const cap = S.roundCone([0, 1.0, 0], [0, 1.16, 0], 0.2, 0.03);
  const parts = [P(S.union(0.02, base, col, head, cap), C.stone, 'stone')];
  parts.push(lit ? P(S.sphere([0, 0.88, 0], 0.075), C.glass, 'lamp-glow') : P(S.sphere([0, 0.85, 0], 0.06), C.sooty, 'stone'));
  return S.union(0.01, ...parts);
}
export const lampOutForm = () => form('lair-lampout', () => lamp(false), { min: [-0.25, -0.05, -0.25], max: [0.25, 1.22, 0.25], cell: 0.02, tris: 220 });
export const lampLitForm = () => form('lair-lamplit', () => lamp(true), { min: [-0.25, -0.05, -0.25], max: [0.25, 1.22, 0.25], cell: 0.02, tris: 220 });

function moss() {
  const stone = P(S.displace(S.roundBox([0, 0.08, 0], [0.26, 0.08, 0.2], 0.05), lumps(5, 0.04, 71), 0.02), C.stone, 'stone');
  const heap = P(S.displace(S.ellipsoid([0, 0.2, 0], [0.18, 0.08, 0.14]), lumps(14, 0.05, 72), 0.03), (x, y, z) => (fbm3(x * 9, y * 9, z * 9, { seed: 5 }) > 0.5 ? C.mossHi : C.moss), 'leaf');
  const stem = P(S.capsule([0.06, 0.25, 0.02], [0.08, 0.36, 0.03], 0.012), C.leaf, 'leaf');
  const flower = P(S.sphere([0.08, 0.38, 0.03], 0.04), C.petal, 'petal');
  return S.union(0.01, stone, heap, stem, flower);
}
export const mossForm = () => form('lair-moss', moss, { min: [-0.35, -0.05, -0.3], max: [0.35, 0.45, 0.3], cell: 0.018, tris: 240 });

function feather() {
  const shaft = S.capsule([-0.36, 0.02, 0], [0.36, 0.03, 0.04], 0.012);
  const vane = S.transform(S.ellipsoid([0, 0, 0], [0.32, 0.015, 0.075]), { translate: [0.04, 0.025, 0.035], rotate: [0, -0.06, 0] });
  return S.union(0.01, P(shaft, C.quill, 'wood'), P(S.subtract(0.005, vane, S.roundBox([0.12, 0.03, 0.1], [0.012, 0.03, 0.04], 0.002)), C.black, 'wood'));
}
export const featherForm = () => form('lair-feather', feather, { min: [-0.42, -0.02, -0.12], max: [0.42, 0.08, 0.16], cell: 0.012, tris: 140 });

function redpool() {
  const rim = P(flatBelow(S.displace(S.subtract(0.03, S.ellipsoid([0, 0, 0], [0.48, 0.08, 0.38]), S.ellipsoid([0, 0.06, 0], [0.36, 0.07, 0.28])), lumps(7, 0.04, 81), 0.03)), C.sooty, 'stone');
  const water = P(S.ellipsoid([0, 0.015, 0], [0.37, 0.02, 0.29]), C.pool, 'stone');
  const glow = P(S.ellipsoid([0.04, 0.03, -0.02], [0.16, 0.012, 0.12]), C.red, 'lamp-glow');
  return S.union(0.01, rim, water, glow);
}
export const redpoolForm = () => form('lair-redpool', redpool, { min: [-0.58, -0.05, -0.46], max: [0.58, 0.14, 0.46], cell: 0.02, tris: 220 });

const FORMS = { clapper: clapperForm, hearth: hearthForm, offering: offeringForm, broom: broomForm, namestone: namestoneForm, sweepings: sweepingsForm,
  stump: stumpForm, shears: shearsForm, violets: violetsForm, floodpost: floodpostForm, spears: spearsForm, moss: mossForm, feather: featherForm, redpool: redpoolForm };
export function placeLair(batch, W) {
  for (const o of W.objects) {
    if (!LAIR_KINDS.includes(o.kind)) continue;
    const at = { x: o.x, h: W.groundAt(o.x, o.y) - 0.02, y: o.y, rot: o.rot || 0, s: o.s || 1 };
    batch.add(o.kind === 'lampout' ? (o.lit ? lampLitForm() : lampOutForm()) : FORMS[o.kind](), at);
  }
}
