


















import { surfacePoint, section, sdf, sdfNormal, formDistance, toY, toDressY, U, WAIST_Y, Y_NECK } from './form3d.js';

const PI = Math.PI, TAU = 2 * PI;
export const GAP = 0.15;                        
export const thickOf = (layer) => (layer ?? 1) * 0.25 + 0.25;
const off = (layer) => thickOf(layer) + GAP;


const halfPerim = (a, b) => (PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)))) / 2;
const cols = (lenCm, spacing) => Math.max(3, Math.round(lenCm / spacing) + 1);
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const sm = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };

const pl = (k) => (x) => {
  if (x <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (x <= k[i][0]) { const t = (x - k[i - 1][0]) / (k[i][0] - k[i - 1][0]); return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * t; }
  return k[k.length - 1][1];
};
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

const NN = [0, 0, 0, 1];

function projectOut(form, p, o, arms = false) {
  for (let k = 0; k < 3; k++) {
    const d = formDistance(form, p[0], p[1], p[2], arms);
    if (d >= o - 0.01) break;
    sdfNormal(form, p[0], p[1], p[2], arms, NN);
    p[0] += NN[0] * (o - d); p[1] += NN[1] * (o - d); p[2] += NN[2] * (o - d);
  }
  return p;
}






const FITTED = (u0, v0, u1, v1) => (v0 !== v1 ? 1 : v0 === 1 ? 0.97 : 0.985);


function fittedHalf(form, name, side, { top, bot, layer = 1, spacing = 2.2, rest = FITTED, fab = null, part, role, support }) {
  const p0 = side === 'front' ? -PI / 2 : PI / 2;
  const s = section(form, 160);
  const nu = cols(halfPerim(s.a, side === 'front' ? s.f : s.b) + 2, spacing);
  const nv = cols((bot(0) - top(0)) * U, spacing);
  const o = off(layer);
  return {
    name, part, role, layer, nu, nv, fab, rest, arms: false, support,
    place: (u, v) => { const phi = p0 + u * PI, y = top(phi) + v * (bot(phi) - top(phi)); return surfacePoint(form, phi, y, o); },
  };
}



const armhole = (form) => (x, y) => {
  if (y <= 106 || y >= 160) return true;
  return Math.abs(x) <= (section(form, y).a / U) * (0.78 + 0.2 * sm((y - 106) / 50));
};







function bodiceHalf(form, name, side, { keep, bottom = () => WAIST_Y, top = 86, layer = 1, spacing = 2.2, fab = null, tightTop = 0.975, stand = 0, part = 'bodice', boned = false }) {
  const p0 = side === 'front' ? -PI / 2 : PI / 2;
  const s = section(form, 160);
  const nu = cols(halfPerim(s.a, side === 'front' ? s.f : s.b) + 2, spacing);
  const shoulder = top < 108;
  const nv = cols((bottom(0) - top) * U + (shoulder ? 16 : 0), spacing);
  const F = 0.35;
  const yAt = (v, phi) => {
    const b = bottom(phi);
    if (!shoulder) return top + v * (b - top);
    return v < F ? top + (112 - top) * (v / F) : 112 + (b - 112) * ((v - F) / (1 - F));
  };
  const o = off(layer) + stand;
  const place = (u, v) => { const phi = p0 + u * PI; return surfacePoint(form, phi, yAt(v, phi), o); };
  const kept = (u, v) => { if (v < -1e-9) return false; const p = place(u, v); return !keep || keep(p[0] / U, toDressY(p[1])); };
  const dv = 1 / (nv - 1);
  return {
    name, part, role: side, layer, nu, nv, fab, arms: false, support: 'auto', boned, stand,
    place,
    mask: keep ? (u, v, p) => keep(p[0] / U, toDressY(p[1])) : null,
    rest: (u0, v0, u1, v1) => {
      if (v0 !== v1) return 1;
      if (tightTop !== 1 && !kept(u0, v0 - dv) && !kept(u1, v1 - dv)) return tightTop;
      return v0 > 1 - 1e-9 ? 0.97 : 0.985;
    },
  };
}



function bodice(form, { front, back, bottom, top, tightTop, layer, fab, stand, prefix = 'bodice', part = 'bodice', boned }) {
  const panels = [
    bodiceHalf(form, `${prefix}.front`, 'front', { keep: front, bottom, top, tightTop, layer, fab, stand, part, boned }),
    bodiceHalf(form, `${prefix}.back`, 'back', { keep: back, bottom, top, tightTop, layer, fab, stand, part, boned }),
  ];
  const seams = [
    { name: `${prefix}.sideL`, a: [`${prefix}.front`, 'right'], b: [`${prefix}.back`, 'left'], byRow: true },
    { name: `${prefix}.sideR`, a: [`${prefix}.front`, 'left'], b: [`${prefix}.back`, 'right'], byRow: true },
  ];
  return { panels, seams, bottom };
}


function ridgeY(form, X) {
  let lo = Y_NECK, hi = 150;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (section(form, m).a < Math.abs(X)) lo = m; else hi = m; }
  return hi;
}




function strap(form, name, xc, { yF = 150, yB = 150, width = 5, layer = 1, spacing = 2, tight = 0.98, part, role }) {
  const o = off(layer), yr = ridgeY(form, Math.abs(xc) + width / 2) - 1;
  const S = 160, pts = [];
  for (let i = 0; i <= S; i++) {
    const t = i / S, front = t <= 0.5, y = front ? yF + (yr - yF) * (t / 0.5) : yr + (yB - yr) * ((t - 0.5) / 0.5);
    const s = section(form, y), q = Math.max(0, 1 - (xc / s.a) ** 2);
    pts.push([xc, toY(y), (front ? s.f : -s.b) * Math.sqrt(q)]);
  }
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  const at = (d) => {
    let i = 1; while (i < L.length - 1 && L[i] < d) i++;
    const f = (d - L[i - 1]) / (L[i] - L[i - 1] || 1), a = pts[i - 1], b = pts[i];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  };
  const len = L[L.length - 1], nv = cols(len, spacing), nu = Math.max(2, Math.round(width / spacing) + 1);
  const N = [0, 0, 0];
  return {
    name, part, role, layer, nu, nv, arms: false,
    rest: (u0, v0, u1, v1) => (v0 !== v1 ? tight : 1),
    anchor: (u, v) => Math.abs(v - 0.5) < 0.08,      
    place: (u, v) => {
      const p = at(v * len); p[0] += (u - 0.5) * width * Math.sign(xc || 1);
      sdfNormal(form, p[0], p[1], p[2], false, N);
      const d = sdf(form, p[0], p[1], p[2], false), push = o - d;
      return [p[0] + N[0] * push, p[1] + N[1] * push, p[2] + N[2] * push];
    },
  };
}





function sash(form, name, ctrl, { width = 16, layer = 2, spacing = 2.5, tight = 1, thickAt = null, part, role }) {
  const pts = [];
  const surf = (xu, y, side) => {
    const X = xu * U;
    if (side === 'r') { const yr = ridgeY(form, X); return [X, toY(yr), 0]; }
    const s = section(form, y), q = Math.max(0, 1 - (X / s.a) ** 2);
    return [Math.sign(X) * Math.min(Math.abs(X), s.a), toY(y), (side === 'f' ? s.f : -s.b) * Math.sqrt(q)];
  };
  for (let c = 1; c < ctrl.length; c++) {
    const [x0, y0, s0] = ctrl[c - 1], [x1, y1, s1] = ctrl[c];
    for (let i = c === 1 ? 0 : 1; i <= 40; i++) {
      const t = i / 40, xu = x0 + (x1 - x0) * t;
      const side = t < 0.5 ? (s0 === 'r' ? s1 : s0) : (s1 === 'r' ? s0 : s1);
      let y = y0 + (y1 - y0) * t;
      if (s0 === 'r' || s1 === 'r') { const yr = ridgeY(form, xu * U); y = s0 === 'r' ? yr + (y1 - yr) * t : y0 + (yr - y0) * t; }
      pts.push(surf(xu, y, (s0 === 'r' && t === 0) || (s1 === 'r' && t === 1) ? 'r' : side));
    }
  }
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  const len = L[L.length - 1];
  const at = (d) => {
    let i = 1; while (i < L.length - 1 && L[i] < d) i++;
    const f = (d - L[i - 1]) / (L[i] - L[i - 1] || 1), a = pts[i - 1], b = pts[i];
    return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f], t: [b[0] - a[0], b[1] - a[1], b[2] - a[2]] };
  };
  const nv = cols(len, spacing), nu = Math.max(3, Math.round(width / spacing) + 1);
  const N = [0, 0, 0, 1];
  const th = (y) => thickAt ? thickAt(y) : 0;
  return {
    name, part, role, layer, nu, nv, support: 'auto', arms: false,
    thickAt: thickAt ? (p) => thickOf(layer) + th(toDressY(p[1])) : null,
    rest: (u0, v0, u1, v1) => (v0 !== v1 ? tight : 1),
    place: (u, v) => {
      const { p, t } = at(v * len);
      sdfNormal(form, p[0], p[1], p[2], false, N);
      let sx = N[1] * t[2] - N[2] * t[1], sy = N[2] * t[0] - N[0] * t[2], sz = N[0] * t[1] - N[1] * t[0];
      const l = Math.hypot(sx, sy, sz) || 1; sx /= l; sy /= l; sz /= l;
      const q = [p[0] + sx * (u - 0.5) * width, p[1] + sy * (u - 0.5) * width, p[2] + sz * (u - 0.5) * width];
      return projectOut(form, q, off(layer) + th(toDressY(q[1])), false);
    },
  };
}










function skirtPanel(form, name, { phi0, phi1, top = WAIST_Y, hem, width = null, k = 0.27, kz = null, layer = 1, spacing = 5, vspacing = 4, folds = 9, hang = 0.72, extra = 1, seed = 1, tuck = null, tightTop = 1, part = 'skirt', role, fab = null, anchorTop = false, maxCols = 34, aspect = null, gathered = extra > 1 }) {
  
  const T = typeof top === 'function' ? top : () => top, top0 = T(PI / 2);
  const o = off(layer), kzz = kz ?? k;
  const w = section(form, top0);
  const wave = (phi) => Math.sin(folds * phi + 0.9 * Math.sin(3 * phi + seed) + 0.5 * Math.sin(5 * phi + seed * 2.3));
  const place = (u, v) => {
    const phi = phi0 + u * (phi1 - phi0), t0 = T(phi), y = t0 + v * (hem(phi) - t0);
    const s = section(form, y), drop = (y - t0) * U, fb = Math.cos(phi) >= 0;
    const fa = s.a + o, fz = (fb ? s.f : s.b) + o;
    let ap, bp;
    if (width) { const W = width(y); ap = Math.max(fa, W); bp = Math.max(fz, W * (aspect ? (fb ? aspect.f : aspect.b) : (fb ? w.f : w.b) / w.a)); }
    else { ap = Math.max(fa, w.a + o + drop * k); bp = Math.max(fz, (fb ? w.f : w.b) + o + drop * kzz); }
    const ac = Math.max(fa, fa + (ap - fa) * hang), bc = Math.max(fz, fz + (bp - fz) * hang);
    const ratio = (extra * (ap + bp)) / (ac + bc), eps = (2 * Math.sqrt(Math.max(0, ratio - 1))) / folds;
    const r = 1 + eps * wave(phi) * clamp01(drop / 8 + (extra > 1 ? 1 : 0));
    return [Math.max(fa, ac * r) * Math.sin(phi), toY(y), Math.max(fz, bc * r) * Math.cos(phi)];
  };
  const hy = hem((phi0 + phi1) / 2), dh = (hy - top0) * U;
  const sp = place(0.5, 1), rr = Math.hypot(sp[0], sp[2]);
  
  
  const nu = Math.min(maxCols, cols((rr * Math.abs(phi1 - phi0)) * Math.max(1, Math.sqrt(extra)), spacing));
  const nv = Math.min(30, cols(dh, vspacing));
  const dv = 1 / (nv - 1);
  return {
    name, part, role, layer, nu, nv, place, fab, tether: 'top', gathered,
    anchor: anchorTop ? (u, v) => v === 0 : null,
    rest: (u0, v0, u1, v1) => {
      if (v0 !== v1) return 1;
      if (v0 === 0) return tightTop;
      if (tuck && v0 > 1 - tuck.rows * dv - 1e-9) return tuck.scale;
      return 1;
    },
  };
}


function fullSkirt(form, name, opts) {
  const panels = [
    skirtPanel(form, `${name}.front`, { ...opts, phi0: -PI / 2, phi1: PI / 2, role: 'front' }),
    skirtPanel(form, `${name}.back`, { ...opts, phi0: PI / 2, phi1: 1.5 * PI, role: 'back' }),
  ];
  return {
    panels,
    seams: [
      { name: `${name}.sideL`, a: [`${name}.front`, 'right'], b: [`${name}.back`, 'left'] },
      { name: `${name}.sideR`, a: [`${name}.front`, 'left'], b: [`${name}.back`, 'right'] },
    ],
    waist: [[`${name}.front`, 'top'], [`${name}.back`, 'top']],
  };
}







function sleeve(form, name, sideSign, { s1, R = () => 0, layer = 1, spacing = 2, fab = null, tightEnd = 1, tightRows = 2, part = 'sleeve' }) {
  const A = form.arm, r = A.r, o = off(layer);
  const tx = sideSign * A.top[0], ty = A.top[1], bx = sideSign * A.bot[0], by = A.bot[1];
  const L = Math.hypot(bx - tx, by - ty), dx = (bx - tx) / L, dy = (by - ty) / L;
  const e1x = sideSign * -dy, e1y = sideSign * dx;              
  const s0 = -0.75 * r;
  let maxR = 0;
  for (let k = 0; k <= 20; k++) maxR = Math.max(maxR, R(s0 + (k / 20) * (s1 - s0), k / 20));
  const nu = Math.max(10, cols(TAU * (r + o + maxR * 0.7), spacing) - 1);
  const nv = cols(s1 - s0, spacing), dv = 1 / (nv - 1);
  return {
    name, part, role: sideSign > 0 ? 'left' : 'right', layer, nu, nv, fab, wrap: true, support: 'auto', tether: 'top',
    place: (u, v) => {
      const th = u * TAU * (1 - 1 / nu), s = s0 + v * (s1 - s0), t = v;
      const base = s < 0 ? Math.sqrt(Math.max(0, r * r - s * s)) : r;
      const rr = base + o + R(s, t) * (s < 0 ? 0.3 : 1);
      const cx = tx + dx * s, cy = ty + dy * s;
      const p = [cx + e1x * Math.cos(th) * rr, cy + e1y * Math.cos(th) * rr, Math.sin(th) * rr];
      return projectOut(form, p, o, true);
    },
    rest: (u0, v0, u1, v1) => (v0 === v1 && v0 > 1 - tightRows * dv - 1e-9 ? tightEnd : 1),
  };
}
const pairOf = (form, name, opts) => ({ panels: [sleeve(form, `${name}.L`, 1, opts), sleeve(form, `${name}.R`, -1, opts)], seams: [] });






function collar(form, name, { gap = 0.14, len, y0 = 88, layer = 2, spacing = 2, outer = 1, fullFrom = 0.25, neck = 0.97, pinTop = false, fab = null, part = 'collar' }) {
  const o = off(layer);
  const s = section(form, y0 + 20);
  const nu = cols(halfPerim(s.a, (s.f + s.b) / 2) * 2 * (1 - gap / PI), spacing);
  let mx = 0; for (let k = 0; k <= 16; k++) mx = Math.max(mx, len(gap + (k / 16) * (TAU - 2 * gap)));
  const nv = cols(mx * U, spacing);
  return {
    name, part, layer, nu, nv, fab, support: pinTop ? null : 'auto', arms: false, pinNeck: pinTop, gathered: outer > 1,
    pin: pinTop ? (u, v) => v === 0 : null,
    place: (u, v) => { const phi = gap + u * (TAU - 2 * gap); return surfacePoint(form, phi, y0 + v * len(phi), o); },
    
    
    rest: (u0, v0, u1, v1) => (v0 !== v1 ? 1 : v0 === 0 ? neck : 1 + (outer - 1) * sm((v0 - fullFrom) / (1 - fullFrom))),
  };
}


function patch(form, name, { phi0, phi1, y0, y1, layer = 3, spacing = 1.6, ruffle = 1, pinTop = true, fab = null, part = 'collar' }) {
  const o = off(layer);
  const s = section(form, (y0 + y1) / 2);
  const nu = cols(((s.a + s.f) / 2) * Math.abs(phi1 - phi0), spacing), nv = cols((y1 - y0) * U, spacing);
  return {
    name, part, layer, nu, nv, fab, arms: false, pin: pinTop ? (u, v) => v === 0 : null, gathered: ruffle > 1,
    place: (u, v) => surfacePoint(form, phi0 + u * (phi1 - phi0), y0 + v * (y1 - y0), o),
    rest: (u0, v0, u1, v1) => (v0 === v1 ? ruffle : 1),
  };
}



const flat = (y) => () => y;
const band = (y0, y1) => (x, y) => y >= y0 && y <= y1;



const BODICES = {
  
  square(form) {
    const top = flat(150), bot = flat(WAIST_Y);
    const panels = [
      fittedHalf(form, 'bodice.front', 'front', { top, bot, part: 'bodice', role: 'front' }),
      fittedHalf(form, 'bodice.back', 'back', { top, bot, part: 'bodice', role: 'back' }),
      strap(form, 'bodice.strapL', 16.4, { part: 'bodice', role: 'strap' }),
      strap(form, 'bodice.strapR', -16.4, { part: 'bodice', role: 'strap' }),
    ];
    const seams = [
      { name: 'bodice.sideL', a: ['bodice.front', 'right'], b: ['bodice.back', 'left'] },
      { name: 'bodice.sideR', a: ['bodice.front', 'left'], b: ['bodice.back', 'right'] },
      { name: 'bodice.strapL.front', a: ['bodice.strapL', 'top'], b: ['bodice.front', 'top'], attach: true },
      { name: 'bodice.strapL.back', a: ['bodice.strapL', 'bottom'], b: ['bodice.back', 'top'], attach: true },
      { name: 'bodice.strapR.front', a: ['bodice.strapR', 'top'], b: ['bodice.front', 'top'], attach: true },
      { name: 'bodice.strapR.back', a: ['bodice.strapR', 'bottom'], b: ['bodice.back', 'top'], attach: true },
    ];
    return { panels, seams, rests: [['bodice.front', 'upper'], ['bodice.back', 'upper'], ['bodice.strapL', 'ridge'], ['bodice.strapR', 'ridge']] };
  },
  
  bustier(form) {
    const f = pl([[0, 154], [14, 134], [30, 138], [50, 152], [80, 158]]);
    
    return { ...bodice(form, { top: 130, front: (x, y) => y >= f(Math.abs(x)), back: (x, y) => y >= 158, tightTop: 0.97, boned: true, bottom: (phi) => WAIST_Y + 10 * Math.max(0, Math.cos(phi)) ** 4 }), strapless: true };
  },
  corset(form) {
    const f = pl([[0, 148], [20, 140], [45, 146], [80, 156]]);
    return {
      ...bodice(form, { top: 136, front: (x, y) => y >= f(Math.abs(x)), back: (x, y) => y >= 156, tightTop: 0.97, boned: true, bottom: (phi) => WAIST_Y + 16 * Math.max(0, Math.cos(phi)) ** 6 }),
      strapless: true,
    };
  },
  
  highneck(form) {
    const arm = armhole(form);
    return bodice(form, { front: (x, y) => arm(x, y), back: (x, y) => arm(x, y) });
  },
  qipao(form) {
    const arm = armhole(form);
    return bodice(form, { top: 82, front: (x, y) => arm(x, y), back: (x, y) => arm(x, y) });
  },
  
  vneck(form) {
    const arm = armhole(form), V = (x) => 178 - 68 * Math.min(1, Math.abs(x) / 22);
    return bodice(form, {
      front: (x, y) => arm(x, y) && (Math.abs(x) >= 22 ? true : y >= V(x)),
      back: (x, y) => arm(x, y) && (Math.abs(x) >= 22 || y >= 110),
    });
  },
  
  
  halter(form) {
    return bodice(form, {
      front: (x, y) => (y >= 160 || Math.abs(x) <= 16 + (y - 88) * 0.64) && ((x / 8) ** 2 + ((y - 121) / 19) ** 2 > 1),
      back: (x, y) => y >= 200 || y <= 93,
    });
  },
  
  empire(form) {
    const arm = armhole(form), sc = (x) => 146 - 34 * (Math.abs(x) / 30) ** 2;
    return { ...bodice(form, { bottom: flat(185), front: (x, y) => arm(x, y) && (Math.abs(x) >= 30 || y >= sc(x)), back: (x, y) => arm(x, y) && (Math.abs(x) >= 30 || y >= 110) }), waistY: 185 };
  },
  
  choli(form) {
    const arm = armhole(form), sc = (x) => 152 - 40 * (Math.abs(x) / 32) ** 2;
    return { ...bodice(form, { bottom: flat(196), front: (x, y) => arm(x, y) && (Math.abs(x) >= 32 || y >= sc(x)), back: (x, y) => arm(x, y) && (Math.abs(x) >= 32 || y >= 118) }), waistY: null };
  },
  
  jeogori(form) {
    const arm = armhole(form);
    return { ...bodice(form, { bottom: flat(182), layer: 2, stand: 0.6, front: (x, y) => arm(x, y) && y >= 88 + 20 * (1 - Math.min(1, Math.abs(x) / 16)), back: (x, y) => arm(x, y) && y >= 92 }), waistY: null };
  },
  
  kebaya(form) {
    const arm = armhole(form), V = (x) => 158 - 56 * Math.min(1, Math.abs(x) / 26);
    return { ...bodice(form, { bottom: flat(300), layer: 2, front: (x, y) => arm(x, y) && (Math.abs(x) >= 26 || y >= V(x)), back: (x, y) => arm(x, y) && (Math.abs(x) >= 26 || y >= 100), tightTop: 0.93 }), waistY: null };
  },
  
  offshoulder(form) {
    const b = bodice(form, { top: 132, front: (x, y) => y >= 142, back: (x, y) => y >= 142, tightTop: 0.97, boned: true });
    const A = form.arm, o = off(2);
    const bandPanel = {
      name: 'bodice.band', part: 'bodice', role: 'band', layer: 2, nu: 64, nv: 6, wrap: true, support: 'auto',
      place: (u, v) => {
        const phi = u * TAU * (1 - 1 / 64), y = 120 + v * 22, Y = toY(y), s = section(form, y);
        const t = (Y - A.top[1]) / (A.bot[1] - A.top[1]), ax = A.top[0] + (A.bot[0] - A.top[0]) * t + A.r;
        const a = Math.max(s.a, ax) + o, fb = Math.cos(phi) >= 0;
        return projectOut(form, [a * Math.sin(phi), Y, ((fb ? s.f : s.b) + o) * Math.cos(phi)], o, true);
      },
      rest: (u0, v0, u1, v1) => (v0 === v1 ? 0.96 : 1),
    };
    return { panels: [...b.panels, bandPanel], seams: b.seams, strapless: true, rests: [['bodice.band', 'anchors']] };
  },
  
  
  sabai(form) {
    const tube = bodice(form, { top: 150, bottom: flat(206), front: band(150, 206), back: band(150, 206), tightTop: 0.97, boned: true });
    const tail = sash(form, 'bodice.sabai', [[-44, 206, 'f'], [34, 0, 'r'], [34, 330, 'b']], { width: 16, layer: 2, part: 'bodice', role: 'drape' });
    return { panels: [...tube.panels, tail], seams: tube.seams, waistY: null, strapless: true, rests: [['bodice.sabai', 'anchors']] };
  },
};


const SKIRTS = {
  aline: (form, o) => fullSkirt(form, 'skirt', { top: o.top, hem: flat(540), k: 0.27, seed: o.seed, tightTop: o.band }),
  ballgown: (form, o) => fullSkirt(form, 'skirt', { top: o.top, hem: flat(552), k: 0.42, folds: 11, hang: 0.6, seed: o.seed, tightTop: o.band }),
  mermaid: (form, o) => fullSkirt(form, 'skirt', {
    top: o.top, hem: flat(552), seed: o.seed, tightTop: o.band, folds: 10, hang: 0.7,
    width: (y) => y < 430 ? 0 : section(form, 430).a + off(1) + ((y - 430) * U) * 0.95,
  }),
  flounce(form, o) {
    const up = fullSkirt(form, 'skirt', { top: o.top, hem: flat(450), k: 0.2, seed: o.seed, tightTop: o.band, folds: 7 });
    
    
    
    const t0 = typeof o.top === 'function' ? o.top(PI / 2) : o.top;
    const fa = section(form, 450).a + off(1), ap = section(form, t0).a + off(1) + (450 - t0) * U * 0.2;
    const r0 = fa + (ap - fa) * 0.72 + (off(2) - off(1));
    
    const pf = up.panels[0].place(0.5, 1), pb = up.panels[1].place(0.5, 1), ps = up.panels[0].place(1, 1);
    const aspect = { f: Math.abs(pf[2]) / Math.abs(ps[0]), b: Math.abs(pb[2]) / Math.abs(ps[0]) };
    const fl = fullSkirt(form, 'flounce', { top: 446, hem: flat(556), layer: 2, width: (y) => r0 + (y - 446) * U * 0.55, aspect, folds: 14, hang: 0.55, extra: 1.4, gathered: true, seed: o.seed + 1 });
    return { panels: [...up.panels, ...fl.panels], seams: [...up.seams, ...fl.seams, { name: 'flounce.join.front', a: ['flounce.front', 'top'], b: ['skirt.front', 'bottom'] }, { name: 'flounce.join.back', a: ['flounce.back', 'top'], b: ['skirt.back', 'bottom'] }], waist: up.waist };
  },
  odette(form, o) {
    const base = fullSkirt(form, 'skirt', { top: o.top, hem: flat(552), k: 0.42, folds: 11, hang: 0.6, seed: o.seed, tightTop: o.band });
    const over = skirtPanel(form, 'skirt.over', { phi0: 0.4, phi1: TAU - 0.4, top: o.top, hem: (phi) => 546 - 20 * Math.cos(phi), k: 0.46, layer: 2, folds: 13, hang: 0.55, seed: o.seed + 3, anchorTop: true });
    return { panels: [...base.panels, over], seams: base.seams, waist: base.waist };
  },
  tea: (form, o) => fullSkirt(form, 'skirt', { top: o.top, hem: flat(466), k: 0.55, folds: 12, hang: 0.62, seed: o.seed, tightTop: o.band }),
  highlow: (form, o) => fullSkirt(form, 'skirt', { top: o.top, hem: (phi) => 485 - 55 * Math.cos(phi), k: 0.3, seed: o.seed, tightTop: o.band }),
  bubble: (form, o) => fullSkirt(form, 'skirt', { top: o.top, hem: flat(414), k: 0.05, folds: 9, hang: 0.9, seed: o.seed, tightTop: o.band, tuck: { rows: 1, scale: 0.88 } }),
  phasin: (form, o) => fullSkirt(form, 'skirt', { top: o.top, hem: flat(572), k: 0.04, folds: 6, hang: 0.85, seed: o.seed, tightTop: o.band }),
  
  bustle(form, o) {
    const under = fullSkirt(form, 'skirt', { top: o.top, hem: flat(552), k: 0.2, seed: o.seed, tightTop: o.band });
    const back = skirtPanel(form, 'skirt.drape', { phi0: PI / 2 + 0.25, phi1: 1.5 * PI - 0.25, top: o.top, hem: flat(392), k: 0.3, layer: 2, folds: 10, hang: 0.5, seed: o.seed + 5, anchorTop: true });
    const apron = skirtPanel(form, 'skirt.apron', { phi0: -1.2, phi1: 1.2, top: o.top, hem: (phi) => 322 + 10 * Math.cos(phi * 2), k: 0.22, layer: 2, folds: 7, hang: 0.5, extra: 1.25, seed: o.seed + 7, anchorTop: true });
    return { panels: [...under.panels, back, apron], seams: under.seams, waist: under.waist };
  },
  
  chima: (form, o) => fullSkirt(form, 'skirt', { top: o.joined ? o.top : 162, hem: flat(592), k: 0.33, folds: 12, hang: 0.62, seed: o.seed, tightTop: o.joined ? 1 : 0.95 }),
  
  
  aodai(form, o) {
    const under = fullSkirt(form, 'skirt', { top: o.top, hem: flat(590), k: 0.1, folds: 7, hang: 0.85, seed: o.seed, tightTop: o.band });
    const fr = skirtPanel(form, 'skirt.panelF', { phi0: -PI / 2 + 0.3, phi1: PI / 2 - 0.3, top: o.top, hem: flat(575), k: 0.05, layer: 2, folds: 5, hang: 0.9, seed: o.seed + 2, anchorTop: true });
    const bk = skirtPanel(form, 'skirt.panelB', { phi0: PI / 2 + 0.3, phi1: 1.5 * PI - 0.3, top: o.top, hem: flat(580), k: 0.05, layer: 2, folds: 5, hang: 0.9, seed: o.seed + 4, anchorTop: true });
    return { panels: [...under.panels, fr, bk], seams: under.seams, waist: under.waist };
  },
  
  
  saree(form, o) {
    const under = fullSkirt(form, 'skirt', { top: o.top, hem: flat(566), k: 0.08, folds: 6, hang: 0.85, seed: o.seed, tightTop: o.band });
    const pleats = skirtPanel(form, 'skirt.pleats', { phi0: -0.5, phi1: 0.5, top: o.top, hem: flat(564), k: 0.1, layer: 2, folds: 44, hang: 0.9, extra: 2.2, seed: o.seed + 1, spacing: 1.5, vspacing: 5, anchorTop: true, maxCols: 44 });
    const pallu = sash(form, 'skirt.pallu', [[-40, 250, 'f'], [30, 0, 'r'], [30, 430, 'b']], { width: 22, layer: 3, part: 'skirt', role: 'pallu', thickAt: (y) => (y > WAIST_Y ? (y - WAIST_Y) * U * 0.09 + 0.6 : 0) });
    return { panels: [...under.panels, pleats, pallu], seams: under.seams, waist: under.waist };
  },
  
  sarong(form, o) {
    const tube = fullSkirt(form, 'skirt', { top: o.top, hem: flat(566), k: 0.04, folds: 6, hang: 0.9, seed: o.seed, tightTop: o.band });
    const fan = skirtPanel(form, 'skirt.wiron', { phi0: -0.32, phi1: 0.32, top: o.top, hem: flat(562), k: 0.05, layer: 2, folds: 50, hang: 0.9, extra: 1.9, seed: o.seed + 1, spacing: 1.4, vspacing: 5, anchorTop: true, maxCols: 40 });
    return { panels: [...tube.panels, fan], seams: tube.seams, waist: tube.waist };
  },
  
  lehenga(form, o) {
    const sk = fullSkirt(form, 'skirt', { top: o.top, hem: flat(574), k: 0.45, folds: 13, hang: 0.6, seed: o.seed, tightTop: o.band });
    const dup = sash(form, 'skirt.dupatta', [[-46, 200, 'f'], [32, 0, 'r'], [32, 360, 'b']], { width: 20, layer: 3, part: 'skirt', role: 'dupatta', thickAt: (y) => (y > WAIST_Y ? (y - WAIST_Y) * U * 0.3 + 0.8 : 0) });
    return { panels: [...sk.panels, dup], seams: sk.seams, waist: sk.waist };
  },
};

const SLEEVES = {
  cap: (form) => pairOf(form, 'sleeve.cap', { s1: 7 }),
  puff: (form) => pairOf(form, 'sleeve.puff', { s1: 12, R: (s, t) => 3.4 * Math.sin(PI * clamp01(t)) ** 0.7, tightEnd: 0.9 }),
  bishop: (form) => pairOf(form, 'sleeve.bishop', { s1: 52, R: (s, t) => 0.4 + 5 * sm((t - 0.3) / 0.6) * (t < 0.95 ? 1 : 0.2), tightEnd: 0.8 }),
  angel: (form) => pairOf(form, 'sleeve.angel', { s1: 56, R: (s, t) => 0.5 + 16 * sm(t / 0.9), spacing: 2.4 }),
  flutter: (form) => pairOf(form, 'sleeve.flutter', { s1: 11, R: (s, t) => 0.5 + 7 * t }),
  juliet: (form) => pairOf(form, 'sleeve.juliet', { s1: 50, R: (s, t) => (t < 0.28 ? 3.6 * Math.sin(PI * t / 0.28) ** 0.7 : 0.3), tightEnd: 0.9, tightRows: 1 }),
  bell: (form) => pairOf(form, 'sleeve.bell', { s1: 48, R: (s, t) => 0.3 + 13 * sm((t - 0.5) / 0.5) }),
  
  terno: (form) => pairOf(form, 'sleeve.terno', { s1: 12, R: (s, t) => 1 + 6 * t, fab: { bend: 0.85 } }),
};

const COLLARS = {
  peterpan: (form) => ({ panels: [collar(form, 'collar', { len: (phi) => (Math.cos(phi) > 0 ? 22 : 15) })], seams: [] }),
  bertha: (form) => ({ panels: [collar(form, 'collar', { gap: 0.05, len: () => 52, outer: 1.35, spacing: 2.2, neck: 0.93 })], seams: [] }),
  
  ruffle: (form) => ({ panels: [collar(form, 'collar', { gap: 0.05, len: () => 22, outer: 1.7, spacing: 1.6, fullFrom: 0.3, pinTop: true })], seams: [] }),
  
  sailor: (form) => ({ panels: [collar(form, 'collar', { gap: 0.3, len: (phi) => { const b = Math.abs(((phi % TAU) + TAU) % TAU - PI); return b < 1.05 ? 72 : 26 + 20 * (1 - Math.min(1, b / PI)); } })], seams: [] }),
  
  jabot: (form) => ({ panels: [patch(form, 'collar.jabot', { phi0: -0.32, phi1: 0.32, y0: 90, y1: 168, ruffle: 1.6 })], seams: [] }),
  
  bow: (form) => ({
    panels: [
      patch(form, 'collar.knot', { phi0: -0.22, phi1: 0.22, y0: 86, y1: 96, spacing: 1.2 }),
      patch(form, 'collar.tailL', { phi0: 0.04, phi1: 0.2, y0: 94, y1: 150, spacing: 1.2 }),
      patch(form, 'collar.tailR', { phi0: -0.2, phi1: -0.04, y0: 94, y1: 150, spacing: 1.2 }),
    ],
    seams: [],
  }),
  
  
  medici(form) {
    const o = off(2), nu = 26, nv = 8;
    return {
      panels: [{
        name: 'collar.medici', part: 'collar', layer: 2, nu, nv, arms: false, fab: { bend: 0.5 },
        pin: (u, v) => v === 0 || v === 1,
        place: (u, v) => {
          const phi = PI / 2 - 0.35 + u * (PI + 0.7), b = surfacePoint(form, phi, 98, o);
          const out = Math.hypot(b[0], b[2]) || 1;
          return [b[0] + (b[0] / out) * v * 7, b[1] + v * 15, b[2] + (b[2] / out) * v * 7];
        },
      }],
      seams: [],
    };
  },
};

export const DRAFTED = { bodice: Object.keys(BODICES), skirt: Object.keys(SKIRTS), collar: Object.keys(COLLARS), sleeve: Object.keys(SLEEVES) };






export function draft(design, form) {
  const out = { panels: [], seams: [], meta: {} };
  const seed = (hashStr(`${design.bodice}|${design.skirt}|${design.seed ?? ''}`) % 997) / 97;
  const b = BODICES[design.bodice]?.(form);
  const waistY = b ? (b.waistY === undefined ? WAIST_Y : b.waistY) : null;
  const joined = waistY != null;
  
  const top = joined ? (b.bottom && waistY === WAIST_Y ? b.bottom : waistY) : WAIST_Y;
  const s = SKIRTS[design.skirt]?.(form, { top, joined, seed, band: joined ? 1 : 0.97 });
  const c = COLLARS[design.collar]?.(form), sl = SLEEVES[design.sleeve]?.(form);
  for (const d of [b, s, c, sl]) if (d) { out.panels.push(...d.panels); out.seams.push(...d.seams); }
  if (b && s && s.waist && joined) {
    out.seams.push({ name: 'waist.front', a: s.waist[0], b: ['bodice.front', 'bottom'] });
    out.seams.push({ name: 'waist.back', a: s.waist[1], b: ['bodice.back', 'bottom'] });
  }
  const rests = [...(b?.rests || (b ? [['bodice.front', 'upper'], ['bodice.back', 'upper']] : []))];
  if (c) rests.push(...c.panels.filter((p) => p.support === 'auto' || p.pinNeck).map((p) => [p.name, 'neck']));
  if (sl) rests.push(...sl.panels.map((p) => [p.name, 'cap']));
  out.meta = { rests, strapless: b?.strapless ? ['bodice.front', 'bodice.back'] : [], waistY };
  out.capacity = 16000;
  return out;
}
