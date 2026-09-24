






















import { MeshData, IDENTITY, compose, translate, rotateY, rotateZ } from '../../../mesh/meshData.mjs';
import { emit, lathe, sweep, circleProfile } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { RIPPLE, jetRamp } from '../water.mjs';
import { hex, vc, vary, mixC, paintVertex } from '../shade.mjs';
import { rod } from '../rod.mjs';


export function flame(mesh, m, { height = 0.24, radius = 0.075, detail = 0, rng, hot, cool }) {
  const steps = detail === 0 ? 5 : 3;
  const tilt = [rng.rangeF(-0.05, 0.05), rng.rangeF(-0.05, 0.05)];
  const path = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    
    path.push([tilt[0] * t * t + 0.012 * Math.sin(t * 5.1), height * t, tilt[1] * t * t]);
  }
  const shape = sweep({
    profile: circleProfile(radius, detail === 0 ? 7 : 5),
    path, up: [0, 0, 1], caps: ['round', 'round'], capSegments: 1, capLength: radius * 0.5,
    scales: (t) => 0.55 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.05)) * (1 - t * 0.55),
  });
  
  
  
  const ramp = jetRamp(shape.p.map((q) => q[1]));
  
  mesh.swayPiece({ perMetre: 0.2 }, (piece) => emit(piece, 'fire', shape, {
    matrix: m,
    color: (p) => mixC(hot, cool, Math.min(1, Math.max(0, p[1] / Math.max(0.01, height)))),
    ripple: (p, n, uv, tag, i) => -RIPPLE.flame * ramp[i],
  }));
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { height: 1.24, caneW: 0.055, bowl: 0.1, flare: 1.0, cane: '#c4a468', bind: '#b8925c', metal: false },
  { height: 0.95, caneW: 0.04, bowl: 0.13, flare: 1.25, cane: '#6f6a74', bind: '#8a8391', metal: true },
  { height: 1.5, caneW: 0.062, bowl: 0.115, flare: 1.4, cane: '#a37c4c', bind: '#d6c08e', metal: false },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('torch');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), height: rng.rangeF(0.95, 1.5) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`torch-${seed}-${season}-lod${detail}`);
  const m = compose(IDENTITY, rotateY(rng.rangeF(0, Math.PI * 2)));
  const H = st.height;
  const bow = rng.rangeF(0.03, 0.08) * (rng.chance(0.5) ? 1 : -1);
  const drift = rng.rangeF(-0.04, 0.04);
  const caneColor = hex(st.cane);

  
  emit(mesh, st.metal ? 'metal' : 'wood', rod({
    path: [[0, -0.03, 0], [bow * 0.7, H * 0.42, drift * 0.5], [bow, H * 0.78, drift], [bow * 0.85, H, drift * 1.1]],
    w: st.caneW, detail: detail === 0 ? 0 : detail === 1 ? 1 : 2, up: [0, 0, 1],
    caps: ['none', 'none'], scales: (t) => 1 - 0.22 * t,
  }), { matrix: m, color: (p, n) => paintVertex(caneColor, p, n, { groundAO: 0.42, groundFade: 0.45, mottle: 0.07, seed: 2 }) });

  const bx = bow * 0.85, bz = drift * 1.1;
  const R = st.bowl;
  
  const sides = detail === 0 ? 9 : detail === 1 ? 7 : 5;
  const bowlPts = detail === 2
    ? [[st.caneW * 0.7, 0], [R, 0.07], [R * 0.7, 0.08], [0, 0.05]]
    : [[st.caneW * 0.6, -0.01], [R * 0.48, 0.012], [R * 0.66, 0.035], [R * 0.95 * st.flare, 0.075], [R * st.flare, 0.092],
      [R * 0.84 * st.flare, 0.088], [R * 0.6, 0.05], [0, 0.035]];
  emit(mesh, st.metal ? 'metal' : 'copper', lathe({ points: bowlPts, sides, phase: rng.rangeF(0, 1) }), {
    matrix: compose(m, translate(bx, H - 0.02, bz)),
    color: vc(vary(rng, hex(st.metal ? st.cane : '#b0763f'), 0.06), { groundAO: 0.05, underside: 0.45 }),
  });

  
  if (detail === 0) {
    const y = H * rng.rangeF(0.5, 0.72);
    emit(mesh, 'cloth', rod({
      path: [[bow * 0.75 - st.caneW, y, drift * 0.6], [bow * 0.75 + st.caneW, y + 0.012, drift * 0.6]],
      w: 0.05, h: 0.026, detail: 1, up: [0, 1, 0], caps: 'none',
    }), { matrix: m, color: vc(hex(st.bind), { groundAO: 0.1, underside: 0.35 }) });
  }

  flame(mesh, compose(m, translate(bx, H + 0.05, bz)), {
    height: detail === 0 ? 0.26 : 0.22, radius: R * 0.72, detail, rng,
    hot: hex('#ffd98a'), cool: hex('#f0763a'),
  });

  if (season === 'winter' && detail < 2) {
    
    const lee = rng.rangeF(0, Math.PI * 2);
    emit(mesh, 'snow', lathe({
      points: [[R * st.flare * 1.02, 0.088], [R * st.flare * 1.06, 0.112], [R * 0.86 * st.flare, 0.108]],
      sides, phase: rng.rangeF(0, 1),
      radiusFn: (th, j, r) => r * (1 - 0.3 * Math.max(0, Math.cos(th - lee))),
    }), { matrix: compose(m, translate(bx, H - 0.02, bz)), color: vc(hex(pal.snow[0]), { groundAO: 0, underside: 0.2 }) });
  }
  return mesh;
}
