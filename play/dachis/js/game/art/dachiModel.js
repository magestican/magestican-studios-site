




















import * as S from '../../vendor/fml/moon/mesh/sdf.js';
import { MeshData } from '../../vendor/fml/moon/mesh/meshData.js';
import { speciesById, METAL_TINTS, planIndex } from '../data/species.js';
import { planLayout, planParts, SWING } from './dachiPlans.js';

const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const lin = (h) => { const s = h.replace('#', ''); return [0, 2, 4].map((i) => toLin(parseInt(s.slice(i, i + 2), 16) / 255)); };
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const WHITE = [1, 1, 1], BLACK = [0, 0, 0];


export const vivid = (c) => { const g = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; return c.map((v) => Math.max(0, Math.min(1, (g + (v - g) * 1.65) * 0.88))); };


const deep = (c) => { const lo = Math.min(...c) * 0.85, hi = Math.max(...c); return c.map((v) => Math.max(0, (v - lo) / (hi - lo + 1e-6))); };
export const light = (c, t) => mix(c, WHITE, t), dark = (c, t) => mix(c, BLACK, t);
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];




export function ell(c, R) {
  const e = S.ellipsoid(c, R), rm = -Math.min(R[0], R[1], R[2]);
  
  
  
  return { d: (x, y, z) => Math.max(e.d(x, y, z), rm), s: (x, y, z) => { const r = e.s(x, y, z); return { d: Math.max(r.d, rm), c: r.c, m: r.m }; }, b: { ...e.b, f: 1 } };
}

export const INK = lin('#1d1a26'), IVORY = lin('#f6efdc'), METAL = lin('#b9c3cf'), GOLD = lin('#e9b83a');
const PINK = lin('#ffb3d0'), BLUSH = lin('#ff6f95'), LEAF = lin('#6ee07a');
const GLOW_RED = lin('#ff3a3a'), FLAME_A = lin('#ffd070'), FLAME_B = lin('#f06018'), GLOW_CYAN = lin('#39e6ff');
const P = (node, color, material) => S.paint(node, { color, material });
export const fur = (node, color) => P(node, color, 'fur');
export const metal = (node, color = METAL) => P(node, color, 'metal');
export const glow = (node, color) => P(node, color, 'lamp-glow');






function layout(shape) {
  if (shape === 'pear') return { 
    parts: [ell([0, 0.55, 0], [0.62, 0.55, 0.58]), ell([0, 1.64, 0.08], [1.04, 0.92, 0.94])], k: 0.2,
    chest: ell([0, 0.55, 0], [0.62, 0.55, 0.58]), head: { c: [0, 1.64, 0.08], r: 0.97 },
    arms: [[0.58, 0.6, 0.2]], feet: [[0.3, 0.08, 0.2]], tail: [0, 0.42, -0.55], wing: [0.36, 1.0, -0.45],
    belly: [0, 0.5, 0.52], neck: 0.9, low: 0.72, back: [0, 0.7, -0.55],
  };
  if (shape === 'long') return { 
    parts: [ell([0, 0.6, -0.25], [0.54, 0.44, 0.76]), ell([0, 1.5, 0.42], [1.02, 0.9, 0.92]),
      ell([0, 1.14, 1.22], [0.3, 0.2, 0.22])], k: 0.22,
    chest: ell([0, 0.6, -0.25], [0.54, 0.44, 0.76]), head: { c: [0, 1.5, 0.42], r: 0.95 }, snout: [0, 1.14, 1.22],
    legs: [[0.3, 0.2], [0.3, -0.66]], tail: [0, 0.68, -0.92], wing: [0.3, 0.98, -0.35], belly: [0, 0.46, 0.3],
    neck: 0.92, low: 0.8, back: [0, 0.95, -0.5],
  };
  if (shape === 'blob') { 
    const drips = [];
    for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.3; drips.push(S.sphere([Math.sin(a) * 0.84, 0.24, Math.cos(a) * 0.78], 0.28)); }
    const tip = S.union(0.1, S.roundCone([0, 1.35, -0.02], [0.06, 2.05, -0.1], 0.42, 0.14), S.roundCone([0.06, 2.05, -0.1], [0.32, 2.3, -0.12], 0.14, 0.06)); 
    return {
      parts: [ell([0, 0.88, 0], [1.1, 0.88, 1.0]), tip, ...drips], k: 0.25,
      chest: ell([0, 0.88, 0], [1.1, 0.88, 1.0]), head: { c: [0, 1.06, 0.06], r: 0.94 },
      arms: [[1.0, 0.72, 0.25]], feet: [], tail: [0, 0.55, -0.9], wing: [0.5, 1.15, -0.55], belly: [0, 0.58, 0.8],
      neck: 1.25, low: 0.62, back: [0, 1.05, -0.8],
    };
  }
  return { 
    parts: [ell([0, 1.12, 0.03], [1.1, 0.96, 1.0]), ell([0, 0.5, 0], [0.8, 0.44, 0.72])], k: 0.3,
    chest: ell([0, 0.5, 0], [0.8, 0.44, 0.72]), head: { c: [0, 1.14, 0.06], r: 0.98 },
    arms: [[0.78, 0.5, 0.3]], feet: [[0.38, 0.08, 0.3]], tail: [0, 0.48, -0.72], wing: [0.5, 1.35, -0.5], belly: [0, 0.42, 0.62],
    neck: 0.8, low: 0.5, back: [0, 1.0, -0.85],
  };
}



const EYE = [0.42, 0.24, 0.87];

function onHead(h, dx, dy, dz) { const n = norm([dx, dy, dz]); return { p: add(h.c, n, h.r), n }; }
function atSurface(node, frame) { return S.place(node, frame.p, frame.X, frame.Y, frame.n); }
function frameAt(h, dx, dy, dz, inset = 0) {
  const { p, n } = onHead(h, dx, dy, dz), f = S.frameFromNormal(n);
  return { p: add(p, n, -inset * h.r), X: f.X, Y: f.Y, n };
}

function alongNormal(node, f) { return S.place(node, f.p, f.X, f.n, cross(f.X, f.n)); }



function splitRegion(sp, ly, h, partNode) {
  const { mode, side } = sp;
  if (mode === 'vertical') return (x) => side * x;
  
  if (mode === 'horizontal') return side > 0 ? (x, y) => y - (h.c[1] + 0.58 * h.r) : (x, y) => ly.low - y;
  if (mode === 'diagonal') {
    
    const n = norm([side, 0.45, 0]), c = [0, h.c[1] + 0.1, 0];
    return (x, y) => (x - c[0]) * n[0] + (y - c[1]) * n[1];
  }
  if (sp.part === 'mask') { 
    
    return (x, y, z) => Math.min(z - (h.c[2] + 0.3 * h.r), h.c[1] - 0.2 * h.r - y, y - (h.c[1] - 0.95 * h.r));
  }
  if (sp.part === 'eye') { 
    const e = onHead(h, side * EYE[0], EYE[1], EYE[2]).p;
    return (x, y, z) => 0.78 * h.r - Math.hypot(x - e[0], y - e[1], z - e[2]);
  }
  if (partNode) return (x, y, z) => 0.05 - partNode.d(x, y, z);
  return () => -1;
}



function splitPaint(node, region, sp, ly, h, col, metalCol, lampCol) {
  const lampPart = sp.mat === 'lamp-glow' && sp.mode === 'part' && sp.part !== 'mask' && sp.part !== 'eye';
  const core = coreAt(sp, ly, h);
  return {
    d: node.d, b: node.b,
    s: (x, y, z) => {
      const r = node.s(x, y, z);
      if (r.m !== 'fur') return r;
      const f = region(x, y, z);
      const seam = sp.mat === 'lamp-glow' && !lampPart ? 0.075 : 0.035; 
      if (f < -seam) return r;
      if (f < seam) { 
        if (sp.mat === 'lamp-glow' && !lampPart) return { d: r.d, c: lampCol, m: 'lamp-glow' };
        return { d: r.d, c: dark(r.c, 0.55), m: r.m };
      }
      if (lampPart) return { d: r.d, c: mix(lampCol, WHITE, 0.15 * sm(0, 0.3, f)), m: 'lamp-glow' };
      if (sp.mat === 'bone') {
        const body = y < ly.neck - 0.05 && y > 0.3 && z > -0.35;
        if (body && Math.abs(x) > 0.14 && Math.sin((y - ly.belly[1]) * 19) > 0.45) return { d: r.d, c: dark(col, 0.45), m: 'fur' };
        
        if (sp.mode === 'part' && sp.part !== 'mask' && sp.part !== 'eye' && Math.sin((x * 0.6 + y + z * 0.8) * 13) > 0.62) return { d: r.d, c: lin('#5a3a34'), m: 'fur' };
        return { d: r.d, c: IVORY, m: 'fur' };
      }
      if (sp.mat === 'lamp-glow' && core && Math.hypot(x - core[0], y - core[1], z - core[2]) < 0.3) return { d: r.d, c: lampCol, m: 'lamp-glow' };
      const shade = 0.95 + 0.2 * Math.max(0, Math.min(1, (y - 0.2) / 2)); 
      return { d: r.d, c: [metalCol[0] * shade, metalCol[1] * shade, metalCol[2] * shade], m: 'metal' };
    },
  };
}

function coreAt(sp, ly, h) {
  if (sp.mat !== 'lamp-glow' || sp.mode === 'part') return null;
  const b = ly.belly;
  if (sp.mode === 'horizontal') return sp.side > 0 ? onHead(h, 0, 0.55, 0.8).p : [0, b[1], b[2] + 0.04];
  return onHead(h, sp.side * 0.7, 0.35, 0.6).p;
}








const decal = (dec, node, tris = 70) => dec.push({ node, tris });

function onLens(f, [a, b, c], u, v) {
  const z = c * Math.sqrt(Math.max(0, 1 - (u / a) ** 2 - (v / b) ** 2));
  return add(add(add(f.p, f.X, u), f.Y, v), f.n, z);
}

const lensAt = (p, f, R) => S.place(ell([0, 0, 0], R.map((v) => Math.max(v, 0.032))), p, f.X, f.Y, f.n);




export const eyeStyleOf = (L) => L.eyeStyle || (!L.eyes || L.eyes === 'cute' ? 'glossy' : L.eyes);

function eyeBand(core, h, EY, halfH, paint) {
  const ey = h.c[1] + EY[1] * h.r;
  const slab = S.intersect(0.02, S.shell(S.offset(core, 0.03), 0.045),
    S.field((x, y, z) => Math.max(Math.abs(y - ey) - halfH * h.r, h.c[2] + 0.35 * h.r - z, Math.abs(x) - 0.82 * h.r)));
  
  
  return paint({ ...slab, b: { c: [0, ey, h.c[2] + 0.55 * h.r], r: 1.05 * h.r, f: 0.5 } });
}


function eyes(L, h, st, core, eyeMat, lampCol, irisCol, dec, out, maskCol = lin('#2c2440')) {
  const style = eyeStyleOf(L);
  const er = (style === 'fierce' ? 0.37 : 0.41) * h.r * (L.eyeK || 1), E = [er * 0.8, er * 1.06, er * 0.42], EY = L.eyeDir || EYE;
  const shine = (f, R, k = 1) => { 
    decal(dec, fur(lensAt(onLens(f, R, -R[0] * 0.3, R[1] * 0.36), f, [R[0] * 0.42 * k, R[1] * 0.36 * k, er * 0.16]), WHITE), 50);
    decal(dec, fur(lensAt(onLens(f, R, R[0] * 0.38, -R[1] * 0.3), f, [R[0] * 0.2 * k, R[1] * 0.16 * k, er * 0.12]), WHITE), 30);
  };
  const dot = (f, R, u, v, rr, col, tris = 30) => decal(dec, fur(lensAt(onLens(f, R, u, v), f, [rr, rr, rr * 0.7]), col), tris);
  const headCore = core || ell(h.c, [h.r * 0.97, h.r * 0.97, h.r * 0.97]);
  if (style === 'hidden') { 
    
    
    dec.push({ node: eyeBand(headCore, h, EY, 0.32, (n) => fur(n, maskCol)), tris: 110 });
    return;
  }
  if (style === 'cyclops') { 
    const f = frameAt(h, 0, EY[1] + 0.14, EY[2], 0), R = [E[0] * 1.3, E[1] * 1.1, E[2] * 1.1];
    decal(dec, fur(lensAt(f.p, f, R), INK), 110);
    decal(dec, fur(lensAt(onLens(f, R, 0, -R[1] * 0.5), f, [R[0] * 0.62, R[1] * 0.3, er * 0.12]), irisCol), 50);
    shine(f, R);
    return;
  }
  if (style === 'visor') { 
    out.push(eyeBand(core, h, EYE, 0.36, (n) => metal(n, lin('#1b2230'))));
    for (const sgn of [-1, 1]) {
      const f0 = frameAt(h, sgn * EY[0], EY[1], EY[2], 0), f = { ...f0, p: add(f0.p, f0.n, 0.07) }, R = [er * 0.78, er * 0.9, er * 0.3];
      decal(dec, glow(lensAt(f.p, f, R), GLOW_CYAN), 70);
      shine(f, R, 0.9);
    }
    return;
  }
  
  const ED = style === 'compound' ? [EY[0] * 1.3, EY[1] + 0.04, EY[2] * 0.85] : EY;
  for (const sgn of [-1, 1]) {
    const f = frameAt(h, sgn * ED[0], ED[1], ED[2], 0), em = eyeMat(sgn);
    if (em === 'metal') { 
      const Rs = [E[0] * 1.2, E[1] * 1.08, E[2] * 0.7], Rl = [E[0] * 0.85, E[0] * 0.85, E[2] * 0.9];
      decal(dec, metal(lensAt(f.p, f, Rs), lin('#262b36')), 70);
      decal(dec, glow(lensAt(f.p, f, Rl), GLOW_RED), 60);
      shine(f, Rl, 0.9);
      continue;
    }
    if (em === 'lamp-glow') { 
      decal(dec, glow(lensAt(f.p, f, E), lampCol), 70);
      shine(f, E);
      continue;
    }
    if (em === 'bone') 
      decal(dec, fur(alongNormal(S.torus([0, 0, 0], er * 1.18, 0.07 * h.r), f), lin('#3a2522')), 80);
    if (style === 'sleepy') { 
      const pts = [-1, -0.5, 0, 0.5, 1].map((t) => [t * er * 0.9, -(Math.abs(t) ** 1.6) * er * 0.45 + er * 0.12, 0]);
      decal(dec, fur(atSurface(S.union(0.03, ...pts.slice(1).map((q, i) => S.capsule(pts[i], q, 0.085 * h.r))), f), INK), 80);
      continue;
    }
    if (style === 'beady') { 
      const R = [er * 0.48, er * 0.54, er * 0.32];
      decal(dec, fur(lensAt(f.p, f, R), INK), 60);
      dot(f, R, -R[0] * 0.3, R[1] * 0.35, R[0] * 0.36, WHITE);
      continue;
    }
    if (style === 'human') { 
      const R = [er * 0.46, er * 0.62, er * 0.3];
      decal(dec, fur(lensAt(f.p, f, R), INK), 60);
      dot(f, R, -R[0] * 0.3, R[1] * 0.38, R[0] * 0.4, WHITE);
      continue;
    }
    if (style === 'button') { 
      const R = [er * 0.72, er * 0.72, er * 0.24];
      decal(dec, fur(lensAt(f.p, f, R), irisCol), 80);
      decal(dec, fur(alongNormal(S.torus([0, 0, 0], er * 0.7, 0.07 * h.r), f), light(irisCol, 0.55)), 80);
      for (const [u, v] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) dot(f, R, u * R[0] * 0.26, v * R[1] * 0.26, 0.05 * h.r, INK);
      continue;
    }
    if (style === 'compound') { 
      
      const R = [E[0] * 1.2, E[1] * 1.12, E[2] * 1.2], fc = light(irisCol, 0.25);
      decal(dec, fur(lensAt(f.p, f, R), INK), 110);
      for (const [u, v] of [[0.2, 0.42], [-0.5, 0.05], [-0.05, 0.05], [0.42, 0.02], [-0.3, -0.4], [0.18, -0.42]])
        dot(f, R, u * R[0], v * R[1], 0.06 * h.r, fc);
      dot(f, R, -R[0] * 0.3, R[1] * 0.42, R[0] * 0.26, WHITE, 40);
      continue;
    }
    
    decal(dec, fur(lensAt(f.p, f, E), INK), 110);
    decal(dec, fur(lensAt(onLens(f, E, 0, -E[1] * 0.5), f, [E[0] * 0.62, E[1] * 0.3, er * 0.12]), irisCol), 50);
    shine(f, E);
    if (style === 'fierce') decal(dec, fur(atSurface(S.capsule([-sgn * er * 1.0, er * 1.5, 0.02], [sgn * er * 0.7, er * 1.08, 0.04], 0.08 * h.r), f), INK), 50);
  }
  if (st === 3 && eyeMat(1) === 'metal' && eyeMat(-1) !== 'metal') 
    out.push(glow(atSurface(S.capsule([-er, er * 1.5, 0], [er, er * 1.5, 0], 0.045 * h.r), frameAt(h, 0.34, 0.45, 0.85, 0.02)), GLOW_RED));
}


function mouth(L, h, snout, type, dec, blush, beak = false) {
  if (beak) snout = null; 
  const fierce = eyeStyleOf(L) === 'fierce' || type === 'Shadow', r = h.r;
  let f;
  if (snout) { 
    const n = norm([0, -0.25, 1]), fr = S.frameFromNormal(n);
    f = { p: add(snout, [0, -0.08, 0.2]), X: fr.X, Y: fr.Y, n };
    const fn = S.frameFromNormal(norm([0, 0.4, 1]));
    decal(dec, fur(S.place(ell([0, 0, 0], [0.09, 0.06, 0.05]), add(snout, [0, 0.08, 0.2]), fn.X, fn.Y, fn.Z), INK), 40);
  } else f = frameAt(h, ...(L.mouthDir || [0, -0.2, 0.98]), 0);
  if (beak) {  } else if (fierce) {
    const pts = [[-0.15, 0.02], [0, -0.04], [0.15, 0.02]];
    decal(dec, fur(atSurface(S.union(0.02, ...pts.slice(1).map((q, i) => S.capsule([pts[i][0] * r, pts[i][1] * r, 0], [q[0] * r, q[1] * r, 0], 0.045 * r))), f), INK), 50);
    decal(dec, fur(atSurface(S.roundCone([0.08 * r, -0.03 * r, 0.03], [0.1 * r, -0.15 * r, 0.03], 0.045 * r, 0.012), f), WHITE), 30);
  } else {
    const M = [0.15 * r, 0.12 * r, 0.06 * r];
    decal(dec, fur(atSurface(S.intersect(0.015, ell([0, 0, 0], M), S.field((x, y) => y - 0.015 * r)), f), INK), 60);
    decal(dec, fur(lensAt(onLens(f, M, 0, -M[1] * 0.55), f, [M[0] * 0.55, M[1] * 0.32, 0.03 * r]), lin('#ff7b93')), 30);
  }
  if (blush) for (const sgn of [-1, 1]) {
    const B = L.blushDir || [0.74, -0.08, 0.68], fb = frameAt(h, sgn * B[0], B[1], B[2], 0);
    decal(dec, fur(lensAt(fb.p, fb, [0.2 * r, 0.12 * r, 0.04 * r]), BLUSH), 40);
  }
}






export function faceDecals(h, look = {}, { eyeMat = () => null, iris = lin('#5b3a8c'), blush = true, beak = false, snout = null } = {}) {
  const dec = [], out = [];
  eyes(look, h, 1, null, eyeMat, GLOW_RED, iris, dec, out);
  mouth(look, h, snout, 'Beast', dec, blush, beak);
  return dec;
}





function ears(kind, h, col, acc, st, es = 1) {
  const out = [], inner = mix(light(col, 0.35), PINK, 0.35), r = h.r * es, hr = h.r;
  for (const sgn of [-1, 1]) {
    const base = add(h.c, norm([sgn * 0.6, 0.72, -0.05]), hr * 1.0), push = (node) => out.push({ side: sgn, node });
    if (kind === 'mouse') { 
      const c = add(h.c, norm([sgn * 0.78, 0.66, -0.1]), hr * 1.1 + r * 0.1);
      push(fur(S.transform(ell([0, 0, 0], [0.72 * r, 0.72 * r, 0.17 * r]), { translate: c, rotate: [0, sgn * -0.35, sgn * -0.3] }),
        (x, y, z) => (z > c[2] + 0.04 * r && Math.hypot(x - c[0], y - c[1]) < 0.46 * r ? PINK : col)));
    } else if (kind === 'bear') { 
      const c = add(h.c, norm([sgn * 0.66, 0.74, 0]), hr * 1.02 + r * 0.2);
      push(fur(S.transform(ell([0, 0, 0], [0.57 * r, 0.57 * r, 0.26 * r]), { translate: c, rotate: [0, 0, sgn * -0.4] }),
        (x, y, z) => (z > c[2] + 0.08 * r && Math.hypot(x - c[0], y - c[1]) < 0.27 * r ? inner : col)));
    } else if (kind === 'cat') { 
      const tip = add(base, [sgn * 0.36 * r, 1.0 * r, -0.05]);
      push(fur(S.roundCone(base, tip, 0.38 * r, 0.06 * r), (x, y, z) => (z > base[2] + 0.14 * r && y > base[1] + 0.1 ? inner : col)));
    } else if (kind === 'bunny') { 
      const mid = add(base, [sgn * 0.26 * r, 1.05 * r, -0.12 * r]), tip = add(mid, [sgn * 0.3 * r, 0.55 * r, -0.12 * r]);
      push(fur(S.union(0.08, S.roundCone(base, mid, 0.24 * r, 0.25 * r), S.roundCone(mid, tip, 0.25 * r, 0.18 * r)),
        (x, y, z) => (z > base[2] + 0.02 && y > base[1] + 0.15 && Math.abs(x - (base[0] + mid[0]) / 2) < 0.12 * r ? inner : col)));
    } else if (kind === 'horns') {
      const len = (0.8 + st * 0.14) * r, mid = add(base, [sgn * 0.3 * r, len * 0.6, -0.12 * r]);
      const tip = add(mid, [sgn * 0.38 * r, len * 0.35, -0.2 * r]);
      push(fur(S.union(0.05, S.roundCone(base, mid, 0.24 * r, 0.15 * r), S.roundCone(mid, tip, 0.15 * r, 0.04 * r)), lin('#f1e4c2')));
    } else if (kind === 'fins') { 
      const c = add(h.c, norm([sgn * 0.95, 0.3, -0.1]), hr * 0.95);
      push(fur(S.transform(ell([0, 0, 0], [0.74 * r, 0.5 * r, 0.13 * r]), { translate: add(c, [sgn * 0.2 * r, 0.16 * r, 0]), rotate: [0, sgn * 1.2, sgn * 0.7] }), 
        (x, y, z) => (Math.sin(Math.atan2(y - c[1], (x - c[0]) * sgn) * 9) > 0.4 ? light(acc, 0.1) : dark(acc, 0.1))));
    } else if (kind === 'antenna') {
      const tip = add(base, [sgn * 0.36 * r, 1.05 * r, 0.05]);
      push(S.union(0.02, fur(S.capsule(base, tip, 0.08 * r), dark(col, 0.3)), glow(S.sphere(tip, 0.26 * r), acc)));
    } else if (kind === 'leaf' && sgn > 0) {
      const c = add(h.c, [0.05 * r, 0.95 * hr + 0.4 * (1 + st * 0.2) * r, 0]);
      push(fur(S.transform(ell([0, 0, 0], [0.34 * r, (0.72 + st * 0.1) * r, 0.07 * r]), { translate: c, rotate: [0, 0.4, -0.35] }), LEAF));
      if (st >= 2) { 
        const fc = add(h.c, [-0.3 * hr, 0.95 * hr, 0.1 * hr]), s = 0.12 * hr * st;
        const petals = [0, 1, 2, 3, 4].map((i) => { const a = (i / 5) * Math.PI * 2; return S.sphere([fc[0] + Math.cos(a) * s * 0.6, fc[1] + Math.sin(a) * s * 0.6, fc[2]], s * 0.45); });
        push(S.union(0.02, fur(S.union(0.02, ...petals), acc), fur(S.sphere(add(fc, [0, 0, 0.06 * r]), s * 0.35), lin('#fff3a0'))));
      }
    
    } else if (kind === 'floppy') { 
      const top = add(h.c, norm([sgn * 0.8, 0.5, -0.1]), hr * 0.92), low = add(top, [sgn * 0.42 * r, -1.0 * r, 0.1 * r]);
      push(fur(S.union(0.1, S.transform(ell([0, 0, 0], [0.26 * r, 0.62 * r, 0.16 * r]), { translate: [(top[0] + low[0]) / 2, (top[1] + low[1]) / 2, (top[2] + low[2]) / 2], rotate: [0, 0, sgn * 0.42] })), dark(col, 0.25)));
    } else if (kind === 'lop') { 
      const a = add(h.c, norm([sgn * 0.62, 0.72, 0]), hr * 0.95), b = add(a, [sgn * 0.75 * r, 0.1 * r, 0]), c = add(b, [sgn * 0.4 * r, -0.35 * r, 0.05]);
      push(fur(S.union(0.1, S.roundCone(a, b, 0.2 * r, 0.24 * r), S.roundCone(b, c, 0.24 * r, 0.2 * r)), (x, y, z) => (z > a[2] + 0.1 * r ? inner : col)));
    } else if (kind === 'fennec') { 
      const tip = add(base, [sgn * 0.85 * r, 0.8 * r, -0.1]);
      push(fur(S.roundCone(base, tip, 0.42 * r, 0.05 * r), (x, y, z) => (z > base[2] + 0.15 * r && y > base[1] + 0.12 ? inner : col)));
    } else if (kind === 'sprig' && sgn > 0) { 
      const b0 = add(h.c, [0, 0.95 * hr, -0.05]), b1 = add(b0, [0, 0.9 * r, 0]);
      push(S.union(0.04, fur(S.roundCone(b0, b1, 0.08 * r, 0.06 * r), lin('#3f9a4a')),
        ...[-1, 1].map((q) => fur(S.transform(ell([0, 0, 0], [0.62 * r, 0.26 * r, 0.08 * r]), { translate: add(b1, [q * 0.55 * r, 0.12 * r, 0]), rotate: [0, 0, q * 0.45] }), LEAF))));
    } else if (kind === 'bobble' && sgn > 0) { 
      const b0 = add(h.c, [0, 0.95 * hr, 0]), b1 = add(b0, [0.1 * r, 0.7 * r, -0.05]), b2 = add(b1, [0.35 * r, 0.25 * r, 0]);
      push(S.union(0.04, fur(S.union(0.05, S.roundCone(b0, b1, 0.09 * r, 0.07 * r), S.roundCone(b1, b2, 0.07 * r, 0.06 * r)), dark(col, 0.3)), fur(S.sphere(b2, 0.34 * r), light(acc, 0.1))));
    } else if (kind === 'wingears') { 
      const c = add(h.c, norm([sgn * 0.85, 0.55, -0.1]), hr * 0.95);
      const fe = [0.2, 0.7, 1.2].map((ang, i) => S.transform(ell([0, 0, 0], [(0.55 - i * 0.1) * r, 0.14 * r, 0.06 * r]),
        { translate: add(c, [sgn * Math.cos(ang) * 0.4 * r, Math.sin(ang) * 0.4 * r + 0.15 * r, -0.05]), rotate: [0, 0, sgn * ang] }));
      push(fur(S.union(0.06, ...fe), light(acc, 0.35)));
    } else if (kind === 'petals' && sgn > 0) { 
      const ps = [];
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + 0.45, d = [Math.cos(a), Math.sin(a) * 0.95 + 0.05, -0.25];
        ps.push(S.transform(ell([0, 0, 0], [0.5 * r, 0.3 * r, 0.12 * r]), { translate: add(h.c, norm(d), hr * 1.22), rotate: [0, 0, a] }));
      }
      push(fur(S.union(0.05, ...ps), light(acc, 0.2)));
    }
  }
  return out;
}





function tail(kind, at, col, acc, k = 1) {
  if (!kind || kind === 'none') return { body: null, extra: [] };
  const [x, y, z] = at, s = (v) => v * k;
  if (kind === 'fluffy') { 
    const c = light(col, 0.25);
    return { body: fur(S.union(0.14, S.sphere([x, y + s(0.05), z - s(0.1)], s(0.4)), S.sphere([x, y + s(0.45), z - s(0.42)], s(0.46)),
      S.sphere([x, y + s(0.95), z - s(0.5)], s(0.44)), S.sphere([x, y + s(1.35), z - s(0.3)], s(0.32))), (px, py) => (py > y + s(1.2) ? light(col, 0.55) : c)), extra: [] };
  }
  if (kind === 'bolt') { 
    const pts = [[x, y, z + 0.2], [x + s(0.45), y + s(0.3), z - s(0.3)], [x - s(0.15), y + s(0.65), z - s(0.5)], [x + s(0.45), y + s(1.15), z - s(0.8)]];
    return { body: fur(S.union(0.03, ...pts.slice(1).map((q, i) => S.capsule(pts[i], q, s(0.17 - i * 0.03)))), lin('#ffd23d')), extra: [] };
  }
  
  const a = [x, y, z + 0.25], b = [x, y - s(0.2), z - s(0.4)], c = [x, y + s(0.1), z - s(0.95)], d = [x, y + s(0.65), z - s(1.15)];
  const body = fur(S.union(0.08, S.roundCone(a, b, s(0.34), s(0.26)), S.roundCone(b, c, s(0.26), s(0.17)), S.roundCone(c, d, s(0.17), s(0.1))), col);
  const extra = [];
  if (kind === 'flame') extra.push(glow(S.roundCone(add(d, [0, -0.05, 0]), add(d, [0, s(0.75), -0.05]), s(0.34), 0.03),
    (px, py) => mix(FLAME_A, FLAME_B, sm(d[1] - 0.1, d[1] + s(0.65), py))));
  else if (kind === 'leaf') extra.push(fur(S.transform(ell([0, 0, 0], [s(0.28), s(0.55), 0.07]), { translate: add(d, [0, s(0.4), -0.05]), rotate: [0, 0, 0.5] }), LEAF));
  else if (kind === 'fins') extra.push(fur(S.transform(ell([0, 0, 0], [0.07, s(0.6), s(0.4)]), { translate: add(d, [0, s(0.3), -0.1]), rotate: [-0.5, 0, 0] }), acc));
  return { body, extra };
}



function wings(at, acc, wingMat, lampCol, g0 = 1, metalCol = lin('#aeb9c6'), partSide = 0) {
  const out = [];
  for (const sgn of [-1, 1]) {
    const root = [sgn * at[0], at[1], at[2]], m = wingMat(sgn), g = g0 * (sgn === partSide ? 1.35 : 1); 
    const lobes = [0.35, 0.85, 1.35].map((ang, i) => {
      const len = [0.72, 0.65, 0.48][i] * g, dir = [Math.cos(ang) * sgn, Math.sin(ang) * 0.9 + 0.2, -0.45];
      return S.transform(ell([0, 0, 0], [len, 0.2, 0.07]), { translate: add(root, norm(dir), len * 0.85), rotate: [0, sgn * 0.45, sgn * (ang * 0.9 + 0.1)] });
    });
    const spar = S.roundCone(root, add(root, [sgn * 0.82 * g, 0.92 * g, -0.52 * g]), 0.1, 0.04);
    const mem = S.union(0.08, ...lobes);
    if (m === 'metal') out.push(metal(S.union(0.04, mem, spar), metalCol));
    else if (m === 'bone') out.push(fur(mem, dark(acc, 0.45)), fur(spar, IVORY), fur(S.union(0.03, ...lobes.map((_, i) => S.capsule(root, add(root, norm([Math.cos([0.35, 0.85, 1.35][i]) * sgn, Math.sin([0.35, 0.85, 1.35][i]) * 0.9 + 0.2, -0.45]), 1.3 * g * [0.72, 0.65, 0.48][i]), 0.05))), IVORY));
    else if (m === 'lamp-glow') out.push(glow(mem, lampCol), metal(spar, metalCol));
    else out.push(fur(mem, dark(acc, 0.05)), fur(spar, dark(acc, 0.35)));
  }
  return out;
}

function ribs(ly, side) {
  
  const out = [], cc = ly.chestC;
  for (let i = 0; i < 3; i++) {
    const y = ly.ribY + i * 0.22, pts = [];
    for (let k = 0; k <= 5; k++) {
      const a = Math.PI * (0.55 + (k / 5) * 0.8);
      pts.push([-side * Math.cos(a) * ly.ribR[0] + cc[0], y - Math.abs(Math.cos(a)) * 0.08, Math.sin(a) * ly.ribR[1] * -1 + cc[2]]);
    }
    out.push(fur(S.union(0.03, ...pts.slice(1).map((q, k) => S.capsule(pts[k], q, 0.065))), IVORY));
  }
  return out;
}






const HEAD_SIGS = new Set(['unihorn', 'antlers', 'crest', 'lamp', 'tuft', 'halo', 'mushroom', 'bow', 'goggles', 'ramhorns', 'crystal']);
function signature(kind, h, ly, col, acc, st, lampCol, shape) {
  const r = h.r, g = 1 + (st - 1) * 0.25, out = [];
  const topP = add(h.c, [0, r * 0.95, 0]);
  const behind = [0, h.c[1] + 0.1, h.c[2] - r * 0.85]; 
  if (kind === 'unihorn') { 
    const f = frameAt(h, 0, 0.9, 0.35, 0.08), tip = add(f.p, norm([0, 1, 0.12]), 1.6 * g * r); 
    out.push(fur(S.roundCone(f.p, tip, 0.32 * r * Math.sqrt(g), 0.06), (x, y) => (Math.sin((y - f.p[1]) * 26) > 0.1 ? lin('#fff3c0') : GOLD)));
  } else if (kind === 'antlers') { 
    for (const sgn of [-1, 1]) {
      const b0 = add(h.c, norm([sgn * 0.45, 0.85, -0.1]), r * 0.9), b1 = add(b0, [sgn * 0.42 * g, 0.62 * g, -0.1]), b2 = add(b1, [sgn * 0.38 * g, 0.42 * g, -0.1]);
      const parts = [S.roundCone(b0, b1, 0.13, 0.1), S.roundCone(b1, b2, 0.1, 0.05)];
      const tines = [[b1, [-sgn * 0.05, 0.45, 0.08]], [b2, [sgn * 0.12, 0.3, 0.06]], [add(b0, [sgn * 0.2 * g, 0.3 * g, 0]), [sgn * 0.34, 0.24, 0.1]]].slice(0, st);
      for (const [p, d] of tines) parts.push(S.roundCone(p, add(p, d, g), 0.085, 0.035));
      out.push(fur(S.union(0.04, ...parts), lin('#c89a6a')));
    }
  } else if (kind === 'ramhorns') { 
    for (const sgn of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 1.5, rad = (0.5 - i * 0.035) * g;
        pts.push(add(h.c, [sgn * (r * 0.92 + Math.sin(a) * rad * 1.1), r * 0.5 + Math.cos(a) * rad * 1.1, -0.15 - Math.sin(a) * 0.1]));
      }
      out.push(fur(S.union(0.05, ...pts.slice(1).map((q, i) => S.roundCone(pts[i], q, (0.17 - i * 0.017) * g, (0.17 - (i + 1) * 0.017) * g))),
        (x, y, z) => (Math.sin((x + y) * 22) > 0.3 ? lin('#e8d6b0') : lin('#cdb58a'))));
    }
  } else if (kind === 'crest') { 
    const fins = [], n = 3 + st;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), a = 0.5 - t * 1.6, dir = norm([0, Math.cos(a), Math.sin(a)]), p = add(h.c, dir, r * 0.85);
      fins.push(S.transform(ell([0, 0, 0], [0.09, 0.42 * g * (1 - Math.abs(t - 0.35) * 0.7), 0.2]), { translate: add(p, dir, 0.22 * g), rotate: [Math.atan2(dir[2], dir[1]), 0, 0] }));
    }
    out.push(fur(S.union(0.06, ...fins), light(acc, 0.1)));
  } else if (kind === 'lamp') { 
    
    
    const base = add(h.c, norm([0, 1, -0.1]), r * 0.88), mid = add(base, [0.05 * g, 1.25 * g, 0.05]), end = add(mid, [0.78 * g, 0.2 * g, 0.2 * g]); 
    const drop = add(end, [0.1 * g, -0.32 * g, 0.02]);
    out.push(fur(S.union(0.04, S.roundCone(base, mid, 0.14, 0.1), S.roundCone(mid, end, 0.1, 0.08), S.roundCone(end, drop, 0.08, 0.06)), dark(col, 0.3)));
    out.push(glow(S.sphere(add(drop, [0, -0.32 * g, 0.03]), 0.46 * g), lampCol));
  } else if (kind === 'shell') { 
    const c = add(behind, [0, 0.7, -0.1]), R = [0.66 * g, 0.95 * g, 0.78 * g]; 
    out.push(fur(S.roundCone(add(c, [0, R[1] * 0.5, 0]), add(c, [0.1, R[1] * 1.55, -0.15]), 0.36 * g, 0.05), dark(acc, 0.2))); 
    out.push(fur(ell(c, R), (x, y, z) => (Math.sin(Math.atan2(y - c[1], z - c[2]) * 2 + Math.hypot(y - c[1], z - c[2]) * 14) > 0.3 ? dark(acc, 0.3) : light(acc, 0.15))));
  } else if (kind === 'spikes') { 
    const n = 3 + st, pts = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), a = 0.2 + t * 1.3, p = add(h.c, norm([0, Math.cos(a), -Math.sin(a)]), r * 0.85);
      const q = t < 0.6 ? p : add(p, [0, -(t - 0.6) * 1.2, -(t - 0.6) * 0.6]);
      pts.push(S.roundCone(q, add(q, norm([0, 1, -0.5]), 0.55 * g * (1 - t * 0.4)), 0.17 * g, 0.03));
    }
    out.push(fur(S.union(0.04, ...pts), light(acc, 0.05)));
  } else if (kind === 'mane') { 
    const tufts = [], n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, d = norm([Math.cos(a), Math.sin(a), -0.35]), p = add(h.c, d, r * 0.8);
      tufts.push(S.roundCone(p, add(p, norm([d[0], d[1], -0.2]), (0.75 + 0.15 * (i % 2)) * g * r), 0.28 * r, 0.05));
    }
    out.push(fur(S.union(0.08, ...tufts), (x, y, z) => (Math.hypot(x - h.c[0], y - h.c[1]) > r * 1.3 ? light(acc, 0.35) : dark(acc, 0.05))));
  } else if (kind === 'tuft') { 
    const a = add(topP, [0, -0.1, 0.05]), b = add(a, [0.05, 0.85 * g, 0.1]), c = add(b, [0.5 * g, 0.25 * g, -0.02]), d = add(c, [0.15, -0.4 * g, 0]);
    out.push(fur(S.union(0.06, S.roundCone(a, b, 0.3, 0.22), S.roundCone(b, c, 0.22, 0.16), S.roundCone(c, d, 0.16, 0.1)), dark(col, 0.2)));
  } else if (kind === 'cheeks') { 
    for (const sgn of [-1, 1]) {
      const c = add(h.c, norm([sgn * 1, -0.35, 0.15]), r * 1.0);
      out.push(fur(S.sphere(c, 0.56 * r * Math.sqrt(g)), (x, y, z) => (z > c[2] + 0.1 ? mix(light(col, 0.3), BLUSH, 0.45) : light(col, 0.3))));
    }
  } else if (kind === 'trunk') { 
    
    const a = onHead(h, 0, -0.15, 1).p, b = add(a, [0.3 * g, -0.2 * g, 0.3 * g]), c = add(b, [0.42 * g, 0.02, 0.05]), d = add(c, [0.12 * g, 0.3 * g, -0.05]);
    out.push(fur(S.union(0.05, S.roundCone(a, b, 0.22, 0.17), S.roundCone(b, c, 0.17, 0.13), S.roundCone(c, d, 0.13, 0.12)), light(col, 0.1)));
  } else if (kind === 'halo') { 
    out.push(glow(S.transform(S.torus([0, 0, 0], 0.8 * r * Math.min(g, 1.25), 0.14 * g), { translate: add(topP, [0, 0.85, -0.1]), rotate: [-0.35, 0, 0] }), lin('#ffd84a'))); 
  } else if (kind === 'scarf') { 
    const low = shape === 'round' || shape === 'blob', y = low ? 0.62 : ly.neck, c = [0, y, low ? 0 : h.c[2] * 0.4], Rr = low ? 0.98 : 0.7;
    const ring = S.transform(S.torus([0, 0, 0], Rr, 0.15), { translate: c, scale: [1, 1, 0.92] });
    const t0 = [0.3, y, c[2] - Rr * 0.9], t1 = [0.75 + 0.2 * g, y + 0.25, c[2] - Rr - 0.5 * g], t2 = [0.35, y - 0.1, c[2] - Rr - 0.6 * g];
    out.push(fur(S.union(0.05, ring, S.roundCone(t0, t1, 0.15, 0.13 * g), S.roundCone(t0, t2, 0.14, 0.11 * g)),
      (x, y2, z) => (Math.sin((x + z) * 9) > 0.35 ? light(acc, 0.4) : acc)));
  } else if (kind === 'gear') { 
    const c = add(behind, [0.55, 0.7 * r, 0.25]), R = 0.62 * g, teeth = []; 
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; teeth.push(S.transform(S.roundBox([0, 0, 0], [0.1 * g, 0.12 * g, 0.08], 0.02), { translate: [Math.cos(a) * R, Math.sin(a) * R, 0], rotate: [0, 0, a] })); }
    const wheel = S.subtract(0.02, S.union(0.02, S.transform(S.roundCylinder([0, 0, 0], R, R, 0.08, 0.02), { rotate: [Math.PI / 2, 0, 0] }), ...teeth),
      S.transform(S.roundCylinder([0, 0, 0], R * 0.35, R * 0.35, 0.3, 0.01), { rotate: [Math.PI / 2, 0, 0] }));
    out.push(metal(S.transform(wheel, { translate: c, rotate: [0, 0.3, 0.2] }), GOLD));
  } else if (kind === 'crystal') { 
    const bits = [], spots = [[0, 0.1, 0, 1.1], [0.42, 0, 0.1, 0.8], [-0.4, 0, 0.05, 0.72], [0.12, 0.25, -0.15, 0.6]].slice(0, 2 + st);
    for (const [dx, dy, dz, len] of spots) {
      const b = add(topP, [dx, dy - 0.2, dz - 0.25]), t = add(b, norm([dx * 1.8, 1, -0.3]), len * g); 
      bits.push(S.roundCone(b, t, 0.27 * g, 0.04));
    }
    out.push(glow(S.union(0.03, ...bits), lampCol));
  } else if (kind === 'mushroom') { 
    
    const k = Math.min(g, 1.2), s0 = add(topP, [-0.15, -0.15, -0.05]), s1 = add(s0, [-0.2 * k, 0.55 * k, 0]);
    out.push(fur(S.roundCone(s0, s1, 0.2 * r, 0.16 * r), lin('#fff4e0')));
    const c = add(s1, [-0.05, 0.05, 0]), R = [0.72 * r * k, 0.5 * r * k, 0.68 * r * k];
    const cap = S.intersect(0.03, ell(c, R), S.field((x, y) => c[1] - 0.04 - y)); 
    const spots = [[0.3, 0.3, 0.45], [-0.45, 0.35, 0.25], [0.05, 0.9, 0.1], [-0.1, 0.4, -0.6], [0.6, 0.3, -0.3], [-0.55, 0.3, -0.35]].map((d) => norm(d));
    out.push(fur(cap, (x, y, z) => { const n = norm([x - c[0], (y - c[1]) * 1.8, z - c[2]]); return spots.some((s) => n[0] * s[0] + n[1] * s[1] + n[2] * s[2] > 0.93) ? lin('#fff8ec') : lin('#e8484f'); }));
  } else if (kind === 'bow') { 
    const c = add(h.c, norm([-0.4, 0.95, 0.1]), r * 0.95), s = Math.min(g, 1.3);
    const loops = [-1, 1].map((q) => S.transform(ell([0, 0, 0], [0.42 * s, 0.26 * s, 0.13]), { translate: add(c, [q * 0.36 * s, 0.05, 0]), rotate: [0, 0, q * 0.4] }));
    out.push(fur(S.union(0.04, ...loops, S.sphere(c, 0.15 * s)), lin('#ff5d9e')));
  } else if (kind === 'fin') { 
    const b = add(behind, [0, -0.1, 0.1]);
    out.push(fur(S.transform(ell([0, 0, 0], [0.11, 0.85 * g, 0.42 * g]), { translate: add(b, [0, 0.6 * g + 0.2, -0.1]), rotate: [-0.45, 0, 0] }), light(acc, 0.05)));
  } else if (kind === 'goggles') { 
    
    const k = Math.min(g, 1.2), fs = [-1, 1].map((sgn) => frameAt(h, sgn * 0.34, 1.0, -0.45, 0.02));
    for (const f of fs) {
      out.push(metal(alongNormal(S.roundCylinder([0, 0.05, 0], 0.22 * r * k, 0.22 * r * k, 0.08, 0.03), f), lin('#8a5a3c')));
      out.push(fur(alongNormal(S.roundCylinder([0, 0.13, 0], 0.16 * r * k, 0.16 * r * k, 0.03, 0.01), f), lin('#7fc8e8')));
    }
    out.push(metal(S.capsule(add(fs[0].p, fs[0].n, 0.06), add(fs[1].p, fs[1].n, 0.06), 0.05), lin('#8a5a3c')));
  }
  return out;
}

function wizardHat(h) {
  const top = h.c[1] + h.r * 0.84, r = h.r, purple = lin('#5a3ec8'); 
  const brim = S.roundCylinder([0, top, h.c[2]], 1.05 * r, 1.0 * r, 0.04 * r, 0.03 * r);
  const cone = S.union(0.06, S.roundCone([0, top + 0.05, h.c[2]], [0.15 * r, top + 0.95 * r, h.c[2] - 0.15 * r], 0.52 * r, 0.16 * r),
    S.roundCone([0.15 * r, top + 0.95 * r, h.c[2] - 0.15 * r], [0.62 * r, top + 1.2 * r, h.c[2] - 0.22 * r], 0.16 * r, 0.05 * r));
  const stars = [[-0.05, 0.4, 0.42], [0.18, 0.8, 0.22]].map(([x, y, zz]) => S.sphere([x * r, top + y * r, h.c[2] + zz * r], 0.08 * r));
  return [S.union(0.03, fur(brim, dark(purple, 0.15)), fur(cone, purple), fur(S.union(0, ...stars), lin('#ffe066')))];
}

function armour(ly) {
  const c = ly.chestC;
  const plate = S.intersect(0.02, S.shell(S.offset(ly.chest, 0.05), 0.045),
    S.field((x, y, z) => Math.max(c[2] + 0.2 - z, Math.abs(y - (c[1] + 0.02)) - 0.42)));
  const stripe = S.intersect(0.01, S.shell(S.offset(ly.chest, 0.07), 0.04), S.field((x, y, z) => Math.max(Math.abs(x) - 0.06, c[2] + 0.3 - z, Math.abs(y - (c[1] + 0.02)) - 0.38)));
  const pads = [-1, 1].map((sgn) => ell([sgn * 0.62, c[1] + 0.34, c[2] + 0.05], [0.28, 0.17, 0.28]));
  return [metal(S.union(0.03, plate, ...pads)), metal(stripe, GOLD)];
}

function priestHat(h, dec) {
  
  
  const top = h.c[1] + h.r * 0.8, r = h.r, z = h.c[2] - 0.05 * r;
  const lobe = (sx) => S.transform(S.roundCone([0, 0, 0], [sx * 0.12 * r, 2.0 * r, 0], 0.56 * r, 0.16 * r), { translate: [sx * 0.12 * r, top, z], scale: [1, 1, 0.62] });
  const mitre = S.union(0.12 * r, lobe(-1), lobe(1));
  const band = S.transform(S.torus([0, 0, 0], 0.54 * r, 0.11 * r), { translate: [0, top + 0.14 * r, z], scale: [1, 1, 0.66] });
  const lappets = [-1, 1].map((sx) => S.roundBox([sx * 0.22 * r, top - 0.15 * r, z - 0.33 * r], [0.08 * r, 0.3 * r, 0.03 * r], 0.03 * r));
  
  dec.push({ node: fur(mitre, lin('#fffdf6')), tris: 260, cell: 0.05 });
  return [fur(S.union(0.02, band, ...lappets), lin('#e02a3c')),
    metal(S.union(0.02, ell([0, top + 0.62 * r, z + 0.33 * r], [0.17 * r, 0.17 * r, 0.06 * r]), S.capsule([0, top + 0.35 * r, z + 0.34 * r], [0, top + 0.95 * r, z + 0.27 * r], 0.035 * r)), GOLD)];
}



function bandana(h) { 
  const r = h.r, c = h.c, WRAP = lin('#fbf6ea');
  const band = S.transform(S.torus([0, 0, 0], 0.92 * r, 0.12 * r), { translate: [c[0], c[1] + 0.42 * r, c[2]], rotate: [-0.18, 0, 0] });
  const kn = [c[0], c[1] + 0.5 * r, c[2] - 0.95 * r];
  const tails = [[-0.35, -0.25], [0.3, -0.4]].map(([dx, dy]) => S.roundCone(kn, [kn[0] + dx * r, kn[1] + dy * r, kn[2] - 0.35 * r], 0.1 * r, 0.05 * r));
  const stripe = S.transform(S.torus([0, 0, 0], 0.97 * r, 0.04 * r), { translate: [c[0], c[1] + 0.42 * r, c[2]], rotate: [-0.18, 0, 0] });
  return [fur(S.union(0.03, band, ...tails, S.sphere(kn, 0.14 * r)), WRAP), fur(stripe, lin('#e25b5b'))];
}
function emberCap(h) { 
  const r = h.r, c = [h.c[0], h.c[1] + 0.68 * h.r, h.c[2]], R = [0.88 * r, 0.66 * r, 0.88 * r];
  const dome = S.intersect(0.03, ell(c, R), S.field((x, y) => c[1] + 0.05 * r - y));
  const crack = S.intersect(0.01, S.shell(ell(c, [R[0] + 0.03, R[1] + 0.03, R[2] + 0.03]), 0.05 * r),
    S.field((x, y, z) => Math.abs(Math.sin(Math.atan2(z - c[2], x - c[0]) * 3) * 0.18 * r - (y - c[1] - 0.3 * r)) - 0.07 * r));
  return [fur(dome, lin('#7a5a4e')), glow(crack, lin('#ff7a2a')), glow(S.sphere([c[0], c[1] + R[1] + 0.02, c[2]], 0.1 * r), lin('#ffb347'))];
}
function backCap(h) { 
  const r = h.r, c = [h.c[0], h.c[1] + 0.45 * h.r, h.c[2]], R = [0.86 * r, 0.7 * r, 0.86 * r];
  const dome = S.intersect(0.03, ell(c, R), S.field((x, y) => c[1] + 0.06 * r - y));
  const brim = S.transform(S.roundBox([0, 0, 0], [0.5 * r, 0.04 * r, 0.42 * r], 0.03 * r), { translate: [c[0] + 0.55 * r, c[1] + 0.12 * r, c[2] - 0.85 * r], rotate: [0.15, -0.75, 0] }); 
  const button = S.sphere([c[0], c[1] + R[1] + 0.02, c[2]], 0.09 * r);
  return [fur(dome, lin('#2b6fd6')), fur(S.union(0.02, brim, button), lin('#ffd23d'))];
}

function lampHelmet(h) { 
  const r = h.r, c = [h.c[0], h.c[1] + 0.5 * h.r, h.c[2]], R = [0.84 * r, 0.66 * r, 0.84 * r];
  const dome = S.intersect(0.03, ell(c, R), S.field((x, y) => c[1] + 0.08 * r - y));
  const brim = S.transform(S.torus([0, 0, 0], 0.86 * r, 0.07 * r), { translate: [c[0], c[1] + 0.1 * r, c[2]] });
  const lamp = S.roundCone([c[0], c[1] + 0.35 * r, c[2] + 0.62 * r], [c[0], c[1] + 0.38 * r, c[2] + 0.9 * r], 0.12 * r, 0.16 * r);
  return [fur(S.union(0.03, dome, brim), lin('#f2c230')), metal(lamp), glow(S.sphere([c[0], c[1] + 0.38 * r, c[2] + 0.95 * r], 0.12 * r), lin('#fff3a0'))];
}
function goggles(h) { 
  const r = h.r, c = h.c, y = c[1] + 0.62 * r;
  const strap = S.transform(S.torus([0, 0, 0], 0.88 * r, 0.07 * r), { translate: [c[0], y, c[2]], rotate: [-0.35, 0, 0] });
  const lens = (sx) => S.transform(S.torus([0, 0, 0], 0.23 * r, 0.07 * r), { translate: [c[0] + sx * 0.3 * r, y + 0.18 * r, c[2] + 0.8 * r], rotate: [1.2, 0, 0] });
  const glass = (sx) => S.sphere([c[0] + sx * 0.3 * r, y + 0.18 * r, c[2] + 0.8 * r], 0.2 * r);
  return [fur(strap, lin('#5a3c1e')), metal(S.union(0.01, lens(-1), lens(1)), lin('#d9a441')), glow(S.union(0, glass(-1), glass(1)), lin('#ff8a3d'))];
}
function horns(h) { 
  const r = h.r, c = h.c, top = c[1] + 0.82 * r;
  const horn = (sx) => S.union(0.04, S.roundCone([c[0] + sx * 0.36 * r, top, c[2]], [c[0] + sx * 0.66 * r, top + 0.6 * r, c[2] - 0.05 * r], 0.22 * r, 0.12 * r),
    S.roundCone([c[0] + sx * 0.66 * r, top + 0.6 * r, c[2] - 0.05 * r], [c[0] + sx * 0.5 * r, top + 1.02 * r, c[2] - 0.12 * r], 0.12 * r, 0.04 * r));
  const band = S.transform(S.torus([0, 0, 0], 0.8 * r, 0.05 * r), { translate: [c[0], top - 0.1 * r, c[2]] });
  return [fur(S.union(0.02, horn(-1), horn(1)), lin('#2a2236')), fur(band, lin('#c0392b'))];
}
function beanie(h) { 
  const r = h.r, c = [h.c[0], h.c[1] + 0.48 * h.r, h.c[2]], R = [0.86 * r, 0.78 * r, 0.86 * r];
  const dome = S.intersect(0.03, ell(c, R), S.field((x, y) => c[1] + 0.12 * r - y));
  const cuff = S.transform(S.torus([0, 0, 0], 0.84 * r, 0.12 * r), { translate: [c[0], c[1] + 0.16 * r, c[2]] });
  return [fur(dome, lin('#9a96a8')), fur(cuff, lin('#7a7688')), fur(S.sphere([c[0], c[1] + R[1] + 0.1 * r, c[2]], 0.2 * r), lin('#ff7a2a'))];
}

function conch(h) { 
  const r = h.r, c = [h.c[0], h.c[1] + 0.5 * h.r, h.c[2]], R = [0.86 * r, 0.62 * r, 0.86 * r];
  const dome = S.intersect(0.03, ell(c, R), S.field((x, y) => c[1] + 0.06 * r - y));
  const spire = S.union(0.05, S.roundCone([c[0], c[1] + 0.5 * r, c[2] - 0.1 * r], [c[0] + 0.1 * r, c[1] + 0.95 * r, c[2] - 0.4 * r], 0.36 * r, 0.18 * r),
    S.roundCone([c[0] + 0.1 * r, c[1] + 0.95 * r, c[2] - 0.4 * r], [c[0] + 0.22 * r, c[1] + 1.15 * r, c[2] - 0.72 * r], 0.18 * r, 0.04 * r));
  const ridges = S.intersect(0.01, S.shell(ell(c, [R[0] + 0.03, R[1] + 0.03, R[2] + 0.03]), 0.04 * r),
    S.field((x, y, z) => Math.abs(Math.sin((y - c[1]) / r * 9)) * 0.1 * r - 0.03 * r));
  const lip = S.transform(S.torus([0, 0, 0], 0.88 * r, 0.09 * r), { translate: [c[0], c[1] + 0.08 * r, c[2]] });
  return [fur(S.union(0.03, dome, spire), lin('#f2a0b8')), fur(ridges, lin('#d97a98')), fur(lip, lin('#fff1e6'))];
}
function coralHorns(h) { 
  const r = h.r, c = h.c, top = c[1] + 0.82 * r;
  const branch = (sx) => {
    const a = [c[0] + sx * 0.36 * r, top, c[2]], b = [c[0] + sx * 0.58 * r, top + 0.55 * r, c[2]];
    const tip = (dx, dy, dz) => S.roundCone(b, [b[0] + sx * dx * r, b[1] + dy * r, b[2] + dz * r], 0.09 * r, 0.05 * r);
    return S.union(0.05, S.roundCone(a, b, 0.14 * r, 0.09 * r), tip(0.3, 0.35, 0.05), tip(-0.12, 0.45, -0.1), tip(0.05, 0.3, 0.25));
  };
  const band = S.transform(S.torus([0, 0, 0], 0.8 * r, 0.05 * r), { translate: [c[0], top - 0.1 * r, c[2]] });
  return [fur(S.union(0.02, branch(-1), branch(1)), lin('#ff7a8a')), fur(band, lin('#2fa0a0'))];
}
function kelpBeanie(h) { 
  const r = h.r, c = [h.c[0], h.c[1] + 0.48 * h.r, h.c[2]], R = [0.86 * r, 0.78 * r, 0.86 * r];
  const dome = S.intersect(0.03, ell(c, R), S.field((x, y) => c[1] + 0.12 * r - y));
  const cuff = S.transform(S.torus([0, 0, 0], 0.84 * r, 0.12 * r), { translate: [c[0], c[1] + 0.16 * r, c[2]] });
  const crown = [c[0], c[1] + R[1], c[2]];
  const fronds = [[-0.5, -0.1, 0.2], [0.45, -0.05, 0.15], [0.05, -0.15, -0.55]].map(([dx, dy, dz]) => S.roundCone(crown, [crown[0] + dx * r, crown[1] + (0.35 + dy) * r, crown[2] + dz * r], 0.1 * r, 0.04 * r));
  return [fur(dome, lin('#2f7a4a')), fur(cuff, lin('#245e3a')), fur(S.union(0.04, ...fronds), lin('#6fbf5a'))];
}
const HAT_SHAPES = { priest: (h, dec) => priestHat(h, dec), bandana, ember: emberCap, backcap: backCap, helmet: lampHelmet, goggles, horns, beanie, conch, coral: coralHorns, kelp: kelpBeanie };
export const HAT_GEOS = Object.keys(HAT_SHAPES);

export const hatGeo = (hat) => (hat === true ? 'priest' : HAT_SHAPES[hat] ? hat : null);

function bandage(h, ly) {
  
  
  const r = h.r, c = h.c, WRAP = lin('#fbf6ea');
  const band = S.transform(S.torus([0, 0, 0], 0.9 * r, 0.1 * r), { translate: [c[0], c[1] + 0.4 * r, c[2] - 0.2 * r], rotate: [-0.5, 0, 0.35] });
  const f = frameAt(h, -0.48, 0.62, 0.62, 0.02);
  const pad = atSurface(S.transform(S.roundBox([0, 0, 0], [0.26 * r, 0.17 * r, 0.06 * r], 0.05 * r), { rotate: [0, 0, -0.35] }), f);
  const cross2 = atSurface(S.transform(S.union(0.01, S.roundBox([0, 0, 0.07 * r], [0.12 * r, 0.035 * r, 0.03 * r], 0.012 * r), S.roundBox([0, 0, 0.07 * r], [0.035 * r, 0.12 * r, 0.03 * r], 0.012 * r)), { rotate: [0, 0, -0.35] }), f);
  const kn = add(c, norm([0.55, 0.75, -0.35]), r * 1.0);
  const tails = [[0.5, 0.35], [0.25, 0.6]].map(([dx, dy]) => S.roundCone(kn, [kn[0] + dx * r, kn[1] + dy * r, kn[2] - 0.1 * r], 0.09 * r, 0.05 * r));
  const out = [fur(S.union(0.03, band, ...tails), WRAP), fur(pad, lin('#fff7ee')), fur(cross2, lin('#e25b5b'))];
  if (ly.arms) { const a = ly.arms[0]; out.push(fur(S.transform(S.torus([0, 0, 0], 0.2, 0.06), { translate: [-a[0], a[1], a[2]], rotate: [0, 0, 1.2] }), lin('#fbf6ea'))); }
  return out;
}

function crown(h, acc) {
  const top = h.c[1] + h.r * 0.86, r = h.r, z = h.c[2] + 0.2 * r;
  const spikes = [[-0.35, 0.36], [0, 0.5], [0.35, 0.36]].map(([x, len]) => S.roundCone([x * r, top - 0.05, z], [x * r * 1.2, top + len * r, z - 0.05], 0.12 * r, 0.02 * r));
  return [fur(S.union(0.03, ...spikes), acc), glow(S.sphere([0, top + 0.08 * r, z + 0.12 * r], 0.08 * r), lin('#fff3c0'))];
}


const KIT = { S, ell, fur, glow, metal, lin, light, dark, mix, add, norm, deep, LEAF, IVORY };



export function splitOf(L) {
  if (L.split) return L.split;
  if (L.skeleton) return { mode: 'vertical', mat: 'bone', side: -1 };
  if (L.cyborg) return { mode: 'vertical', mat: 'metal', side: 1 };
  return null;
}


export function dachiNode(sp, opts = {}) {
  const L = sp.look, st = sp.stage, type = sp.types[0];
  
  const plan = L.plan || 'round', full = st >= 2 && plan !== 'round';
  const col = vivid(lin(sp.color)), acc = vivid(lin(sp.accent)), ly = (full && planLayout(plan, KIT)) || layout(L.shape), h = ly.head;
  const shapeEff = full ? plan : L.shape;
  
  const swingA = full ? (SWING[plan] || 0) : 0, pz = h.c[2], cs = Math.cos(swingA), sn = Math.sin(swingA);
  const swingP = (p) => (swingA ? [p[0] * cs + (p[2] - pz) * sn, p[1], -p[0] * sn + (p[2] - pz) * cs + pz] : p);
  const swingN = (n) => (swingA ? S.transform(S.transform(n, { translate: [0, 0, -pz] }), { rotate: [0, swingA, 0], translate: [0, 0, pz] }) : n);
  
  if (swingA) { ly.belly = swingP(ly.belly); ly.wing0 = ly.wing; ly.wing = swingP(ly.wing); }
  ly.chestC = ly.chestC || [0, ly.belly[1] + 0.05, L.shape === 'long' ? -0.2 : 0];
  ly.ribY = ly.belly[1] - 0.12; ly.ribR = ly.ribR || (L.shape === 'long' ? [0.6, 0.85] : L.shape === 'pear' ? [0.72, 0.66] : [1.0, 0.9]);
  const split = splitOf(L);
  
  
  const lampCol = deep(acc);
  let metalCol = L.metal && METAL_TINTS[L.metal] ? vivid(lin(METAL_TINTS[L.metal])) : light(METAL, 0.3);
  if (split && split.mat === 'lamp-glow') metalCol = dark(metalCol, 0.3);
  const bellyCol = light(col, 0.55), markCol = mix(col, acc, 0.75);
  const spots = [];
  for (let i = 0; i < 8; i++) { const a = i * 2.4, e = ((i * 37) % 11) / 11 - 0.3; spots.push(add(ly.chestC, norm([Math.sin(a), e, Math.cos(a)]), 0.8)); }
  const skin = (x, y, z) => {
    let c = col;
    const [bx, by, bz] = ly.belly;
    if ((L.pattern === 'belly' || L.pattern === 'heart') && z > bz - 0.35 && y < ly.neck) {
      const e = ((x - bx) / 0.5) ** 2 + ((y - by) / 0.45) ** 2;
      c = mix(c, bellyCol, 1 - sm(0.75, 1.0, e));
    } else if (L.pattern === 'spots') {
      for (const s of spots) if (Math.hypot(x - s[0], y - s[1], z - s[2]) < 0.2) { c = light(col, 0.4); break; }
    } else if (L.pattern === 'stripes' && z < 0.2 && Math.sin(y * 8 + x * 2.5) > 0.55) c = dark(col, 0.3);
    if (L.pattern === 'heart' && z > 0) { 
      const hx = (x + 0.05) / 0.2, hy = (y - by - 0.05) / 0.2;
      const q = hx * hx + (hy - Math.sqrt(Math.abs(hx)) * 0.8) ** 2;
      if (q < 0.9) c = lin('#ff5d9e');
    }
    if (st >= 2 && x < -0.5 && y < ly.neck && Math.abs(y - (ly.chestC[1] + 0.05) + (x + 0.7) * 0.4) < 0.1 && z > -0.3) c = markCol; 
    return c; 
  };

  
  const partArm = split && split.mode === 'part' && split.part === 'arm' ? split.side : 0;
  const limbs = [], limbSide = { '-1': [], 1: [] };
  const limbPush = (sgn, node0, arm) => { const node = swingN(node0); limbs.push(node); if (arm) limbSide[sgn].push(node); };
  const PP = planParts(plan, full, ly, h, col, acc, st, KIT, planIndex(sp) % 2), ownLimbs = []; 
  for (const q of PP.limbs) { if (q.own) { const n = swingN(q.node); ownLimbs.push(n); if (q.arm) limbSide[q.sgn].push(n); } else limbPush(q.sgn, q.node, q.arm); }
  if (ly.arms && !PP.noArms) for (const a of ly.arms) for (const sgn of [-1, 1]) {
    const k = sgn === partArm ? 1.75 : 1; 
    limbPush(sgn, S.transform(ell([0, 0, 0], [0.2 * k, 0.26 * k, 0.2 * k]), { translate: [sgn * a[0] * (k > 1 ? 1.15 : 1), a[1] + (k > 1 ? 0.12 : 0), a[2]], rotate: [0.3, 0, sgn * (k > 1 ? 1.0 : 0.6)] }), true);
  }
  if (ly.feet && !PP.noFeet) for (const f of ly.feet) for (const sgn of [-1, 1]) limbPush(sgn, ell([sgn * f[0], f[1] + 0.04, f[2]], [0.26, 0.15, 0.3]), false);
  if (ly.legs) ly.legs.forEach(([lx, lz], i) => { for (const sgn of [-1, 1]) {
    const k = i === 0 && sgn === partArm ? 1.45 : 1;
    const leg = S.union(0.06, S.roundCone([sgn * lx, ly.legTop || 0.5, lz], [sgn * (lx + 0.02), 0.13, lz + 0.03], 0.2 * k, 0.17 * k),
      ell([sgn * (lx + 0.02), 0.09, lz + 0.08], [0.19 * k, 0.11, 0.23 * k]));
    limbPush(sgn, leg, i === 0);
  } });
  const B = L.build || { w: 1, t: 1, e: 1 };
  const earKind = L.ears === 'none' && L.topper ? L.topper : L.ears;
  const tailK = split && split.mode === 'part' && split.part === 'tail' ? 1.35 : 1;
  const earList = ears(earKind, h, col, acc, st, B.e), tl0 = PP.tail ? { body: PP.tail, extra: [] } : tail(L.tail, ly.tail, col, acc, tailK);
  const tl = { body: tl0.body && swingN(tl0.body), extra: tl0.extra.map(swingN) };
  const hp = ly.hp || [], body = ly.parts.filter((_, i) => !hp.includes(i));
  const trunk = hp.length && swingA ? S.union(ly.k, ...hp.map((i) => ly.parts[i]), swingN(S.union(ly.k, ...body))) : S.union(ly.k, ...ly.parts);
  const organicParts = [fur(trunk, skin), ...earList.map((e) => e.node), ...ownLimbs, ...PP.organic.map(swingN)];
  if (limbs.length) organicParts.push(fur(S.union(0.02, ...limbs), dark(col, 0.1)));
  if (tl.body) organicParts.push(tl.body);
  let organic = S.union(0.1, ...organicParts);

  
  let region = null;
  if (split) {
    let partNode = null;
    if (split.mode === 'part') {
      if (split.part === 'arm') partNode = limbSide[split.side].length ? S.union(0, ...limbSide[split.side]) : null;
      else if (split.part === 'tail' && tl.body) partNode = tl.body;
      else if (split.part === 'ear') { const e = earList.filter((q) => q.side === split.side); partNode = e.length ? e[0].node : earList[0] && earList[0].node; }
    }
    region = splitRegion(split, ly, h, partNode);
    if (!(split.mode === 'part' && split.part === 'wing')) organic = splitPaint(organic, region, split, ly, h, col, metalCol, lampCol);
  }
  const eyeMat = (sgn) => {
    if (!split) return null;
    if (split.mode === 'part') return split.part === 'eye' && sgn === split.side ? split.mat : null; 
    const e = onHead(h, sgn * EYE[0], EYE[1], EYE[2]).p;
    return region(e[0], e[1], e[2]) > 0 ? split.mat : null;
  };
  const wingMat = (sgn) => {
    if (!split) return null;
    if (split.mode === 'part') return split.part === 'wing' && sgn === split.side ? split.mat : null;
    const w = [sgn * ly.wing[0], ly.wing[1], ly.wing[2]];
    return region(w[0], w[1], w[2]) > 0 ? split.mat : null;
  };

  const details = [organic, ...tl.extra, ...PP.details.map(swingN), ...(PP.head || [])], dec = []; 
  eyes(L, h, st, S.union(ly.k, ...ly.parts), eyeMat, lampCol, mix(deep(acc), INK, 0.35), dec, details, mix(acc, INK, 0.92));
  mouth(L, h, ly.snout, type, dec, L.eyes !== 'visor' && L.signature !== 'cheeks', !!PP.beak);
  if (PP.beak) details.push(...PP.beak);
  const g = 1 + (st - 1) * 0.12;
  if ((L.wings || PP.wings) && !PP.noWings) details.push(...wings(ly.wing0 || ly.wing, acc, wingMat, lampCol, g * (PP.wings || 1), metalCol, split && split.mode === 'part' && split.part === 'wing' ? split.side : 0).map(swingN));
  if (split && split.mat === 'bone' && (split.mode === 'vertical' || split.mode === 'diagonal')) details.push(...ribs(ly, split.side).map(swingN));
  else if (L.skeleton) details.push(...ribs(ly, -1).map(swingN));
  if (L.signature && !(PP.beak && (L.signature === 'trunk' || L.signature === 'cheeks'))) details.push(...signature(L.signature, h, ly, col, acc, st, lampCol, shapeEff));
  if (L.armor) details.push(...armour(ly).map(swingN));
  if (L.wizardHat) details.push(...wizardHat(h));
  else if (hatGeo(opts.hat)) details.push(...HAT_SHAPES[hatGeo(opts.hat)](h, dec));
  else if (st === 3 && !HEAD_SIGS.has(L.signature)) details.push(...crown(h, acc));
  if (opts.bandage) details.push(...bandage(h, ly));
  const node = S.union(0.025, ...details);
  
  
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const d of details) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], d.b.c[a] - d.b.r); hi[a] = Math.max(hi[a], d.b.c[a] + d.b.r); }
  if (B.w === 1 && B.t === 1) { node.box = { min: lo, max: hi }; node.decals = dec; return node; }
  
  
  const bw = 1.03 + (B.w - 1.03) * 1.6, bt = 1.04 + (B.t - 1.04) * 1.6;
  const out = S.transform(node, { scale: [bw, bt, bw] });
  out.box = { min: [lo[0] * bw, lo[1] * bt, lo[2] * bw], max: [hi[0] * bw, hi[1] * bt, hi[2] * bw] };
  out.decals = dec.map((d) => ({ node: S.transform(d.node, { scale: [bw, bt, bw] }), tris: d.tris, cell: d.cell }));
  return out;
}


const CELL = 0.055, TRIS = 2500, UV = 3.5; 


const DACHI_TRIS = 2000, DACHI_CELL = 0.064, DECAL_CELL = 0.03;


export const DECAL_UV = [8.5 / 32, 1 - 23.5 / 32];



export const NO_INK_UV = [9.5 / 32, 1 - 23.5 / 32];


const STAGE_CELL = [1, 1.14, 1.24];
const cache = new Map();
export const modelStats = { built: 0, ms: 0, tris: 0, log: [] };

export const modelKey = (spId, opts = {}) => { const g = hatGeo(opts.hat); return `${spId}${opts.bandage ? 'b' : ''}${g ? 'h' + (g === 'priest' ? '' : g) : ''}`; };

function boundsOf(node) {
  if (node.box) { const min = node.box.min.slice(); if (!node.box.free) min[1] = Math.max(min[1], -0.25); 
    return { min, max: node.box.max }; }
  
  const b = node.b, lo = [0, 0, 0], hi = [0, 0, 0];
  for (let a = 0; a < 3; a++) { lo[a] = b.c[a] - b.r; hi[a] = b.c[a] + b.r; }
  lo[1] = Math.max(lo[1], -0.1);
  return { min: lo, max: hi };
}

export function hasModel(spId, opts) { return cache.has(modelKey(spId, opts)); }
export function dachiArrays(spId, opts = {}) {
  const key = modelKey(spId, opts);
  let arr = cache.get(key);
  if (arr) return arr;
  const t0 = (typeof performance !== 'undefined' ? performance : Date).now();
  const sp = speciesById(spId);
  arr = buildArrays('dachi-' + key, dachiNode(sp, opts), sp.name, t0, { tris: DACHI_TRIS, cell: DACHI_CELL * STAGE_CELL[sp.stage - 1] });
  cache.set(key, arr);
  return arr;
}


export function buildArrays(name, node, label = name, t0 = (typeof performance !== 'undefined' ? performance : Date).now(), { cell = CELL, tris = TRIS } = {}) {
  const md = new MeshData(name);
  const { min, max } = boundsOf(node);
  const res = S.sdfPart(md, node, { min, max, cell, targetTris: tris, material: 'fur', uvScale: UV, ao: { reach: 0.3, strength: 1.4 }, aoMin: 0.45 });
  
  
  const tagged = (node.decals || []).some((d) => d.rig), rigTags = new Map();
  const fillTags = (v) => { if (tagged) for (const [k, g] of md.groups) { const t = rigTags.get(k) || []; rigTags.set(k, t); while (t.length < g.positions.length / 3) t.push(v); } };
  fillTags(node.rig || 0);
  
  
  
  
  for (const { node: dn, tris: dt, cell: dc, ao: fineAo, uv: ownUv, box, rig: partRig, inkless } of node.decals || []) {
    fillTags(0); 
    const b = dn.b, lo = box ? box.min : b.c.map((v) => v - b.r), hi = box ? box.max : b.c.map((v) => v + b.r);
    const before = new Map([...md.groups].map(([k, g]) => [k, g.uvs.length]));
    const shade = fineAo ? { ao: { reach: 0.3, strength: 1.4 }, aoMin: 0.5 } : { ao: { reach: 0.1, strength: 0 }, aoMin: 1 };
    const tp = modelStats.trace ? Date.now() : 0; 
    let got = 0;
    try { const pr = S.sdfPart(md, dn, { min: lo, max: hi, cell: dc || DECAL_CELL, targetTris: dt, material: 'fur', uvScale: UV, ...shade }); res.fine += pr.fine; got = pr.tris; }
    catch (err) { modelStats.decalErrors = (modelStats.decalErrors || 0) + 1; if (fineAo) modelStats.partErrors = (modelStats.partErrors || 0) + 1; } 
    
    
    if (tp) modelStats.trace.push({ key: name, ms: Date.now() - tp, cell: dc, tris: dt, got, ao: !!fineAo });
    const du = inkless ? NO_INK_UV : DECAL_UV;
    if (!ownUv) for (const [k, g] of md.groups) for (let i = before.get(k) || 0; i < g.uvs.length; i += 2) { g.uvs[i] = du[0]; g.uvs[i + 1] = du[1]; }
    fillTags(partRig || 0);
  }
  const arr = md.toArrays();
  if (tagged) for (const g of arr.groups) g.rig = Float32Array.from(rigTags.get(g.material) || new Array(g.position.length / 3).fill(0));
  const ms = (typeof performance !== 'undefined' ? performance : Date).now() - t0;
  modelStats.built++; modelStats.ms += ms; modelStats.tris += arr.triangles;
  modelStats.log.push({ key: name, name: label, ms: Math.round(ms), tris: arr.triangles, fine: res.fine });
  return arr;
}
