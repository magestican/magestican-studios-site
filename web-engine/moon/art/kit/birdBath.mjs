










import { MeshData, IDENTITY, compose, translate, rotateY } from '../../mesh/meshData.mjs';
import { sweep, lathe, emit, circleProfile } from '../../mesh/bevel.mjs';
import { SeededRng } from '../../../rng/seededRng.js';
import { seasonPalette } from '../../palette/seasons.mjs';
import { hex, vc, paintVertex, mixC } from './shade.mjs';
import { RIPPLE, surfaceRamp } from './water.mjs';

export function birdBath(mesh, m, { height = 0.78, bowl = 0.3, detail = 0, rng, stoneColor, waterColor, birdColor = null, snowColor = null }) {
  const sides = detail === 0 ? 8 : detail === 1 ? 6 : 5;
  const H = height, R = bowl;
  const pts = detail === 2
    ? [[0, 0], [0.19, 0], [0.07, 0.2], [0.07, H * 0.72], [R, H * 0.94], [R * 0.9, H], [0, H * 0.93]]
    : detail === 1
      ? [[0, 0], [0.2, 0], [0.13, 0.09], [0.075, 0.22], [0.07, H * 0.7], [R * 0.62, H * 0.84], [R * 1.02, H * 0.95], [R * 0.85, H], [0, H * 0.935]]
      : [[0, 0], [0.2, 0], [0.13, 0.09], [0.075, 0.22], [0.09, H * 0.72], [R * 0.62, H * 0.84], [R * 0.95, H * 0.9], [R * 1.02, H * 0.955], [R * 0.93, H], [R * 0.72, H * 0.965], [0, H * 0.935]];
  const ph = rng.rangeF(0, 6);
  const shape = lathe({ points: pts, sides, phase: rng.rangeF(0, 1), uvScale: 1.5, radiusFn: detail === 2 ? null : (th, j, r) => r * (1 + 0.03 * Math.sin(th * 3 + ph + j * 0.7)) });
  
  
  const wet = shape.p.map((p) => p[1] > H * 0.92 && Math.hypot(p[0], p[2]) < R * 0.8);
  const water = waterColor || hex('#9fd0dc');
  
  
  
  const ramp = surfaceRamp(shape.p.map((p) => Math.hypot(p[0], p[2])), R * 0.8);
  emit(mesh, 'stone', shape, {
    matrix: m,
    color: (p, n, uv, tag, i) => {
      const c = paintVertex(stoneColor, p, n, { groundAO: 0.3, groundFade: 0.3 });
      return wet[i] ? mixC(c, water, snowColor ? 0.2 : 0.85) : c;
    },
    ripple: snowColor ? 0 : (p, n, uv, tag, i) => (wet[i] ? RIPPLE.basin * ramp[i] : 0),
  });
  
  
  
  
  
  if (!snowColor) {
    const skinR = R * 0.78;
    const skin = lathe({ points: [[skinR, H * 0.93], [skinR * 0.55, H * 0.928], [0, H * 0.925]], sides, phase: rng.child('water').rangeF(0, 1) });
    const skinRamp = surfaceRamp(skin.p.map((p) => Math.hypot(p[0], p[2])), skinR);
    emit(mesh, 'water', skin, {
      matrix: m,
      color: vc(water, { groundAO: 0, underside: 0.15 }),
      ripple: (p, n, uv, tag, i) => RIPPLE.basin * skinRamp[i],
    });
  }
  if (snowColor && detail < 2) {
    emit(mesh, 'snow', lathe({ points: [[R * 0.86, H * 0.975], [R * 0.6, H * 1.03], [R * 0.25, H * 1.05], [0, H * 1.055]], sides }), { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }
  if (detail === 0 && birdColor) {
    const a = rng.rangeF(0, Math.PI * 2);
    const path = [[-0.075, 0.03, 0], [-0.03, 0.045, 0], [0.012, 0.05, 0], [0.038, 0.072, 0], [0.056, 0.088, 0]];
    const sc = [0.28, 0.95, 1, 0.56, 0.64];
    const bird = sweep({ profile: circleProfile(0.034, 5), path, up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.024, scales: (t, i) => sc[i] });
    const at = compose(m, compose(translate(Math.sin(a) * R * 0.97, H, Math.cos(a) * R * 0.97), rotateY(a + Math.PI / 2 + rng.rangeF(-0.5, 0.5))));
    emit(mesh, 'petal', bird, { matrix: at, color: vc(birdColor, { groundAO: 0, underside: 0.35 }) });
  }
}

export const TIER = 'dressing';
const STYLES = [
  { height: 0.78, bowl: 0.3, stone: '#c9c2b8', bird: '#6a8fd0' },
  { height: 0.5, bowl: 0.38, stone: '#d9cfc2', bird: '#e0674e' },
  { height: 0.98, bowl: 0.26, stone: '#b8b0c4', bird: '#e6b84a' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('birdBath');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), height: rng.rangeF(0.55, 0.95) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`birdBath-${seed}-${season}-lod${detail}`);
  birdBath(mesh, IDENTITY, { height: st.height, bowl: st.bowl, detail, rng, stoneColor: hex(st.stone), birdColor: hex(st.bird), snowColor: season === 'winter' ? hex(pal.snow[0]) : null });
  return mesh;
}
