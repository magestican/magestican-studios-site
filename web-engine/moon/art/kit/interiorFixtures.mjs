


















import { Shape, emit, lathe, sweep, blob, surface, roundedRectProfile } from '../../mesh/bevel.mjs';
import { compose, translate, rotateY, rotateX } from '../../mesh/meshData.mjs';
import { pillow, archOutline } from './door.mjs';
import { rod } from './rod.mjs';
import { vc, vary, mixC, scaleC } from './shade.mjs';

export const FIXTURE_KINDS = Object.freeze([
  'stove', 'counter', 'sink', 'shelf', 'table', 'stool',
  'tub', 'basin', 'mirror', 'towelRail', 'bed', 'wardrobe', 'bedside', 'stairs',
]);

const TAU = Math.PI * 2;
const sidesFor = (detail, hi = 16) => (detail === 0 ? hi : detail === 1 ? Math.max(6, Math.round(hi * 0.45)) : 5);



function seR(th, A, B, e) {
  const s = Math.abs(Math.sin(th)) / A, c = Math.abs(Math.cos(th)) / B;
  return 1 / Math.pow(s ** e + c ** e, 1 / e);
}






export function loft({ w, d, rows, e = 6, detail = 0, rng, wobble = 0.008, hi = 16 }) {
  const ph = rng.rangeF(0, TAU), q = rng.rangeI(2, 4);
  const sides = sidesFor(detail, hi);
  
  
  
  
  const pw = (v) => Math.sign(v) * Math.abs(v) ** (2 / e);
  const s = new Shape();
  let arc = 0;
  const ring = rows.map(([k, y], j) => {
    if (j > 0) arc += Math.hypot((k - rows[j - 1][0]) * (w + d) / 4, y - rows[j - 1][1]);
    if (k < 1e-6) { const pole = s.add([0, y, 0], [arc, 0], 1); return new Array(sides + 1).fill(pole); }
    const out = [];
    for (let i = 0; i <= sides; i++) {
      const t = Math.PI / 4 + (i / sides) * TAU;
      const f = k * (1 + wobble * Math.sin(t * q + ph + j * 1.3));
      out.push(i === sides ? out[0] : s.add([(w / 2) * f * pw(Math.sin(t)), y, (d / 2) * f * pw(Math.cos(t))], [arc, (i / sides) * (w + d)], k));
    }
    return out;
  });
  for (let j = 0; j + 1 < ring.length; j++) for (let i = 0; i < sides; i++) s.quad(ring[j][i], ring[j][i + 1], ring[j + 1][i + 1], ring[j + 1][i]);
  return s;
}



function panel(w, h, cy, { r = 0.03, raise = 0.012, detail = 0 } = {}) {
  const ring = (dd) => {
    const pts = roundedRectProfile(Math.max(0.02, w - 2 * dd), Math.max(0.02, h - 2 * dd), Math.max(0.005, r - dd * 0.5), detail === 0 ? 1 : 0).map(([x, y]) => [x, y + cy]);
    let a = 0;
    for (let i = 0; i < pts.length; i++) { const p = pts[i], n = pts[(i + 1) % pts.length]; a += p[0] * n[1] - n[0] * p[1]; }
    return a < 0 ? pts.reverse() : pts;
  };
  return pillow({ outline: ring, insets: detail === 0 ? [0, Math.min(w, h) * 0.12] : [0], zs: [0, raise], centre: [0, cy], centreZ: raise * 1.1, uv: ([x, y]) => [x, y] });
}

const legs = (mesh, m, pts, { w = 0.05, detail, color }) => {
  for (const path of pts) emit(mesh, 'wood', rod({ path, w, detail, up: [1, 0, 0], caps: 'round', capSegments: 0 }), { matrix: m, color: vc(color, { groundAO: 0.35 }) });
};



function stove(mesh, m, { w, d, h, detail, rng, c, flueTop = 1.8 }) {
  const body = loft({ w: w - 0.04, d: d - 0.06, e: 5, detail, rng, rows: [[0.96, 0], [1, 0.05], [1.02, h * 0.45], [1, h - 0.07], [0.95, h - 0.04], [0, h - 0.04]] });
  emit(mesh, 'stone', body, { matrix: compose(m, translate(0, 0, -0.02)), color: vc(c.stone, { groundAO: 0.3, underside: 0.2 }) });
  const top = loft({ w, d, e: 7, detail, rng, hi: 12, rows: [[0.93, h - 0.05], [1, h - 0.035], [1, h - 0.01], [0.96, h], [0, h + 0.004]] });
  emit(mesh, 'metal', top, { matrix: m, color: vc(c.iron, { groundAO: 0 }) });
  
  const segs = detail === 0 ? 5 : 3;
  const mouth = pillow({ outline: (dd) => archOutline(0.3, 0.26, dd, segs), insets: detail === 0 ? [0, 0.04] : [0], zs: [0, 0.008], centre: [0, 0.09], centreZ: 0.012, uv: ([x, y]) => [x / 0.3 + 0.5, y / 0.26] });
  const front = d / 2 - 0.01;
  emit(mesh, 'fire', mouth, { matrix: compose(m, translate(rng.rangeF(-0.05, 0.05), 0.1, front)), color: c.fire });
  if (detail < 2) {
    const frame = archOutline(0.36, 0.3, 0, segs).map(([x, y]) => [x, y + 0.08, 0]);
    emit(mesh, 'metal', sweep({ profile: roundedRectProfile(0.035, 0.04, 0.01, 0), path: frame, closed: true, up: [0, 0, 1] }), { matrix: compose(m, translate(0, 0, front + 0.012)), color: vc(c.iron, { groundAO: 0 }) });
    
    const px = rng.rangeF(-0.18, 0.12);
    const pot = lathe({ points: [[0, h], [0.13, h + 0.005], [0.15, h + 0.08], [0.145, h + 0.15], [0.155, h + 0.16], [0.13, h + 0.155], [0, h + 0.12]], sides: sidesFor(detail, 11), phase: rng.rangeF(0, 1) });
    emit(mesh, 'metal', pot, { matrix: compose(m, translate(px, 0, 0.02)), color: vc(scaleC(c.iron, 1.5), { groundAO: 0 }) });
    const fx = rng.rangeF(0.12, 0.24) * (px < 0 ? 1 : -1);
    emit(mesh, 'metal', rod({ path: [[fx, h, -d / 2 + 0.1], [fx, h + 0.35, -d / 2 + 0.08], [fx + 0.02, flueTop - 0.05, -d / 2 + 0.06], [fx + 0.02, flueTop, -d / 2 + 0.06]], w: 0.11, detail, up: [1, 0, 0], caps: 'none' }), { matrix: m, color: vc(c.iron, { groundAO: 0 }) });
  }
}

function counter(mesh, m, { w, d, h, detail, rng, c }) {
  const body = loft({ w: w - 0.04, d: d - 0.06, e: 9, detail, rng, rows: [[0.97, 0], [1, 0.08], [1, h - 0.05], [0, h - 0.05]] });
  emit(mesh, 'wood', body, { matrix: compose(m, translate(0, 0, -0.03)), color: vc(c.wood, { groundAO: 0.35 }) });
  const top = loft({ w: w + 0.03, d: d + 0.01, e: 9, detail, rng, hi: 12, rows: [[0.97, h - 0.055], [1, h - 0.04], [1, h - 0.008], [0.98, h], [0, h + 0.002]] });
  emit(mesh, 'wood', top, { matrix: m, color: vc(c.top, { groundAO: 0 }) });
  if (detail < 2) {
    
    const split = rng.rangeF(-0.12, 0.12);
    const dw0 = w / 2 + split - 0.06, dw1 = w / 2 - split - 0.06;
    const dh = h - 0.3;
    emit(mesh, 'wood', panel(dw0, dh, 0.1 + dh / 2, { detail }), { matrix: compose(m, translate(-w / 2 + 0.04 + dw0 / 2, 0, d / 2 - 0.028)), color: vc(c.darkWood, { groundAO: 0.2 }) });
    emit(mesh, 'wood', panel(dw1, dh, 0.1 + dh / 2, { detail }), { matrix: compose(m, translate(w / 2 - 0.04 - dw1 / 2, 0, d / 2 - 0.028)), color: vc(c.darkWood, { groundAO: 0.2 }) });
  }
}

function sink(mesh, m, { h, detail, rng, c }) {
  
  const R = 0.2 + rng.rangeF(-0.015, 0.015);
  const pts = [[0.14, h], [R * 0.95, h + 0.03], [R, h + 0.12], [R + 0.012, h + 0.15], [R - 0.02, h + 0.152], [R - 0.035, h + 0.1], [0.1, h + 0.03], [0, h + 0.025]];
  emit(mesh, 'stone', lathe({ points: pts, sides: sidesFor(detail, 14), phase: rng.rangeF(0, 1) }), { matrix: m, color: vc(c.ceramic, { groundAO: 0 }) });
  if (detail < 2) {
    const tx = rng.rangeF(-0.05, 0.05);
    emit(mesh, 'metal', rod({ path: [[tx, h, -0.2], [tx, h + 0.28, -0.19], [tx + 0.01, h + 0.31, -0.1], [tx + 0.01, h + 0.25, -0.04]], w: 0.03, detail, up: [1, 0, 0], caps: 'round' }), { matrix: m, color: vc(c.brass, { groundAO: 0 }) });
  }
}



function shelf(mesh, m, { w, d, detail, rng, c, bare = false }) {
  const sagM = rng.rangeF(0.006, 0.016);
  emit(mesh, 'wood', rod({ path: [[-w / 2, 0, d / 2 - 0.02], [0, -sagM, d / 2 - 0.02], [w / 2, 0.002, d / 2 - 0.02]], w: 0.035, h: d, detail, up: [0, 1, 0], caps: 'round', capSegments: 0 }), { matrix: compose(m, translate(0, 0, -d / 2 + 0.02)), color: vc(c.wood, { groundAO: 0 }) });
  if (detail > 0) return;
  for (const [bx, lean] of [[-w / 2 + 0.12 + rng.rangeF(0, 0.05), rng.rangeF(-0.02, 0.02)], [w / 2 - 0.1 - rng.rangeF(0, 0.08), rng.rangeF(-0.02, 0.02)]]) {
    emit(mesh, 'wood', rod({ path: [[bx, -0.2, -d / 2 + 0.02], [bx + lean, -0.03, d / 2 - 0.05]], w: 0.03, detail, up: [1, 0, 0], caps: 'round' }), { matrix: m, color: vc(c.darkWood, { groundAO: 0 }) });
  }
  if (bare) return;
  
  let x = -w / 2 + 0.1;
  for (let k = 0; k < 3; k++) {
    x += rng.rangeF(0.16, 0.27);
    if (x > w / 2 - 0.08) break;
    const tall = rng.rangeF(0.08, 0.2), r = rng.rangeF(0.04, 0.07);
    const pts = k === 1 ? [[0, 0.02], [r * 0.7, 0.02], [r * 1.5, 0.07], [r * 1.35, 0.075], [0, 0.05]]
      : [[0, 0.02], [r, 0.02], [r * 1.08, 0.02 + tall * 0.7], [r * 0.7, 0.02 + tall], [r * 0.75, 0.035 + tall], [0, 0.035 + tall]];
    const col = [c.jarA, c.jarB, c.ceramic][k];
    emit(mesh, k === 1 ? 'wood' : 'stone', lathe({ points: pts, sides: sidesFor(detail, 9), phase: rng.rangeF(0, 1) }), { matrix: compose(m, translate(x, -sagM * 0.6, 0)), color: vc(vary(rng, col, 0.05), { groundAO: 0.15 }) });
  }
}

function table(mesh, m, { w, d, h, detail, rng, c }) {
  const top = loft({ w, d, e: 5, detail, rng, rows: [[0.95, h - 0.05], [1, h - 0.035], [1.005, h - 0.008], [0.97, h], [0, h + 0.003]] });
  emit(mesh, 'wood', top, { matrix: m, color: vc(c.wood, { groundAO: 0 }) });
  const pts = [];
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = sx * (w / 2 - 0.1 - rng.rangeF(0, 0.03)), z = sz * (d / 2 - 0.09 - rng.rangeF(0, 0.02));
    const splay = rng.rangeF(0.01, 0.045);
    pts.push([[x, h - 0.04, z], [x + sx * splay * 0.4, h * 0.5, z + sz * splay * 0.3], [x + sx * splay, 0, z + sz * splay * 0.8]]);
  }
  legs(mesh, m, pts, { w: 0.055, detail, color: c.darkWood });
}

function stool(mesh, m, { h, detail, rng, c, spin = 0 }) {
  const seat = lathe({ points: [[0.14, h - 0.04], [0.18, h - 0.03], [0.195, h - 0.01], [0.185, h + 0.004], [0.09, h - 0.006], [0, h - 0.01]], sides: sidesFor(detail, 12), phase: spin, radiusFn: (th, j, r) => r * (1 + 0.03 * Math.sin(th * 2 + spin * 5)) });
  emit(mesh, 'wood', seat, { matrix: m, color: vc(c.wood, { groundAO: 0 }) });
  const pts = [];
  for (let k = 0; k < 3; k++) {
    const a = spin * TAU + (k * TAU) / 3 + rng.rangeF(-0.25, 0.25), r0 = 0.11, r1 = 0.17 + rng.rangeF(0, 0.04);
    pts.push([[r0 * Math.sin(a), h - 0.035, r0 * Math.cos(a)], [r1 * Math.sin(a), 0, r1 * Math.cos(a)]]);
  }
  legs(mesh, m, pts, { w: 0.04, detail, color: c.darkWood });
}



function tub(mesh, m, { w, d, h, detail, rng, c }) {
  
  
  const body = loft({ w, d, e: 2.6, detail, rng, hi: 18, wobble: 0.006, rows: [[0.86, 0.1], [0.94, 0.16], [0.99, h * 0.6], [1.0, h - 0.02], [0.99, h + 0.01], [0.93, h + 0.012], [0.9, h - 0.03], [0.86, 0.24], [0, 0.22]] });
  emit(mesh, 'stone', body, { matrix: m, color: vc(c.ceramic, { groundAO: 0.25, underside: 0.25 }) });
  if (detail === 2) return;
  const feet = [];
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = sx * (w / 2 - 0.2 - rng.rangeF(0, 0.04)), z = sz * (d / 2 - 0.14);
    feet.push([[x * 0.97, 0.15, z * 0.95], [x + sx * 0.03, 0.04, z + sz * 0.02], [x + sx * 0.05, 0, z + sz * 0.035]]);
  }
  for (const path of feet) emit(mesh, 'metal', rod({ path, w: 0.05, detail, up: [1, 0, 0], caps: 'round', capSegments: 1 }), { matrix: m, color: vc(c.brass, { groundAO: 0.2 }) });
  const tx = -w / 2 + 0.22 + rng.rangeF(0, 0.08);
  emit(mesh, 'metal', rod({ path: [[tx, h - 0.05, -d / 2 + 0.02], [tx, h + 0.2, -d / 2 + 0.04], [tx + 0.03, h + 0.22, -d / 2 + 0.16], [tx + 0.03, h + 0.14, -d / 2 + 0.2]], w: 0.03, detail, up: [1, 0, 0], caps: 'round' }), { matrix: m, color: vc(c.brass, { groundAO: 0 }) });
}

function basin(mesh, m, { w, d, h, detail, rng, c }) {
  const A = w / 2, B = d / 2;
  const pts = [[0.24, 0], [0.18, 0.05], [0.15, 0.3], [0.17, h * 0.7], [0.55, h - 0.1], [0.97, h - 0.03], [1, h], [0.9, h + 0.004], [0.62, h - 0.1], [0, h - 0.11]];
  const ph = rng.rangeF(0, TAU);
  emit(mesh, 'stone', lathe({ points: pts, sides: sidesFor(detail, 14), phase: Math.PI / 4, radiusFn: (th, j, k) => k * seR(th, A, B, 2.4) * (1 + 0.01 * Math.sin(th * 3 + ph)) }), { matrix: compose(m, translate(0, 0, 0.02)), color: vc(c.ceramic, { groundAO: 0.25 }) });
  if (detail < 2) {
    const tx = rng.rangeF(-0.06, 0.06);
    emit(mesh, 'metal', rod({ path: [[tx, h - 0.02, -d / 2 + 0.03], [tx, h + 0.12, -d / 2 + 0.05], [tx + 0.01, h + 0.13, -d / 2 + 0.14], [tx + 0.01, h + 0.08, -d / 2 + 0.17]], w: 0.026, detail, up: [1, 0, 0], caps: 'round' }), { matrix: m, color: vc(c.brass, { groundAO: 0 }) });
  }
}

function mirror(mesh, m0, { w, d, h, detail, rng, c }) {
  const m = compose(m0, translate(0, 0, -d / 2)); 
  const glass = panel(w - 0.08, h - 0.08, h / 2, { r: 0.06, raise: 0.003, detail });
  emit(mesh, 'metal', glass, { matrix: compose(m, translate(0, 0, 0.012)), color: vc(c.mirror, { groundAO: 0 }) });
  const tilt = rng.rangeF(-0.02, 0.02);
  const path = roundedRectProfile(w - 0.03, h - 0.03, 0.07, detail === 0 ? 2 : 1).map(([x, y]) => [x, y + h / 2 + x * tilt, 0.02]);
  emit(mesh, 'wood', sweep({ profile: roundedRectProfile(0.045, 0.03, 0.01, 0), path, closed: true, up: [0, 0, 1] }), { matrix: m, color: vc(c.trim, { groundAO: 0 }) });
}

function towelRail(mesh, m0, { w, d, h, detail, rng, c }) {
  const m = compose(m0, translate(0, 0, -d / 2)); 
  const y = h - 0.02, off = 0.085; 
  emit(mesh, 'metal', rod({ path: [[-w / 2, y, 0.01], [-w / 2 + 0.01, y, off], [w / 2 - 0.01, y + 0.004, off], [w / 2, y, 0.01]], w: 0.024, detail, up: [0, 1, 0], caps: 'round' }), { matrix: m, color: vc(c.brass, { groundAO: 0 }) });
  if (detail === 2) return;
  
  
  const x0 = -w / 2 + 0.07 + rng.rangeF(0, 0.05), x1 = w / 2 - 0.08 - rng.rangeF(0, 0.06);
  const front = 0.36 + rng.rangeF(0, 0.08), back = 0.24 + rng.rangeF(0, 0.05);
  const vs = [0, 0.3, 0.45, 0.5, 0.55, 0.7, 1];
  const us = [0, 0.25, 0.5, 0.75, 1].slice(0, detail === 0 ? 5 : 3).map((u, i, a) => i / (a.length - 1));
  const ph = rng.rangeF(0, TAU);
  const at = (u, v) => {
    const x = x0 + (x1 - x0) * u;
    const hem = 0.012 * Math.sin(u * 7 + ph);
    if (v <= 0.5) { const t = v / 0.5; const yy = y - front * (1 - t) - hem * (1 - t); return [x + 0.02 * (1 - t), yy + (t > 0.9 ? 0.02 : 0), off + 0.022 - 0.01 * t + 0.015 * Math.sin(Math.PI * t)]; }
    const t = (v - 0.5) / 0.5; return [x - 0.015 * t, y + 0.02 - back * t - hem * t, off - 0.022 - 0.008 * t];
  };
  const sh = surface({ us, vs, at: (u, v) => at(u, v), uv: (u, v) => [u, v] });
  emit(mesh, 'canvas', sh, { matrix: m, color: vc(c.towel, { groundAO: 0.1, underside: 0.2 }) });
}



function bed(mesh, m, { w, d, h, detail, rng, c }) {
  
  const frame = loft({ w, d, e: 8, detail, rng, rows: [[0.97, 0.12], [1, 0.15], [1, 0.27], [0.97, 0.3], [0, 0.3]] });
  emit(mesh, 'wood', frame, { matrix: m, color: vc(c.wood, { groundAO: 0.3 }) });
  const mat = loft({ w: w - 0.08, d: d - 0.14, e: 7, detail, rng, rows: [[0.97, 0.28], [1, 0.34], [0.99, 0.44], [0.93, 0.47], [0, 0.48]] });
  emit(mesh, 'canvas', mat, { matrix: compose(m, translate(0, 0, 0.03)), color: vc(c.sheet, { groundAO: 0.1 }) });
  
  const bz = d * 0.17 + rng.rangeF(-0.02, 0.02);
  const blanket = loft({ w: w - 0.01, d: d * 0.64, e: 6, detail, rng, wobble: 0.015, rows: [[1, 0.3], [1.01, 0.42], [0.98, 0.49], [0.9, 0.51], [0, 0.52]] });
  emit(mesh, 'canvas', blanket, { matrix: compose(m, compose(translate(rng.rangeF(-0.015, 0.015), 0, bz), rotateY(rng.rangeF(-0.03, 0.03)))), color: vc(c.blanket, { groundAO: 0.12, underside: 0.3 }) });
  if (detail < 2) {
    const pil = blob({ radii: [w * 0.3, 0.07, 0.17], subdiv: detail === 0 ? 3 : 2, seed: rng.rangeI(1, 1e5), lump: 0.06, flats: [{ n: [0, -1, 0], d: 0.04, k: 0.03 }] });
    emit(mesh, 'canvas', pil, { matrix: compose(m, compose(translate(rng.rangeF(-0.08, 0.08), 0.52, -d / 2 + 0.26), rotateY(rng.rangeF(-0.12, 0.12)))), color: vc(c.pillow, { groundAO: 0.05 }) });
  }
  
  const board = (hh, z, t) => loft({ w: w + 0.03, d: 0.07, e: 6, detail, rng, hi: 12, rows: [[1, 0], [1, hh - 0.12], [0.94 + t, hh - 0.04], [0.7, hh], [0, hh + 0.01]] });
  emit(mesh, 'wood', board(h, 0, 0), { matrix: compose(m, translate(0, 0, -d / 2 + 0.035)), color: vc(c.darkWood, { groundAO: 0.3 }) });
  emit(mesh, 'wood', board(0.55 + rng.rangeF(0, 0.08), 0, 0.03), { matrix: compose(m, translate(0, 0, d / 2 - 0.035)), color: vc(c.darkWood, { groundAO: 0.3 }) });
}

function wardrobe(mesh, m, { w, d, h, detail, rng, c }) {
  const body = loft({ w: w - 0.04, d: d - 0.04, e: 9, detail, rng, rows: [[0.97, 0], [1, 0.08], [1, h - 0.1], [1.04, h - 0.07], [1.05, h - 0.02], [0.99, h], [0, h + 0.004]] });
  emit(mesh, 'wood', body, { matrix: m, color: vc(c.wood, { groundAO: 0.35 }) });
  if (detail === 2) return;
  const split = rng.rangeF(0.04, 0.1) * (rng.next() < 0.5 ? -1 : 1);
  const dw0 = w / 2 + split - 0.05, dw1 = w / 2 - split - 0.05, dh = h - 0.26;
  const zf = d / 2 - 0.018;
  emit(mesh, 'wood', panel(dw0, dh, 0.12 + dh / 2, { detail, r: 0.05 }), { matrix: compose(m, translate(-w / 2 + 0.035 + dw0 / 2, 0, zf)), color: vc(c.darkWood, { groundAO: 0.2 }) });
  emit(mesh, 'wood', panel(dw1, dh, 0.12 + dh / 2, { detail, r: 0.05 }), { matrix: compose(m, translate(w / 2 - 0.035 - dw1 / 2, 0, zf)), color: vc(mixC(c.darkWood, c.wood, 0.3), { groundAO: 0.2 }) });
  const knobX = -w / 2 + 0.035 + dw0 + 0.012;
  for (const [kx, ky] of [[knobX - 0.05, h * 0.52], [knobX + 0.05, h * 0.5 + rng.rangeF(-0.03, 0.03)]]) {
    emit(mesh, 'metal', lathe({ points: [[0, 0], [0.018, 0.005], [0.022, 0.025], [0.012, 0.035], [0, 0.036]], sides: 6 }), { matrix: compose(m, compose(translate(kx, ky, zf + 0.012), rotateX(Math.PI / 2))), color: vc(c.brass, { groundAO: 0 }) });
  }
}

function bedside(mesh, m, { w, d, h, detail, rng, c }) {
  const body = loft({ w, d, e: 7, detail, rng, hi: 12, rows: [[0.95, 0], [1, 0.06], [1, h - 0.04], [1.03, h - 0.02], [0.98, h], [0, h + 0.003]] });
  emit(mesh, 'wood', body, { matrix: m, color: vc(c.wood, { groundAO: 0.35 }) });
  if (detail > 0) return;
  emit(mesh, 'wood', panel(w - 0.1, 0.13, h - 0.13, { detail, r: 0.025 }), { matrix: compose(m, translate(0, 0, d / 2 - 0.01)), color: vc(c.darkWood, { groundAO: 0 }) });
  
  emit(mesh, 'stone', lathe({ points: [[0, h], [0.04, h], [0.042, h + 0.09], [0.036, h + 0.092], [0, h + 0.08]], sides: sidesFor(detail, 8) }), { matrix: compose(m, translate(rng.rangeF(-0.1, -0.04), 0, rng.rangeF(-0.06, 0.04))), color: vc(c.jarA, { groundAO: 0 }) });
  emit(mesh, 'canvas', rod({ path: [[-0.09, h + 0.02, 0], [0.09, h + 0.02, 0]], w: 0.035, h: 0.13, detail, up: [0, 1, 0], caps: 'round' }), { matrix: compose(m, compose(translate(0.08, 0, 0.02), rotateY(rng.rangeF(-0.5, 0.5)))), color: vc(c.book, { groundAO: 0 }) });
}








function stairs(mesh, m, { w, d, h, detail, rng, c, foot = 1, steps = 8, down = false }) {
  const f = foot < 0 ? -1 : 1, n = Math.max(3, steps);
  const run = w / n, zi = -d / 2 + 0.03, zo = d / 2 - 0.03;
  const wood = vc(c.wood, { groundAO: 0.25 }), dark = vc(c.darkWood, { groundAO: 0.2 }), trim = vc(c.trim, { groundAO: 0.1 });
  const board = (x, y, dx) => emit(mesh, 'wood', rod({
    path: [[x + rng.rangeF(-0.008, 0.008), y + rng.rangeF(-0.004, 0.004), zi], [x + rng.rangeF(-0.008, 0.008), y + rng.rangeF(-0.004, 0.004), zo]],
    w: 0.045, h: dx, detail, up: [0, 1, 0], caps: 'none',
  }), { matrix: m, color: wood });
  const post = (x, z, top) => emit(mesh, 'wood', rod({ path: [[x, 0, z], [x + rng.rangeF(-0.006, 0.006), top, z]], w: 0.07, h: 0.07, detail, up: [1, 0, 0], caps: 'round' }), { matrix: m, color: trim });
  if (!down) {
    for (let i = 0; i < n; i++) board(f * (w / 2 - (i + 0.5) * run), h * (i + 1) / n - 0.022, run - 0.012);
    for (const z of [zi, zo]) {
      emit(mesh, 'wood', rod({ path: [[f * (w / 2 - 0.08), 0, z], [0, h / 2 + rng.rangeF(-0.01, 0.01), z], [-f * (w / 2 - 0.08), h, z]], w: 0.2, h: 0.05, detail, up: [0, 1, 0], caps: 'none' }), { matrix: m, color: dark });
    }
    const nx = f * (w / 2 - 0.05);
    post(nx, zo, 0.98);
    emit(mesh, 'wood', rod({ path: [[nx, 0.95, zo], [0, 0.95 + h / 2 + 0.01, zo], [-f * (w / 2 - 0.08), h + 0.9, zo]], w: 0.06, h: 0.05, detail, up: [0, 1, 0], caps: 'round' }), { matrix: m, color: trim });
    if (detail === 0) for (const t of [0.3, 0.55, 0.8]) { const x = nx - f * t * (w - 0.13); post(x, zo, 0.93 + h * t); }
    return;
  }
  
  const pad = loft({ w: w - 0.02, d: d - 0.02, e: 10, detail: 2, rng, rows: [[1, 0.003], [0, 0.004]] });
  emit(mesh, 'wood', pad, { matrix: m, color: vc(scaleC(c.darkWood, 0.45), { groundAO: 0.5 }) });
  board(-f * (w / 2 - run / 2), 0.012, run - 0.012);
  const y = 0.92, hx = w / 2 - 0.035, hz = d / 2 - 0.035;
  const rail = [[-f * hx, y, -hz], [f * hx, y + 0.006, -hz], [f * hx, y, hz], [-f * hx, y - 0.004, hz]];
  emit(mesh, 'wood', rod({ path: rail, w: 0.06, h: 0.05, detail, up: [0, 1, 0], caps: 'round', corner: 0 }), { matrix: m, color: trim });
  for (const [x, , z] of rail) post(x, z, y);
  if (detail === 0) for (const t of [0.33, 0.66]) for (const z of [-hz, hz]) post(-f * hx + f * t * 2 * hx, z, y);
}

const BUILD = Object.freeze({ stove, counter, sink, shelf, table, stool, tub, basin, mirror, towelRail, bed, wardrobe, bedside, stairs });





export function fixture(mesh, kind, m, { size, detail = 0, rng, c, ...rest }) {
  const f = BUILD[kind];
  if (!f) throw new Error(`unknown fixture '${kind}' (kinds: ${FIXTURE_KINDS.join(', ')})`);
  f(mesh, m, { ...size, ...rest, detail, rng, c });
  return mesh;
}
