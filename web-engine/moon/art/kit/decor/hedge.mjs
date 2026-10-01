

















import { MeshData, IDENTITY, compose, translate, rotateY } from '../../../mesh/meshData.mjs';
import { emit, sweep, superellipseProfile, roughen, blob } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, mixC, paintVertex } from '../shade.mjs';







export function hedgeRun(mesh, m, {
  length = 2.0, width = 0.52, height = 0.78, detail = 0, rng,
  leafColor, deepColor, berryColor = null, blossomColor = null, snowColor = null,
}) {
  const count = detail === 0 ? 14 : detail === 1 ? 9 : 6;
  const steps = detail === 0 ? 6 : detail === 1 ? 4 : 2;
  const halfW = width / 2, halfH = height / 2;
  
  
  
  const crown = rng.rangeF(0.34, 0.66);
  const wander = rng.rangeF(0.02, 0.05) * (rng.chance(0.5) ? 1 : -1);
  const path = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const dip = -0.03 * Math.abs(t - crown) * (t < crown ? 1.4 : 1);
    path.push([(t - 0.5) * length, halfH + dip, wander * Math.sin(t * Math.PI * 1.7)]);
  }
  
  
  const endA = rng.rangeF(0.62, 0.78), endB = rng.rangeF(0.8, 0.94);
  const body = sweep({
    
    
    
    profile: superellipseProfile(halfH, halfW, detail === 2 ? 3 : 3.6, count),
    path,
    up: [0, 1, 0],
    caps: 'round',
    capSegments: detail === 0 ? 2 : 1,
    capLength: halfW * 0.6,
    scales: (t) => {
      const a = Math.min(1, t / 0.22), b = Math.min(1, (1 - t) / 0.22);
      return 1 - (1 - endA) * (1 - a) - (1 - endB) * (1 - b);
    },
  });
  
  
  if (detail < 2) roughen(body, { amount: detail === 0 ? 0.022 : 0.014, freq: 5.5, seed: rng.rangeI(1, 1e6), octaves: detail === 0 ? 3 : 2 });
  
  
  const tint = vary(rng, leafColor, 0.05);
  emit(mesh, 'leaf', body, {
    matrix: m,
    color: (p, n) => mixC(paintVertex(tint, p, n, { groundAO: 0.3, groundFade: 0.55, mottle: 0.11, seed: 3 }), deepColor, Math.max(0, 0.5 - p[1] * 0.55)),
  });

  if (detail === 2) return;

  
  const dotColor = berryColor || blossomColor;
  if (dotColor && detail === 0) {
    const side = rng.chance(0.5) ? 1 : -1;
    const n = rng.rangeI(5, 8);
    for (let i = 0; i < n; i++) {
      const t = (i + rng.rangeF(0.1, 0.9)) / n;
      const dot = blob({ radii: [0.045, 0.038, 0.042], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.3 });
      emit(mesh, berryColor ? 'fruit' : 'blossom', dot, {
        matrix: compose(m, translate((t - 0.5) * length * 0.86, halfH + rng.rangeF(-0.12, 0.2), side * halfW * rng.rangeF(0.6, 0.95))),
        color: vc(vary(rng, dotColor, 0.08), { groundAO: 0, underside: 0.3 }),
      });
    }
  }

  if (snowColor) {
    const ridge = sweep({
      profile: superellipseProfile(0.035, halfW * 0.72, 3, detail === 0 ? 8 : 6),
      path: path.map((p) => [p[0] * 0.94, p[1] + halfH - 0.02, p[2]]),
      up: [0, 1, 0], caps: 'none',
      scales: (t) => 0.62 + 0.42 * Math.sin(Math.PI * Math.min(1, Math.max(0, t))),
    });
    emit(mesh, 'snow', ridge, { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { length: 2.0, width: 0.5, height: 0.86, leaf: 1, berry: null, blossom: null },
  { length: 2.2, width: 0.62, height: 0.56, leaf: 2, berry: '#c2506a', blossom: null },
  { length: 1.9, width: 0.46, height: 1.02, leaf: 0, berry: null, blossom: '#f3c3d8' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('hedge');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), height: rng.rangeF(0.55, 1.0) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`hedge-${seed}-${season}-lod${detail}`);
  hedgeRun(mesh, compose(IDENTITY, rotateY(rng.rangeF(-0.06, 0.06))), {
    length: st.length, width: st.width, height: st.height, detail, rng,
    leafColor: hex(pal.leaf[st.leaf]), deepColor: hex(pal.leaf[2]),
    berryColor: st.berry ? hex(st.berry) : null,
    blossomColor: st.blossom ? hex(st.blossom) : null,
    snowColor: season === 'winter' && detail < 2 ? hex(pal.snow[0]) : null,
  });
  return mesh;
}
