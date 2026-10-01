


import { S, form, lin, jit } from './kit.js';

const SOIL = lin('#6a4a38'), PEBBLE = lin('#d8d0c4'), LEAF = lin('#4f9a3c'), LEAF2 = lin('#78c050');
const BLOOMS = ['#ff9fd0', '#fff2a0', '#ffffff', '#c4a8ff', '#ff9a7a'].map(lin);
const RX = 0.5, RZ = 0.34;

function bedNode() {
  const soil = S.paint(S.displace(S.ellipsoid([0, 0.02, 0], [RX, 0.12, RZ]), (x, y, z) => Math.sin(x * 40) * 0.006, 0.01), { color: SOIL, material: 'soil' });
  const border = S.paint(S.union(0.01, ...Array.from({ length: 16 }, (_, k) => {
    const a = k / 16 * Math.PI * 2, s = 0.045 + jit(k, 1) * 0.02;
    return S.ellipsoid([Math.cos(a) * (RX + 0.03), 0.04, Math.sin(a) * (RZ + 0.03)], [s * 1.3, s, s * 1.1]);
  })), { color: PEBBLE, material: 'stone' });
  return S.union(0.02, soil, border);
}
function clumpNode() {
  const leaves = S.paint(S.union(0.04, ...[0, 1, 2, 3, 4].map((k) => {
    const a = k * 1.26, r = 0.06;
    return S.ellipsoid([Math.cos(a) * r, 0.07, Math.sin(a) * r], [0.07, 0.045, 0.05]);
  })), { material: 'leaf', color: (x, y) => (y > 0.08 ? LEAF2 : LEAF) });
  const blooms = S.paint(S.union(0.01, ...[0, 1, 2, 3, 4].map((k) => {
    const a = k * 2.4 + 0.3, r = 0.03 + (k % 2) * 0.05, h = 0.14 + jit(k, 4) * 0.06;
    return S.union(0.02, S.sphere([Math.cos(a) * r, h, Math.sin(a) * r], 0.034), S.sphere([Math.cos(a) * r, h + 0.02, Math.sin(a) * r], 0.02));
  })), { material: 'petal', color: [1, 1, 1] });
  return S.union(0.015, leaves, blooms);
}
export const bedForm = () => form('flower-bed', bedNode, { min: [-0.65, -0.12, -0.5], max: [0.65, 0.15, 0.5], cell: 0.022, tris: 360 });
export const clumpForm = () => form('flower-clump', clumpNode, { min: [-0.18, -0.02, -0.18], max: [0.18, 0.26, 0.18], cell: 0.012, tris: 180 });

export function placeFlowerBeds(batch, W) {
  const bed = bedForm(), clump = clumpForm();
  for (const o of W.objects) {
    if (o.kind !== 'bed') continue;
    const h = W.groundAt(o.x, o.y);
    batch.add(bed, { x: o.x, h: h - 0.02, y: o.y, rot: o.rot });
    const c = Math.cos(o.rot), s = Math.sin(o.rot);
    [[-0.28, -0.08], [-0.05, 0.1], [0.2, -0.1], [0.32, 0.1], [0.02, -0.14]].forEach(([lx, lz], k) => {
      const x = o.x + lx * c + lz * s, y = o.y - lx * s + lz * c;
      batch.add(clump, { x, h: h + 0.08, y, rot: k * 1.7, s: 0.9 + jit(k, o.seed) * 0.3 }, { petal: BLOOMS[(k + o.seed) % BLOOMS.length] });
    });
  }
}
