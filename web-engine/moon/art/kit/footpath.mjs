







import { MeshData, IDENTITY, compose, translate, rotateY } from '../../mesh/meshData.mjs';
import { emit, blob } from '../../mesh/bevel.mjs';
import { SeededRng } from '../../../rng/seededRng.js';
import { seasonPalette } from '../../palette/seasons.mjs';
import { hex, vc, vary } from './shade.mjs';
import { steppingStone } from './flowerBox.mjs';




export function footpath(mesh, m, { length = 1.6, stones = 3, size = 0.46, bendX = 0.16, detail = 0, rng, color, snowColor = null, snowDetail = detail }) {
  const n = detail === 2 ? Math.min(stones, 2) : stones;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const s = size * rng.rangeF(0.86, 1.06);
    const z = size / 2 + t * Math.max(0, length - size);
    const x = bendX * Math.sin(Math.PI * t * 1.3) + rng.rangeF(-0.05, 0.05);
    const stone = steppingStone({ rng, size: s, detail: detail === 0 ? 0 : 2 });
    const at = compose(m, compose(translate(x, 0, z), rotateY(rng.rangeF(0, Math.PI))));
    emit(mesh, 'stone', stone, { matrix: at, color: vc(vary(rng, color, 0.06), { groundAO: 0.1 }) });
    if (snowColor && detail < 2) {
      
      const cap = blob({ radii: [s * 0.33, 0.045, s * 0.27], subdiv: snowDetail === 0 ? 2 : 1, seed: rng.rangeI(1, 1e6), lump: 0.3, lumpFreq: 2.2, flats: [{ n: [0, -1, 0], d: 0.2, k: 0.25 }] });
      emit(mesh, 'snow', cap, { matrix: compose(at, translate(0, 0.018, 0)), color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
    }
  }
}

export const TIER = 'dressing';
const STYLES = [
  { length: 1.6, stones: 3, size: 0.46, bendX: 0.16 },
  { length: 1.7, stones: 4, size: 0.36, bendX: -0.22 },
  { length: 1.5, stones: 2, size: 0.62, bendX: 0.08 },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('footpath');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), bendX: rng.rangeF(-0.25, 0.25) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`footpath-${seed}-${season}-lod${detail}`);
  footpath(mesh, IDENTITY, { ...st, detail, rng, color: hex(pal.stone[season === 'winter' ? 0 : 1]), snowColor: season === 'winter' ? hex(pal.snow[0]) : null });
  return mesh;
}
