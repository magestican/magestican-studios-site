




import { MeshData, compose, translate, rotateY } from '../mesh/meshData.mjs';
import { emit, lathe, sweep, circleProfile } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { hex, mixC, paintVertex, vary } from './kit/shade.mjs';

export const TIER = 'dressing';
export const LODS = [0, 1, 2];
const RIBS = 8;

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const rng = new SeededRng(seed).child('cactus');
  const detail = Math.max(0, Math.min(2, lod | 0));
  const mesh = new MeshData(`cactus-${seed}-${season}-lod${detail}`);
  const base = vary(rng, hex('#5f9a58'), 0.05), crown = hex('#9cc97a'), groove = hex('#3f6f42');
  const sides = [16, 12, 8][detail];
  const rib = (th, rr) => rr * (1 + 0.07 * Math.cos(th * RIBS));
  const paint = (p, n, top) => {
    const th = Math.atan2(p[0], p[2]);
    const g = 0.5 - 0.5 * Math.cos(th * RIBS);
    return paintVertex(mixC(mixC(groove, base, 0.35 + 0.65 * g), crown, Math.min(1, Math.max(0, (p[1] - top * 0.75) / (top * 0.25)))), p, n, { groundAO: 0.3, underside: 0.1 });
  };

  const H = rng.rangeF(1.5, 2.1), R = rng.rangeF(0.2, 0.25);
  const trunk = lathe({ points: [[0, -0.05], [R * 0.9, -0.05], [R * 0.97, 0.2], [R, H * 0.3], [R * 0.97, H * 0.85], [R * 0.7, H * 0.97], [0, H]], sides, radiusFn: (th, j, rr) => rib(th, rr) });
  emit(mesh, 'leaf', trunk, { color: (p, n) => paint(p, n, H) });

  const arms = detail === 2 ? 1 : rng.rangeI(1, 3);
  let a0 = rng.rangeF(0, Math.PI * 2);
  for (let i = 0; i < arms; i++) {
    const a = a0 + i * (Math.PI * 2 / arms) + rng.rangeF(-0.4, 0.4);
    const y0 = H * rng.rangeF(0.35, 0.6), out = rng.rangeF(0.55, 0.72), up = rng.rangeF(0.45, 0.8);
    const r = R * rng.rangeF(0.55, 0.7);
    const path = [[R * 0.6, y0, 0], [out * 0.7, y0 + 0.02, 0], [out, y0 + 0.14, 0], [out + 0.02, y0 + up, 0]];
    const arm = sweep({ profile: circleProfile(r, [10, 8, 6][detail]), path, caps: 'round', capSegments: detail === 0 ? 3 : 2, scales: [1, 1, 0.97, 0.85] });
    const m = compose(rotateY(a), translate(0, 0, 0));
    emit(mesh, 'leaf', arm, { matrix: m, color: (p, n) => paint(p, n, y0 + up + 0.2) });
  }
  return mesh;
}
