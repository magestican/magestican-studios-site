



import { MeshData } from '../mesh/meshData.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { fbm3 } from '../noise.mjs';
import { linear, seasonPalette } from '../palette/seasons.mjs';

export function generate({ seed = 1, season = 'summer' } = {}) {
  const rng = new SeededRng(seed);
  const m = new MeshData(`_viewerProbe-${seed}`);
  const tint = linear(seasonPalette(season).leaf[1]);
  const rings = 12, segs = 32, r0 = 1 + rng.next();
  const idx = [];
  for (let i = 0; i <= rings; i++) {
    const phi = (i / rings) * Math.PI;
    const row = [];
    for (let j = 0; j <= segs; j++) {
      const th = (j / segs) * Math.PI * 2;
      const n = [Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)];
      const r = r0 * (0.8 + 0.4 * fbm3(n[0] * 2, n[1] * 2, n[2] * 2, { seed }));
      row.push(m.vertex('leaf', [n[0] * r, n[1] * r + r0, n[2] * r], n, tint, [j / segs, i / rings]));
    }
    idx.push(row);
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = idx[i][j], b = idx[i][j + 1], c = idx[i + 1][j], d = idx[i + 1][j + 1];
      if (i !== 0) m.tri('leaf', a, b, c);
      if (i !== rings - 1) m.tri('leaf', b, d, c);
    }
  }
  return m;
}
