










import { MeshData, IDENTITY } from '../../mesh/meshData.mjs';
import { sweep, blob, emit, deform, circleProfile, superellipseProfile } from '../../mesh/bevel.mjs';
import { SeededRng } from '../../../rng/seededRng.js';
import { seasonPalette } from '../../palette/seasons.mjs';
import { hex, vc, vary } from './shade.mjs';
import { rod } from './rod.mjs';
import { bloom, BLOOMS } from './blooms.mjs';

export function flowerBed(mesh, m, { width = 1.3, depth = 0.55, detail = 0, rng, season = 'summer', edge = 'stone', edgeColor, leafColor, snowColor = null, spires = true }) {
  const winter = season === 'winter';
  if (detail < 2) {
    const count = detail === 0 ? 10 : 8;
    const loop = superellipseProfile(width / 2, depth / 2, 3, count, Math.PI / count);
    const path = loop.map(([x, z]) => [x, 0.035, z]);
    const bumps = path.map((_, i) => (i % 2 ? rng.rangeF(0.74, 0.88) : rng.rangeF(1.0, 1.2)));
    const kerb = sweep({ profile: circleProfile(0.055, detail === 0 ? 5 : 4, 0, 0.07), path, closed: true, up: [0, 1, 0], scales: (t, i) => bumps[i], uvScale: 1.4 });
    emit(mesh, edge === 'wood' ? 'wood' : 'stone', kerb, { matrix: m, color: vc(edgeColor, { groundAO: 0.25, groundFade: 0.1 }) });
  }
  const mound = blob({
    radii: [width / 2 - 0.03, winter ? 0.1 : 0.15, depth / 2 - 0.03], subdiv: detail === 0 ? 2 : 1, seed: rng.rangeI(1, 1e6),
    lump: 0.2, lumpFreq: 2.1, flats: [{ n: [0, -1, 0], d: 0.25, k: 0.25 }],
  });
  deform(mound, (p) => { p[1] += 0.03; });
  if (winter) emit(mesh, 'snow', mound, { matrix: m, color: vc(snowColor || hex(seasonPalette('winter').snow[0]), { groundAO: 0.1, underside: 0.2 }) });
  else emit(mesh, 'grass', mound, { matrix: m, color: vc(leafColor, { groundAO: 0.3, groundFade: 0.2 }) });
  if (detail === 2) return;

  const n = winter ? (detail === 0 ? 3 : 0) : detail === 0 ? Math.max(4, Math.round(width * 4.2)) : Math.max(2, Math.round(width * 1.8));
  for (let i = 0; i < n; i++) {
    const u = ((i + rng.rangeF(0.15, 0.85)) / n) * 2 - 1;
    const v = rng.rangeF(-0.6, 0.6) * Math.sqrt(Math.max(0, 1 - u * u * 0.8));
    const y = 0.03 + (winter ? 0.1 : 0.15) * Math.sqrt(Math.max(0, 1 - u * u - v * v * 0.3)) + 0.02;
    bloom(mesh, m, [u * (width / 2 - 0.12), y, v * (depth / 2 - 0.08)], { r: winter ? 0.03 : rng.rangeF(0.055, 0.08), rng, season });
  }
  if (detail === 0 && !winter && spires) {
    const colors = BLOOMS[season] || BLOOMS.summer;
    for (const side of [-1, 1]) {
      const x = side * width * rng.rangeF(0.14, 0.3), z = rng.rangeF(-0.08, 0.06);
      const lx = side * rng.rangeF(0.02, 0.07), h = rng.rangeF(0.36, 0.5);
      const spire = rod({ path: [[x, 0.1, z], [x + lx * 0.5, h * 0.6, z], [x + lx, h, z + 0.02]], w: 0.075, sides: 4, detail: 2, capSegments: 0, capLength: 0.05, scales: (t) => 1 - 0.45 * t });
      emit(mesh, 'petal', spire, { matrix: m, color: vc(vary(rng, hex(rng.pick(colors)), 0.05), { groundAO: 0, underside: 0.2 }) });
    }
  }
}

export const TIER = 'dressing';
const STYLES = [
  { width: 1.5, depth: 0.55, edge: 'stone', edgeColor: null },
  { width: 0.95, depth: 0.85, edge: 'wood', edgeColor: '#a8784e' },
  { width: 1.05, depth: 0.5, edge: 'stone', edgeColor: '#d9cfc2', spires: false },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('flowerBed');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), width: rng.rangeF(0.9, 1.6) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`flowerBed-${seed}-${season}-lod${detail}`);
  flowerBed(mesh, IDENTITY, {
    ...st, detail, rng, season, edgeColor: hex(st.edgeColor || pal.stone[1]), leafColor: hex(pal.leaf[1]),
    snowColor: season === 'winter' ? hex(pal.snow[0]) : null,
  });
  return mesh;
}
