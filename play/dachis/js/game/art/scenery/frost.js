








import { S, form, lin, jit } from './kit.js';
import { fbm3 } from '../../../vendor/fml/moon/noise.js';

const C = {
  needle: lin('#1e4a46'), needleHi: lin('#2c6458'), snow: lin('#f4f8ff'), snowShade: lin('#c8daf0'), bark: lin('#5a3a2a'),
  ice: lin('#bfe6ff'), iceDeep: lin('#6ab0e0'), wood: lin('#8a5a36'), dark: lin('#5c3a22'), pale: lin('#b88a5a'), rope: lin('#d8c08a'),
  iron: lin('#4a4450'), stone: lin('#8a94a8'),
};
const P = (node, color, material) => S.paint(node, { color, material });
const lumps = (s, amp, seed) => (x, y, z) => (fbm3(x * s, y * s, z * s, { seed, octaves: 2 }) - 0.5) * amp;

function fir() {
  const trunk = P(S.capsule([0, 0, 0], [0, 0.5, 0], 0.08), C.bark, 'bark');
  const tiers = [], caps = [];
  for (let k = 0; k < 3; k++) {
    const y = 0.35 + k * 0.48, r = 0.62 - k * 0.17, h = 0.62 - k * 0.08;
    tiers.push(S.displace(S.roundCone([0, y, 0], [0, y + h, 0], r, 0.03), lumps(9, 0.07, 11 + k), 0.05));
    caps.push(S.displace(S.roundCone([0, y + h * 0.42, 0], [0, y + h + 0.02, 0], r * 0.62, 0.04), lumps(8, 0.06, 21 + k), 0.04));
  }
  const needles = P(S.union(0.03, ...tiers), (x, y, z) => (Math.sin(Math.atan2(x, z) * 9 + y * 5) > 0.3 ? C.needleHi : C.needle), 'leaf');
  const snow = P(S.union(0.03, ...caps), (x, y) => (y > 0.9 ? C.snow : C.snowShade), 'snow');
  return S.union(0.02, trunk, needles, snow);
}
export const firForm = () => form('frost-fir', fir, { min: [-0.72, -0.05, -0.72], max: [0.72, 2.2, 0.72], cell: 0.03, tris: 520 });

function drift() {
  const mound = S.displace(S.ellipsoid([0, 0, 0], [0.95, 0.32, 0.55]), (x, y, z) => lumps(4, 0.12, 31)(x, y, z) + (z > 0 ? -z * 0.12 : 0), 0.08);
  return P(S.intersect(0.02, mound, S.plane([0, 1, 0], 0.02)), (x, y) => (y > 0.16 ? C.snow : C.snowShade), 'snow');
}
export const driftForm = () => form('frost-drift', drift, { min: [-1.1, -0.05, -0.7], max: [1.1, 0.42, 0.7], cell: 0.03, tris: 220 });

function iceBlock() {
  const slab = S.transform(S.displace(S.roundBox([0, 0, 0], [0.42, 0.34, 0.16], 0.05), lumps(6, 0.05, 41), 0.03), { translate: [0, 0.3, 0], rotate: [0.35, 0.4, 0.2] });
  const crumb = S.union(0.02, S.ellipsoid([0.42, 0.04, 0.2], [0.12, 0.06, 0.1]), S.ellipsoid([-0.36, 0.03, -0.18], [0.09, 0.05, 0.08]));
  return S.union(0.02, P(slab, (x, y) => (y > 0.45 ? C.ice : C.iceDeep), 'gem'), P(crumb, C.ice, 'gem'));
}
export const iceBlockForm = () => form('frost-iceblock', iceBlock, { min: [-0.7, -0.05, -0.6], max: [0.7, 0.85, 0.6], cell: 0.022, tris: 260 });


function span() {
  const planks = [];
  for (let k = 0; k < 7; k++) planks.push(S.roundBox([0, -0.04, -0.72 + k * 0.24], [0.6 - jit(k, 5) * 0.05, 0.035, 0.1], 0.015));
  const deck = P(S.union(0.005, ...planks), (x, y, z) => (jit(Math.floor((z + 1) * 4.2), 6) > 0.5 ? C.pale : C.wood), 'plank');
  const beams = P(S.union(0.01, S.capsule([-0.55, -0.1, -0.82], [-0.55, -0.1, 0.82], 0.05), S.capsule([0.55, -0.1, -0.82], [0.55, -0.1, 0.82], 0.05)), C.dark, 'wood');
  const posts = P(S.union(0.01, ...[-0.62, 0.62].map((x) => S.capsule([x, -0.1, -0.76], [x, 0.55, -0.76], 0.04))), C.dark, 'wood');
  const rails = P(S.union(0.005, ...[-0.62, 0.62].flatMap((x) => [S.capsule([x, 0.52, -0.8], [x, 0.46, 0.8], 0.022), S.capsule([x, 0.25, -0.8], [x, 0.2, 0.8], 0.016)])), C.rope, 'wood');
  return S.union(0.005, deck, beams, posts, rails);
}
export const spanForm = () => form('frost-span', span, { min: [-0.72, -0.2, -0.9], max: [0.72, 0.62, 0.9], cell: 0.02, tris: 420 });

function winch() {
  const frame = P(S.union(0.01, S.roundBox([-0.42, 0.4, 0], [0.06, 0.4, 0.06], 0.02), S.roundBox([0.42, 0.4, 0], [0.06, 0.4, 0.06], 0.02),
    S.roundBox([0, 0.04, 0], [0.5, 0.04, 0.3], 0.02)), C.dark, 'wood');
  const drum = P(S.transform(S.roundCylinder([0, 0, 0], 0.18, 0.18, 0.36, 0.02), { translate: [0, 0.55, 0], rotate: [0, 0, Math.PI / 2] }), C.rope, 'wood');
  const wheel = P(S.union(0.01, S.transform(S.torus([0, 0, 0], 0.3, 0.035), { translate: [0.52, 0.55, 0], rotate: [0, 0, Math.PI / 2] }),
    ...[0, 1, 2].map((k) => { const a = k * Math.PI / 3; return S.capsule([0.52, 0.55 + Math.sin(a) * 0.3, Math.cos(a) * 0.3], [0.52, 0.55 - Math.sin(a) * 0.3, -Math.cos(a) * 0.3], 0.025); })), C.iron, 'metal');
  return S.union(0.01, frame, drum, wheel);
}
export const winchForm = () => form('frost-winch', winch, { min: [-0.6, -0.05, -0.4], max: [0.9, 0.95, 0.4], cell: 0.02, tris: 380 });

function prayerLine() {
  const poles = P(S.union(0.01, S.capsule([-0.9, 0, 0], [-0.9, 1.3, 0], 0.035), S.capsule([0.9, 0, 0], [0.9, 1.3, 0], 0.035)), C.dark, 'wood');
  const line = P(S.capsule([-0.9, 1.25, 0], [0.9, 1.25, 0], 0.012), C.rope, 'wood');
  const flags = [];
  for (let k = 0; k < 6; k++) { const x = -0.72 + k * 0.29, y = 1.24 - Math.sin((k + 0.5) / 6 * Math.PI) * 0.12; flags.push(S.roundBox([x, y - 0.13, 0], [0.1, 0.12, 0.012], 0.01)); }
  const cols = [lin('#e04848'), lin('#f0c040'), lin('#4ab0e0'), lin('#f4f4f4'), lin('#5ac060'), lin('#e04848')];
  return S.union(0.005, poles, line, P(S.union(0.005, ...flags), (x) => cols[Math.max(0, Math.min(5, Math.floor((x + 0.86) / 0.29)))], 'cloth'));
}
export const prayerLineForm = () => form('frost-prayerline', prayerLine, { min: [-1.0, -0.05, -0.15], max: [1.0, 1.4, 0.15], cell: 0.02, tris: 300 });



function frozen() {
  const body = S.union(0.06, S.ellipsoid([0, 0.42, 0], [0.32, 0.3, 0.28]), S.sphere([0.12, 0.74, 0.1], 0.2), S.sphere([0.02, 0.95, 0.12], 0.07), S.sphere([0.24, 0.93, 0.04], 0.07));
  const ice = S.subtract(0.02, S.displace(S.roundBox([0, 0.3, 0], [0.55, 0.3, 0.48], 0.08), lumps(5, 0.06, 51), 0.04), S.offset(body, 0.03));
  return S.union(0.01, P(body, [1, 1, 1], 'fruit'), P(ice, (x, y) => (y > 0.85 ? C.ice : C.iceDeep), 'gem'));
}
export const frozenForm = () => form('frost-frozen', frozen, { min: [-0.7, -0.05, -0.62], max: [0.7, 1.1, 0.62], cell: 0.025, tris: 520 });

export const FROST_KINDS = ['fir', 'drift', 'iceblock', 'span', 'winch', 'prayerline', 'frozen'];
export function placeFrost(batch, W) {
  if (W.decks) spanForm(); 
  if (W.frozen) { frozenForm(); iceBlockForm(); } 
  for (const o of W.objects) {
    if (!FROST_KINDS.includes(o.kind)) continue;
    const at = { x: o.x, h: o.h != null ? o.h : W.groundAt(o.x, o.y) - 0.03, y: o.y, rot: o.rot || 0, s: o.s || 1 };
    if (o.kind === 'fir') batch.add(firForm(), at);
    else if (o.kind === 'drift') batch.add(driftForm(), at);
    else if (o.kind === 'iceblock') batch.add(iceBlockForm(), at);
    else if (o.kind === 'span') batch.add(spanForm(), at);
    else if (o.kind === 'winch') batch.add(winchForm(), at);
    else if (o.kind === 'prayerline') batch.add(prayerLineForm(), at);
    else if (o.kind === 'frozen') batch.add(frozenForm(), at, { fruit: lin(o.c || '#a8bfd6') });
  }
}
