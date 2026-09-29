


import { S, form, lin, jit } from './kit.js';

const WOOD = lin('#9a6a40'), DARK = lin('#6e4a2c'), ROPE = lin('#d8c08a');

function postNode() {
  const stake = S.union(0.02,
    S.roundBox([0, 0.3, 0], [0.045, 0.3, 0.04], 0.015),
    S.roundCone([0, 0.58, 0], [0, 0.66, 0], 0.04, 0.008));
  const lash = S.paint(S.union(0.005, S.torus([0, 0.24, 0], 0.052, 0.012), S.torus([0, 0.46, 0], 0.052, 0.012)), { color: ROPE, material: 'wood' });
  return S.union(0.005, S.paint(stake, { color: DARK, material: 'wood' }), lash);
}

function railNode() {
  return S.paint(S.union(0.01,
    S.capsule([0, 0.24, -0.5], [0, 0.25, 0.5], 0.026),
    S.capsule([0, 0.46, -0.5], [0, 0.45, 0.5], 0.026)), { color: WOOD, material: 'wood' });
}
export const postForm = () => form('fence-post', postNode, { min: [-0.12, -0.05, -0.12], max: [0.12, 0.72, 0.12], cell: 0.018, tris: 120 });
export const railForm = () => form('fence-rail', railNode, { min: [-0.08, 0.15, -0.6], max: [0.08, 0.55, 0.6], cell: 0.02, tris: 60 });

export function placeFences(batch, W) {
  const rings = new Map();
  for (const o of W.objects) if (o.kind === 'fence') (rings.get(o.ring) || rings.set(o.ring, []).get(o.ring)).push(o);
  const post = postForm(), rail = railForm();
  for (const list of rings.values()) {
    list.sort((a, b) => a.k - b.k);
    list.forEach((a, i) => {
      const b = list[(i + 1) % list.length], ha = W.groundAt(a.x, a.y), hb = W.groundAt(b.x, b.y);
      batch.add(post, { x: a.x, h: ha - 0.04, y: a.y, rot: jit(i, 1) * 6, s: [1, 0.9 + jit(i, 2) * 0.2, 1] });
      const L = Math.hypot(b.x - a.x, b.y - a.y);
      batch.add(rail, { x: (a.x + b.x) / 2, h: (ha + hb) / 2 - 0.04, y: (a.y + b.y) / 2, rot: Math.atan2(b.x - a.x, b.y - a.y), s: [1, 1, L] });
    });
  }
}
