












import { sweep, circleProfile, superellipseProfile, deform, emit, roundedRectProfile } from '../../mesh/bevel.mjs';
import { compose, translate, scale } from '../../mesh/meshData.mjs';
import { valueNoise3 } from '../../noise.mjs';
import { vc } from './shade.mjs';



export function slopeSlab({ length, run, rise, thickness = 0.24, rows = 6, lift = 0.05, sStart = 0, cols = 6, capSegments = 1, seed = 0, wobble = 0.014 }) {
  const len = Math.hypot(run, rise);
  const dz = run / len, dy = -rise / len, nz = rise / len, ny = run / len;
  const S = len, th = thickness;
  const P = [[0, sStart, 0]];
  if (rows > 0) {
    const rowLen = (S - sStart - 0.05) / rows;
    for (let r = 0; r < rows; r++) {
      const a = sStart + r * rowLen;
      P.push([th, a + 0.02, r / 4 + 0.005]);
      P.push([th + lift, a + rowLen - 0.035, (r + 1) / 4 - 0.012]);
    }
  } else {
    P.push([th, sStart + 0.02, 0.005], [th + lift * 0.5, S - 0.1, 1]);
  }
  const offC = (th + lift) / 2, R = offC + 0.012, sE = S - offC * 0.6;
  const vEnd = rows > 0 ? rows / 4 : 1;
  [0.9, 0, -0.9].forEach((a, k) => P.push([offC + R * Math.sin(a), sE + R * Math.cos(a) * 0.8, vEnd + 0.03 * (k + 1)]));
  P.push([0.01, S - 0.4, vEnd + 0.25]);

  const path = [];
  for (let i = 0; i <= cols; i++) path.push([-length / 2 + (length * i) / cols, 0, 0]);
  const sMid = (sStart + S) / 2;
  const s = sweep({
    profile: P, path, up: [0, 1, 0], caps: 'round', capSegments, capLength: th * 0.75,
    capProfile: (q, f) => [th / 2 + (q[0] - th / 2) * f, sMid + (q[1] - sMid) * (1 - (1 - f) * 0.04)],
    uvScale: 1,
  });
  
  for (const uv of s.uv) uv[0] /= 1.6;
  return deform(s, ([x, off, sv]) => {
    const w = (valueNoise3(x * 1.4, sv * 2.3, 0, seed) - 0.5) * 2 * wobble * Math.min(1, Math.max(0, off / th));
    const o = off + w;
    return [x, dy * sv + ny * o, dz * sv + nz * o];
  });
}

function droop(shape, { length, sag, cornerDrop, run }) {
  return deform(shape, (p) => {
    const t = (2 * p[0]) / length;
    p[1] -= sag * Math.max(0, 1 - t * t) + cornerDrop * t * t * Math.max(0, Math.min(1.2, Math.abs(p[2]) / run));
  });
}


export function gableRoof(mesh, m, { length, halfSpan, rise, thickness = 0.24, overhang = 0.42, rows = 6, detail = 0, rng, color, ridgeColor, sag = 0.08, snowColor = null, cols: colsOverride = null }) {
  const run = halfSpan + overhang, riseTotal = (rise * run) / halfSpan;
  const len = Math.hypot(halfSpan, rise);
  const cols = colsOverride ?? (detail === 0 ? 5 : detail === 1 ? 3 : 2);
  const r = snowColor ? 0 : detail === 0 ? rows : detail === 1 ? Math.ceil(rows / 2) : 0;
  const capSegments = detail === 2 ? 0 : 1;
  const bend = { length, sag, cornerDrop: sag * 0.9, run };
  const ridgeTop = rise + (thickness * len) / halfSpan;
  for (const side of [1, -1]) {
    const seed = rng.rangeI(1, 1e6);
    const slab = slopeSlab({ length, run, rise: riseTotal, thickness, rows: r, sStart: -thickness * 0.9, cols, capSegments, seed });
    deform(slab, (p) => { p[1] += rise; });
    droop(slab, bend);
    const mm = compose(m, side < 0 ? scale(1, 1, -1) : [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]);
    emit(mesh, 'roof', slab, { matrix: mm, color: vc(color, { groundAO: 0, underside: 0.45 }) });
    if (snowColor) {
      const snow = snowSlab({ length: length + 0.06, run, rise: riseTotal, base: thickness + 0.02, cols: Math.max(2, cols - 1), capSegments, seed: seed + 7, detail });
      deform(snow, (p) => { p[1] += rise; });
      droop(snow, bend);
      emit(mesh, 'snow', snow, { matrix: mm, color: vc(snowColor, { groundAO: 0, underside: 0.25, mottle: 0.04 }) });
    }
  }
  if (!snowColor && detail < 2) {
    const path = [];
    for (let i = 0; i <= cols; i++) path.push([-length / 2 - 0.02 + ((length + 0.04) * i) / cols, ridgeTop + 0.015, 0]);
    const cap = sweep({ profile: superellipseProfile(0.1, 0.17, 2.6, detail === 0 ? 8 : 6, 0), path, up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.09 });
    droop(cap, bend);
    emit(mesh, 'wood', cap, { matrix: m, color: vc(ridgeColor, { groundAO: 0 }) });
  }
  return { ridgeTop: ridgeTop + 0.1, eaveY: -overhang * (rise / halfSpan) };
}

function snowSlab({ length, run, rise, base, cols, capSegments, seed, detail }) {
  const len = Math.hypot(run, rise);
  const dz = run / len, dy = -rise / len, nz = rise / len, ny = run / len;
  const S = len;
  const P = detail >= 1
    ? [[base - 0.02, -0.25], [base + 0.16, -0.25], [base + 0.14, S + 0.04], [base - 0.1, S + 0.06], [base - 0.04, S * 0.5]]
    : [[base - 0.02, -0.25], [base + 0.15, -0.25], [base + 0.21, 0.3 * S], [base + 0.18, 0.72 * S], [base + 0.13, S + 0.02],
      [base + 0.01, S + 0.1], [base - 0.13, S + 0.07], [base - 0.06, S - 0.05], [base - 0.01, S * 0.5]];
  const path = [];
  for (let i = 0; i <= cols; i++) path.push([-length / 2 + (length * i) / cols, 0, 0]);
  const s = sweep({
    profile: P, path, up: [0, 1, 0], caps: 'round', capSegments, capLength: 0.12,
    capProfile: (q, f) => [base + 0.04 + (q[0] - base - 0.04) * f, S / 2 + (q[1] - S / 2) * (1 - (1 - f) * 0.05)],
    uvScale: 0.5,
  });
  return deform(s, ([x, off, sv]) => {
    const lump = off > base + 0.05 ? (valueNoise3(x * 1.1, sv * 1.3, 5, seed) - 0.5) * 0.09 : 0;
    const o = off + lump;
    return [x, dy * sv + ny * o, dz * sv + nz * o];
  });
}


export function awning(mesh, m, { width = 1.6, depth = 0.8, drop = 0.3, detail = 0, rng, color, braceColor, snowColor = null }) {
  const seed = rng.rangeI(1, 1e6);
  const th = 0.14;
  const slab = slopeSlab({ length: width, run: depth, rise: drop, thickness: th, rows: snowColor || detail === 2 ? 0 : detail === 0 ? 3 : 2, lift: 0.04, sStart: -0.05, cols: detail === 0 ? 3 : 2, capSegments: detail === 2 ? 0 : 1, seed, wobble: 0.01 });
  droop(slab, { length: width, sag: 0.03, cornerDrop: 0.03, run: depth });
  emit(mesh, 'roof', slab, { matrix: m, color: vc(color, { groundAO: 0, underside: 0.45 }) });
  if (snowColor) {
    const snow = snowSlab({ length: width + 0.04, run: depth, rise: drop, base: th + 0.01, cols: 2, capSegments: detail === 2 ? 0 : 1, seed: seed + 3, detail });
    emit(mesh, 'snow', snow, { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.25 }) });
  }
  if (detail < 2) {
    for (const side of [-1, 1]) {
      const x = side * (width / 2 - 0.12);
      const path = [];
      const n = detail === 0 ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const a = (i / (n - 1)) * (Math.PI / 2);
        path.push([x, -0.62 + 0.55 * Math.sin(a) - drop * 0.4 * Math.sin(a), 0.03 + depth * 0.72 * (1 - Math.cos(a))]);
      }
      emit(mesh, 'wood', sweep({ profile: roundedRectProfile(0.06, 0.06, 0.02, 0), path, up: [1, 0, 0], caps: 'round', capSegments: 1, capLength: 0.03 }), { matrix: m, color: vc(braceColor) });
    }
  }
}

export { circleProfile };
