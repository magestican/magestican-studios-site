






























import { MeshData, IDENTITY, compose, translate, rotateX, rotateY, rotateZ } from '../../../mesh/meshData.mjs';
import { emit, sweep, lathe } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, mixC, scaleC, paintVertex } from '../shade.mjs';
import { rod } from '../rod.mjs';










export function troughProfile(half, height, thick, flare = [0.1, 0.16], solid = false) {
  const outL = -half * (1 + flare[0]), outR = half * (1 + flare[1]);
  if (solid) {
    return [
      [0, -half], [0, half], [height, outR], [height - 0.012, half * 0.55],
      [height - 0.016, -half * 0.5], [height, outL],
    ];
  }
  return [
    [0, -half], [0, half],
    [height * 0.5, half * (1 + flare[1] * 0.5)], [height, outR],
    [height - 0.014, outR - 0.016], [thick, half * 0.86],
    [thick, -half * 0.82], [height - 0.014, outL + 0.014],
    [height, outL], [height * 0.5, -half * (1 + flare[0] * 0.5)],
  ];
}


export function wheelProfile(r, width, hub) {
  const w = width * 0.5;
  return [
    [0, -w * 0.8], [hub, -w], [r * 0.72, -w * 0.62], [r * 0.96, -w * 0.5],
    [r, 0], [r * 0.95, w * 0.52], [r * 0.7, w * 0.66], [hub * 0.92, w], [0, w * 0.78],
  ];
}








export function spokePaint(base, spokes, phase, centre = [0, 0]) {
  return (p, n) => {
    const a = Math.atan2(p[1] - centre[1], p[0] - centre[0]) * spokes + phase;
    const along = Math.abs(Math.cos(a)) ** 3;
    return paintVertex(scaleC(base, 0.66 + 0.34 * along), p, n, { groundAO: 0.28, groundFade: 0.45, underside: 0.4, mottle: 0.05, seed: 59 });
  };
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { length: 0.88, half: 0.19, height: 0.17, wheel: 0.17, width: 0.055, shaft: 0.42, tip: 0.1, spokes: 5, body: '#cfa877', rim: '#8d6b46', tyre: '#6f6a74' },
  { length: 0.74, half: 0.165, height: 0.24, wheel: 0.21, width: 0.045, shaft: 0.36, tip: 0.14, spokes: 6, body: '#8fa9bd', rim: '#6d7f8c', tyre: '#5e5a62' },
  { length: 1.12, half: 0.215, height: 0.115, wheel: 0.145, width: 0.06, shaft: 0.5, tip: 0.06, spokes: 4, body: '#b9a487', rim: '#7d6a52', tyre: '#6a6560' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('cart');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), length: rng.rangeF(0.74, 1.12) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`cart-${seed}-${season}-lod${detail}`);
  
  
  const m = compose(IDENTITY, rotateY(rng.rangeF(-0.09, 0.09)));
  const body = hex(st.body);
  const flare = [rng.rangeF(0.06, 0.13), rng.rangeF(0.13, 0.22)];

  
  const axleX = st.length * rng.rangeF(0.1, 0.2);
  const tip = st.tip * rng.rangeF(0.85, 1.15);
  const bedY = st.wheel * 0.92;
  const bedAt = compose(m, compose(translate(0, bedY, 0), rotateZ(tip)));
  emit(mesh, 'plank', sweep({
    profile: troughProfile(st.half, st.height, 0.024, flare, detail === 2),
    
    
    path: detail === 2
      ? [[-st.length * 0.5, 0, 0], [st.length * 0.5, 0, 0]]
      : [[-st.length * 0.5, 0, 0], [0, rng.rangeF(-0.004, 0.004), 0], [st.length * 0.5, 0, 0]],
    up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.016,
    scales: (t) => 1 - 0.05 * t,
  }), {
    matrix: bedAt,
    color: (p, n) => paintVertex(vary(rng, body, 0.05), p, n, { groundAO: 0.22, groundFade: 0.5, underside: 0.5, mottle: 0.07, seed: 61 }),
  });

  
  
  const sides = detail === 0 ? 10 : detail === 1 ? 8 : 5;
  for (const side of [-1, 1]) {
    const r = st.wheel * (side < 0 ? 1 : rng.rangeF(0.94, 0.99));
    const toe = rng.rangeF(-0.05, 0.05);
    const hubX = axleX + rng.rangeF(-0.01, 0.01);
    const at = compose(m, compose(
      translate(hubX, r, side * (st.half * (1 + flare[side < 0 ? 0 : 1]) + st.width * 0.6)),
      compose(rotateY(toe), rotateX(Math.PI * 0.5)),
    ));
    const pts = detail === 2
      ? [[0, -st.width * 0.4], [r * 0.9, -st.width * 0.4], [r, 0], [r * 0.88, st.width * 0.4], [0, st.width * 0.4]]
      : wheelProfile(r, st.width, r * 0.2);
    emit(mesh, 'wood', lathe({ points: pts, sides, phase: rng.rangeF(0, 1.2) }), {
      matrix: at, color: spokePaint(mixC(body, hex(st.rim), 0.55), st.spokes, rng.rangeF(0, 3), [hubX, r]),
    });
    
    if (detail === 0) {
      emit(mesh, 'metal', lathe({ points: [[r * 1.005, -st.width * 0.3], [r * 1.02, 0], [r * 1.005, st.width * 0.28]], sides }), {
        matrix: at, color: vc(hex(st.tyre), { groundAO: 0.3, groundFade: 0.4, underside: 0.35 }),
      });
    }
  }

  
  
  if (detail < 2) {
    [-1, 1].forEach((side, k) => {
      const len = st.shaft * (k === 0 ? 1 : rng.rangeF(0.86, 0.96));
      const spread = st.half * (0.45 + 0.3 * k);
      emit(mesh, 'wood', rod({
        path: [
          [-st.length * 0.42, bedY + st.height * 0.2 - tip * st.length * 0.42, side * spread],
          [-st.length * 0.5 - len * 0.5, bedY * 0.45, side * spread * 1.1],
          [-st.length * 0.5 - len, 0.022, side * spread * 1.15],
        ],
        w: 0.036 - 0.003 * k, h: 0.03, detail: detail === 0 ? 0 : 1, up: [0, 1, 0],
        caps: ['none', 'round'], capLength: 0.014, scales: (t) => 1 - 0.18 * t,
      }), { matrix: m, color: (p, n) => paintVertex(mixC(body, hex(st.rim), 0.35), p, n, { groundAO: 0.35, groundFade: 0.4, underside: 0.45, mottle: 0.06, seed: 67 + k }) });
    });
  }

  if (season === 'winter' && detail < 2) {
    
    emit(mesh, 'snow', sweep({
      profile: [[0, -st.half * 0.78], [0.016, -st.half * 0.4], [0.022, st.half * 0.45], [0.012, st.half * 0.8]],
      path: [[-st.length * 0.4, 0.03, 0], [0, 0.034, 0.004], [st.length * 0.42, 0.028, 0]],
      up: [0, 1, 0], caps: 'none',
      scales: (t) => 0.66 + 0.4 * Math.sin(Math.PI * Math.min(1, Math.max(0, t)) ** 0.8),
    }), { matrix: bedAt, color: vc(hex(pal.snow[0]), { groundAO: 0, underside: 0.2 }) });
  }
  return mesh;
}
