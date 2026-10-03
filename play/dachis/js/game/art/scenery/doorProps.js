




import { S, form, lin } from './kit.js';

const WOOD = lin('#7a4e2c'), DARK = lin('#4a2e1a'), ROPE = lin('#d8c08a'), BARK = lin('#6a4a30'), HOLE = lin('#140c08'), IRON = lin('#4a4450');

function ladderNode() {
  
  const posts = S.union(0.01, S.roundCone([-0.32, 0, 0], [-0.32, 0.7, 0], 0.06, 0.045), S.roundCone([0.32, 0, 0], [0.32, 0.7, 0], 0.06, 0.045));
  const lash = S.union(0.005, S.torus([-0.32, 0.55, 0], 0.07, 0.016), S.torus([0.32, 0.55, 0], 0.07, 0.016));
  const rails = S.union(0.01, S.capsule([-0.26, 0.5, 0], [-0.26, -0.05, 0.75], 0.025), S.capsule([0.26, 0.5, 0], [0.26, -0.05, 0.75], 0.025));
  const rungs = S.union(0.005, ...[0, 1, 2, 3].map((k) => { const t = (k + 0.5) / 4; return S.roundBox([0, 0.5 - t * 0.55, t * 0.75], [0.26, 0.022, 0.035], 0.012); }));
  return S.union(0.01, S.paint(posts, { color: WOOD, material: 'wood' }), S.paint(S.union(0.005, lash, rails), { color: ROPE, material: 'wood' }), S.paint(rungs, { color: DARK, material: 'wood' }));
}
export const ladderForm = () => form('door-ladder', ladderNode, { min: [-0.45, -0.15, -0.15], max: [0.45, 0.8, 0.9], cell: 0.025, tris: 360 });

function ropeSlideNode() {
  const post = S.paint(S.roundCone([0, 0, 0], [0, 1.25, 0], 0.11, 0.08), { color: WOOD, material: 'wood' });
  const wheel = S.paint(S.union(0.01, S.torus([0, 1.15, 0.12], 0.1, 0.025), S.capsule([0, 1.15, 0.0], [0, 1.15, 0.14], 0.02)), { color: IRON, material: 'metal' });
  
  const rope = S.paint(S.union(0.01, S.capsule([0, 1.06, 0.14], [0, 0.95, 0.7], 0.02), S.capsule([0, 0.95, 0.7], [0, 0.88, 1.2], 0.02)), { color: ROPE, material: 'wood' });
  const grip = S.paint(S.union(0.01, S.capsule([0, 0.95, 0.55], [0, 0.72, 0.55], 0.015), S.capsule([-0.12, 0.72, 0.55], [0.12, 0.72, 0.55], 0.03)), { color: DARK, material: 'wood' });
  const bind = S.paint(S.torus([0, 0.9, 0], 0.115, 0.02), { color: ROPE, material: 'wood' });
  return S.union(0.01, post, wheel, rope, grip, bind);
}
export const ropeSlideForm = () => form('door-ropeslide', ropeSlideNode, { min: [-0.3, -0.05, -0.3], max: [0.3, 1.4, 1.3], cell: 0.025, tris: 420 });

function knotHoleNode() {
  const lip = S.paint(S.displace(S.torus([0, 0.02, 0], 0.48, 0.13), (x, y, z) => Math.sin(Math.atan2(z, x) * 7) * 0.02, 0.03), { color: BARK, material: 'wood' });
  const hole = S.paint(S.roundCylinder([0, -0.02, 0], 0.42, 0.42, 0.03, 0.02), { color: HOLE, material: 'stone' });
  return S.union(0.02, lip, hole);
}
export const knotHoleForm = () => form('door-knothole', knotHoleNode, { min: [-0.7, -0.2, -0.7], max: [0.7, 0.25, 0.7], cell: 0.03, tris: 300 });

export function placeDoorProps(batch, W) {
  const forms = { ladder: ladderForm, ropeslide: ropeSlideForm, knothole: knotHoleForm };
  for (const o of W.objects) {
    const f = forms[o.kind]; if (!f) continue;
    batch.add(f(), { x: o.x, h: W.groundAt(o.x, o.y), y: o.y, rot: o.rot || 0, s: o.s || 1 });
  }
}
