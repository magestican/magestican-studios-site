































import { MeshData, IDENTITY, compose, translate, rotateX, rotateY, rotateZ } from '../../../mesh/meshData.mjs';
import { emit, sweep, lathe } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, mixC, paintVertex } from '../shade.mjs';
import { rod } from '../rod.mjs';












export function gableProfile(halfW, wallH, ridgeH, eave = [0.02, 0.035], ridgeX = 0.1) {
  return [
    [0, halfW],
    [0, -halfW],
    [wallH * 0.62, -halfW * 1.015],
    [wallH, -halfW],
    [wallH - 0.012, -(halfW + eave[0])],
    [wallH + ridgeH, halfW * ridgeX],
    [wallH - 0.012, halfW + eave[1]],
    [wallH * 0.97, halfW * 0.99],
  ];
}






export function holeSocket(r, depth) {
  return [[r, 0], [r * 0.93, -depth * 0.2], [r * 0.66, -depth * 0.72], [r * 0.3, -depth], [0, -depth * 1.06]];
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { post: 0.92, postW: 0.07, halfW: 0.105, wallH: 0.17, ridgeH: 0.085, depth: 0.135, eave: [0.018, 0.038], ridgeX: 0.12, hole: 0.032, perch: 0.055, body: '#f0e4cb', roof: '#8f7a5e', post_c: '#a7794f' },
  { post: 0.66, postW: 0.092, halfW: 0.125, wallH: 0.13, ridgeH: 0.06, depth: 0.155, eave: [0.05, 0.026], ridgeX: -0.18, hole: 0.028, perch: 0, body: '#9dbd97', roof: '#5f7a5e', post_c: '#8d6b46' },
  { post: 1.24, postW: 0.058, halfW: 0.088, wallH: 0.215, ridgeH: 0.14, depth: 0.12, eave: [0.03, 0.014], ridgeX: 0.22, hole: 0.04, perch: 0.042, body: '#c4675a', roof: '#f0e2cc', post_c: '#6e6a74' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('birdhouse');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), post: rng.rangeF(0.66, 1.24) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`birdhouse-${seed}-${season}-lod${detail}`);
  
  
  const m = compose(IDENTITY, rotateY(rng.rangeF(-0.1, 0.1)));
  const H = st.post;
  const lean = rng.rangeF(-0.05, 0.05), drift = rng.rangeF(-0.035, 0.035);

  
  emit(mesh, 'wood', rod({
    path: [[0, -0.035, 0], [lean * 0.5, H * 0.6, drift * 0.5], [lean, H, drift]],
    w: st.postW, h: st.postW * 0.9, detail, up: [0, 0, 1],
    caps: 'none', scales: (t) => 1 - 0.16 * t,
  }), { matrix: m, color: (p, n) => paintVertex(hex(st.post_c), p, n, { groundAO: 0.44, groundFade: 0.55, mottle: 0.08, seed: 47 }) });

  
  const at = compose(m, compose(
    translate(lean + rng.rangeF(-0.015, 0.015), H - 0.01, drift + rng.rangeF(-0.015, 0.015)),
    compose(rotateZ(rng.rangeF(-0.045, 0.045)), rotateY(rng.rangeF(-0.12, 0.12))),
  ));
  const eave = detail === 2 ? [st.eave[0] * 0.5, st.eave[1] * 0.5] : st.eave;
  const body = sweep({
    profile: gableProfile(st.halfW, st.wallH, st.ridgeH, eave, st.ridgeX),
    path: [[0, 0, -st.depth * 0.5], [0, 0.003, 0], [0, 0, st.depth * 0.5]],
    up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: st.depth * 0.07,
    scales: (t) => 1 - 0.035 * t,
  });
  const wood = hex(st.body);
  emit(mesh, 'plank', body, {
    matrix: at,
    color: (p, n) => {
      
      
      const roofish = n[1] > 0.35 ? 1 : 0;
      return paintVertex(mixC(vary(rng, wood, 0.04), hex(st.roof), roofish * 0.8), p, n, { groundAO: 0.1, groundFade: 0.25, underside: 0.45, mottle: 0.06, seed: 53 });
    },
  });

  if (detail < 2) {
    
    const hx = st.halfW * rng.rangeF(-0.3, 0.3);
    const hy = st.wallH * rng.rangeF(0.62, 0.78);
    const holeAt = compose(at, compose(translate(hx, hy, st.depth * 0.48), rotateX(Math.PI * 0.5)));
    emit(mesh, 'wood', lathe({
      points: holeSocket(st.hole, st.hole * 1.4), sides: detail === 0 ? 8 : 6,
    }), { matrix: holeAt, color: vc(mixC(hex(st.roof), [0, 0, 0], 0.55), { groundAO: 0, underside: 0.1 }) });

    
    if (st.perch) {
      const side = rng.chance(0.5) ? 1 : -1;
      const x0 = hx + side * st.hole * 0.7;
      emit(mesh, 'wood', rod({
        path: [[x0, hy - st.hole * 1.5, st.depth * 0.42], [x0 + side * st.perch * 0.5, hy - st.hole * 1.5 - 0.008, st.depth * 0.5 + st.perch]],
        w: 0.014, detail: 2, up: [0, 1, 0], caps: ['none', 'round'], capLength: 0.006,
      }), { matrix: at, color: vc(hex('#8d6b46'), { groundAO: 0, underside: 0.4 }) });
    }
  }

  if (season === 'winter' && detail < 2) {
    
    const deep = st.eave[0] > st.eave[1] ? -1 : 1;
    const ridge = st.halfW * st.ridgeX;
    emit(mesh, 'snow', sweep({
      profile: [[0, ridge - st.halfW * 0.34], [0.022, ridge + (st.halfW * 0.3 + st.eave[deep > 0 ? 1 : 0]) * deep], [0.03, ridge + st.halfW * 0.05], [0.018, ridge - st.halfW * 0.3]],
      path: [[0, st.wallH + st.ridgeH - 0.012, -st.depth * 0.46], [0, st.wallH + st.ridgeH - 0.006, 0], [0, st.wallH + st.ridgeH - 0.016, st.depth * 0.46]],
      up: [0, 1, 0], caps: 'none',
      scales: (t) => 0.72 + 0.34 * Math.sin(Math.PI * Math.min(1, Math.max(0, t))),
    }), { matrix: at, color: vc(hex(pal.snow[0]), { groundAO: 0, underside: 0.2 }) });
  }
  return mesh;
}
