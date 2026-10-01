









import { MeshData, IDENTITY } from '../../mesh/meshData.mjs';
import { lathe, blob, emit, deform } from '../../mesh/bevel.mjs';
import { SeededRng } from '../../../rng/seededRng.js';
import { seasonPalette } from '../../palette/seasons.mjs';
import { hex, vc } from './shade.mjs';
import { bloom } from './blooms.mjs';

export function flowerPot(mesh, m, { radius = 0.17, height = 0.24, flare = 1, detail = 0, rng, season = 'summer', potColor, leafColor, snowColor = null, blooms = null }) {
  const sides = detail === 2 ? 5 : 6;
  const r = radius, h = height;
  const pts = detail === 2
    ? [[0, 0], [r * 0.74, 0], [r * 1.04 * flare, h], [r * 0.86 * flare, h * 0.93], [0, h * 0.88]]
    : detail === 1
      ? [[0, 0], [r * 0.7, 0], [r * (0.72 + 0.2 * flare), h * 0.74], [r * 1.08 * flare, h * 0.9], [r * 0.9 * flare, h * 0.97], [0, h * 0.9]]
      : [[0, 0], [r * 0.68, 0], [r * 0.74, 0.02], [r * (0.72 + 0.2 * flare), h * 0.74], [r * 1.02 * flare, h * 0.8], [r * 1.1 * flare, h * 0.9], [r * 1.02 * flare, h], [r * 0.9 * flare, h * 0.97], [0, h * 0.9]];
  const wob = rng.rangeF(0, 6), amt = detail === 2 ? 0 : 0.035;
  const pot = lathe({ points: pts, sides, phase: rng.rangeF(0, 1), uvScale: 2, radiusFn: amt ? (th, j, rr) => rr * (1 + amt * Math.sin(th * 2 + wob)) : null });
  emit(mesh, 'stone', pot, { matrix: m, color: vc(potColor, { groundAO: 0.25, groundFade: 0.12 }) });

  const winter = season === 'winter';
  const top = h * 0.9;
  const mr = r * 0.98 * flare;
  const mound = blob({ radii: [mr, r * (winter ? 0.42 : 0.62), mr], subdiv: detail === 0 ? 2 : 1, seed: rng.rangeI(1, 1e6), lump: winter ? 0.12 : 0.22, lumpFreq: 2.2, flats: [{ n: [0, -1, 0], d: 0.25, k: 0.2 }] });
  deform(mound, (p) => { p[1] += top; });
  if (winter) emit(mesh, 'snow', mound, { matrix: m, color: vc(snowColor || hex(seasonPalette('winter').snow[0]), { groundAO: 0, underside: 0.2 }) });
  else emit(mesh, 'grass', mound, { matrix: m, color: vc(leafColor, { groundAO: 0, underside: 0.3 }) });
  if (detail === 2) return { top: top + r * 0.6 };
  const n = blooms ?? (detail === 0 ? (winter ? 2 : 3) : 2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng.rangeF(-0.4, 0.4);
    const rr = mr * rng.rangeF(0.25, 0.7);
    bloom(mesh, m, [Math.sin(a) * rr, top + r * rng.rangeF(0.45, 0.7) * (winter ? 0.6 : 1), Math.cos(a) * rr], { r: winter ? 0.03 : rng.rangeF(0.05, 0.075), rng, season });
  }
  return { top: top + r * 0.6 };
}

export const TIER = 'dressing';
const STYLES = [
  { radius: 0.2, height: 0.2, flare: 1.08, pot: '#d98a5f' },
  { radius: 0.15, height: 0.34, flare: 0.92, pot: '#c97a55' },
  { radius: 0.22, height: 0.26, flare: 1.15, pot: '#e0a27a' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('flowerPot');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), flare: rng.rangeF(0.9, 1.15) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`flowerPot-${seed}-${season}-lod${detail}`);
  flowerPot(mesh, IDENTITY, { ...st, potColor: hex(st.pot), detail, rng, season, leafColor: hex(pal.leaf[1]), snowColor: season === 'winter' ? hex(pal.snow[0]) : null });
  return mesh;
}
