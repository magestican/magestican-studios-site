




import { MeshData, compose, translate, rotateX, rotateY } from '../mesh/meshData.mjs';
import { emit, lathe, transform, bend } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { valueNoise3 } from '../noise.mjs';
import { hex, mixC, paintVertex, vary } from './kit/shade.mjs';

export const TIER = 'dressing';
export const LODS = [0, 1, 2];
const CAPS = Object.freeze(['#d8574e', '#9a6cc8', '#e0a040']);

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const rng = new SeededRng(seed).child('giantMushroom');
  const detail = Math.max(0, Math.min(2, lod | 0));
  const mesh = new MeshData(`giantMushroom-${seed}-${season}-lod${detail}`);
  const sides = [14, 10, 7][detail];
  const H = rng.rangeF(1.3, 1.8), R = rng.rangeF(0.16, 0.2);
  const cream = vary(rng, hex('#f1e6cf'), 0.03), shade = hex('#cdb99a');

  const stem = lathe({ points: [[0, -0.05], [R * 1.35, -0.05], [R * 1.15, H * 0.15], [R, H * 0.5], [R * 1.05, H * 0.85], [R * 0.9, H], [0, H]], sides });
  bend(stem, { along: 1, dir: 0, from: 0, length: H, amount: rng.rangeF(-0.12, 0.12) });
  emit(mesh, 'petal', stem, { color: (p, n) => paintVertex(mixC(shade, cream, Math.min(1, p[1] / H)), p, n, { groundAO: 0.3 }) });

  const CR = rng.rangeF(0.75, 1.0), CH = CR * rng.rangeF(0.45, 0.6);
  const capC = vary(rng, hex(CAPS[(seed - 1 + 3) % 3]), 0.04), spot = hex('#fff6e8'), gill = hex('#e8d6b8');
  const sn = rng.rangeI(1, 1e6);
  const capPts = [[0, 0], [CR * 0.35, 0.02], [CR * 0.85, 0.04], [CR, 0.1], [CR * 0.95, CH * 0.45], [CR * 0.7, CH * 0.85], [0, CH]];
  const cap = lathe({ points: capPts, sides: sides + 4, radiusFn: (th, j, rr) => rr * (1 + (j >= 3 ? 0.035 * Math.sin(th * 7 + sn % 5) : 0)) });
  const tilt = compose(translate(0, H - 0.08, 0), compose(rotateY(rng.rangeF(0, Math.PI * 2)), rotateX(rng.rangeF(0.05, 0.16))));
  transform(cap, tilt);
  emit(mesh, 'petal', cap, {
    color: (p, n) => {
      if (n[1] < -0.3) return paintVertex(gill, p, n, { groundAO: 0, underside: 0.25 });
      const s = valueNoise3(p[0] * 3.2, p[1] * 3.2, p[2] * 3.2, sn);
      return paintVertex(s > 0.68 ? spot : capC, p, n, { groundAO: 0, underside: 0.1 });
    },
  });
  return mesh;
}
