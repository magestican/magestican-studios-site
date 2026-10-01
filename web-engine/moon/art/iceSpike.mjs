



import { MeshData, compose, translate, rotateY, rotateX } from '../mesh/meshData.mjs';
import { blob, bend, emit, lathe, transform, deform } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette } from '../palette/seasons.mjs';
import { hex, mixC, paintVertex, vary, vc } from './kit/shade.mjs';

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const rng = new SeededRng(seed).child('iceSpike');
  const detail = Math.max(0, Math.min(2, lod | 0));
  const pal = seasonPalette(season);
  const mesh = new MeshData(`iceSpike-${seed}-${season}-lod${detail}`);
  const ice = hex('#9fd4ee'), frost = hex('#eef8ff');

  const drift = blob({ radii: [0.6, 0.18, 0.52], subdiv: [4, 3, 2][detail], seed: rng.rangeI(1, 1e6), lump: 0.1 });
  deform(drift, (p) => { p[1] = Math.max(p[1], -0.04); });
  emit(mesh, 'snow', drift, { color: vc(hex(pal.snow ? pal.snow[0] : '#f4f8ff'), { groundAO: 0.08, underside: 0.2 }) });

  const n = detail === 2 ? 2 : rng.rangeI(3, 5);
  for (let i = 0; i < n; i++) {
    const h = i === 0 ? rng.rangeF(1.5, 2.0) : rng.rangeF(0.7, 1.3);
    const r = h * rng.rangeF(0.1, 0.13);
    const jit = rng.rangeI(1, 1e6);
    const spike = lathe({
      points: [[0, -0.1], [r, -0.1], [r * 0.82, h * 0.3], [r * 0.5, h * 0.65], [r * 0.16, h * 0.9], [0, h]],
      sides: 5, phase: rng.rangeF(0, 1),
      radiusFn: (th, j, rr) => rr * (1 + 0.12 * Math.sin(th * 3 + jit % 7 + j)),
    });
    bend(spike, { along: 1, dir: 0, from: 0, length: h, amount: rng.rangeF(-0.12, 0.12) });
    const a = (i / n) * Math.PI * 2 + rng.rangeF(-0.4, 0.4);
    const d = i === 0 ? 0.04 : rng.rangeF(0.2, 0.36);
    transform(spike, compose(translate(Math.sin(a) * d, 0.05, Math.cos(a) * d), compose(rotateY(a), rotateX(i === 0 ? rng.rangeF(-0.06, 0.06) : rng.rangeF(0.15, 0.4)))));
    const c0 = vary(rng, ice, 0.04);
    emit(mesh, 'gem', spike, { color: (p, nn) => paintVertex(mixC(c0, frost, Math.min(1, Math.max(0, (p[1] - h * 0.45) / (h * 0.55)))), p, nn, { groundAO: 0.1, underside: 0.12 }) });
  }
  return mesh;
}
