












import { MeshData, IDENTITY, compose, rotateY, rotateZ } from '../../../mesh/meshData.mjs';
import { lathe, emit, sweep, circleProfile } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, mixC, paintVertex } from '../shade.mjs';
import { RIPPLE, surfaceRamp } from '../water.mjs';
import { bloom } from '../blooms.mjs';
import { rod } from '../rod.mjs';






export function barrel(mesh, m, {
  height = 0.8, radius = 0.26, belly = 1.18, open = 'lid', detail = 0, rng,
  woodColor, hoopColor, fillColor = null, season = 'summer', snowColor = null,
}) {
  const sides = detail === 0 ? 10 : detail === 1 ? 8 : 6;
  const H = height, R = radius;
  
  
  const pts = detail === 2
    ? [[0, 0], [R * 0.94, 0], [R * belly, H * 0.5], [R * 0.94, H], [0, H]]
    : [[0, 0], [R * 0.82, 0], [R * 0.95, H * 0.07], [R * (belly * 0.99), H * 0.46], [R * (belly * 0.96), H * 0.58],
      [R * 0.97, H * 0.93], [R * 0.9, H], [R * 0.86, H - 0.012], [0, H - 0.02]];
  const wob = rng.rangeF(0, 6);
  const staves = detail === 2 ? null : (th, j, r) => r * (1 + 0.018 * Math.sin(th * sides + wob));
  const body = lathe({ points: pts, sides, phase: rng.rangeF(0, 1), uvScale: 2.2, radiusFn: staves });
  
  
  const inside = fillColor
    ? body.p.map((p) => p[1] > H - 0.05 && Math.hypot(p[0], p[2]) < R * 0.9)
    : null;
  
  
  const wet = open === 'water' && inside && !snowColor;
  const ramp = surfaceRamp(body.p.map((p) => Math.hypot(p[0], p[2])), R * 0.9);
  emit(mesh, 'wood', body, {
    matrix: m,
    color: (p, n, uv, tag, i) => {
      const c = paintVertex(woodColor, p, n, { groundAO: 0.32, groundFade: 0.22, mottle: 0.05, seed: 3 });
      return inside && inside[i] ? mixC(c, fillColor, 0.85) : c;
    },
    ripple: wet ? (p, n, uv, tag, i) => (inside[i] ? RIPPLE.basin * ramp[i] : 0) : 0,
  });
  
  
  
  
  
  if (wet) {
    const skinR = R * 0.86;
    const skin = lathe({ points: [[skinR, H - 0.055], [skinR * 0.55, H - 0.058], [0, H - 0.06]], sides, phase: rng.child('water').rangeF(0, 1) });
    const skinRamp = surfaceRamp(skin.p.map((p) => Math.hypot(p[0], p[2])), skinR);
    emit(mesh, 'water', skin, {
      matrix: m,
      color: vc(fillColor, { groundAO: 0, underside: 0.15 }),
      ripple: (p, n, uv, tag, i) => RIPPLE.basin * skinRamp[i],
    });
  }

  
  
  const hoops = detail === 2 ? [0.5] : [0.08, 0.5, 0.92];
  for (const f of hoops) {
    const y = H * f + rng.rangeF(-0.012, 0.012);
    const swell = 1 + (belly - 1) * (1 - Math.abs(f - 0.5) * 2) ** 0.8;
    const w = (f === 0.5 ? 0.036 : 0.028) + rng.rangeF(-0.004, 0.006);
    const ring = lathe({
      points: [[R * swell * 1.012, y - w], [R * swell * 1.05, y - w * 0.5], [R * swell * 1.05, y + w * 0.5], [R * swell * 1.012, y + w]],
      sides, phase: rng.rangeF(0, 1),
    });
    emit(mesh, 'metal', ring, { matrix: m, color: vc(vary(rng, hoopColor, 0.05), { groundAO: 0.3, underside: 0.45 }) });
  }

  if (open === 'lid') {
    
    const y = H - 0.018;
    const n = detail === 0 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
      const z = t * R * 0.56;
      const half = Math.sqrt(Math.max(0.02, (R * 0.88) ** 2 - z * z));
      emit(mesh, 'plank', rod({
        path: [[-half, y + rng.rangeF(-0.004, 0.004), z], [half, y + rng.rangeF(-0.004, 0.004), z + rng.rangeF(-0.008, 0.008)]],
        w: 0.03, h: R * 0.58, detail: detail === 0 ? 0 : 1, corner: 0, up: [0, 1, 0], caps: 'none',
      }), { matrix: m, color: vc(vary(rng, woodColor, 0.07), { groundAO: 0.1, underside: 0.4 }) });
    }
  } else if (open === 'soil' && detail < 2) {
    
    const leaf = hex(seasonPalette(season).leaf[0]);
    const mound = lathe({ points: [[R * 0.88, H - 0.03], [R * 0.7, H + 0.07], [R * 0.34, H + 0.11], [0, H + 0.1]], sides, phase: rng.rangeF(0, 1), radiusFn: (th, j, r) => r * (1 + 0.14 * Math.sin(th * 2.7 + wob)) });
    emit(mesh, 'leaf', mound, { matrix: m, color: vc(vary(rng, leaf, 0.08), { groundAO: 0, underside: 0.3 }) });
    const spill = rng.rangeF(0, Math.PI * 2);
    for (let i = 0; i < (detail === 0 ? 5 : 3); i++) {
      const a = spill + i * 1.31 + rng.rangeF(-0.2, 0.2);
      const rr = R * rng.rangeF(0.3, 0.92);
      bloom(mesh, m, [Math.sin(a) * rr, H + rng.rangeF(0.06, 0.14), Math.cos(a) * rr], { r: 0.055, rng, season });
    }
  } else if (open === 'water' && detail < 2) {
    
    const a = rng.rangeF(0, Math.PI * 2);
    const y = H * 0.24;
    const tap = sweep({
      profile: circleProfile(0.022, detail === 0 ? 6 : 4),
      path: [[R * 0.95, y, 0], [R * 1.16, y, 0], [R * 1.2, y - 0.045, 0], [R * 1.2, y - 0.085, 0]],
      up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.016, scales: (t, i) => [1, 1, 0.82, 0.95][i],
    });
    emit(mesh, 'copper', tap, { matrix: compose(m, rotateY(a)), color: vc(hoopColor, { groundAO: 0.2, underside: 0.4 }) });
  }

  if (snowColor && detail < 2) {
    const y = open === 'soil' ? H + 0.09 : H - 0.005;
    const cap = lathe({ points: [[R * 0.86, y], [R * 0.6, y + 0.05], [R * 0.28, y + 0.07], [0, y + 0.072]], sides, phase: rng.rangeF(0, 1) });
    emit(mesh, 'snow', cap, { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
  }
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  { height: 0.78, radius: 0.26, belly: 1.2, open: 'lid', wood: '#b07f4e', hoop: '#6e6a74', lean: 0.02 },
  { height: 0.62, radius: 0.28, belly: 1.14, open: 'soil', wood: '#c08a55', hoop: '#7a746a', lean: 0.015, fill: '#4a3a2c' },
  { height: 0.92, radius: 0.27, belly: 1.16, open: 'water', wood: '#8d6440', hoop: '#a9764a', lean: 0.03, fill: '#7fb3c4' },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('barrel');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), height: rng.rangeF(0.6, 0.9) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`barrel-${seed}-${season}-lod${detail}`);
  
  const lean = compose(rotateY(rng.rangeF(0, Math.PI * 2)), compose(rotateZ(rng.rangeF(-st.lean, st.lean)), rotateY(rng.rangeF(0, Math.PI * 2))));
  barrel(mesh, compose(IDENTITY, lean), {
    height: st.height, radius: st.radius, belly: st.belly, open: st.open, detail, rng, season,
    woodColor: hex(st.wood), hoopColor: hex(st.hoop), fillColor: st.fill ? hex(st.fill) : null,
    snowColor: season === 'winter' ? hex(pal.snow[0]) : null,
  });
  return mesh;
}
