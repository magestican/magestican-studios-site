










import * as S from '../../vendor/fml/moon/mesh/sdf.js';
import { lin, fur, metal, glow, ell, buildArrays, dark, light } from './dachiModel.js';

export const KNIGHT_HEIGHT = 3.0;
export const KNIGHT_HINGE = [0.26, 2.16, -0.26]; 
const ARMOR = lin('#2b2735'), PLATE = light(ARMOR, 0.12), TRIM = lin('#6e1620'), BEAK = lin('#9a7a3c');
const FEATHER = lin('#141119'), QUILL = lin('#2a2230'), TALON = lin('#d6ccb4'), RED = lin('#ff2436');
const PIN = lin('#2756b0'), RUST = lin('#8c4a28');

function bodyNode() {
  const p = [];
  for (const sx of [-1, 1]) {
    
    p.push(metal(S.capsule([sx * 0.2, 1.45, 0], [sx * 0.24, 0.86, 0.04], 0.15), ARMOR));
    p.push(metal(S.sphere([sx * 0.245, 0.84, 0.11], 0.12), PLATE));
    p.push(metal(S.roundCone([sx * 0.245, 0.86, 0.19], [sx * 0.25, 0.97, 0.34], 0.05, 0.01), TRIM));
    p.push(metal(S.roundCone([sx * 0.24, 0.8, 0.04], [sx * 0.23, 0.2, 0.03], 0.14, 0.11), ARMOR));
    p.push(metal(ell([sx * 0.24, 0.1, 0.1], [0.13, 0.1, 0.22]), PLATE));
    for (const o of [-0.08, 0, 0.08]) p.push(fur(S.roundCone([sx * 0.24 + o, 0.08, 0.27], [sx * 0.24 + o * 1.7, 0.02, 0.47], 0.045, 0.012), TALON));
    p.push(fur(S.roundCone([sx * 0.24, 0.08, -0.08], [sx * 0.24, 0.02, -0.26], 0.04, 0.012), TALON));
    
    p.push(metal(S.transform(S.roundBox([0, 0, 0], [0.15, 0.22, 0.035], 0.02), { translate: [sx * 0.18, 1.3, 0.22], rotate: [-0.22, 0, sx * -0.12] }), PLATE));
    
    p.push(metal(ell([sx * 0.52, 2.32, 0], [0.28, 0.19, 0.28]), PLATE));
    p.push(metal(ell([sx * 0.58, 2.19, 0.01], [0.24, 0.12, 0.25]), ARMOR));
    p.push(metal(S.transform(S.torus([0, 0, 0], 0.24, 0.025), { translate: [sx * 0.52, 2.3, 0] }), TRIM));
    for (let k = 0; k < 3; k++) p.push(fur(S.roundCone([sx * (0.5 + k * 0.08), 2.42, -0.06 + k * 0.07], [sx * (0.78 + k * 0.1), 2.82 - k * 0.1, -0.22 + k * 0.04], 0.06, 0.012), k === 1 ? QUILL : FEATHER));
    
    p.push(metal(S.capsule([sx * 0.56, 2.18, 0], [sx * 0.66, 1.72, 0.04], 0.11), ARMOR));
    p.push(metal(S.sphere([sx * 0.66, 1.72, 0.04], 0.115), PLATE));
    p.push(metal(S.roundCone([sx * 0.66, 1.7, 0.06], [sx * 0.68, 1.26, 0.12], 0.135, 0.105), ARMOR));
    p.push(metal(S.transform(S.torus([0, 0, 0], 0.13, 0.025), { translate: [sx * 0.67, 1.62, 0.07] }), TRIM));
    p.push(metal(ell([sx * 0.69, 1.16, 0.14], [0.1, 0.12, 0.09]), PLATE));
    for (const o of [-0.06, -0.02, 0.02, 0.06]) p.push(fur(S.roundCone([sx * 0.69 + o, 1.08, 0.17], [sx * 0.7 + o * 1.3, 0.93, 0.24], 0.03, 0.008), TALON));
    
    p.push(metal(ell([sx * 0.19, 2.6, 0.08], [0.08, 0.15, 0.15]), PLATE));
  }
  
  p.push(metal(ell([0, 2.02, 0.02], [0.46, 0.44, 0.32]), ARMOR));
  p.push(metal(ell([0, 1.72, 0], [0.33, 0.26, 0.25]), dark(ARMOR, 0.25)));
  p.push(metal(ell([0, 1.5, 0], [0.37, 0.2, 0.28]), ARMOR));
  p.push(metal(S.capsule([0, 2.32, 0.29], [0, 1.8, 0.28], 0.04), TRIM));
  p.push(metal(S.transform(S.torus([0, 0, 0], 0.31, 0.05), { translate: [0, 1.6, 0] }), TRIM));
  p.push(glow(ell([0, 2.06, 0.32], [0.075, 0.1, 0.05]), RED));
  p.push(glow(S.sphere([0, 1.6, 0.34], 0.05), RED));
  p.push(metal(S.capsule([0, 2.36, 0], [0, 2.52, 0.02], 0.14), dark(ARMOR, 0.2)));
  
  p.push(metal(ell([0, 2.7, 0], [0.25, 0.27, 0.28]), ARMOR));
  p.push(metal(S.capsule([-0.19, 2.8, 0.17], [0.19, 2.8, 0.17], 0.065), PLATE));
  p.push(metal(S.roundCone([0, 2.74, 0.2], [0, 2.56, 0.5], 0.12, 0.025), BEAK));
  p.push(metal(S.roundCone([0, 2.59, 0.48], [0, 2.47, 0.5], 0.04, 0.01), dark(BEAK, 0.3)));
  for (let k = 0; k < 6; k++) {
    const x = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.06;
    p.push(fur(S.roundCone([x, 2.92 - k * 0.04, -0.06 - k * 0.04], [x * 1.8, 3.02 - k * 0.11, -0.58 - k * 0.04], 0.065, 0.014), k % 3 ? FEATHER : QUILL));
  }
  const node = S.union(0.03, ...p);
  node.box = { min: [-1.1, 0, -0.9], max: [1.1, KNIGHT_HEIGHT + 0.1, 0.7] };
  
  node.decals = [
    ...[-1, 1].map((sx) => ({ node: glow(ell([sx * 0.1, 2.73, 0.245], [0.07, 0.026, 0.04]), RED), tris: 60, cell: 0.012, inkless: true })),
    { node: fur(ell([-0.68, 1.47, 0.215], [0.055, 0.055, 0.018]), PIN), tris: 80, cell: 0.01 },
    { node: metal(S.transform(S.torus([0, 0, 0], 0.055, 0.014), { rotate: [Math.PI / 2, 0, 0], translate: [-0.68, 1.47, 0.225] }), RUST), tris: 80, cell: 0.01 },
  ];
  return node;
}






export const KNIGHT_WRIST = [1.15, 0.38, -0.04];
const W0 = KNIGHT_WRIST;
const rel = (q) => [q[0] - W0[0], q[1] - W0[1], q[2] - W0[2]];
const feather = (k) => {
  const t = k / 8, u = 0.25 + t * 2.35;
  const root = [u, 0.25 - t * 0.12 - (t < 0.45 ? 0 : (t - 0.45) * 0.1), -0.06 - t * 0.05];
  const len = 1.05 + t * 0.75, out = 0.05 + t * t * 0.9;
  return { root, end: [root[0] + out, root[1] - len, root[2] - 0.04], r: 0.11 - t * 0.02, paint: k % 2 ? QUILL : FEATHER };
};
function wingInNode() {
  const p = [];
  p.push(metal(S.union(0.04, S.capsule([0, 0, 0], W0, 0.1), S.sphere(W0, 0.12)), dark(ARMOR, 0.2)));
  p.push(fur(S.transform(ell([0, 0, 0], [0.7, 0.36, 0.07]), { translate: [0.6, 0.08, -0.06], rotate: [0, 0, 0.22] }), FEATHER));
  for (let k = 0; k < 4; k++) { const f = feather(k); p.push(fur(S.roundCone(f.root, f.end, f.r, 0.025), f.paint)); }
  const node = S.union(0.04, ...p);
  node.box = { min: [-0.2, -1.5, -0.35], max: [1.5, 0.6, 0.2], free: true };
  return node;
}
function wingOutNode() {
  const p = [], tip = rel([2.75, 0.18, -0.1]);
  p.push(metal(S.union(0.04, S.capsule([0, 0, 0], tip, 0.07), S.sphere([0, 0, 0], 0.11)), dark(ARMOR, 0.2)));
  p.push(metal(S.roundCone([0, 0, 0], [0.1, 0.26, 0.06], 0.06, 0.01), TRIM)); 
  p.push(fur(S.transform(ell([0, 0, 0], [0.8, 0.28, 0.06]), { translate: rel([1.8, 0.07, -0.08]), rotate: [0, 0, -0.08] }), FEATHER));
  for (let k = 4; k < 9; k++) { const f = feather(k); p.push(fur(S.roundCone(rel(f.root), rel(f.end), f.r, 0.025), f.paint)); }
  const node = S.union(0.04, ...p);
  node.box = { min: [-0.25, -2.1, -0.4], max: [2.6, 0.45, 0.25], free: true };
  return node;
}

export const knightKey = (part) => `knight-${part}`;
export function knightArrays({ part = 'body' } = {}) {
  if (part === 'wingIn') return buildArrays(knightKey(part), wingInNode(), 'Eagle knight wing (arm)', undefined, { cell: 0.045, tris: 900 });
  if (part === 'wingOut') return buildArrays(knightKey(part), wingOutNode(), 'Eagle knight wing (hand)', undefined, { cell: 0.045, tris: 1100 });
  return buildArrays(knightKey('body'), bodyNode(), 'Eagle knight', undefined, { cell: 0.035, tris: 5200 });
}
