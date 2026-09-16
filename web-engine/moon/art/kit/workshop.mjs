



















import { sweep, lathe, emit, roundedRectProfile, circleProfile, deform } from '../../mesh/bevel.mjs';
import { compose, translate } from '../../mesh/meshData.mjs';
import { valueNoise3 } from '../../noise.mjs';
import { chimney } from './chimney.mjs';
import { pillow, archOutline } from './door.mjs';
import { vc, vary, scaleC } from './shade.mjs';


export const PRESS = Object.freeze({ top: 1.76, halfWidth: 0.72, back: 0.7, front: 1.1 });

export const KETTLE_SCALE = 1.18;

function slat(mesh, material, m, a, b, { w, h, detail, color, up = [0, 1, 0] }) {
  const r = Math.min(w, h) * 0.3;
  const s = sweep({ profile: roundedRectProfile(h, w, r, detail === 0 ? 1 : 0), path: [a, b], up, caps: 'round', capSegments: 0, capLength: Math.min(w, h) * 0.35 });
  emit(mesh, material, s, { matrix: m, color });
}

export function slatCrate(mesh, m, { width = 0.56, depth = 0.42, height = 0.42, detail = 0, rng, color }) {
  const hw = width / 2, hd = depth / 2;
  const c = () => vc(vary(rng, color, 0.07), { groundAO: 0.3 });
  const sh = 0.035;
  if (detail === 2) {
    const block = sweep({ profile: roundedRectProfile(height, depth, 0.03, 0), path: [[-hw, height / 2, 0], [hw, height / 2, 0]], up: [0, 1, 0], caps: 'round', capSegments: 0, capLength: 0.02 });
    emit(mesh, 'wood', block, { matrix: m, color: c() });
    return { top: height };
  }
  const n = detail === 0 ? 3 : 2;
  const sw = (depth - 0.02 * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const z = -hd + sw / 2 + i * (sw + 0.02);
    slat(mesh, 'wood', m, [-hw + rng.rangeF(-0.01, 0.01), height - sh / 2, z], [hw + rng.rangeF(-0.01, 0.01), height - sh / 2 + rng.rangeF(-0.004, 0.004), z], { w: sw, h: sh, detail, color: c() });
  }
  const rows = detail === 0 ? [0.1, 0.26] : [0.2];
  for (const y of rows) {
    slat(mesh, 'wood', m, [-hw + 0.01, y, hd - 0.012], [hw - 0.01, y + rng.rangeF(-0.01, 0.01), hd - 0.012], { w: 0.024, h: 0.1, detail: 1, color: c() });
    for (const sgn of [-1, 1]) slat(mesh, 'wood', m, [sgn * (hw - 0.012), y, -hd + 0.02], [sgn * (hw - 0.012), y, hd - 0.02], { w: 0.1, h: 0.024, detail: 1, color: c(), up: [1, 0, 0] });
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      slat(mesh, 'wood', m, [sx * (hw - 0.03), 0, sz * (hd - 0.03)], [sx * (hw - 0.03), height - sh, sz * (hd - 0.03)], { w: 0.04, h: 0.04, detail: 1, color: vc(scaleC(color, 0.8), { groundAO: 0.3 }), up: [0, 0, 1] });
    }
  }
  return { top: height };
}

export function fruitPress(mesh, m, { detail = 0, rng, wood, darkWood, iron }) {
  const W = (c, k = 0.06, o = {}) => vc(vary(rng, c, k), { groundAO: 0.25, ...o });
  const ironC = vc(iron, { groundAO: 0 });
  const sides = detail === 0 ? 12 : detail === 1 ? 8 : 6;
  const ph = rng.rangeF(0, 6);
  
  
  const platPts = detail === 2 ? [[0.66, 0], [0.64, 0.15], [0, 0.15]] : [[0.62, 0], [0.67, 0.03], [0.68, 0.11], [0.64, 0.15], [0, 0.15]];
  const plat = lathe({ points: platPts, sides, radiusFn: detail === 2 ? null : (th, j, r, i) => r * (1 + 0.025 * Math.cos(3 * th + ph)) * (j > 0 && j < 4 ? (i % 2 ? 0.985 : 1.01) : 1) });
  emit(mesh, 'wood', plat, { matrix: m, color: W(darkWood, 0.05, { underside: 0.4 }) });
  
  const trayPts = detail === 2
    ? [[0, 0.15], [0.56, 0.18], [0.55, 0.32], [0, 0.27]]
    : [[0, 0.15], [0.5, 0.15], [0.57, 0.2], [0.58, 0.3], [0.54, 0.33], [0.5, 0.27], [0, 0.26]];
  const tray = lathe({ points: trayPts, sides, radiusFn: (th, j, r) => r * (1 + 0.025 * Math.cos(2 * th + ph)) });
  emit(mesh, 'wood', tray, { matrix: m, color: W(wood, 0.04, { underside: 0.4 }) });
  if (detail < 2) {
    const U = [];
    const n = detail === 0 ? 4 : 3;
    for (let k = 0; k <= n; k++) { const a = (Math.PI * k) / n; U.push([-0.09 * Math.sin(a), 0.09 * Math.cos(a)]); }
    for (let k = n; k >= 0; k--) { const a = (Math.PI * k) / n; U.push([-0.06 * Math.sin(a), 0.06 * Math.cos(a)]); }
    const spout = sweep({ profile: U, path: [[0, 0.32, 0.5], [0, 0.29, 0.72], [0, 0.23, 0.86]], up: [0, 1, 0], caps: 'round', capSegments: 0, capLength: 0.02 });
    emit(mesh, 'wood', spout, { matrix: m, color: W(wood, 0.04) });
    const bucket = lathe({ points: [[0, 0], [0.12, 0], [0.15, 0.23], [0.13, 0.24], [0.105, 0.035], [0, 0.035]], sides: detail === 0 ? 9 : 6 });
    emit(mesh, 'wood', bucket, { matrix: compose(m, translate(rng.rangeF(-0.04, 0.04), 0, 0.95)), color: W(darkWood, 0.05, { underside: 0.3 }) });
  }
  
  const bSides = detail === 0 ? 15 : detail === 1 ? 10 : 6;
  const basketPts = detail === 2
    ? [[0.42, 0.27], [0.46, 0.64], [0.41, 1.03], [0, 1.03]]
    : [[0.4, 0.27], [0.44, 0.33], [0.46, 0.66], [0.445, 0.99], [0.41, 1.03], [0, 1.03]];
  const basket = lathe({
    points: basketPts, sides: bSides,
    radiusFn: detail === 2 ? null : (th, j, r, i) => (j > 0 && j < 4 ? r * (detail === 0 ? (i % 3 === 0 ? 0.965 : 1.01) : i % 2 ? 0.975 : 1.01) : r),
  });
  emit(mesh, 'wood', basket, { matrix: m, color: W(darkWood, 0.05) });
  if (detail < 2) {
    for (const [y, r] of [[0.45, 0.47], [0.87, 0.468]]) {
      const n = detail === 0 ? 10 : 7;
      const path = [];
      for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; path.push([r * Math.sin(a), y, r * Math.cos(a)]); }
      emit(mesh, 'metal', sweep({ profile: roundedRectProfile(0.075, 0.028, 0.01, 0), path, closed: true, up: [0, 1, 0] }), { matrix: m, color: ironC });
    }
    const plate = lathe({ points: [[0, 1.03], [0.37, 1.03], [0.4, 1.07], [0.38, 1.11], [0, 1.11]], sides });
    emit(mesh, 'wood', plate, { matrix: m, color: W(wood) });
    const a = rng.rangeF(-0.3, 0.3);
    slat(mesh, 'wood', m, [-0.3 * Math.cos(a), 1.16, -0.3 * Math.sin(a)], [0.3 * Math.cos(a), 1.16, 0.3 * Math.sin(a)], { w: 0.14, h: 0.1, detail, color: W(darkWood) });
    const b = a + Math.PI / 2 + rng.rangeF(-0.15, 0.15);
    slat(mesh, 'wood', m, [-0.2 * Math.cos(b), 1.25, -0.2 * Math.sin(b)], [0.2 * Math.cos(b), 1.25, 0.2 * Math.sin(b)], { w: 0.12, h: 0.08, detail, color: W(darkWood) });
  }
  
  
  
  const core = lathe({ points: [[0, 0.26], [0.055, 0.26], [0.055, 1.58], [0, 1.58]], sides: detail === 0 ? 6 : 4 });
  emit(mesh, 'metal', core, { matrix: m, color: ironC });
  const knob = lathe({ points: [[0, 1.55], [0.075, 1.57], [0.09, 1.64], [0.07, 1.72], [0, PRESS.top]], sides: detail === 0 ? 8 : detail === 1 ? 6 : 5 });
  emit(mesh, 'metal', knob, { matrix: m, color: ironC });
  const hubY = 1.34;
  if (detail === 0) {
    const turns = 3, per = 5;
    const y0 = 1.42, y1 = 1.56;
    const path = [];
    for (let k = 0; k <= turns * per; k++) {
      const t = k / (turns * per), a = t * turns * Math.PI * 2;
      path.push([0.07 * Math.cos(a), y0 + (y1 - y0) * t, 0.07 * Math.sin(a)]);
    }
    emit(mesh, 'metal', sweep({ profile: circleProfile(0.022, 3), path, up: [0, 1, 0], caps: 'round', capSegments: 0, capLength: 0.012 }), { matrix: m, color: vc(scaleC(iron, 1.2), { groundAO: 0 }) });
  }
  const hub = lathe({ points: [[0, hubY - 0.06], [0.1, hubY - 0.06], [0.13, hubY], [0.1, hubY + 0.06], [0, hubY + 0.06]], sides: detail === 0 ? 8 : detail === 1 ? 6 : 5 });
  emit(mesh, 'metal', hub, { matrix: m, color: ironC });
  const R = 0.56, tilt = rng.rangeF(0.01, 0.025);
  const wy = (a) => hubY + tilt * Math.sin(a + ph);
  const rimN = detail === 0 ? 14 : detail === 1 ? 9 : 6;
  const rim = [];
  for (let k = 0; k < rimN; k++) { const a = (k / rimN) * Math.PI * 2; rim.push([R * Math.cos(a), wy(a), R * Math.sin(a)]); }
  emit(mesh, 'wood', sweep({ profile: roundedRectProfile(0.1, 0.085, 0.032, 0), path: rim, closed: true, up: [0, 1, 0] }), { matrix: m, color: W(darkWood, 0.04, { underside: 0.35 }) });
  const spokes = [];
  const nSpokes = detail === 2 ? 3 : 5;
  for (let k = 0; k < nSpokes; k++) spokes.push(ph + (k * Math.PI * 2) / nSpokes + rng.rangeF(-0.12, 0.12));
  for (const a of spokes) {
    const path = [[0.1 * Math.cos(a), hubY, 0.1 * Math.sin(a)], [(R - 0.03) * Math.cos(a), wy(a), (R - 0.03) * Math.sin(a)]];
    emit(mesh, 'wood', sweep({ profile: roundedRectProfile(0.065, 0.055, 0.02, 0), path, up: [0, 1, 0], caps: 'none' }), { matrix: m, color: W(wood, 0.05) });
  }
  if (detail < 2) {
    const a = spokes[0] + Math.PI / 5;
    const gx = R * Math.cos(a), gz = R * Math.sin(a);
    emit(mesh, 'wood', sweep({ profile: circleProfile(0.04, detail === 0 ? 6 : 4), path: [[gx, wy(a) + 0.03, gz], [gx * 1.02, wy(a) + 0.24, gz * 1.02]], up: [1, 0, 0], caps: 'round', capSegments: 1, capLength: 0.035 }), { matrix: m, color: W(wood) });
  }
  return { top: PRESS.top };
}

export function stoveKettle(mesh, m, { detail = 0, rng, stone, copper, iron, wood, fire }) {
  const st = chimney({ width: 0.84, depth: 0.74, courseH: 0.3, courses: 2, stonesFrom: 0, detail: Math.min(2, detail + 1), rng: rng.child('stove') });
  emit(mesh, 'stone', st.shape, { matrix: m, color: vc(stone, { useTag: true, groundAO: 0.2, underside: 0.2 }) });
  const segs = detail === 0 ? 5 : 3;
  if (detail < 2) {
    const frame = archOutline(0.28, 0.26, 0, segs).map(([x, y]) => [x, y + 0.06, 0]);
    emit(mesh, 'metal', sweep({ profile: roundedRectProfile(0.035, 0.045, 0.012, 0), path: frame, closed: true, up: [0, 0, 1] }), { matrix: compose(m, translate(0, 0, 0.39)), color: vc(iron, { groundAO: 0 }) });
  }
  
  
  
  const bed = pillow({ outline: (d) => archOutline(0.24, 0.21, d, segs), insets: detail === 0 ? [0, 0.04] : [0], zs: [0, 0.01], centre: [0, 0.08], centreZ: 0.016, uv: ([x, y]) => [x / 0.24 + 0.5, y / 0.21] });
  emit(mesh, 'glass', bed, { matrix: compose(m, translate(0, 0.07, 0.37)), color: fire });

  const seed = rng.rangeI(1, 1e6);
  const sides = detail === 0 ? 11 : detail === 1 ? 8 : 6;
  const pts = detail === 2
    ? [[0, 0.6], [0.3, 0.7], [0.315, 0.9], [0.3, 1.035], [0, 0.95]]
    : [[0, 0.6], [0.16, 0.6], [0.27, 0.66], [0.315, 0.77], [0.31, 0.89], [0.285, 0.97], [0.3, 0.995], [0.31, 1.025], [0.285, 1.04], [0.265, 0.99], [0, 0.93]];
  const kettle = lathe({
    points: pts, sides,
    radiusFn: detail === 2 ? null : (th, j, r) => (j > 0 && j < 6 ? r * (1 + 0.03 * (valueNoise3(Math.sin(th) * 2.5, j * 0.9, Math.cos(th) * 2.5, seed) - 0.5)) : r),
  });
  emit(mesh, 'copper', kettle, { matrix: m, color: vc(copper, { groundAO: 0, underside: 0.45 }) });
  if (detail < 2) {
    const tilt = rng.rangeF(0.8, 1.15);
    const n = detail === 0 ? 7 : 4;
    const bail = [];
    for (let k = 0; k <= n; k++) {
      const a = (Math.PI * k) / n, r = 0.335;
      const up = 0.36 * Math.sin(a);
      bail.push([r * Math.cos(a), 1.0 + up * Math.cos(tilt), -up * Math.sin(tilt)]);
    }
    emit(mesh, 'metal', sweep({ profile: circleProfile(0.013, 4), path: bail, up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.012 }), { matrix: m, color: vc(iron, { groundAO: 0 }) });
    const px = rng.rangeF(-0.12, 0.12);
    const paddle = sweep({ profile: circleProfile(0.02, 4), path: [[px, 0.9, 0.05], [px + 0.14, 1.2, -0.02], [px + 0.27, 1.48, -0.1]], up: [0, 0, 1], caps: 'round', capSegments: 1, capLength: 0.025 });
    emit(mesh, 'wood', paddle, { matrix: m, color: vc(wood, { groundAO: 0 }) });
  }
  return { top: 1.04 };
}

export function bottlingBench(mesh, m, { width = 1.5, height = 0.88, depth = 0.58, detail = 0, rng, wood, top, copper, iron }) {
  const hw = width / 2, hd = depth / 2;
  const n = detail === 0 ? 3 : 1;
  for (const sgn of [-1, 1]) {
    const z = (sgn * depth) / 4, path = [];
    const tilt = rng.rangeF(-0.006, 0.006);
    for (let k = 0; k <= n; k++) { const u = (2 * k) / n - 1; path.push([u * (hw + 0.04), height - 0.03 - 0.006 * (1 - u * u) + tilt * u, z]); }
    const board = sweep({ profile: roundedRectProfile(0.06, depth / 2 - 0.012, 0.022, detail === 0 ? 1 : 0), path, up: [0, 1, 0], caps: 'round', capSegments: detail === 2 ? 0 : 1, capLength: 0.03 });
    emit(mesh, 'wood', board, { matrix: m, color: vc(vary(rng, top, 0.06), { groundAO: 0 }) });
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const a = [sx * (hw - 0.12), height - 0.06, sz * (hd - 0.09)];
      const b = [sx * (hw - 0.06 + rng.rangeF(0, 0.02)), 0, sz * (hd - 0.05)];
      emit(mesh, 'wood', sweep({ profile: roundedRectProfile(0.075, 0.075, 0.025, detail === 0 ? 1 : 0), path: [a, b], up: [0, 0, 1], caps: 'none' }), { matrix: m, color: vc(scaleC(wood, 0.9), { groundAO: 0.3 }) });
    }
  }
  if (detail < 2) {
    slat(mesh, 'wood', m, [-hw + 0.1, 0.24, 0], [hw - 0.1, 0.24, 0.01], { w: depth - 0.16, h: 0.04, detail, color: vc(scaleC(wood, 0.85), { groundAO: 0.3 }) });
  }
  
  const fx = -width * 0.24;
  const h = height;
  const funnelPts = detail === 2
    ? [[0.014, h + 0.16], [0.02, h + 0.25], [0.145, h + 0.465], [0.012, h + 0.27]]
    : [[0.014, h + 0.16], [0.02, h + 0.25], [0.13, h + 0.43], [0.145, h + 0.465], [0.125, h + 0.455], [0.012, h + 0.27]];
  const funnel = lathe({ points: funnelPts, sides: detail === 0 ? 12 : detail === 1 ? 8 : 6 });
  emit(mesh, 'copper', funnel, { matrix: compose(m, translate(fx, 0, -0.04)), color: vc(copper, { groundAO: 0, underside: 0.4 }) });
  if (detail < 2) {
    emit(mesh, 'metal', sweep({ profile: circleProfile(0.012, 4), path: [[fx - 0.19, h, -0.04], [fx - 0.19, h + 0.36, -0.04], [fx - 0.12, h + 0.36, -0.04]], up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.01 }), { matrix: m, color: vc(iron, { groundAO: 0 }) });
    const ring = [];
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; ring.push([fx + 0.075 * Math.sin(a), h + 0.35, -0.04 + 0.075 * Math.cos(a)]); }
    emit(mesh, 'metal', sweep({ profile: circleProfile(0.01, 3), path: ring, closed: true, up: [0, 1, 0] }), { matrix: m, color: vc(iron, { groundAO: 0 }) });
    
    const cx = width * 0.08, lift = rng.rangeF(0.3, 0.5);
    slat(mesh, 'wood', m, [cx, h, -0.12], [cx, h + 0.34, -0.12], { w: 0.06, h: 0.06, detail, color: vc(scaleC(wood, 0.9), { groundAO: 0 }), up: [0, 0, 1] });
    const tip = [cx + 0.42, h + 0.34 + 0.42 * Math.sin(lift), -0.14];
    emit(mesh, 'wood', sweep({ profile: circleProfile(0.022, 4), path: [[cx - 0.08, h + 0.33, -0.1], [cx + 0.2, h + 0.34 + 0.2 * Math.sin(lift), -0.12], tip], up: [0, 0, 1], caps: 'round', capSegments: 1, capLength: 0.025 }), { matrix: m, color: vc(wood, { groundAO: 0 }) });
    emit(mesh, 'metal', sweep({ profile: circleProfile(0.012, 4), path: [[cx + 0.1, h + 0.34 + 0.1 * Math.sin(lift), -0.1], [cx + 0.1, h + 0.1, -0.1]], up: [0, 0, 1], caps: 'round', capSegments: 0, capLength: 0.01 }), { matrix: m, color: vc(iron, { groundAO: 0 }) });
  }
  return { top: h + 0.465 };
}

export function stovePipe(mesh, m, { height = 1.3, detail = 0, rng, metal, cap }) {
  const bendX = rng.rangeF(0.08, 0.16), bendZ = rng.rangeF(-0.04, 0.04);
  const path = detail === 0
    ? [[0, 0, 0], [0, height * 0.55, 0], [bendX * 0.7, height * 0.78, bendZ * 0.7], [bendX, height, bendZ]]
    : [[0, 0, 0], [0, height * 0.6, 0], [bendX, height, bendZ]];
  const pipe = sweep({ profile: circleProfile(0.075, detail === 0 ? 8 : detail === 1 ? 6 : 4), path, up: [0, 0, 1], caps: 'none' });
  emit(mesh, 'metal', pipe, { matrix: m, color: vc(metal, { groundAO: 0 }) });
  const hatPts = detail === 2 ? [[0, 0.02], [0.17, 0.035], [0, 0.16]] : [[0, 0.02], [0.17, 0.035], [0.12, 0.09], [0.03, 0.15], [0, 0.16]];
  const hat = lathe({ points: hatPts, sides: detail === 0 ? 8 : 5 });
  deform(hat, (p) => { p[0] += bendX; p[1] += height + 0.04; p[2] += bendZ; });
  emit(mesh, 'metal', hat, { matrix: m, color: vc(cap, { groundAO: 0, underside: 0.4 }) });
  return { top: height + 0.2 };
}
