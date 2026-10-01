




import { MeshData, compose, translate, rotateY, rotateX, rotateZ } from '../mesh/meshData.mjs';
import { blob, emit, lathe, transform, deform } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette } from '../palette/seasons.mjs';
import { hex, mixC, paintVertex, vary, vc } from './kit/shade.mjs';

export const TIER = 'dressing';
export const LODS = [0, 1, 2];
const HUES = Object.freeze([['#c8a8f0', '#7a5cc8'], ['#a8e8e8', '#3f9fb0'], ['#f5b8cf', '#c0587e']]);

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const rng = new SeededRng(seed).child('crystalCluster');
  const detail = Math.max(0, Math.min(2, lod | 0));
  const pal = seasonPalette(season);
  const mesh = new MeshData(`crystalCluster-${seed}-${season}-lod${detail}`);
  const [tipHex, rootHex] = HUES[(seed - 1 + 3) % 3];
  const tipC = hex(tipHex), rootC = hex(rootHex);

  const boss = blob({ radii: [0.55, 0.3, 0.5], subdiv: [4, 3, 2][detail], seed: rng.rangeI(1, 1e6), lump: 0.18 });
  deform(boss, (p) => { p[1] = Math.max(p[1], -0.05); });
  emit(mesh, 'stone', boss, { color: vc(vary(rng, hex(pal.stone[0]), 0.05), { groundAO: 0.3, groundFade: 0.3 }) });

  const n = detail === 2 ? 3 : rng.rangeI(4, 6);
  for (let i = 0; i < n; i++) {
    const h = i === 0 ? rng.rangeF(1.0, 1.35) : rng.rangeF(0.45, 0.95);
    const r = h * rng.rangeF(0.13, 0.17);
    const tip = h * rng.rangeF(0.2, 0.28);
    const shard = lathe({ points: [[0, -0.1], [r * 0.9, -0.1], [r, h * 0.35], [r * 0.92, h - tip], [0, h]], sides: detail === 2 ? 5 : 6, phase: rng.rangeF(0, 1) });
    const a = i === 0 ? rng.rangeF(0, Math.PI * 2) : (i / n) * Math.PI * 2 + rng.rangeF(-0.3, 0.3);
    const d = i === 0 ? 0.05 : rng.rangeF(0.18, 0.34);
    const lean = i === 0 ? rng.rangeF(-0.1, 0.1) : rng.rangeF(0.28, 0.6);
    transform(shard, compose(translate(Math.sin(a) * d, 0.12, Math.cos(a) * d), compose(rotateY(a), compose(rotateX(lean), rotateZ(rng.rangeF(-0.08, 0.08))))));
    const c0 = vary(rng, rootC, 0.05), c1 = vary(rng, tipC, 0.04);
    emit(mesh, 'gem', shard, { color: (p, nn) => paintVertex(mixC(c0, c1, Math.min(1, Math.max(0, p[1] / 1.1))), p, nn, { groundAO: 0.12, underside: 0.1 }) });
  }
  return mesh;
}
