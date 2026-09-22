




















import { MeshData, IDENTITY, compose, translate, rotateY, rotateZ, rotateX } from '../../../mesh/meshData.mjs';
import { emit, lathe, blob, sweep, circleProfile, superellipseProfile } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, paintVertex } from '../shade.mjs';
import { rod } from '../rod.mjs';


export function plinth(mesh, m, { radius = 0.26, height = 0.5, detail = 0, rng, color }) {
  const R = radius, H = height;
  const sides = detail === 0 ? 10 : detail === 1 ? 8 : 5;
  const wob = rng.rangeF(0, 6);
  const pts = detail === 2
    ? [[0, 0], [R, 0], [R * 0.86, H], [0, H]]
    : [[0, 0], [R * 1.12, 0], [R * 1.08, H * 0.09], [R * 0.9, H * 0.17],
      [R * 0.86, H * 0.62], [R * 0.93, H * 0.7], [R * 1.06, H * 0.84], [R * 1.04, H * 0.93],
      [R * 0.92, H], [R * 0.7, H - 0.012], [0, H - 0.02]];
  const shape = lathe({
    points: pts, sides, phase: rng.rangeF(0, 1), uvScale: 2,
    radiusFn: detail === 2 ? null : (th, j, r) => r * (1 + 0.013 * Math.sin(th * 3 + wob) + 0.006 * Math.sin(th * 7 + j)),
  });
  emit(mesh, 'stone', shape, { matrix: m, color: (p, n) => paintVertex(color, p, n, { groundAO: 0.36, groundFade: 0.4, mottle: 0.08, seed: 11 }) });
  return H;
}





export function carvedFigure(mesh, m, { base = 0.5, height = 0.8, radius = 0.17, waist, lean, detail = 0, rng, color }) {
  const steps = waist.length - 1;
  const path = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    path.push([lean[0] * t * t, base + height * t, lean[1] * t * t * (0.6 + 0.4 * t)]);
  }
  const shape = sweep({
    profile: circleProfile(radius, detail === 0 ? 9 : detail === 1 ? 7 : 5),
    path, up: [0, 0, 1], caps: 'round', capSegments: detail === 0 ? 2 : 1, capLength: radius * 0.8,
    scales: (t, i) => waist[i],
  });
  emit(mesh, 'stone', shape, { matrix: m, color: (p, n) => paintVertex(color, p, n, { groundAO: 0.2, groundFade: 0.3, mottle: 0.07, seed: 5 }) });
  return [lean[0], base + height, lean[1] * 1.0];
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { kind: 'hare', pr: 0.26, ph: 0.46, fh: 0.74, fr: 0.16, waist: [0.95, 0.72, 0.86, 0.58, 0.72, 0.3], stone: '#cdc6bb', trim: '#b0a596' },
  { kind: 'sundial', pr: 0.3, ph: 0.62, fh: 0.42, fr: 0.13, waist: [1, 0.86, 0.78, 0.84, 1.15, 1.05], stone: '#bfc3c8', trim: '#9c7c4a' },
  { kind: 'urn', pr: 0.24, ph: 0.4, fh: 0.86, fr: 0.2, waist: [0.6, 0.98, 1.05, 0.72, 0.52, 0.78], stone: '#c8bda8', trim: '#a08b6c' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('statue');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), ph: rng.rangeF(0.4, 0.62) };
  const pal = seasonPalette(season);
  const snow = season === 'winter' && detail < 2 ? hex(pal.snow[0]) : null;
  const mesh = new MeshData(`statue-${seed}-${season}-lod${detail}`);
  const m = compose(IDENTITY, rotateY(rng.rangeF(0, Math.PI * 2)));
  const stone = hex(st.stone);
  const top = plinth(mesh, m, { radius: st.pr, height: st.ph, detail, rng, color: stone });
  const lean = [rng.rangeF(-0.05, 0.05), rng.rangeF(-0.05, 0.05)];
  const head = carvedFigure(mesh, m, {
    base: top - 0.03, height: st.fh, radius: st.fr, waist: st.waist, lean, detail, rng, color: stone,
  });

  if (detail < 2) {
    
    const side = rng.chance(0.5) ? 1 : -1;
    if (st.kind === 'hare') {
      emit(mesh, 'stone', rod({
        path: [[head[0] + side * 0.03, head[1] - 0.06, head[2]], [head[0] + side * 0.05, head[1] + 0.16, head[2] - 0.02], [head[0] + side * 0.13, head[1] + 0.26, head[2] - 0.05]],
        w: 0.075, h: 0.045, detail: detail === 0 ? 0 : 1, up: [1, 0, 0], caps: ['none', 'round'], capLength: 0.03,
        scales: (t) => 1 - 0.35 * t,
      }), { matrix: m, color: vc(vary(rng, stone, 0.04), { groundAO: 0.1, underside: 0.4 }) });
    } else if (st.kind === 'sundial') {
      const dial = lathe({ points: [[0, 0], [0.19, -0.008], [0.2, 0.01], [0.17, 0.022], [0, 0.02]], sides: detail === 0 ? 10 : 7, phase: rng.rangeF(0, 1) });
      const at = compose(m, compose(translate(head[0], head[1], head[2]), rotateX(rng.rangeF(0.12, 0.2) * side)));
      emit(mesh, 'stone', dial, { matrix: at, color: vc(vary(rng, stone, 0.04), { groundAO: 0.1, underside: 0.45 }) });
      emit(mesh, 'copper', rod({
        path: [[-0.09 * side, 0.02, 0], [0.02 * side, 0.15, 0], [0.09 * side, 0.17, 0]],
        w: 0.03, h: 0.012, detail: 1, up: [0, 0, 1], caps: 'none',
      }), { matrix: at, color: vc(hex(st.trim), { groundAO: 0, underside: 0.4 }) });
    } else {
      const lip = lathe({ points: [[0.13, 0], [0.2, 0.03], [0.19, 0.06], [0.14, 0.05]], sides: detail === 0 ? 10 : 7, phase: rng.rangeF(0, 1),
        radiusFn: (th, j, r) => r * (1 - 0.14 * Math.max(0, Math.cos(th - 1.1))) });
      emit(mesh, 'stone', lip, { matrix: compose(m, translate(head[0], head[1] - 0.04, head[2])), color: vc(vary(rng, stone, 0.05), { groundAO: 0.05, underside: 0.4 }) });
    }
  }

  if (snow) {
    const cap = blob({ radii: [st.fr * 0.9, 0.035, st.fr * 0.8], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.28 });
    emit(mesh, 'snow', cap, { matrix: compose(m, translate(head[0], head[1] + 0.02, head[2])), color: vc(snow, { groundAO: 0, underside: 0.2 }) });
    const rim = lathe({ points: [[st.pr * 1.0, top - 0.02], [st.pr * 1.08, top + 0.01], [st.pr * 0.72, top + 0.012]], sides: detail === 0 ? 10 : 7, phase: rng.rangeF(0, 1) });
    emit(mesh, 'snow', rim, { matrix: m, color: vc(snow, { groundAO: 0, underside: 0.2 }) });
  }
  return mesh;
}
