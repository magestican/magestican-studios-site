























import { MeshData, IDENTITY, compose, translate, rotateY } from '../../../mesh/meshData.mjs';
import { emit, sweep, superellipseProfile, blob } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, paintVertex } from '../shade.mjs';
import { rod } from '../rod.mjs';





export function archPath({ span, height, rng }) {
  const a = span * 0.5 * rng.rangeF(0.94, 1.02);      
  const b = span * 0.5 * rng.rangeF(1.0, 1.1);        
  const za = rng.rangeF(-0.03, 0.01), zb = rng.rangeF(-0.01, 0.03);
  const crown = rng.rangeF(-0.06, 0.06) * span;
  const shoulder = height * rng.rangeF(0.6, 0.7);
  return [
    [-a, -0.03, za],
    [-a * 1.01, shoulder, za],
    [-a * 0.66, height * 0.94, za * 0.6],
    [crown, height, (za + zb) * 0.3],
    [b * 0.7, height * 0.92, zb * 0.6],
    [b * 1.01, shoulder * rng.rangeF(0.95, 1.05), zb],
    [b, -0.03, zb],
  ];
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { span: 1.4, height: 2.2, section: 0.07, bars: 3, wood: '#b58a58', metal: false, leaf: 1, flower: '#f2b6c8' },
  { span: 1.66, height: 1.86, section: 0.08, bars: 4, wood: '#c8a071', metal: false, leaf: 2, flower: null },
  { span: 1.18, height: 2.42, section: 0.05, bars: 2, wood: '#6d6a74', metal: true, leaf: 0, flower: '#ead9a8' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('arch');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), height: rng.rangeF(1.9, 2.4) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`arch-${seed}-${season}-lod${detail}`);
  
  
  
  
  
  const m = compose(IDENTITY, rotateY(rng.rangeF(-0.05, 0.05)));
  const path = archPath({ span: st.span, height: st.height, rng });
  const s = st.section;
  const woodColor = hex(st.wood);

  
  
  
  const member = sweep({
    profile: superellipseProfile(s * 0.5, s * 0.44, 4, detail === 0 ? 8 : detail === 1 ? 6 : 4),
    path: detail === 2 ? [path[0], path[2], path[3], path[4], path[6]] : path,
    up: [0, 0, 1], caps: ['none', 'none'],
    
    scales: (t) => 1.12 - 0.26 * Math.sin(Math.PI * Math.min(1, Math.max(0, t))),
  });
  emit(mesh, st.metal ? 'metal' : 'wood', member, {
    matrix: m,
    color: (p, n) => paintVertex(woodColor, p, n, { groundAO: 0.4, groundFade: 0.5, mottle: 0.07, seed: 23 }),
  });

  if (detail < 2) {
    
    const side = rng.chance(0.5) ? 1 : -1;
    const bars = detail === 0 ? st.bars : Math.max(1, st.bars - 2);
    for (let i = 0; i < bars; i++) {
      const y = st.height * (0.2 + 0.62 * ((i + rng.rangeF(0.2, 0.8)) / bars));
      const half = st.span * 0.5 * (1 - 0.1 * (y / st.height));
      emit(mesh, st.metal ? 'metal' : 'wood', rod({
        path: [[-half * rng.rangeF(0.9, 1), y, side * s * 0.2], [half * rng.rangeF(0.9, 1), y + rng.rangeF(-0.02, 0.02), side * s * 0.2]],
        w: s * 0.5, h: s * 0.42, detail: detail === 0 ? 1 : 2, up: [0, 1, 0], caps: 'none',
      }), { matrix: m, color: vc(vary(rng, woodColor, 0.06), { groundAO: 0.2, underside: 0.4 }) });
    }
    
    const up = rng.chance(0.5) ? -1 : 1;
    const n = detail === 0 ? rng.rangeI(6, 8) : 4;
    for (let i = 0; i < n; i++) {
      const t = (i + rng.rangeF(0.1, 0.9)) / n;
      const y = st.height * (0.12 + 0.82 * t);
      const x = up * st.span * 0.5 * (1 - 0.5 * Math.max(0, t - 0.6) / 0.4) + rng.rangeF(-0.05, 0.05);
      const leafy = blob({ radii: [0.1, 0.075, 0.09], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.34 });
      emit(mesh, 'leaf', leafy, {
        matrix: compose(m, translate(x, Math.min(y, st.height + 0.02), rng.rangeF(-0.06, 0.06))),
        color: vc(vary(rng, hex(pal.leaf[st.leaf]), 0.07), { groundAO: 0.1, underside: 0.35 }),
      });
      if (st.flower && detail === 0 && i % 2 === 0) {
        const fl = blob({ radii: [0.045, 0.032, 0.042], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.2 });
        emit(mesh, 'blossom', fl, {
          matrix: compose(m, translate(x + up * 0.06, Math.min(y + 0.04, st.height + 0.04), 0.07)),
          color: vc(vary(rng, hex(st.flower), 0.06), { groundAO: 0, underside: 0.3 }),
        });
      }
    }
  }

  if (season === 'winter' && detail < 2) {
    
    emit(mesh, 'snow', sweep({
      profile: superellipseProfile(0.025, s * 0.5, 3, detail === 0 ? 6 : 4),
      path: [path[2], path[3], path[4]].map((p) => [p[0], p[1] + s * 0.45, p[2]]),
      up: [0, 0, 1], caps: 'none',
      scales: (t) => 0.55 + 0.5 * Math.sin(Math.PI * Math.min(1, Math.max(0, t))),
    }), { matrix: m, color: vc(hex(pal.snow[0]), { groundAO: 0, underside: 0.2 }) });
  }
  return mesh;
}
