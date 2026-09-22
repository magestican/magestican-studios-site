















import { MeshData, IDENTITY, compose, translate, rotateY, rotateZ } from '../../../mesh/meshData.mjs';
import { emit, sweep, superellipseProfile, roughen } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, paintVertex } from '../shade.mjs';
import { rod } from '../rod.mjs';






export function bale(mesh, m, { girth = 0.34, length = 0.62, squat = 1, e = 2.6, detail = 0, rng, strawColor, twineColor = null }) {
  const count = detail === 0 ? 12 : detail === 1 ? 9 : 6;
  const steps = detail === 0 ? 4 : detail === 1 ? 3 : 2;
  const swell = rng.rangeF(0.36, 0.64);
  const path = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    path.push([(t - 0.5) * length, girth - 0.02, rng.rangeF(-0.006, 0.006)]);
  }
  const shape = sweep({
    profile: superellipseProfile(girth, girth * squat, e, count),
    path, up: [0, 1, 0], caps: 'round', capSegments: detail === 0 ? 2 : 1, capLength: girth * 0.34,
    
    scales: (t) => 0.9 + 0.13 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t + (0.5 - swell)) ))),
  });
  if (detail < 2) roughen(shape, { amount: detail === 0 ? 0.016 : 0.01, freq: 9, seed: rng.rangeI(1, 1e6), octaves: detail === 0 ? 3 : 2 });
  emit(mesh, 'grass', shape, {
    matrix: m,
    color: (p, n) => paintVertex(vary(rng, strawColor, 0.05), p, n, { groundAO: 0.4, groundFade: 0.5, mottle: 0.13, seed: 17 }),
  });

  
  if (twineColor && detail === 0) {
    const bands = [rng.rangeF(-0.3, -0.16), rng.rangeF(0.12, 0.32)];
    for (const b of bands) {
      const slip = rng.rangeF(-0.03, 0.03);
      emit(mesh, 'cloth', sweep({
        profile: superellipseProfile(0.012, 0.012, 2, 4),
        path: [[b * length, girth * 2 - 0.03, 0], [b * length + slip, girth - 0.02, girth * squat + 0.01], [b * length, 0.02, 0], [b * length - slip, girth - 0.02, -girth * squat - 0.01], [b * length, girth * 2 - 0.03, 0]],
        up: [1, 0, 0], caps: 'none',
      }), { matrix: m, color: vc(twineColor, { groundAO: 0.1, underside: 0.3 }) });
    }
  }
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { girth: 0.36, length: 0.66, squat: 1, e: 2.6, extra: null, straw: '#dcc078', twine: '#b5a07a' },
  { girth: 0.24, length: 0.78, squat: 1.15, e: 5, extra: null, straw: '#e4cd8c', twine: '#9d8f6e' },
  { girth: 0.38, length: 0.6, squat: 1, e: 2.8, extra: { girth: 0.21, length: 0.4 }, straw: '#d2b26a', twine: '#c0ab84' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('hayBale');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), girth: rng.rangeF(0.24, 0.38) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`hayBale-${seed}-${season}-lod${detail}`);
  const straw = hex(st.straw);
  
  const m = compose(IDENTITY, compose(rotateY(rng.rangeF(0, Math.PI * 2)), rotateZ(rng.rangeF(-0.05, 0.05))));
  bale(mesh, m, { girth: st.girth, length: st.length, squat: st.squat, e: st.e, detail, rng, strawColor: straw, twineColor: hex(st.twine) });

  if (st.extra && detail < 2) {
    
    
    const side = rng.chance(0.5) ? 1 : -1;
    const at = compose(m, compose(translate(st.length * 0.42 * side, 0, st.girth * 0.7), rotateZ(side * rng.rangeF(0.1, 0.24))));
    bale(mesh, at, { girth: st.extra.girth, length: st.extra.length, squat: 1.05, e: 3, detail: detail === 0 ? 1 : 2, rng, strawColor: straw, twineColor: null });
  }

  if (season === 'winter' && detail < 2) {
    
    const g = st.girth;
    emit(mesh, 'snow', sweep({
      profile: superellipseProfile(0.03, g * st.squat * 0.72, 3, detail === 0 ? 8 : 6),
      path: [[-st.length * 0.44, g * 2 - 0.05, 0], [0, g * 2 - 0.015, 0.01], [st.length * 0.44, g * 2 - 0.06, 0]],
      up: [0, 1, 0], caps: 'none',
      scales: (t) => 0.6 + 0.45 * Math.sin(Math.PI * Math.min(1, Math.max(0, t))),
    }), { matrix: m, color: vc(hex(pal.snow[0]), { groundAO: 0, underside: 0.2 }) });
  }
  return mesh;
}
