

























import { MeshData, IDENTITY, compose, translate, rotateY, rotateZ } from '../../../mesh/meshData.mjs';
import { emit, sweep, blob, lathe } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, paintVertex } from '../shade.mjs';
import { rod } from '../rod.mjs';








export function tunnelProfile(halfW, height, count = 10, skew = 0) {
  const pts = [[0, halfW]];
  const n = Math.max(3, count);
  for (let k = 1; k < n; k++) {
    const a = (k / n) * Math.PI;
    const w = halfW * (1 + skew * Math.cos(a));
    pts.push([height * Math.sin(a) ** 0.85, w * Math.cos(a)]);
  }
  pts.push([0, -halfW]);
  return pts;
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { post: 0.98, postW: 0.075, halfW: 0.115, boxH: 0.2, depth: 0.31, flag: true, body: '#f0e6d2', trim: '#8f7a5e', post_c: '#a7794f' },
  { post: 0.74, postW: 0.095, halfW: 0.13, boxH: 0.17, depth: 0.27, flag: false, body: '#9fbf9a', trim: '#5f7a5e', post_c: '#8d6b46' },
  { post: 1.16, postW: 0.062, halfW: 0.1, boxH: 0.24, depth: 0.25, flag: true, body: '#cc6a5c', trim: '#f2e2cc', post_c: '#6e6a74' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('mailbox');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), post: rng.rangeF(0.74, 1.16) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`mailbox-${seed}-${season}-lod${detail}`);
  const m = compose(IDENTITY, rotateY(rng.rangeF(0, Math.PI * 2)));
  const H = st.post;
  const lean = rng.rangeF(-0.05, 0.05);
  const drift = rng.rangeF(-0.03, 0.03);
  const postColor = hex(st.post_c);

  
  emit(mesh, 'wood', rod({
    path: [[0, -0.03, 0], [lean * 0.5, H * 0.6, drift * 0.5], [lean, H, drift]],
    w: st.postW, h: st.postW * 0.92, detail: detail === 0 ? 0 : detail === 1 ? 1 : 2, up: [0, 0, 1],
    caps: ['none', 'round'], capLength: 0.035, scales: (t) => 1 - 0.14 * t,
  }), { matrix: m, color: (p, n) => paintVertex(postColor, p, n, { groundAO: 0.42, groundFade: 0.5, mottle: 0.07, seed: 13 }) });

  
  
  const count = detail === 0 ? 11 : detail === 1 ? 8 : 5;
  const skew = detail === 2 ? 0 : rng.rangeF(0.06, 0.13) * (rng.chance(0.5) ? 1 : -1);
  const at = compose(m, compose(
    translate(lean + rng.rangeF(-0.02, 0.02), H + st.boxH * 0.06, drift + rng.rangeF(-0.02, 0.02)),
    rotateZ(rng.rangeF(-0.05, 0.05)),
  ));
  const body = sweep({
    profile: tunnelProfile(st.halfW, st.boxH, count, skew),
    path: [[0, 0, -st.depth * 0.5], [0, 0.004, 0], [0, 0, st.depth * 0.5]],
    up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: st.depth * 0.06,
    
    scales: (t) => 1 - 0.05 * t,
  });
  emit(mesh, 'metal', body, {
    matrix: at,
    color: (p, n) => paintVertex(vary(rng, hex(st.body), 0.04), p, n, { groundAO: 0.1, groundFade: 0.2, underside: 0.45, mottle: 0.05, seed: 19 }),
  });

  if (detail < 2) {
    
    const knob = blob({ radii: [0.022, 0.02, 0.016], subdiv: 1, seed: rng.rangeI(1, 1e6), lump: 0.15 });
    emit(mesh, 'metal', knob, {
      matrix: compose(at, translate(rng.rangeF(-0.03, 0.03), st.boxH * rng.rangeF(0.32, 0.46), st.depth * 0.52)),
      color: vc(hex(st.trim), { groundAO: 0, underside: 0.4 }),
    });
    
    if (st.flag) {
      const side = rng.chance(0.5) ? 1 : -1;
      const up = st.flag && rng.chance(0.6);
      const x0 = side * st.halfW * 0.96;
      emit(mesh, 'metal', rod({
        path: up
          ? [[x0, st.boxH * 0.3, -st.depth * 0.1], [x0 + side * 0.01, st.boxH * 0.92, -st.depth * 0.1], [x0 + side * 0.05, st.boxH * 1.12, -st.depth * 0.08]]
          : [[x0, st.boxH * 0.34, -st.depth * 0.1], [x0 + side * 0.03, st.boxH * 0.12, -st.depth * 0.12], [x0 + side * 0.06, st.boxH * 0.02, -st.depth * 0.1]],
        w: 0.026, h: 0.014, detail: 1, up: [0, 0, 1], caps: 'none',
      }), { matrix: at, color: vc(hex('#c8503f'), { groundAO: 0, underside: 0.4 }) });
    }
  }

  if (season === 'winter' && detail < 2) {
    emit(mesh, 'snow', sweep({
      profile: tunnelProfile(st.halfW * 0.6, 0.03, detail === 0 ? 7 : 5, 0),
      path: [[0, st.boxH - 0.01, -st.depth * 0.44], [0, st.boxH + 0.005, 0], [0, st.boxH - 0.012, st.depth * 0.44]],
      up: [0, 1, 0], caps: 'none',
      scales: (t) => 0.7 + 0.35 * Math.sin(Math.PI * Math.min(1, Math.max(0, t))),
    }), { matrix: at, color: vc(hex(pal.snow[0]), { groundAO: 0, underside: 0.2 }) });
  }
  return mesh;
}
