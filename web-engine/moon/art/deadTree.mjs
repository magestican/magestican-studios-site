



import { MeshData } from '../mesh/meshData.mjs';
import { emit } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { rod } from './kit/rod.mjs';
import { hex, mixC, paintVertex, vary } from './kit/shade.mjs';

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const rng = new SeededRng(seed).child('deadTree');
  const detail = Math.max(0, Math.min(2, lod | 0));
  const mesh = new MeshData(`deadTree-${seed}-${season}-lod${detail}`);
  const pale = vary(rng, hex('#b9aa98'), 0.05), dark = hex('#6d5c4c');
  const color = (top) => (p, n) => paintVertex(mixC(dark, pale, Math.min(1, Math.max(0, p[1] / top) ** 0.6)), p, n, { groundAO: 0.35 });

  const H = rng.rangeF(1.7, 2.3);
  const wob = () => rng.rangeF(-0.12, 0.12);
  const trunkPath = [[0, -0.05, 0], [wob(), H * 0.3, wob()], [wob() * 1.5, H * 0.65, wob() * 1.5], [wob() * 2, H, wob() * 2]];
  emit(mesh, 'bark', rod({ path: trunkPath, w: 0.26, detail, caps: 'round', scales: [1.25, 0.95, 0.75, 0.55] }), { color: color(H + 0.8) });

  const n = detail === 2 ? 2 : rng.rangeI(3, 4);
  for (let i = 0; i < n; i++) {
    const from = trunkPath[i % 2 === 0 ? 3 : 2];
    const a = (i / n) * Math.PI * 2 + rng.rangeF(-0.5, 0.5);
    const len = rng.rangeF(0.6, 1.1), rise = rng.rangeF(0.25, 0.7);
    const dir = [Math.sin(a), Math.cos(a)];
    const path = [0, 0.35, 0.7, 1].map((t) => [
      from[0] + dir[0] * len * t + (t > 0 ? wob() * 0.5 : 0),
      from[1] - 0.05 + rise * t - 0.18 * t * t + (t > 0.5 ? rng.rangeF(0, 0.15) : 0),
      from[2] + dir[1] * len * t + (t > 0 ? wob() * 0.5 : 0),
    ]);
    emit(mesh, 'bark', rod({ path, w: 0.11, detail: Math.min(2, detail + 1), caps: 'round', scales: [1, 0.75, 0.5, 0.25] }), { color: color(H + 0.8) });
  }
  return mesh;
}
