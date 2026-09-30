






import { S, form, lin, mixLin } from './kit.js';
import { fbm3 } from '../../../vendor/fml/moon/noise.js';

const SHAPES = [
  { r: [0.34, 0.26, 0.3], cut: [[0.4, 1, 0.2], 0.2], cut2: [[-1, 0.3, 0.5], 0.28] },
  { r: [0.4, 0.22, 0.28], cut: [[-0.3, 1, 0.1], 0.17], cut2: [[0.8, 0.2, -1], 0.24] },
  { r: [0.3, 0.3, 0.3], cut: [[0.1, 1, -0.4], 0.22], cut2: [[1, 0.1, 0.9], 0.26] },
  { r: [0.36, 0.24, 0.36], cut: [[0, 1, 0], 0.18], cut2: [[-0.6, 0.2, -1], 0.3] },
];
const GREY = lin('#c4bbb0'), MOSS = lin('#8fbf5a'), BASALT = lin('#5a4a4c'), EMBER = lin('#ff7a2a');

function stoneNode(v, finish) {
  const sh = SHAPES[v % SHAPES.length];
  const rough = (x, y, z) => (fbm3(x * 5, y * 5, z * 5, { seed: 7 + v, octaves: 3 }) - 0.5) * 0.09;
  let n = S.displace(S.ellipsoid([0, sh.r[1] * 0.75, 0], sh.r), rough, 0.05);
  n = S.intersect(0.03, n, S.plane(sh.cut[0], sh.cut[1] + sh.r[1] * 0.75));
  n = S.intersect(0.03, n, S.plane(sh.cut2[0], sh.cut2[1]));
  const top = sh.r[1] * 1.3;
  return S.paint(n, {
    material: 'stone',
    color: (x, y, z) => {
      const g = fbm3(x * 9, y * 9, z * 9, { seed: 3 + v, octaves: 2 });
      
      if (finish === 'dark') {
        const c = mixLin(lin('#7a6a64'), lin('#968478'), g);
        return mixLin(c, lin('#9aa860'), Math.max(0, Math.min(1, (y - top * 0.75) / (top * 0.2))) * (g > 0.6 ? 0.45 : 0.08));
      }
      if (finish === 'basalt') {
        const c = mixLin(BASALT, lin('#6e5a58'), g);
        return mixLin(c, EMBER, Math.max(0, Math.min(1, (0.12 - y) / 0.14)) * 0.85);
      }
      const c = mixLin(GREY, lin('#a79d94'), g);
      return mixLin(c, MOSS, Math.max(0, Math.min(1, (y - top * 0.72) / (top * 0.2))) * (g > 0.55 ? 0.6 : 0.15));
    },
  });
}

export const stoneForm = (v, finish = 'grey') => form(`stone-${finish}-${v % 4}`, () => stoneNode(v, finish), {
  min: [-0.5, -0.1, -0.5], max: [0.5, 0.55, 0.5], cell: 0.035, tris: 180,
});





function ledgeNode(v) {
  const rough = (x, y, z) => (fbm3(x * 3.5, y * 6, z * 3.5, { seed: 21 + v, octaves: 3 }) - 0.5) * 0.12;
  let n = S.displace(S.roundBox([0, -0.55, -0.1], [0.82 + (v % 2) * 0.1, 0.6, 0.42], 0.1), rough, 0.07);
  n = S.intersect(0.05, n, S.plane([0, 1, 0.12], 0.02)); 
  return S.paint(n, {
    material: 'stone',
    color: (x, y, z) => {
      const g = fbm3(x * 6, y * 9, z * 6, { seed: 5 + v, octaves: 2 });
      const band = Math.abs(((y + 1.2 + g * 0.08) / 0.19) % 1 - 0.5) > 0.4 ? 0.8 : 1; 
      const c = mixLin(lin('#7a6a64'), lin('#9c8a7c'), g);
      const rock = [c[0] * band, c[1] * band, c[2] * band];
      return mixLin(rock, lin('#9aa860'), Math.max(0, Math.min(1, (y + 0.03) / 0.05)) * (g > 0.6 ? 0.5 : 0.1)); 
    },
  });
}
export const ledgeForm = (v) => form(`ledge-${v % 3}`, () => ledgeNode(v % 3), {
  min: [-1.05, -1.25, -0.65], max: [1.05, 0.12, 0.45], cell: 0.045, tris: 420,
});


export function placeLedges(batch, W) {
  for (const o of W.objects) {
    if (o.kind !== 'ledge') continue;
    batch.add(ledgeForm(o.v), { x: o.x, h: o.h, y: o.y, rot: o.rot, s: [o.s, 1, 1] });
  }
}


export const SEA_WORN = { stone: [0.72, 0.93, 1.1] };


export function placeRimStones(batch, W) {
  for (const o of W.objects) {
    if (o.kind !== 'rimstone') continue;
    batch.add(stoneForm(o.v), { x: o.x, h: W.groundAt(o.x, o.y) - 0.1 * o.s, y: o.y, rot: o.rot, s: [o.s * 1.1, o.s * 1.05, o.s] }, o.flavor === 'coral' ? SEA_WORN : {});
  }
}



function pillarNode(v) {
  const H = [1.05, 1.5, 0.7][v];
  const flutes = (x, y, z) => Math.cos(Math.atan2(z, x) * 10) * 0.012;
  let shaft = S.displace(S.roundCylinder([0, H / 2 + 0.12, 0], 0.2, 0.2, H / 2, 0.02), flutes, 0.015);
  shaft = S.intersect(0.02, shaft, S.plane([0.35 * (v - 1), 1, 0.3], H + 0.1));
  const plinth = S.roundBox([0, 0.07, 0], [0.3, 0.08, 0.3], 0.025);
  const n = S.union(0.03, plinth, shaft, S.roundCylinder([0, 0.2, 0], 0.25, 0.25, 0.05, 0.02));
  return S.paint(S.displace(n, (x, y, z) => (fbm3(x * 7, y * 7, z * 7, { seed: 61 + v, octaves: 2 }) - 0.5) * 0.04, 0.03), {
    material: 'stone',
    color: (x, y, z) => {
      const g = fbm3(x * 8, y * 8, z * 8, { seed: 63 + v, octaves: 2 });
      return mixLin(mixLin(lin('#d8d0c4'), lin('#b8b0a6'), g), lin('#6fb09a'), Math.max(0, Math.min(1, (0.45 - y) / 0.35)) * (0.3 + g * 0.5));
    },
  });
}
export const pillarForm = (v) => form(`pillar-${v % 3}`, () => pillarNode(v % 3), { min: [-0.4, -0.05, -0.4], max: [0.4, 1.8, 0.4], cell: 0.03, tris: 300 });
export function placePillars(batch, W) {
  for (const o of W.objects) {
    if (o.kind !== 'pillar') continue;
    batch.add(pillarForm(o.v), { x: o.x, h: W.groundAt(o.x, o.y) - 0.04, y: o.y, rot: o.rot, s: o.s }, SEA_WORN);
  }
}
