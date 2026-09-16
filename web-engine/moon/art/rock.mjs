










import { MeshData, compose, translate, rotateY } from '../mesh/meshData.mjs';
import { blob, emit, transform, deform, computeNormals, splitShape, smoothstep } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette } from '../palette/seasons.mjs';
import { valueNoise3 } from '../noise.mjs';
import { hex, mixC, paintVertex, vary, vc } from './kit/shade.mjs';

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const MOSS = { spring: ['#8cc063', 0.75], summer: ['#6fae55', 0.6], autumn: ['#a8984c', 0.5], winter: ['#6f8f6a', 0] };

export function rockShape(rng, radii, subdiv) {
  const flats = [{ n: [0, -1, 0], d: 0.45, k: 0.25 }];
  const count = rng.rangeI(3, 4);
  const spin = rng.rangeF(0, Math.PI * 2);
  for (let i = 0; i < count; i++) {
    const th = rng.rangeF(0.35, 1.2), ph = spin + (i / count) * Math.PI * 2 + rng.rangeF(-0.4, 0.4);
    flats.push({ n: [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)], d: rng.rangeF(0.6, 0.76), k: 0.16 });
  }
  return blob({ radii, subdiv, seed: rng.rangeI(1, 1e6), lump: 0.08, lumpFreq: 1.4, flats });
}

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const rng = new SeededRng(seed).child('rock');
  const detail = Math.max(0, Math.min(2, lod | 0));
  const pal = seasonPalette(season);
  const mesh = new MeshData(`rock-${seed}-${season}-lod${detail}`);
  const variant = seed >= 1 && seed <= 3 ? seed - 1 : rng.rangeI(0, 2);
  const size = seed >= 1 && seed <= 3 ? 1 : rng.rangeF(0.45, 1.2);

  const parts = [];
  
  
  if (variant === 0) {
    parts.push({ radii: [0.42, 0.44, 0.38], at: [0, 0], subdiv: [6, 4, 2][detail] });
  } else if (variant === 1) {
    parts.push({ radii: [0.34, 0.38, 0.31], at: [-0.12, -0.02], subdiv: [5, 3, 2][detail] });
    parts.push({ radii: [0.2, 0.22, 0.19], at: [0.3, 0.16], subdiv: [4, 3, 2][detail] });
    if (detail < 2) parts.push({ radii: [0.11, 0.1, 0.1], at: [0.1, -0.3], subdiv: [3, 2][detail] });
  } else {
    parts.push({ radii: [0.5, 0.34, 0.42], at: [0, 0], subdiv: [6, 4, 2][detail] });
  }

  const [mossHex, mossAmount] = MOSS[season];
  const moss = hex(mossHex);
  const snowC = season === 'winter' ? hex(pal.snow[0]) : null;
  for (const part of parts) {
    const r = part.radii.map((v) => v * size * rng.rangeF(0.9, 1.1));
    const s = rockShape(rng, r, part.subdiv);
    transform(s, compose(translate(part.at[0] * size, 0, part.at[1] * size), rotateY(rng.rangeF(0, Math.PI * 2))));
    const minY = Math.min(...s.p.map((p) => p[1]));
    deform(s, (p) => { p[1] -= minY + 0.03 * Math.min(1, size); });
    const base = vary(rng, hex(rng.chance(0.7) ? pal.stone[0] : '#d6cfc4'), 0.06);
    const seedN = rng.rangeI(1, 1e6);
    const upness = (p, n) => n[1] + (valueNoise3(p[0] * 5, p[1] * 5, p[2] * 5, seedN) - 0.5) * 0.5;

    if (snowC) {
      const n0 = computeNormals(s);
      const up = s.p.map((p, i) => upness(p, n0[i]));
      deform(s, (p, i) => { const k = 0.04 * size * smoothstep(0.45, 0.85, up[i]); p[0] += n0[i][0] * k; p[1] += n0[i][1] * k; p[2] += n0[i][2] * k; });
      const [rock, snow] = splitShape(s, (tri) => (up[tri[0]] + up[tri[1]] + up[tri[2]]) / 3 > 0.6);
      emit(mesh, 'stone', rock, { color: vc(base, { groundAO: 0.28, groundFade: 0.25 * size + 0.05 }) });
      emit(mesh, 'snow', snow, { color: vc(snowC, { groundAO: 0, underside: 0.2, mottle: 0.04 }) });
    } else {
      emit(mesh, 'stone', s, {
        color: (p, n) => {
          const w = smoothstep(0.5, 0.9, upness(p, n)) * mossAmount;
          return paintVertex(mixC(base, moss, w), p, n, { groundAO: 0.28, groundFade: 0.25 * size + 0.05 });
        },
      });
    }
  }
  return mesh;
}
