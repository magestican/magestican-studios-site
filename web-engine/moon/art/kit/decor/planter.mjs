




































import { MeshData, IDENTITY, compose, translate, rotateY, rotateZ } from '../../../mesh/meshData.mjs';
import { emit, sweep, roundedRectProfile } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, mixC, paintVertex } from '../shade.mjs';
import { bloom } from '../blooms.mjs';
















export function troughSection(half, height, thick, batter = [0.06, 0.1], form = 'full') {
  const outF = half * (1 + batter[0]), outB = -half * (1 + batter[1]);
  if (form === 'solid') {
    return [[0, -half], [0, half], [height, outF], [height - 0.01, half * 0.3], [height - 0.012, -half * 0.35], [height, outB]];
  }
  const mid = form === 'full';
  return [
    [0, -half], [0, half],
    ...(mid ? [[height * 0.55, half * (1 + batter[0] * 0.5)]] : []),
    [height, outF],
    [height - 0.013, outF - 0.018], [thick, half * 0.8],
    [thick, -half * 0.76], [height - 0.013, outB + 0.016],
    [height, outB],
    ...(mid ? [[height * 0.55, -half * (1 + batter[1] * 0.5)]] : []),
  ];
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { length: 0.92, half: 0.135, height: 0.26, cap: false, blooms: 4, drift: -0.22, wood: '#d8b483', trim: '#a8825c' },
  { length: 0.58, half: 0.15, height: 0.34, cap: false, blooms: 3, drift: 0.1, wood: '#9fb094', trim: '#6f7d63' },
  { length: 1.14, half: 0.175, height: 0.19, cap: true, blooms: 5, drift: 0.26, wood: '#c0ae92', trim: '#8d7c62' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('planter');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), length: rng.rangeF(0.58, 1.14) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`planter-${seed}-${season}-lod${detail}`);
  
  
  const m = compose(IDENTITY, compose(rotateY(rng.rangeF(-0.07, 0.07)), rotateZ(rng.rangeF(-0.012, 0.012))));
  const wood = hex(st.wood);
  const batter = [rng.rangeF(0.04, 0.09), rng.rangeF(0.09, 0.15)];
  const L = st.length;
  
  const sagAt = rng.rangeF(-0.12, 0.12);
  const sag = rng.rangeF(0.008, 0.016);
  const spine = detail === 2
    ? [[-L * 0.5, 0, 0], [L * 0.5, 0, 0]]
    : [[-L * 0.5, 0, 0], [L * sagAt, -sag, 0], [L * 0.5, 0.004, 0]];
  const taper = [rng.rangeF(0.93, 0.97), rng.rangeF(0.86, 0.92)];
  emit(mesh, 'plank', sweep({
    profile: troughSection(st.half, st.height, 0.026, batter, detail === 0 ? 'full' : detail === 1 ? 'lean' : 'solid'),
    path: spine, up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.015,
    scales: (t) => taper[0] + (taper[1] - taper[0]) * t,
  }), {
    matrix: m,
    color: (p, n) => paintVertex(vary(rng, wood, 0.05), p, n, { groundAO: 0.34, groundFade: 0.45, underside: 0.5, mottle: 0.07, seed: 71 }),
  });

  
  if (st.cap && detail < 2) {
    const side = rng.chance(0.5) ? 1 : -1;
    emit(mesh, 'plank', sweep({
      profile: roundedRectProfile(0.018, st.half * 0.46, 0.007, detail === 0 ? 1 : 0),
      path: [[-L * 0.47, st.height, side * st.half * (1 + batter[side > 0 ? 0 : 1]) * 0.86], [L * 0.03, st.height - sag * 0.6, side * st.half * 0.9], [L * 0.47, st.height + 0.003, side * st.half * 0.88]],
      up: [0, 1, 0], caps: 'round', capLength: 0.008,
    }), { matrix: m, color: (p, n) => paintVertex(mixC(wood, hex(st.trim), 0.45), p, n, { groundAO: 0.1, groundFade: 0.3, underside: 0.45, mottle: 0.05, seed: 73 }) });
  }

  
  const soilY = st.height - 0.045;
  if (detail < 2) {
    const soil = mixC(hex('#6b563f'), hex(pal.soil ? pal.soil[0] : '#6b563f'), 0.5);
    emit(mesh, 'soil', sweep({
      profile: [[0, -st.half * 0.74], [0.014, -st.half * 0.4], [0.02, st.half * 0.3], [0.008, st.half * 0.72]],
      path: [[-L * 0.44, soilY, 0], [L * sagAt, soilY - sag * 0.7 + 0.004, 0.004], [L * 0.44, soilY + 0.002, 0]],
      up: [0, 1, 0], caps: 'none',
      scales: (t) => 0.78 + 0.3 * Math.sin(Math.PI * Math.min(1, Math.max(0, t)) ** 0.85),
    }), { matrix: m, color: (p, n) => paintVertex(soil, p, n, { groundAO: 0, underside: 0.3, mottle: 0.12, seed: 79 }) });

    
    if (season !== 'winter') {
      const n = detail === 0 ? st.blooms : Math.max(1, st.blooms - 2);
      for (let i = 0; i < n; i++) {
        const x = L * (st.drift + rng.rangeF(-0.16, 0.16));
        const z = st.half * rng.rangeF(-0.42, 0.42);
        bloom(mesh, m, [x, soilY + 0.018, z], { r: rng.rangeF(0.05, 0.075), rng, season });
      }
    }
  }

  if (season === 'winter' && detail < 2) {
    emit(mesh, 'snow', sweep({
      profile: [[0, -st.half * 0.7], [0.016, -st.half * 0.3], [0.022, st.half * 0.36], [0.01, st.half * 0.68]],
      path: [[-L * 0.42, soilY + 0.024, 0], [L * sagAt, soilY + 0.03, 0.003], [L * 0.42, soilY + 0.026, 0]],
      up: [0, 1, 0], caps: 'none',
      scales: (t) => 0.7 + 0.36 * Math.sin(Math.PI * Math.min(1, Math.max(0, t))),
    }), { matrix: m, color: vc(hex(pal.snow[0]), { groundAO: 0, underside: 0.2 }) });
  }
  return mesh;
}
