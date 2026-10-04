



import { S, form, lin, jit } from './kit.js';

const ROCK = lin('#5a5068'), ROCK_HI = lin('#7a7088'), BRASS = lin('#d8a848'), STONE = lin('#9a8ea8');


function prism(base, dir, len, r) {
  const [bx, by, bz] = base, [dx, dy, dz] = dir, top = [bx + dx * len, by + dy * len, bz + dz * len];
  return S.union(0.01, S.roundCone(base, top, r, r * 0.9), S.roundCone(top, [top[0] + dx * r * 1.4, top[1] + dy * r * 1.4, top[2] + dz * r * 1.4], r * 0.9, 0.005));
}
function crystal() {
  const foot = S.ellipsoid([0, 0.05, 0], [0.42, 0.14, 0.38]);
  const shards = [];
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * 6.283 + jit(k, 1), tilt = 0.25 + jit(k, 2) * 0.45, len = 0.35 + jit(k, 3) * 0.45;
    const d = [Math.sin(a) * Math.sin(tilt), Math.cos(tilt), Math.cos(a) * Math.sin(tilt)];
    shards.push(prism([Math.sin(a) * 0.12, 0.08, Math.cos(a) * 0.12], d, len, 0.07 + jit(k, 4) * 0.04));
  }
  shards.push(prism([0, 0.1, 0], [0.05, 1, 0.02], 0.85, 0.12));
  
  const gem = S.paint(S.union(0.02, ...shards), { material: 'gem', color: (x, y) => { const t = Math.min(1, Math.max(0, (y - 0.3) * 1.1)); return [0.75 + t * 0.25, 0.75 + t * 0.25, 0.78 + t * 0.22]; } });
  return S.union(0.02, S.paint(foot, { color: (x, y) => (y > 0.1 ? ROCK_HI : ROCK), material: 'stone' }), gem);
}
export const crystalForm = () => form('geode-crystal', crystal, { min: [-0.7, -0.1, -0.7], max: [0.7, 1.2, 0.7], cell: 0.025, tris: 520 });

function mirrorStand() {
  const plinth = S.paint(S.roundBox([0, 0.12, 0], [0.32, 0.12, 0.32], 0.04), { color: STONE, material: 'stone' });
  const post = S.paint(S.union(0.02, S.roundCylinder([0, 0.3, 0], 0.09, 0.07, 0.07, 0.02), S.capsule([0, 0.3, 0], [0, 0.62, 0], 0.035)), { color: BRASS, material: 'copper' });
  const ring = S.paint(S.torus([0, 0.7, 0], 0.12, 0.022), { color: BRASS, material: 'copper' });
  return S.union(0.01, plinth, post, ring);
}
export const mirrorStandForm = () => form('geode-mirrorstand', mirrorStand, { min: [-0.4, -0.05, -0.4], max: [0.4, 0.86, 0.4], cell: 0.018, tris: 320 });

function sunCrack() {
  const slab = S.paint(S.displace(S.roundBox([0, 0.7, -0.15], [0.7, 0.75, 0.22], 0.08), (x, y, z) => Math.sin(x * 9 + y * 5) * 0.03, 0.04), { color: ROCK, material: 'stone' });
  const slit = S.paint(S.roundBox([0, 0.75, 0.08], [0.08, 0.55, 0.04], 0.03), { color: lin('#fff4c0'), material: 'lamp-glow' });
  const rubble = S.paint(S.union(0.03, S.ellipsoid([-0.35, 0.06, 0.25], [0.14, 0.08, 0.12]), S.ellipsoid([0.3, 0.05, 0.3], [0.12, 0.07, 0.1]), S.ellipsoid([0.05, 0.04, 0.4], [0.09, 0.05, 0.08])), { color: ROCK_HI, material: 'stone' });
  return S.union(0.02, slab, slit, rubble);
}
export const sunCrackForm = () => form('geode-suncrack', sunCrack, { min: [-0.85, -0.05, -0.5], max: [0.85, 1.55, 0.55], cell: 0.025, tris: 360 });

export function placeCrystals(batch, W) {
  for (const o of W.objects) {
    const at = { x: o.x, h: W.groundAt(o.x, o.y) - 0.03, y: o.y, rot: o.rot || 0, s: o.s || 1 };
    if (o.kind === 'crystal') batch.add(crystalForm(), at, { gem: lin(o.c || '#c8a0ff') });
    else if (o.kind === 'mirrorstand') batch.add(mirrorStandForm(), at);
    else if (o.kind === 'suncrack') batch.add(sunCrackForm(), at);
  }
}
