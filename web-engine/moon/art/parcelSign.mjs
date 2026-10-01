























import { MeshData, compose, translate, rotateX, rotateY, rotateZ, scale } from '../mesh/meshData.mjs';
import { Shape, sweep, lathe, emit, circleProfile, superellipseProfile } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { seasonPalette } from '../palette/seasons.mjs';
import { hex, paintVertex, scaleC, vary, vc } from './kit/shade.mjs';

export const TIER = 'dressing';
export const LODS = [0, 1, 2];
export const VARIANTS = Object.freeze(['nailed', 'hanging', 'arched']);

const WOOD = '#8f6446', BOARD = '#f1e2c0', PAW = '#4f9d91', HAT = '#6b5048', BAND = '#f1d49a', GOLD = '#f2c14e';
const FLAGS = ['#f28b7d', '#f6d67a', '#8fd3b6', '#b9a3e3', '#f7a9c4'];

const THICK = 0.045;
const POST_R = 0.05;


const HAT_SCALE = 1.5, HAT_X = -0.2, PAW_SCALE = 1.35, COIN_R = 0.085;

const TRIM = '#d9705f', TRIM_M = 0.055;


function design(seed) {
  const rng = new SeededRng(seed).child('parcelSign');
  const variant = seed >= 1 && seed <= 3 ? seed - 1 : rng.rangeI(0, 2);
  const k = rng.rangeF(0.97, 1.03);
  const legX = 0.36 + rng.rangeF(-0.02, 0.02);
  const width = [1.0, 1.04, 0.98][variant] * k;
  const height = [0.5, 0.5, 0.54][variant] * rng.rangeF(0.97, 1.03);
  const cy = [1.0, 1.06, 0.96][variant] + rng.rangeF(-0.02, 0.02);
  const tilt = variant === 1 ? rng.rangeF(0.045, 0.075) * (rng.chance(0.5) ? 1 : -1) : rng.rangeF(-0.025, 0.025);
  const z = POST_R + THICK / 2 + 0.004;
  return { variant, legX, width, height, cy, tilt, z, rng };
}


function onBoard(d, x, y, dz = 0) {
  const c = Math.cos(d.tilt), s = Math.sin(d.tilt);
  return { x: x * c - y * s, y: d.cy + x * s + y * c, z: d.z + THICK / 2 + dz };
}

export function anchors({ seed = 1 } = {}) {
  const d = design(seed);
  const board = { ...onBoard(d, 0, 0), width: d.width, height: d.height, rotZ: d.tilt };
  
  const label = { ...onBoard(d, 0, -d.height * 0.04), width: d.width * 0.46, height: d.height * 0.46, rotZ: d.tilt };
  const coinAt = d.variant === 1 ? [d.width / 2 - 0.13, d.height / 2 - 0.12] : [d.width / 2 - 0.13, -d.height / 2 + 0.12];
  const marks = [{ kind: 'coin', ...onBoard(d, coinAt[0], coinAt[1]), r: COIN_R }];
  if (d.variant === 0) marks.push({ kind: 'hat', ...onBoard(d, HAT_X * d.width, d.height / 2 - 0.012 + 0.12 * HAT_SCALE, -0.01), r: 0.2 * HAT_SCALE });
  else if (d.variant === 1) marks.push({ kind: 'paw', ...onBoard(d, -d.width / 2 + 0.17, -d.height / 2 + 0.13), r: 0.1 * PAW_SCALE });
  else marks.push({ kind: 'paw', ...onBoard(d, 0, d.height / 2 - 0.085), r: 0.1 * PAW_SCALE });
  return { footprint: { hx: 0.42, hz: 0.1 }, board, label, marks, variant: VARIANTS[d.variant] };
}



function insetOutline(outline, by) {
  const M = outline.length;
  return outline.map((p, k) => {
    const a = outline[(k - 1 + M) % M], b = outline[(k + 1) % M];
    const e1 = norm2([p[0] - a[0], p[1] - a[1]]), e2 = norm2([b[0] - p[0], b[1] - p[1]]);
    
    const n = norm2([-(e1[1] + e2[1]), e1[0] + e2[0]]);
    const miter = Math.max(0.5, n[0] * -e1[1] + n[1] * e1[0]);
    return [p[0] + (n[0] * by) / miter, p[1] + (n[1] * by) / miter];
  });
}

function norm2(v) {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
}








export function slab(outline, thick, bevel, centre, { borderM = 0 } = {}) {
  const s = new Shape();
  const M = outline.length;
  const zf = thick / 2, zb = -thick / 2;
  const uv = (x, y) => [x * 1.4, y * 1.4];
  const trim = borderM > 0 ? 1 : 0;
  const face = bevel > 0 ? insetOutline(outline, bevel) : outline;
  const front = face.map(([x, y]) => s.add([x, y, zf], uv(x, y), 1 + trim));
  let fan = front;
  const ring = (k) => [k, (k + 1) % M];
  if (borderM > 0) {
    const inner = insetOutline(outline, borderM);
    const band = inner.map(([x, y]) => s.add([x, y, zf], uv(x, y), 2));
    fan = inner.map(([x, y]) => s.add([x, y, zf], uv(x, y), 1));
    for (let k = 0; k < M; k++) { const [a, b] = ring(k); s.quad(band[a], front[a], front[b], band[b]); }
  }
  const cf = s.add([centre[0], centre[1], zf], uv(...centre));
  const cb = s.add([centre[0], centre[1], zb], uv(...centre));
  for (let k = 0; k < M; k++) { const [a, b] = ring(k); s.tri(cf, fan[a], fan[b]); }
  if (bevel > 0) {
    const rimF = outline.map(([x, y]) => s.add([x, y, zf - bevel * 0.55], uv(x, y), 0.82 + trim));
    const rimB = outline.map(([x, y]) => s.add([x, y, zb + bevel * 0.55], uv(x, y), 0.82));
    const back = face.map(([x, y]) => s.add([x, y, zb], uv(x, y)));
    for (let k = 0; k < M; k++) {
      const [a, b] = ring(k);
      s.quad(front[a], rimF[a], rimF[b], front[b]);
      s.quad(rimF[a], rimB[a], rimB[b], rimF[b]);
      s.quad(rimB[a], back[a], back[b], rimB[b]);
      s.tri(cb, back[b], back[a]);
    }
  } else {
    const back = outline.map(([x, y]) => s.add([x, y, zb], uv(x, y), 0.82));
    for (let k = 0; k < M; k++) {
      const [a, b] = ring(k);
      s.quad(front[a], back[a], back[b], front[b]);
      s.tri(cb, back[b], back[a]);
    }
  }
  return s;
}



function boardOutline(d, rng, lod) {
  const w = d.width / 2, h = d.height / 2;
  const cornerSeg = [3, 2, 1][lod];
  const jit = lod === 2 ? 0 : 0.006;
  const pts = [];
  const radii = [0.05, 0.07, 0.04, 0.06].map((r) => r * rng.rangeF(0.7, 1.3));
  const corner = (cx, cy, r, a0) => {
    for (let i = 0; i <= cornerSeg; i++) {
      const a = a0 + (i / cornerSeg) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r + rng.rangeF(-jit, jit), cy + Math.sin(a) * r + rng.rangeF(-jit, jit)]);
    }
  };
  corner(-w + radii[0], -h + radii[0], radii[0], Math.PI);
  if (lod === 0) pts.push([rng.rangeF(-0.05, 0.05), -h + rng.rangeF(-0.008, 0.004)]);
  corner(w - radii[1], -h + radii[1], radii[1], -Math.PI / 2);
  const topStart = pts.length;
  if (d.variant === 2) {
    
    const rise = 0.1, n = [8, 5, 3][lod];
    const shoulder = h - 0.02;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = w - t * 2 * w;
      const y = shoulder + Math.sin(Math.PI * t) * rise + (i === 0 || i === n ? 0 : rng.rangeF(-jit, jit));
      pts.push([x, y]);
    }
  } else {
    corner(w - radii[2], h - radii[2], radii[2], 0);
    if (lod === 0) pts.push([rng.rangeF(-0.08, 0.08), h + rng.rangeF(-0.004, 0.008)]);
    corner(-w + radii[3], h - radii[3], radii[3], Math.PI / 2);
  }
  const top = pts.slice(topStart);
  return { pts, top };
}


function hatOutline(lod) {
  const n = [7, 4, 3][lod];
  const lean = 0.012;
  const pts = [[-0.2, 0.012], [-0.07, 0.0], [0.08, 0.0], [0.205, 0.018], [0.215, 0.045], [0.13, 0.05]];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI;
    pts.push([0.125 * Math.cos(a) + lean * Math.sin(a), 0.05 + 0.15 * Math.sin(a) + (a < Math.PI / 2 ? 0.004 : 0)]);
  }
  pts.push([-0.132, 0.05], [-0.212, 0.04]);
  return pts;
}

function dome(r, h, sides, lod) {
  const points = lod === 2 ? [[r, 0], [0, h]] : [[r, 0], [r * 0.86, h * 0.62], [0, h]];
  return lathe({ points, sides });
}



export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const d = design(seed);
  const L = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('parcelSign-detail');
  const mesh = new MeshData(`parcelSign-${seed}-${season}-lod${L}`);
  const snow = season === 'winter' && L < 2 ? vc(hex(seasonPalette(season).snow[0]), { groundAO: 0, underside: 0.25 }) : null;
  const wood = vc(vary(rng, hex(WOOD), 0.06), { groundAO: 0.35, groundFade: 0.35 });
  const boardBase = vary(rng, hex(BOARD), 0.03), trimBase = hex(TRIM);
  const boardColor = (p, n, uv, tag) => (tag > 1.5
    ? paintVertex(scaleC(trimBase, tag - 1), p, n, { groundAO: 0.1 })
    : paintVertex(scaleC(boardBase, tag), p, n, { groundAO: 0.1 }));
  const sides = [6, 5, 3][L];
  const boardMat = compose(translate(0, d.cy, d.z), rotateZ(d.tilt));
  const a = anchors({ seed });

  
  const tops = [];
  const heights = [1.34, 1.62, 1.44];
  for (const side of [-1, 1]) {
    const H = heights[d.variant] + rng.rangeF(-0.03, 0.03);
    const lean = d.variant === 2 ? -side * 0.075 : rng.rangeF(-0.02, 0.02);
    const leanZ = rng.rangeF(-0.025, 0.02);
    
    
    const ts = L === 0 ? [0, 0.22, 0.6, 1] : [0, 0.22, 1];
    const n = ts.length;
    const x0 = side * d.legX;
    const path = ts.map((t) => [x0 + lean * t, H * t, leanZ * t * t]);
    const profile = superellipseProfile(POST_R, POST_R * 0.9, 2.6, sides);
    const topCap = d.variant === 0 || L === 2 ? 'flat' : 'round';
    emit(mesh, 'wood', sweep({ profile, path, up: [0, 0, 1], scales: (t) => 1.1 - 0.16 * t, caps: ['none', topCap], capRings: [], capSegments: 1, capLength: 0.04 }), { color: wood });
    const top = path[n - 1];
    tops.push(top);
    if (d.variant === 0 && L === 0) {
      const knob = lathe({ points: [[0.052, 0], [0.066, 0.03], [0.05, 0.062], [0, 0.075]], sides: 6, phase: rng.rangeF(0, 1) });
      emit(mesh, 'wood', knob, { matrix: translate(top[0], top[1] - 0.004, top[2]), color: wood });
    }
    if (snow) {
      const cap = d.variant === 0 ? 0.075 : 0.035;
      emit(mesh, 'snow', dome(0.058, 0.045, L === 0 ? 6 : 4, L === 0 ? 0 : 2), { matrix: translate(top[0], top[1] + cap - 0.008, top[2]), color: snow });
    }
  }

  
  const { pts, top } = boardOutline(d, rng, L);
  emit(mesh, 'plank', slab(pts, THICK, [0.012, 0, 0][L], [0, 0], { borderM: L < 2 ? TRIM_M : 0 }), { matrix: boardMat, color: boardColor });

  if (d.variant === 1) {
    
    const y = Math.min(tops[0][1], tops[1][1]) - 0.07;
    const barZ = POST_R + 0.035;
    const bar = [[-0.56, y + rng.rangeF(-0.01, 0.01), barZ], [0, y - 0.012, barZ], [0.56, y + rng.rangeF(-0.01, 0.01), barZ]];
    emit(mesh, 'wood', sweep({ profile: superellipseProfile(0.036, 0.03, 2.4, [6, 4, 3][L]), path: L === 0 ? bar : [bar[0], bar[2]], up: [0, 1, 0], caps: L === 2 ? 'flat' : 'round', capRings: [], capSegments: 1, capLength: 0.03 }), { color: wood });
    const cord = vc(hex('#e9dcc0'), { groundAO: 0 });
    for (const bx of [-0.3, 0.3]) {
      const end = onBoard(d, bx, d.height / 2 - 0.02, -THICK / 2);
      emit(mesh, 'cloth', sweep({ profile: circleProfile(0.01, 3), path: [[bx, y, barZ], [end.x, end.y, end.z]], up: [0, 0, 1], caps: 'none' }), { color: cord });
    }
    if (L < 2) {
      const first = rng.rangeI(0, FLAGS.length - 1);
      for (let i = 0; i < 3; i++) {
        const fx = -0.15 + i * 0.15 + rng.rangeF(-0.02, 0.02);
        const tri = [[-0.055, 0], [0, -0.13 * rng.rangeF(0.9, 1.1)], [0.055, 0]];
        const flag = slab(tri, 0.008, 0, [0, -0.04]);
        emit(mesh, 'cloth', flag, { matrix: compose(translate(fx, y - 0.025, barZ + 0.03), rotateZ(rng.rangeF(-0.12, 0.12))), color: vc(hex(FLAGS[(first + i) % FLAGS.length]), { groundAO: 0, underside: 0.1 }) });
      }
    }
    if (snow) {
      const barSnow = L === 0 ? [[-0.5, y + 0.04, barZ], [0, y + 0.03, barZ], [0.5, y + 0.04, barZ]] : [[-0.45, y + 0.035, barZ], [0.45, y + 0.035, barZ]];
      emit(mesh, 'snow', sweep({ profile: circleProfile(0.026, L === 0 ? 5 : 4, 0, 0.04), path: barSnow, up: [0, 0, 1], caps: L === 0 ? 'round' : 'flat', capSegments: 1, capLength: 0.03, scales: (t) => 0.7 + 0.4 * Math.sin(Math.PI * t) }), { color: snow });
    }
  }

  
  for (const m of a.marks) {
    if (m.kind === 'hat') {
      const hatOut = hatOutline(L);
      
      const hatMat = compose(boardMat, compose(translate(HAT_X * d.width, d.height / 2 - 0.012, -0.008), compose(rotateZ(rng.rangeF(-0.05, 0.05)), scale(HAT_SCALE))));
      emit(mesh, 'plank', slab(hatOut, THICK * 0.8, [0.008, 0, 0][L], [0, 0.03]), { matrix: hatMat, color: vc(hex(HAT), { groundAO: 0, useTag: true }) });
      if (L < 2) {
        const band = [[-0.128, 0.052], [0.126, 0.052], [0.124, 0.09], [-0.126, 0.09]];
        emit(mesh, 'cloth', slab(band, 0.008, 0, [0, 0.07]), { matrix: compose(hatMat, translate(0, 0, THICK * 0.4 + 0.004)), color: vc(hex(BAND), { groundAO: 0 }) });
      }
      if (snow) emit(mesh, 'snow', sweep({ profile: circleProfile(0.02, 5, 0, 0.03), path: [[-0.1, 0.17, 0], [0, 0.215, 0], [0.1, 0.17, 0]], up: [0, 0, 1], caps: 'round', capSegments: 1, capLength: 0.02 }), { matrix: hatMat, color: snow });
    } else if (m.kind === 'paw') {
      paw(mesh, compose(translate(m.x, m.y, m.z - 0.002), compose(rotateZ(d.tilt + rng.rangeF(-0.35, 0.35)), scale(PAW_SCALE))), L, rng);
    } else {
      coin(mesh, translate(m.x, m.y, m.z - 0.002), L);
    }
  }

  if (snow) {
    
    const edge = L === 0 ? top : [top[0], top[Math.floor(top.length / 2)], top[top.length - 1]];
    const path = edge.map(([x, y]) => [x, y + 0.012, 0]);
    const roll = sweep({ profile: circleProfile(0.026, L === 0 ? 5 : 4, 0, THICK * 0.62), path, up: [0, 0, 1], caps: L === 0 ? 'round' : 'flat', capSegments: 1, capLength: 0.03, scales: (t, i) => 0.75 + 0.45 * Math.sin(Math.PI * t) + (i % 2) * 0.08 });
    emit(mesh, 'snow', roll, { matrix: boardMat, color: snow });
  }
  return mesh;
}



function paw(mesh, m, L, rng) {
  const color = vc(hex(PAW), { groundAO: 0, underside: 0.1 });
  const up = rotateX(Math.PI / 2);
  const pad = lathe({
    points: L === 2 ? [[0.05, 0], [0, 0.012]] : [[0.05, 0], [0.043, 0.008], [0, 0.013]],
    sides: [9, 6, 4][L],
    radiusFn: L === 2 ? null : (th, j, r) => r * (1 + 0.16 * Math.cos(3 * th + Math.PI / 2)),
  });
  
  emit(mesh, 'plank', pad, { matrix: compose(m, compose(up, scale(1.15, 1, 0.9))), color });
  const toes = L === 2 ? [[0, 0.085, 0.022]] : [[-0.064, 0.05, 0.019], [-0.026, 0.088, 0.022], [0.024, 0.091, 0.023], [0.066, 0.056, 0.018]];
  for (const [x, y, r] of toes) {
    const rr = r * rng.rangeF(0.92, 1.08);
    emit(mesh, 'plank', dome(rr, 0.012, [6, 5, 4][L], L === 0 ? 0 : 2), { matrix: compose(m, compose(translate(x, y, 0), compose(up, scale(1, 1, 1.25)))), color });
  }
}


function coin(mesh, m, L) {
  const color = vc(hex(GOLD), { groundAO: 0, underside: 0.15 });
  const R = COIN_R, t = 0.014;
  const points = L === 2 ? [[R, 0], [0, t]] : L === 1 ? [[R, 0], [R, t], [0, t * 0.8]] : [[R, 0], [R, t], [R * 0.74, t * 0.72], [0, t * 1.15]];
  emit(mesh, 'gold', lathe({ points, sides: [11, 8, 6][L], phase: 0.2 }), { matrix: compose(m, rotateX(Math.PI / 2)), color });
}



export const STAKE = Object.freeze({ heightM: 0.52, radiusM: 0.028, sagM: 0.07, flagsPerRun: 2 });





export function boundaryRun(mesh, a, b, { seed = 1, season = 'summer', lod = 0, index = 0 } = {}) {
  const rng = new SeededRng(seed).child(`stake-${index}`);
  const L = Math.max(0, Math.min(2, lod | 0));
  const H = STAKE.heightM * rng.rangeF(0.92, 1.06);
  const wood = vc(vary(rng, hex(WOOD), 0.08), { ground: a[1], groundAO: 0.35, groundFade: 0.25 });
  const lean = [rng.rangeF(-0.03, 0.03), 0, rng.rangeF(-0.03, 0.03)];
  const top = [a[0] + lean[0], a[1] + H, a[2] + lean[2]];
  emit(mesh, 'wood', sweep({ profile: circleProfile(STAKE.radiusM, [5, 4, 3][L]), path: [a, top], up: [1, 0, 0], scales: (t) => 1.1 - 0.25 * t, caps: ['none', L === 2 ? 'flat' : 'round'], capRings: [], capSegments: 1, capLength: 0.025 }), { color: wood });
  if (!b) return mesh;
  const end = [b[0], b[1] + STAKE.heightM, b[2]];
  const n = [4, 2, 1][L];
  const cordPath = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [top[0] + (end[0] - top[0]) * t, top[1] + (end[1] - top[1]) * t - STAKE.sagM * 4 * t * (1 - t), top[2] + (end[2] - top[2]) * t];
  });
  emit(mesh, 'cloth', sweep({ profile: circleProfile(0.008, 3), path: cordPath, up: [0, 1, 0], caps: 'none' }), { color: vc(hex('#efe3c8'), { groundAO: 0 }) });
  if (L < 2) {
    const dx = end[0] - top[0], dz = end[2] - top[2];
    const len = Math.hypot(dx, dz) || 1;
    const yaw = Math.atan2(-dz, dx);
    for (let f = 0; f < STAKE.flagsPerRun; f++) {
      const t = (f + 1) / (STAKE.flagsPerRun + 1) + rng.rangeF(-0.06, 0.06);
      const p = [top[0] + dx * t, top[1] + (end[1] - top[1]) * t - STAKE.sagM * 4 * t * (1 - t), top[2] + dz * t];
      
      const tri = [[-0.075, 0], [0, -0.16], [0.075, 0]];
      const color = vc(hex(FLAGS[(index * 2 + f + seed) % FLAGS.length]), { groundAO: 0, underside: 0.1 });
      const m = compose(translate(p[0], p[1] - 0.004, p[2]), compose(rotateY(yaw), rotateZ(rng.rangeF(-0.1, 0.1))));
      emit(mesh, 'cloth', slab(tri, 0.006, 0, [0, -0.05]), { matrix: m, color });
      if (len < 0.4) break;
    }
  }
  if (season === 'winter' && L === 0) {
    emit(mesh, 'snow', dome(0.034, 0.03, 5, 0), { matrix: translate(top[0], top[1] + 0.012, top[2]), color: vc(hex(seasonPalette(season).snow[0]), { groundAO: 0 }) });
  }
  return mesh;
}
