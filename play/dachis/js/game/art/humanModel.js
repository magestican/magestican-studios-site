














import * as S from '../../vendor/fml/moon/mesh/sdf.js';
import { lin, fur, metal, glow, ell, dark, light, mix, INK } from './dachiModel.js';

const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const hex = (c) => (typeof c === 'string' ? lin(c) : c);



export function surf(node, x, y, z0 = 0, dz = 1) {
  let z = z0, d = node.d(x, y, z);
  for (let i = 0; i < 600 && d < 0; i++) { z += dz * Math.max(0.002, -d * 0.8); d = node.d(x, y, z); }
  return [x, y, z];
}
export const normalOf = (node, p) => S.normalAt(node, p[0], p[1], p[2], 2e-3);

export const part = (node, tris, cell, o = {}) => ({ node, tris, cell, ...o });
export const finePart = (node, tris, cell) => ({ node, tris, cell, ao: true, uv: true });

export function lens(p, n, R, col, up = [0, 1, 0]) {
  const f = S.frameFromNormal(n, up);
  return fur(S.place(ell([0, 0, 0], R), p, f.X, f.Y, f.Z), hex(col));
}

export function tube(pts, r, col, k = 0.004) {
  const segs = [];
  for (let i = 1; i < pts.length; i++) segs.push(S.capsule(pts[i - 1], pts[i], typeof r === 'function' ? r(i / (pts.length - 1)) : r));
  return fur(S.union(k, ...segs), hex(col));
}

export function spline(cp, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * (cp.length - 1), k = Math.min(cp.length - 2, Math.floor(t)), u = t - k;
    const p0 = cp[Math.max(0, k - 1)], p1 = cp[k], p2 = cp[k + 1], p3 = cp[Math.min(cp.length - 1, k + 2)];
    out.push([0, 1, 2].map((a) => 0.5 * ((2 * p1[a]) + (-p0[a] + p2[a]) * u + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * u * u + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * u * u * u)));
  }
  return out;
}










export function overlay(node, region, col, H, { off = 0.012, box = null, cell = 0.022, tris = 160 } = {}) {
  const skin = S.intersect(0.003, S.offset(node, off * H), S.field(region));
  return { node: fur(skin, hex(col)), tris, cell, ao: true, uv: true, box };
}

export function onSurface(node, pts, back = false, lift = 0.01) {
  return pts.map(([x, y]) => { const q = surf(node, x, y, 0, back ? -1 : 1); return add(q, normalOf(node, q), lift); });
}





export function humanHead(rig, o = {}) {
  const H = rig.hh, e = rig.eye, P = (x, y, z) => [x * H, e + y * H, z * H], R = (a, b, c) => [a * H, b * H, c * H];
  const skin = hex(o.skin), old = o.age === 'old';
  
  
  const shape = [
    ell(P(0, 0.1, -0.05), R(0.37, 0.42, 0.455)), 
    ell(P(0, -0.18, 0.07), R(0.305, 0.31, 0.32)), 
    ell(P(0, -0.34, 0.1), R(old ? 0.24 : 0.225, 0.15, 0.26)), 
    ell(P(0, -0.43, 0.215), R(0.1, 0.075, 0.09)), 
    ...[-1, 1].map((s) => ell(P(s * 0.19, -0.12, 0.2), R(0.12, 0.1, 0.12))), 
    ell(P(0, 0.11, 0.3), R(0.28, 0.065, 0.09)), 
  ];
  const nose = S.union(0.02,
    S.roundCone(P(0, 0.03, 0.37), P(0, -0.18, 0.46), 0.032 * H, 0.052 * H),
    ...[-1, 1].map((s) => S.sphere(P(s * 0.048, -0.205, 0.405), 0.036 * H)));
  const nr = rig.neckR ?? 0.2 * H;
  const neck = S.roundCone(P(0, -0.28, -0.09), [0, rig.shoulder + 0.02 * H, -0.07 * H], nr * 0.9, nr * 1.08);
  const head = fur(S.union(0.07, ...shape, neck), skin);
  const lipC = hex(o.lips || mix(skin, lin('#b04a50'), 0.45));
  const lips = fur(S.union(0.012, ell(P(0, -0.318, 0.352), R(0.078, 0.022, 0.03)), ell(P(0, -0.356, 0.345), R(0.066, 0.027, 0.03))), lipC);
  const ears = [-1, 1].map((s) => S.subtract(0.015,
    fur(S.transform(ell([0, 0, 0], R(0.04, 0.115, 0.072)), { translate: P(s * 0.36, -0.07, -0.05), rotate: [0, s * -0.12, 0] }), skin),
    fur(S.sphere(P(s * 0.395, -0.07, -0.035), 0.036 * H), dark(skin, 0.3)), { cutColor: true }));
  return { skin: S.union(0.03, head, fur(nose, skin), lips, ...ears), P, R, H, e };
}





export function humanEyes(headNode, rig, o = {}) {
  const H = rig.hh, e = rig.eye, out = [], cell = Math.max(0.004, 0.0045 * H);
  const irisC = hex(o.iris || '#5a3a22'), browC = hex(o.hair || '#3a2418'), lash = mix(hex(o.hair || '#3a2418'), INK, 0.6);
  for (const s of [-1, 1]) {
    const x = s * 0.155 * H, p = surf(headNode, x, e), n0 = normalOf(headNode, p), n = norm(add(n0, [0, 0, 1.2]));
    const on = (u, v, lift) => { const q = surf(headNode, x + u * H, e + v * H); return add(q, normalOf(headNode, q), lift * H); };
    if (o.lens && o.lens(s)) continue; 
    out.push(part(lens(add(p, n, -0.006 * H), n, R3(0.092, 0.054, 0.024, H), '#efe6dc'), 60, cell));
    out.push(part(lens(add(p, n, 0.012 * H), n, R3(0.056, 0.056, 0.014, H), irisC), 40, cell));
    out.push(part(lens(add(p, n, 0.019 * H), n, R3(0.028, 0.028, 0.01, H), INK), 24, cell));
    const f = S.frameFromNormal(n);
    out.push(part(lens(add(add(add(p, n, 0.026 * H), f.X, -0.016 * H), f.Y, 0.018 * H), n, R3(0.013, 0.013, 0.006, H), [1, 1, 1]), 16, cell));
    
    const lid = [-1, -0.5, 0, 0.5, 1].map((t) => on(t * 0.088 * s, 0.03 + (1 - t * t) * 0.02 + (t > 0 ? 0.004 : 0), 0.018));
    out.push(part(tube(lid, (t) => (0.011 + t * 0.008) * H, lash), 60, cell));
    
    const bk = o.brow || 1, brow = [-1, -0.4, 0.2, 0.7, 1.1].map((t) => on(t * 0.1 * s, 0.135 + Math.sin((t + 1) * 1.3) * 0.02 - (t > 0.8 ? 0.012 : 0) + (t < -0.5 ? 0.006 : 0), 0.012));
    out.push(part(tube(brow, (t) => (0.019 - Math.abs(t - 0.4) * 0.008) * H * bk, browC), 70, cell * 1.3));
  }
  
  const ml = [-1, -0.5, 0, 0.5, 1].map((t) => { const q = surf(headNode, t * 0.075 * H, e + (-0.337 + Math.abs(t) ** 2 * 0.012 + (t > 0 ? t * 0.006 : 0)) * H); return add(q, normalOf(headNode, q), 0.004 * H); });
  out.push(part(tube(ml, 0.009 * H, mix(hex(o.lips || '#a0505a'), INK, 0.55)), 40, cell));
  return out;
}
const R3 = (a, b, c, H) => [a * H, b * H, c * H];





export function humanHand(rig, s, wrist, dir, skin, o = {}) {
  
  
  
  const H = rig.hh * (o.k ?? 1), c = o.curl ?? 0.25, X = (v) => [v[0] * s, v[1], v[2]], pts = [];
  const palm = ell(X([0, -0.14 * H, 0]), [0.05 * H, 0.14 * H, 0.1 * H]);
  pts.push(palm, S.capsule([0, 0.04 * H, 0], X([0, -0.08 * H, 0]), 0.062 * H)); 
  const fz = [0.066, 0.022, -0.022, -0.064], len = [0.21, 0.235, 0.22, 0.17];
  fz.forEach((z, i) => {
    const b = X([0, -0.26 * H, z * H]), L = len[i] * H, a1 = 0.2 + c * 0.8, a2 = a1 + 0.3 + c * 0.8;
    const m = add(b, X([-Math.sin(a1) * L * 0.55, -Math.cos(a1) * L * 0.55, 0]));
    const t = add(m, X([-Math.sin(a2) * L * 0.45, -Math.cos(a2) * L * 0.45, 0]));
    pts.push(S.capsule(b, m, 0.028 * H), S.capsule(m, t, 0.025 * H));
  });
  pts.push(S.union(0.02, S.capsule(X([-0.02 * H, -0.06 * H, 0.08 * H]), X([-0.05 * H, -0.16 * H, 0.13 * H]), 0.032 * H),
    S.capsule(X([-0.05 * H, -0.16 * H, 0.13 * H]), X([-0.07 * H, -0.24 * H, 0.11 * H]), 0.027 * H))); 
  const node = fur(S.union(0.03, ...pts), hex(skin));
  const Y = norm(dir.map((v) => -v)), Z0 = [0, 0, 1], Xa = norm(cross(Y, Z0)), Z = cross(Xa, Y);
  return S.place(node, wrist, Xa, Y, Z);
}





export function highTop(rig, x, c, o = {}) {
  const H = rig.hh, up = o.collar ?? 0.5;
  const upper = hex(c.upper), panel = hex(c.panel), sole = hex(c.sole);
  const shoe = S.union(0.05,
    S.roundBox([x, 0.055 * H, 0.1 * H], [0.16 * H, 0.055 * H, 0.34 * H], 0.045 * H), 
    ell([x, 0.17 * H, 0.2 * H], [0.15 * H, 0.12 * H, 0.26 * H]), 
    S.roundCone([x, 0.12 * H, -0.1 * H], [x, up * H, -0.06 * H], 0.165 * H, 0.15 * H), 
  );
  const collar = S.transform(S.torus([0, 0, 0], 0.14 * H, 0.045 * H), { translate: [x, up * H, -0.06 * H], rotate: [0.18, 0, 0] });
  const tongue = S.transform(S.roundBox([0, 0, 0], [0.085 * H, 0.14 * H, 0.03 * H], 0.025 * H), { translate: [x, (up - 0.02) * H, 0.07 * H], rotate: [-0.35, 0, 0] });
  const node = S.union(0.02, fur(shoe, (px, py) => (py < 0.1 * H ? sole : upper)), fur(collar, light(panel, 0.1)), fur(tongue, hex(c.tongue || c.upper)));
  const bx = { min: [x - 0.22 * H, 0.08 * H, -0.32 * H], max: [x + 0.22 * H, (up + 0.05) * H, 0.48 * H] };
  const panels = [
    overlay(shoe, (px, py, pz) => Math.max(pz + 0.17 * H, py - 0.3 * H, 0.1 * H - py) * 0.9, panel, H, { box: bx, tris: 80, cell: 0.016 }), 
    overlay(shoe, (px, py, pz) => Math.max(Math.abs(py - (0.19 + (pz / H - 0.05) * 0.35) * H) - 0.035 * H, 0.1 * H - Math.abs(px - x), -0.12 * H - pz, pz - 0.3 * H) * 0.8, panel, H, { box: bx, tris: 100, cell: 0.016 }), 
  ];
  
  const lc = [], lcol = hex(c.laces);
  for (let i = 0; i < 4; i++) {
    const y = (0.2 + i * 0.075) * H, w = 0.07 * H;
    const a = surf(shoe, x - w, y, -0.1 * H), b = surf(shoe, x + w, y + 0.04 * H, -0.1 * H);
    lc.push(S.capsule(add(a, [0, 0, 0.012 * H]), add(b, [0, 0, 0.012 * H]), 0.017 * H));
    const a2 = surf(shoe, x + w, y, -0.1 * H), b2 = surf(shoe, x - w, y + 0.04 * H, -0.1 * H);
    lc.push(S.capsule(add(a2, [0, 0, 0.012 * H]), add(b2, [0, 0, 0.012 * H]), 0.017 * H));
  }
  return { node, laces: fur(S.union(0.005, ...lc), lcol), panels };
}







export function neckPhones(rig, c, o = {}) {
  const H = rig.hh, nr = (rig.neckR ?? 0.2 * H) / H, r = (o.r ?? nr + 0.06) * H, y0 = rig.shoulder + (o.lift ?? 0.2) * H, z0 = (o.z ?? -0.07) * H;
  const band = S.intersect(0.01, S.transform(S.torus([0, 0, 0], r, 0.02 * H), { translate: [0, y0, z0], rotate: [0.6, 0, 0] }),
    S.field((x, y, z) => z - z0 - 0.04 * H));
  const parts = [fur(band, hex(c.band))];
  let jack = null;
  const cx = (o.x ?? nr + 0.1 * (rig.bodyW ?? 1)) * H; 
  for (const s of [-1, 1]) {
    
    
    let cc = [s * cx, rig.shoulder + 0.1 * H, 0.1 * H];
    if (o.on) { let y = rig.shoulder - 0.3 * H; for (let i = 0; i < 400 && o.on.d(cc[0], y, cc[2]) < 0; i++) y += 0.004 * H; cc = [cc[0], y + 0.05 * H, cc[2]]; }
    const n = norm([-s * 0.25, 0.9, 0.35]); 
    const f = S.frameFromNormal(n, [0, 0, 1]);
    const cup = (node) => S.place(node, cc, f.X, f.Z, f.Y); 
    parts.push(fur(cup(S.roundCylinder([0, -0.02 * H, 0], 0.112 * H, 0.1 * H, 0.03 * H, 0.012 * H)), hex(c.band))); 
    parts.push(fur(cup(S.roundCylinder([0, 0.026 * H, 0], 0.118 * H, 0.112 * H, 0.02 * H, 0.008 * H)), hex(c.pads))); 
    
    const bandEnd = [s * r * 0.97, y0 - 0.1 * H, z0 + 0.06 * H];
    parts.push(fur(S.capsule(add(add(cc, n, -0.02 * H), [0, 0.06 * H, -0.04 * H]), bandEnd, 0.016 * H), hex(c.band)));
    if (s < 0) jack = add(add(cc, n, -0.04 * H), [0, -0.05 * H, 0.02 * H]);
  }
  return { node: S.union(0.01, ...parts), jack };
}





export function tapePlayer(rig, p, n, c) {
  const H = rig.hh, f = S.frameFromNormal(n), Y = f.Y, Xa = f.X, Z = n;
  const L = (x, y, z) => add(add(add(p, Xa, x * H), Y, y * H), Z, z * H);
  const P = (node) => S.place(node, p, Xa, Y, Z);
  const box = (cx, cy, cz, hx, hy, hz, rr) => P(S.roundBox([cx * H, cy * H, cz * H], [hx * H, hy * H, hz * H], rr * H));
  const body = hex(c.body), panel = hex(c.panel);
  const parts = [
    fur(box(0, 0, 0, 0.17, 0.215, 0.062, 0.028), body),
    fur(box(0, -0.02, 0.05, 0.148, 0.152, 0.02, 0.012), panel), 
    fur(box(0, 0.1, -0.06, 0.08, 0.1, 0.03, 0.02), dark(panel, 0.2)), 
    fur(box(0.172, -0.02, 0, 0.014, 0.16, 0.04, 0.008), lin('#e8322c')), 
  ];
  for (let i = 0; i < 4; i++) parts.push(fur(box(-0.105 + i * 0.07, 0.228, 0.005, 0.028, 0.022, 0.036, 0.008), i === 1 ? lin('#e8322c') : lin('#c9ccd2')));
  parts.push(fur(P(S.roundCylinder([0.12 * H, 0.235 * H, -0.02 * H], 0.02 * H, 0.02 * H, 0.022 * H, 0.006 * H)), dark(panel, 0.3))); 
  const cell = 0.0035 * H, dec = [
    part(fur(box(0, -0.015, 0.068, 0.122, 0.084, 0.006, 0.006), lin('#ece6d8')), 40, cell * 1.6), 
    part(fur(box(0, 0.035, 0.075, 0.112, 0.02, 0.003, 0.002), lin('#ff6a2a')), 30, cell), 
    part(fur(box(0, -0.028, 0.075, 0.072, 0.026, 0.003, 0.002), hex(c.window)), 30, cell), 
  ];
  for (const sx of [-1, 1]) dec.push(part(fur(P(ell([sx * 0.046 * H, -0.028 * H, 0.079 * H], [0.017 * H, 0.017 * H, 0.004 * H])), hex(c.reels)), 24, cell));
  return { node: S.union(0.006, ...parts), decals: dec, jack: L(0.12, 0.27, -0.02) };
}



export function punch(c) { const g = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; return c.map((v) => Math.max(0, Math.min(1, (g + (v - g) * 1.4) * 0.94))); }

export function outfitColours(o, keep = ['skin', 'hair', 'eyes', 'lips']) {
  const walk = (v, k) => (typeof v === 'string' && v[0] === '#' ? (keep.includes(k) ? lin(v) : punch(lin(v)))
    : v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).map(([kk, vv]) => [kk, walk(vv, kk)])) : v);
  return walk(o, '');
}
