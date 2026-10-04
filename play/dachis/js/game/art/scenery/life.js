












import { S, form, lin, mixLin, jit } from './kit.js';
import { fbm3 } from '../../../vendor/fml/moon/noise.js';

const C = {
  wood: lin('#8a5a36'), dark: lin('#5c3a22'), pale: lin('#b88a5a'), straw: lin('#ecc870'), clay: lin('#c8643c'),
  clayDark: lin('#8a3e24'), stone: lin('#b0a496'), stoneDark: lin('#7e746a'), sack: lin('#dcc69a'), rope: lin('#d8c08a'),
  iron: lin('#4a4450'), fish: lin('#8ab4cc'), fishBelly: lin('#e6eef2'), food: [0.95, 0.95, 0.95], copper: lin('#b86a3a'),
  water: lin('#1c3a4a'), leaf: lin('#3c8a3a'), leafHi: lin('#8cd05a'), leafDark: lin('#1e5a2e'),
};
const P = (node, color, material) => S.paint(node, { color, material });
const lumps = (s, amp, seed) => (x, y, z) => (fbm3(x * s, y * s, z * s, { seed, octaves: 2 }) - 0.5) * amp;


function bowl() {
  const body = S.subtract(0.01, S.roundCylinder([0, 0.07, 0], 0.15, 0.1, 0.07, 0.03), S.roundCylinder([0, 0.12, 0], 0.125, 0.08, 0.06, 0.02));
  const food = S.displace(S.ellipsoid([0, 0.12, 0], [0.12, 0.05, 0.12]), lumps(30, 0.03, 3), 0.02);
  return S.union(0.01, P(body, C.pale, 'wood'), P(food, C.food, 'fruit'));
}
export const bowlForm = () => form('life-bowl', bowl, { min: [-0.22, -0.03, -0.22], max: [0.22, 0.22, 0.22], cell: 0.012, tris: 160 });

function basket() {
  const weave = (x, y, z) => (Math.sin(Math.atan2(x, z) * 14 + Math.floor(y * 30) * 1.6) > 0 ? 0.012 : 0);
  const body = S.subtract(0.01, S.displace(S.roundCylinder([0, 0.12, 0], 0.2, 0.15, 0.12, 0.03), weave, 0.015), S.roundCylinder([0, 0.2, 0], 0.17, 0.13, 0.1, 0.02));
  const rim = S.torus([0, 0.23, 0], 0.19, 0.022);
  const fruit = S.union(0.01, ...[[0, 0.27, 0], [0.09, 0.25, 0.05], [-0.08, 0.25, 0.06], [0.03, 0.25, -0.1], [-0.07, 0.25, -0.06], [0.02, 0.34, 0.02]].map((p) => S.sphere(p, 0.065)));
  return S.union(0.01, P(body, C.straw, 'roof'), P(rim, C.wood, 'wood'), P(fruit, [1, 1, 1], 'fruit'));
}
export const basketForm = () => form('life-basket', basket, { min: [-0.28, -0.03, -0.28], max: [0.28, 0.42, 0.28], cell: 0.014, tris: 260 });

function pots() {
  const pot = (x, z, s) => S.subtract(0.01,
    S.union(0.05, S.ellipsoid([x, 0.2 * s, z], [0.17 * s, 0.2 * s, 0.17 * s]), S.roundCylinder([x, 0.38 * s, z], 0.09 * s, 0.09 * s, 0.05 * s, 0.02)),
    S.roundCylinder([x, 0.42 * s, z], 0.065 * s, 0.065 * s, 0.06 * s, 0.01));
  const band = (y, s) => (x0, y0) => (Math.abs(y0 - y * s) < 0.018 ? C.clayDark : C.clay);
  return S.union(0.01,
    P(pot(0, 0, 1), (x, y) => band(0.26, 1)(x, y), 'stone'),
    P(pot(0.26, 0.12, 0.62), (x, y) => band(0.26, 0.62)(x, y), 'stone'));
}
export const potsForm = () => form('life-pots', pots, { min: [-0.25, -0.03, -0.25], max: [0.45, 0.5, 0.3], cell: 0.016, tris: 260 });

function crates() {
  const crate = (c, h, rot) => S.transform(S.union(0.005,
    P(S.roundBox([0, 0, 0], [h, h, h], 0.02), C.pale, 'wood'),
    P(S.union(0.002, S.roundBox([0, 0, h + 0.004], [h * 0.95, 0.03, 0.01], 0.008), S.roundBox([0, 0, -h - 0.004], [h * 0.95, 0.03, 0.01], 0.008),
      S.roundBox([h + 0.004, 0, 0], [0.01, 0.03, h * 0.95], 0.008), S.roundBox([-h - 0.004, 0, 0], [0.01, 0.03, h * 0.95], 0.008)), C.dark, 'wood')),
  { translate: c, rotate: [0, rot, 0] });
  const sack = P(S.union(0.06, S.ellipsoid([0.42, 0.17, 0.12], [0.15, 0.18, 0.13]), S.ellipsoid([0.42, 0.36, 0.12], [0.06, 0.05, 0.06])), C.sack, 'canvas');
  const tie = P(S.torus([0.42, 0.32, 0.12], 0.06, 0.012), C.rope, 'wood');
  
  return S.union(0.005, crate([0, 0.18, 0], 0.18, 0), crate([0.02, 0.36 + 0.13, -0.01], 0.13, 0.4), sack, tie);
}
export const cratesForm = () => form('life-crates', crates, { min: [-0.3, -0.03, -0.3], max: [0.62, 0.66, 0.32], cell: 0.016, tris: 320 });

function fishRack() {
  const leg = (x, z0, z1) => S.capsule([x, 0, z0], [x, 0.95, (z0 + z1) / 2 * 0], 0.03);
  const frame = P(S.union(0.01,
    leg(-0.6, -0.3, 0), S.capsule([-0.6, 0, 0.3], [-0.6, 0.95, 0], 0.03),
    leg(0.6, -0.3, 0), S.capsule([0.6, 0, 0.3], [0.6, 0.95, 0], 0.03),
    S.capsule([-0.68, 0.92, 0], [0.68, 0.92, 0], 0.028)), C.wood, 'wood');
  const fish = [], strings = [];
  for (let k = 0; k < 5; k++) {
    const x = -0.44 + k * 0.22, y = 0.62 - jit(k, 2) * 0.06;
    strings.push(S.capsule([x, 0.9, 0], [x, y + 0.12, 0], 0.006));
    fish.push(S.union(0.02, S.ellipsoid([x, y, 0], [0.045, 0.13, 0.025]), S.roundCone([x, y - 0.12, 0], [x, y - 0.2, 0], 0.012, 0.045)));
  }
  return S.union(0.01, frame, P(S.union(0.002, ...strings), C.rope, 'wood'),
    P(S.union(0.01, ...fish), (x, y, z) => (z > 0.012 ? C.fishBelly : C.fish), 'petal'));
}
export const fishRackForm = () => form('life-fishrack', fishRack, { min: [-0.8, -0.03, -0.4], max: [0.8, 1.05, 0.4], cell: 0.016, tris: 420 });

function cookFire() {
  const stones = P(S.union(0.02, ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => { const a = k / 8 * 6.283; return S.ellipsoid([Math.sin(a) * 0.3, 0.05, Math.cos(a) * 0.3], [0.09, 0.07, 0.08]); })), C.stoneDark, 'stone');
  const logs = P(S.union(0.01, S.capsule([-0.22, 0.05, -0.08], [0.22, 0.09, 0.08], 0.04), S.capsule([-0.2, 0.09, 0.12], [0.2, 0.05, -0.1], 0.04)), C.dark, 'wood');
  const flame = P(S.union(0.03, S.roundCone([0, 0.08, 0], [0, 0.3, 0], 0.11, 0.01), S.roundCone([0.06, 0.08, 0.03], [0.07, 0.22, 0.02], 0.06, 0.01)), lin('#ffb03a'), 'fire');
  const tri = P(S.union(0.01, S.capsule([-0.34, 0, -0.2], [0, 0.82, 0], 0.022), S.capsule([0.34, 0, -0.2], [0, 0.82, 0], 0.022), S.capsule([0, 0, 0.38], [0, 0.82, 0], 0.022)), C.wood, 'wood');
  const chain = P(S.capsule([0, 0.8, 0], [0, 0.56, 0], 0.01), C.iron, 'metal');
  const pot = P(S.subtract(0.01, S.ellipsoid([0, 0.46, 0], [0.16, 0.12, 0.16]), S.roundCylinder([0, 0.58, 0], 0.11, 0.11, 0.04, 0.01)), C.iron, 'metal');
  const stew = P(S.roundCylinder([0, 0.53, 0], 0.11, 0.11, 0.008, 0.004), lin('#d88a3a'), 'fruit');
  const handle = P(S.torus([0, 0.56, 0], 0.15, 0.008), C.iron, 'metal');
  return S.union(0.005, stones, logs, flame, tri, chain, pot, stew, handle);
}
export const cookFireForm = () => form('life-cookfire', cookFire, { min: [-0.45, -0.03, -0.45], max: [0.45, 0.9, 0.5], cell: 0.016, tris: 520 });

function well() {
  
  
  const ring = P(S.subtract(0.01, S.roundCylinder([0, 0.3, 0], 0.48, 0.48, 0.3, 0.04), S.roundCylinder([0, 0.4, 0], 0.34, 0.34, 0.4, 0.02)),
    (x, y, z) => (Math.abs(Math.sin(y * 26)) < 0.18 || Math.abs(Math.sin(Math.atan2(x, z) * 6 + Math.floor(y * 8) * 1.3)) < 0.14 ? C.stoneDark : C.stone), 'stone');
  const water = P(S.roundCylinder([0, 0.36, 0], 0.34, 0.34, 0.01, 0.005), C.water, 'glass');
  const posts = P(S.union(0.01, S.capsule([-0.42, 0.5, 0], [-0.42, 1.3, 0], 0.04), S.capsule([0.42, 0.5, 0], [0.42, 1.3, 0], 0.04),
    S.capsule([-0.48, 1.12, 0], [0.48, 1.12, 0], 0.035)), C.wood, 'wood');
  const roof = P(S.union(0.02, S.transform(S.roundBox([0, 0, 0], [0.62, 0.025, 0.32], 0.02), { translate: [0, 1.38, 0.18], rotate: [0.55, 0, 0] }),
    S.transform(S.roundBox([0, 0, 0], [0.62, 0.025, 0.32], 0.02), { translate: [0, 1.38, -0.18], rotate: [-0.55, 0, 0] })), C.straw, 'roof');
  const rope = P(S.capsule([0.05, 1.1, 0], [0.05, 0.86, 0], 0.008), C.rope, 'wood');
  const bucket = P(S.subtract(0.01, S.roundCylinder([0.05, 0.78, 0], 0.08, 0.065, 0.08, 0.01), S.roundCylinder([0.05, 0.84, 0], 0.065, 0.055, 0.06, 0.005)), C.copper, 'copper');
  return S.union(0.005, ring, water, posts, roof, rope, bucket);
}
export const wellForm = () => form('life-well', well, { min: [-0.7, -0.03, -0.6], max: [0.7, 1.62, 0.6], cell: 0.025, tris: 700 });

const CLOTHS = [lin('#f4f0e6'), lin('#7ab8e8'), lin('#f08a8a'), lin('#f4d26a')];
function washLine() {
  const posts = P(S.union(0.01, S.capsule([-0.9, 0, 0], [-0.9, 1.25, 0], 0.035), S.capsule([0.9, 0, 0], [0.9, 1.25, 0], 0.035)), C.wood, 'wood');
  const line = P(S.union(0.005, S.capsule([-0.9, 1.2, 0], [0, 1.1, 0], 0.008), S.capsule([0, 1.1, 0], [0.9, 1.2, 0], 0.008)), C.rope, 'wood');
  const cloth = (x, w, h, k) => P(S.displace(S.roundBox([x, 1.12 - h, 0], [w, h, 0.012], 0.01), (px, py) => Math.sin(px * 30 + k) * 0.01, 0.012), CLOTHS[k], 'cloth');
  return S.union(0.005, posts, line, cloth(-0.5, 0.16, 0.2, 0), cloth(-0.05, 0.12, 0.26, 1), cloth(0.42, 0.18, 0.16, 2));
}
export const washLineForm = () => form('life-washline', washLine, { min: [-1.0, -0.03, -0.1], max: [1.0, 1.32, 0.1], cell: 0.016, tris: 380 });

function strawBed() {
  const nest = P(S.displace(S.union(0.08, S.ellipsoid([0, 0.07, 0], [0.5, 0.08, 0.36]), S.torus([0, 0.1, 0], 0.36, 0.08)), lumps(18, 0.04, 9), 0.03),
    (x, y, z) => mixLin(lin('#c8a050'), C.straw, Math.min(1, y * 7)), 'roof');
  const pillow = P(S.ellipsoid([0.22, 0.17, 0], [0.12, 0.05, 0.16]), lin('#e8e0f4'), 'cloth');
  return S.union(0.01, nest, pillow);
}
export const strawBedForm = () => form('life-strawbed', strawBed, { min: [-0.62, -0.03, -0.5], max: [0.62, 0.26, 0.5], cell: 0.018, tris: 300 });

function toys() {
  const ball = P(S.sphere([0, 0.11, 0], 0.11), (x, y, z) => (Math.sin(Math.atan2(x, z) * 3) > 0 ? lin('#f05a5a') : lin('#f8f0e0')), 'cloth');
  const cart = P(S.roundBox([0.34, 0.11, 0.08], [0.13, 0.05, 0.08], 0.015), lin('#e8a040'), 'wood');
  const wheels = P(S.union(0.005, ...[[0.24, 0.0], [0.44, 0.0], [0.24, 0.16], [0.44, 0.16]].map(([x, z]) => S.transform(S.roundCylinder([0, 0, 0], 0.045, 0.045, 0.012, 0.005), { translate: [x, 0.05, z], rotate: [Math.PI / 2, 0, 0] }))), C.dark, 'wood');
  const string = P(S.capsule([0.47, 0.11, 0.08], [0.62, 0.01, 0.12], 0.006), C.rope, 'wood');
  const top = P(S.union(0.01, S.roundCone([-0.2, 0.0, 0.22], [-0.2, 0.09, 0.22], 0.005, 0.07), S.capsule([-0.2, 0.09, 0.22], [-0.2, 0.15, 0.22], 0.012)), lin('#5ab4e8'), 'wood');
  return S.union(0.005, ball, cart, wheels, string, top);
}
export const toysForm = () => form('life-toys', toys, { min: [-0.32, -0.03, -0.15], max: [0.7, 0.26, 0.35], cell: 0.012, tris: 300 });

function tools() {
  const barrel = P(S.roundCylinder([0, 0.25, 0], 0.2, 0.18, 0.25, 0.03), C.pale, 'wood');
  const hoops = P(S.union(0.005, S.torus([0, 0.08, 0], 0.19, 0.012), S.torus([0, 0.42, 0], 0.19, 0.012)), C.iron, 'metal');
  const handles = P(S.union(0.005, S.capsule([0.06, 0.3, 0.02], [0.12, 1.15, 0.05], 0.018), S.capsule([-0.05, 0.3, 0.04], [-0.14, 1.1, 0.08], 0.018), S.capsule([0, 0.3, -0.06], [0.02, 1.05, -0.14], 0.018)), C.wood, 'wood');
  const heads = P(S.union(0.005, S.roundBox([0.12, 1.16, 0.1], [0.07, 0.015, 0.05], 0.008), S.roundBox([-0.14, 1.12, 0.08], [0.1, 0.012, 0.012], 0.006)), C.iron, 'metal');
  const broom = P(S.displace(S.roundCone([0.02, 1.02, -0.14], [0.02, 1.22, -0.16], 0.03, 0.08), lumps(40, 0.02, 4), 0.012), C.straw, 'roof');
  return S.union(0.005, barrel, hoops, handles, heads, broom);
}
export const toolsForm = () => form('life-tools', tools, { min: [-0.3, -0.03, -0.3], max: [0.3, 1.3, 0.3], cell: 0.014, tris: 360 });



function sandbags() {
  const bags = [];
  for (let row = 0; row < 2; row++) for (let k = 0; k < (row ? 6 : 7); k++) {
    const a = (k - (row ? 2.5 : 3)) * 0.27, r = 1.1;
    bags.push(S.transform(S.ellipsoid([0, 0, 0], [0.17, 0.085, 0.11]), { translate: [Math.sin(a) * r, 0.07 + row * 0.15, Math.cos(a) * r], rotate: [0, a, 0] }));
  }
  return P(S.displace(S.union(0.03, ...bags), lumps(14, 0.02, 15), 0.012), (x, y, z) => (fbm3(x * 6, y * 6, z * 6, { seed: 16 }) > 0.55 ? lin('#c8b080') : C.sack), 'canvas');
}
export const sandbagsForm = () => form('life-sandbags', sandbags, { min: [-1.2, -0.03, 0.5], max: [1.2, 0.36, 1.32], cell: 0.02, tris: 420 });


function seawall() {
  const blocks = [];
  for (let row = 0; row < 3; row++) for (let k = 0; k < 7; k++) {
    const a = (k - 3 + (row % 2) * 0.5) * 0.24, r = 1.5 + row * -0.04;
    blocks.push(S.transform(S.roundBox([0, 0, 0], [0.17, 0.11, 0.12], 0.03), { translate: [Math.sin(a) * r, -0.3 + row * 0.22, Math.cos(a) * r], rotate: [0, a, 0] }));
  }
  return P(S.union(0.01, ...blocks), (x, y, z) => mixLin(C.stoneDark, C.stone, Math.min(1, Math.max(0, (y + 0.4) * 1.6 + (fbm3(x * 5, y * 5, z * 5, { seed: 17 }) - 0.5) * 0.6))), 'stone');
}
export const seawallForm = () => form('life-seawall', seawall, { min: [-1.2, -0.5, 0.9], max: [1.2, 0.4, 1.8], cell: 0.025, tris: 460 });



function stilts() {
  const deck = P(S.displace(S.roundCylinder([0, -0.06, 0], 1.0, 1.0, 0.06, 0.02), (x) => (Math.abs(Math.sin(x * 15.7)) < 0.08 ? -0.01 : 0), 0.012), C.pale, 'plank');
  const posts = [], braces = [];
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * 6.283 + 0.26, x = Math.sin(a) * 0.86, z = Math.cos(a) * 0.86;
    posts.push(S.capsule([x, -0.08, z], [x, -2.2, z], 0.065));
    const b = (k + 1) / 6 * 6.283 + 0.26, x2 = Math.sin(b) * 0.86, z2 = Math.cos(b) * 0.86;
    braces.push(S.capsule([x, -0.15, z], [x2, -0.75, z2], 0.025));
  }
  const ladder = S.union(0.005, S.capsule([-0.2, 0, 1.0], [-0.2, -1.3, 1.4], 0.025), S.capsule([0.2, 0, 1.0], [0.2, -1.3, 1.4], 0.025),
    ...[1, 2, 3, 4].map((k) => { const t = k / 5; return S.capsule([-0.2, -t * 1.3, 1.0 + t * 0.4], [0.2, -t * 1.3, 1.0 + t * 0.4], 0.02); }));
  return S.union(0.01, deck, P(S.union(0.01, ...posts), C.dark, 'wood'), P(S.union(0.005, ...braces), C.wood, 'wood'), P(ladder, C.wood, 'wood'));
}
export const stiltsForm = () => form('life-stilts', stilts, { min: [-1.1, -2.3, -1.1], max: [1.1, 0.06, 1.5], cell: 0.03, tris: 700 });


function jetty() {
  const planks = [];
  for (let k = 0; k < 7; k++) planks.push(S.roundBox([0, -0.04, -0.72 + k * 0.24], [0.42 - jit(k, 5) * 0.04, 0.035, 0.105], 0.015));
  const deck = P(S.union(0.005, ...planks), (x, y, z) => (jit(Math.floor((z + 1) * 4.2), 6) > 0.5 ? C.pale : C.wood), 'plank');
  const posts = P(S.union(0.01, ...[[-0.42, -0.7], [0.42, -0.7], [-0.42, 0.7], [0.42, 0.7]].map(([x, z]) => S.capsule([x, 0.08, z], [x, -1.2, z], 0.05))), C.dark, 'wood');
  const rope = P(S.union(0.005, S.torus([0.42, 0.0, 0.7], 0.06, 0.014), S.torus([-0.42, 0.0, 0.7], 0.06, 0.014)), C.rope, 'wood');
  return S.union(0.005, deck, posts, rope);
}
export const jettyForm = () => form('life-jetty', jetty, { min: [-0.55, -1.3, -0.9], max: [0.55, 0.12, 0.9], cell: 0.02, tris: 360 });


function raft() {
  const logs = [];
  for (let k = 0; k < 6; k++) logs.push(S.capsule([-0.6 + k * 0.24, 0.0, -0.75], [-0.6 + k * 0.24, 0.0, 0.75 + jit(k, 7) * 0.1], 0.11));
  const body = P(S.union(0.02, ...logs), (x, y, z) => (jit(Math.floor((x + 1) * 4.1), 8) > 0.5 ? C.wood : C.pale), 'wood');
  const ties = P(S.union(0.005, S.capsule([-0.72, 0.1, -0.5], [0.72, 0.1, -0.5], 0.03), S.capsule([-0.72, 0.1, 0.5], [0.72, 0.1, 0.5], 0.03)), C.rope, 'wood');
  const pole = P(S.capsule([-0.5, 0.15, -0.6], [0.55, 0.15, 0.85], 0.025), C.dark, 'wood');
  const post = P(S.union(0.01, S.capsule([0.5, 0.1, -0.6], [0.5, 0.75, -0.6], 0.025), S.capsule([0.5, 0.75, -0.6], [0.5, 0.75, -0.48], 0.015)), C.dark, 'wood');
  const lamp = P(S.roundBox([0.5, 0.66, -0.46], [0.05, 0.07, 0.05], 0.015), lin('#ffd890'), 'lamp-glow');
  return S.union(0.01, body, ties, pole, post, lamp);
}
export const raftForm = () => form('life-raft', raft, { min: [-0.8, -0.15, -0.95], max: [0.8, 0.85, 1.0], cell: 0.022, tris: 520 });


const TRUNK = lin('#9a8858');
const crown = (lo, hi, y0, y1, seed) => (x, y, z) => mixLin(lo, hi, Math.max(0, Math.min(1, (y - y0) / (y1 - y0) * 0.85 + (fbm3(x * 7, y * 7, z * 7, { seed, octaves: 2 }) - 0.5) * 0.5)));

function fruitOn(puffs, n, seed, size, hang) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const [c, r] = puffs[k % puffs.length], a = jit(k, seed) * 6.283, e = -0.25 - jit(k, seed + 1) * 0.6;
    const d = [Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)];
    const p = [c[0] + d[0] * r * 0.92, c[1] + d[1] * r * 0.92, c[2] + d[2] * r * 0.92];
    out.push(S.union(0.01, S.capsule(p, [p[0], p[1] - hang, p[2]], 0.012), S.ellipsoid([p[0], p[1] - hang - size * 0.8, p[2]], [size * 0.85, size, size * 0.85])));
  }
  return out;
}
function fruitTree({ lo, hi, fruit, puffs, n, size, hang, seed }) {
  const trunk = P(S.union(0.06, S.roundCone([0, 0, 0], [0, 1.1, 0], 0.13, 0.08), S.roundCone([0, 0.8, 0], [0.34, 1.25, 0.1], 0.06, 0.04),
    S.roundCone([0, 0.9, 0], [-0.3, 1.3, -0.1], 0.055, 0.035), S.roundCone([0, 0.05, 0], [0.2, -0.02, 0.08], 0.08, 0.04)), TRUNK, 'bark');
  const leaves = P(S.displace(S.union(0.16, ...puffs.map(([c, r]) => S.sphere(c, r))), lumps(4.5, 0.12, seed), 0.07), crown(lo, hi, 0.9, 2.2, seed + 1), 'leaf');
  const fr = fruitOn(puffs, n, seed + 2, size, hang);
  return S.union(0.02, trunk, leaves, P(S.union(0.005, ...fr), fruit, 'fruit'));
}
const MANGO_PUFFS = [[[0, 1.6, 0], 0.62], [[0.42, 1.4, 0.15], 0.45], [[-0.4, 1.42, -0.12], 0.46], [[0.05, 1.42, 0.42], 0.42], [[-0.1, 1.45, -0.42], 0.4]];
const mango = () => fruitTree({ lo: C.leafDark, hi: lin('#5ca84a'), fruit: (x, y) => mixLin(lin('#e8a030'), lin('#f0d040'), Math.min(1, Math.max(0, (y - 0.9) * 3))), puffs: MANGO_PUFFS, n: 10, size: 0.075, hang: 0.08, seed: 31 });
export const mangoForm = () => form('life-mango', mango, { min: [-1.1, -0.08, -1.1], max: [1.1, 2.4, 1.1], cell: 0.045, tris: 700 });
const APPLE_PUFFS = [[[0, 1.55, 0], 0.6], [[0.4, 1.42, 0.2], 0.42], [[-0.42, 1.4, 0.05], 0.42], [[0.05, 1.4, -0.42], 0.42], [[0, 1.95, 0], 0.38]];
const apple = () => fruitTree({ lo: lin('#2f7a34'), hi: lin('#9ad860'), fruit: (x, y, z) => (fbm3(x * 20, y * 20, z * 20, { seed: 5 }) > 0.62 ? lin('#f8c060') : lin('#e03a3a')), puffs: APPLE_PUFFS, n: 12, size: 0.07, hang: 0.03, seed: 41 });
export const appleTreeForm = () => form('life-apple', apple, { min: [-1.1, -0.08, -1.1], max: [1.1, 2.4, 1.1], cell: 0.045, tris: 700 });


function banana() {
  const stem = P(S.roundCone([0, 0, 0], [0.04, 1.5, 0], 0.14, 0.09), (x, y) => mixLin(lin('#7a6a3a'), lin('#8aa04a'), Math.min(1, y / 1.5)), 'bark');
  const leaves = [];
  for (let k = 0; k < 7; k++) {
    const a = k / 7 * 6.283 + 0.4, dx = Math.sin(a), dz = Math.cos(a), up = 0.25 + jit(k, 3) * 0.3;
    const base = [0.04, 1.45, 0], mid = [dx * 0.55, 1.6 + up, dz * 0.55], tip = [dx * 1.05, 1.25 + up * 0.5, dz * 1.05];
    leaves.push(S.union(0.05, S.transform(S.ellipsoid([0, 0, 0], [0.04, 0.16, 0.5]), { translate: [(base[0] + mid[0]) / 2, (base[1] + mid[1]) / 2, (base[2] + mid[2]) / 2], rotate: [-0.6, a, 0] }),
      S.transform(S.ellipsoid([0, 0, 0], [0.035, 0.15, 0.36]), { translate: [(mid[0] + tip[0]) / 2, (mid[1] + tip[1]) / 2, (mid[2] + tip[2]) / 2], rotate: [0.5, a, 0] })));
  }
  const leaf = P(S.union(0.05, ...leaves), crown(lin('#2e8a3a'), lin('#a8e070'), 1.3, 2.1, 51), 'leaf');
  const stalk = P(S.union(0.01, S.capsule([0.06, 1.42, 0.06], [0.22, 1.2, 0.2], 0.03), S.capsule([0.22, 1.2, 0.2], [0.24, 0.85, 0.22], 0.02)), lin('#6a8a3a'), 'leaf');
  const fingers = [];
  for (let t = 0; t < 4; t++) for (let k = 0; k < 5; k++) {
    const a = k / 5 * 6.283, y = 1.17 - t * 0.08, cx = 0.22 + Math.sin(a) * 0.07, cz = 0.2 + Math.cos(a) * 0.07;
    fingers.push(S.capsule([cx, y, cz], [cx + Math.sin(a) * 0.07, y + 0.1, cz + Math.cos(a) * 0.07], 0.022));
  }
  const bunch = P(S.union(0.01, ...fingers), (x, y) => mixLin(lin('#a8c840'), lin('#f0d850'), Math.min(1, (y - 0.9) * 3)), 'fruit');
  const bud = P(S.ellipsoid([0.24, 0.8, 0.22], [0.05, 0.09, 0.05]), lin('#8a3a6a'), 'petal');
  return S.union(0.02, stem, leaf, stalk, bunch, bud);
}
export const bananaForm = () => form('life-banana', banana, { min: [-1.2, -0.08, -1.2], max: [1.2, 2.3, 1.2], cell: 0.04, tris: 600 });


function fruitFall() {
  const f = [[0, 0.06, 0, 0.065], [0.18, 0.055, 0.08, 0.06], [-0.14, 0.055, 0.12, 0.058], [0.06, 0.05, -0.2, 0.055]];
  const fruit = S.subtract(0.01, S.union(0.005, ...f.map(([x, y, z, r]) => S.ellipsoid([x, y, z], [r, r * 0.9, r * 1.1]))), S.sphere([0.2, 0.1, 0.12], 0.05));
  const leaf = P(S.transform(S.ellipsoid([0, 0, 0], [0.06, 0.008, 0.11]), { translate: [-0.05, 0.11, 0.0], rotate: [0.2, 0.6, 0] }), C.leaf, 'leaf');
  return S.union(0.005, P(fruit, [1, 1, 1], 'fruit'), leaf);
}
export const fruitFallForm = () => form('life-fruitfall', fruitFall, { min: [-0.3, -0.03, -0.3], max: [0.3, 0.16, 0.3], cell: 0.01, tris: 140 });


const FORMS = {
  bowl: bowlForm, basket: basketForm, pots: potsForm, crates: cratesForm, fishrack: fishRackForm, cookfire: cookFireForm,
  well: wellForm, washline: washLineForm, strawbed: strawBedForm, toys: toysForm, tools: toolsForm,
  sandbags: sandbagsForm, seawall: seawallForm, stilts: stiltsForm, jetty: jettyForm,
  mango: mangoForm, appletree: appleTreeForm, banana: bananaForm, fruitfall: fruitFallForm,
};
export const LIFE_KINDS = Object.keys(FORMS);

const HAND = new Set(['bowl', 'basket', 'pots', 'crates', 'toys', 'tools', 'fruitfall', 'cookfire', 'strawbed']);

export function placeLife(batch, W) {
  if (W.rafts) raftForm(); 
  for (const o of W.objects) {
    const f = FORMS[o.kind]; if (!f) continue;
    
    const h = o.h != null ? o.h : W.groundAt(o.x, o.y) - (o.kind === 'seawall' ? 0 : 0.02);
    batch.add(f(), { x: o.x, h, y: o.y, rot: o.rot || 0, s: o.s || (HAND.has(o.kind) ? 1.25 : 1) }, o.c ? { fruit: lin(o.c) } : {});
  }
}
