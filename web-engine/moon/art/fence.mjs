









import { MeshData, translate } from '../mesh/meshData.mjs';
import { sweep, lathe, blob, emit, superellipseProfile, circleProfile, roundedRectProfile } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette } from '../palette/seasons.mjs';
import { hex, vary, vc } from './kit/shade.mjs';

export const TIER = 'dressing';
export const LODS = [0, 1, 2];
const WOODS = ['#f3ead8', '#c79a6a', '#9a7b5e'];

export function generate({ seed = 1, season = 'summer', lod = 0, endPosts = true } = {}) {
  const rng = new SeededRng(seed).child('fence');
  const d = Math.max(0, Math.min(2, lod | 0));
  const style = seed >= 1 && seed <= 3 ? seed - 1 : rng.rangeI(0, 2);
  const mesh = new MeshData(`fence-${seed}-${season}-lod${d}`);
  const wood = vary(rng, hex(WOODS[style]), 0.05);
  const color = vc(wood, { groundAO: 0.3, groundFade: 0.35 });
  const snowC = season === 'winter' && d < 2 ? hex(seasonPalette(season).snow[0]) : null;
  const sides = [8, 6, 4][d];

  const xs = endPosts ? [-0.95, 0.95] : [-0.95];
  const tops = [];
  for (const x of xs) {
    const h = (style === 1 ? 0.95 : 0.9) + rng.rangeF(-0.07, 0.07);
    const lx = rng.rangeF(-0.06, 0.06) * (style === 2 ? 1.8 : 1), lz = rng.rangeF(-0.04, 0.04) * (style === 2 ? 1.8 : 1);
    const n = d === 0 ? 3 : 2;
    const path = Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return [x + lx * t * t, h * t, lz * t * t]; });
    const r = style === 2 ? 0.09 : 0.08;
    const profile = style === 2
      ? circleProfile(r, sides).map(([a, b], k) => { const j = 1 + (((k * 7919) % 13) / 13 - 0.5) * 0.18; return [a * j, b * j]; })
      : superellipseProfile(r, r, 3.5, sides);
    const post = sweep({ profile, path, up: [0, 0, 1], scales: (t) => 1.08 - 0.12 * t, caps: ['none', d === 2 ? 'flat' : 'round'], capRings: [], capSegments: d === 0 ? 2 : 1, capLength: 0.05 });
    emit(mesh, 'wood', post, { color });
    const top = path[n - 1];
    tops.push(top);
    if (d === 0 && style !== 2) {
      const knob = lathe({ points: [[0, 0], [0.105, 0.0], [0.112, 0.032], [0.074, 0.072], [0, 0.09]], sides: 8, phase: rng.rangeF(0, 1) });
      emit(mesh, 'wood', knob, { matrix: translate(top[0], top[1] + 0.02, top[2]), color });
    }
  }

  const x0 = -1.0, x1 = endPosts ? 1.0 : 1.05;
  const railN = [4, 3, 2][d];
  const railPath = (y0, y1, z, sagAmt) => Array.from({ length: railN }, (_, i) => {
    const t = i / (railN - 1), x = x0 + (x1 - x0) * t;
    return [x, y0 + (y1 - y0) * t - sagAmt * 4 * t * (1 - t), z + rng.rangeF(-0.008, 0.008)];
  });
  const rails = style === 0
    ? [railPath(0.34 + rng.rangeF(-0.02, 0.02), 0.36, 0.085, rng.rangeF(0.015, 0.035)), railPath(0.68, 0.66 + rng.rangeF(-0.03, 0.02), 0.085, rng.rangeF(0.02, 0.045))]
    : style === 1
      ? [railPath(0.26, 0.28, 0, 0.015), railPath(0.64, 0.62, 0, 0.02)]
      : [railPath(0.4, 0.37, 0.095, rng.rangeF(0.04, 0.07)), railPath(0.78, 0.5, 0.1, rng.rangeF(0.01, 0.03))];
  
  const railProfile = style === 2 ? circleProfile(0.068, [8, 6, 4][d], 0.4) : superellipseProfile(0.066, 0.046, 2.6, [10, 6, 4][d]);
  for (const path of rails) {
    emit(mesh, 'wood', sweep({ profile: railProfile, path, up: [0, 1, 0], caps: d === 2 ? 'flat' : 'round', capRings: [], capSegments: 1, capLength: 0.035, uvScale: 1 }), { color });
  }

  if (style === 1 && d < 2) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const x = -0.64 + (1.28 * i) / (count - 1) + rng.rangeF(-0.02, 0.02);
      const h = 0.78 + rng.rangeF(-0.05, 0.05);
      const picket = sweep({ profile: roundedRectProfile(0.036, 0.115, 0.015, 0), path: [[x, 0, 0.07], [x + rng.rangeF(-0.015, 0.015), h, 0.07]], up: [0, 0, 1], caps: ['none', 'round'], capSegments: 1, capLength: 0.07 });
      emit(mesh, 'wood', picket, { color });
    }
  }

  if (snowC) {
    const snowColor = vc(snowC, { groundAO: 0, underside: 0.2 });
    for (const top of tops) {
      const puff = blob({ radii: [0.1, 0.055, 0.1], subdiv: d === 0 ? 2 : 1, seed: rng.rangeI(1, 1e6), lump: 0.2, flats: [{ n: [0, -1, 0], d: 0.2, k: 0.2 }] });
      emit(mesh, 'snow', puff, { matrix: translate(top[0], top[1] + (d === 0 && style !== 2 ? 0.1 : 0.05), top[2]), color: snowColor });
    }
    if (d === 0) {
      const top = rails[1].map(([x, y, z]) => [x, y + 0.045, z]);
      const roll = sweep({ profile: circleProfile(0.03, 5, 0, 0.05).map(([a, b]) => [a, b]), path: top.slice(0, Math.max(2, top.length)), up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.05, scales: (t) => 0.8 + 0.4 * Math.sin(Math.PI * t) });
      emit(mesh, 'snow', roll, { color: snowColor });
    }
  }
  return mesh;
}
