


























import * as S from '../../vendor/fml/moon/mesh/sdf.js';
import { lin, fur, buildArrays, dark, light, mix, ell } from './dachiModel.js';
import { humanRig, KID_HEIGHT, KID_HEADS, KID_OUTFITS } from './humanRig.js';
import { hex, surf, normalOf, part, finePart, tube, spline, humanHead, humanEyes, humanHand, highTop, neckPhones, tapePlayer, outfitColours, overlay, onSurface } from './humanModel.js';

export const CAST_UNIT = 0.2;
export const RIG_ARM = 1, RIG_BODY = 2;
const RIG = humanRig({ height: KID_HEIGHT, heads: KID_HEADS });

export const KID_RIG = {
  eye: RIG.eye, hh: RIG.hh, hip: RIG.hip, shoulder: RIG.shoulder, knee: RIG.knee, elbow: RIG.elbow, upperArm: RIG.upperArm,
  armLine: RIG.armLine, armLow: RIG.armLow, legBlend: RIG.legBlend, kneeBlend: RIG.kneeBlend, height: RIG.H,
};
export const KID_CELL = 0.045;

const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const tag = (entry, rig) => ({ ...entry, rig });



function torsoForm(r) {
  const H = r.hh;
  return S.union(0.14 * H,
    ell([0, r.chest + 0.06 * H, 0.02 * H], [r.chestHalf, 0.44 * H, r.chestDepth]),
    ell([0, r.waist, 0], [r.waistHalf, 0.3 * H, r.waistDepth]),
    ell([0, r.hip + 0.16 * H, -0.01 * H], [r.hipHalf, 0.3 * H, r.hipDepth]),
    ...[-1, 1].map((s) => S.capsule([s * 0.16 * H, r.shoulder + 0.03 * H, -0.06 * H], [s * (r.shoulderX - 0.08 * H), r.shoulder - 0.07 * H, -0.03 * H], 0.13 * H)));
}

export function kidNode({ gender = 'boy' } = {}) {
  const girl = gender === 'girl', o = outfitColours(KID_OUTFITS[girl ? 'girl' : 'boy']), r = RIG, H = r.hh;
  const skin = hex(o.skin), hair = hex(o.hair), e = r.eye;
  const body = [], fine = [], jk = []; 
  const V = (x, y, z) => [x * H, y, z * H]; 

  
  const form = torsoForm(r);
  const belt = r.waist - 0.14 * H; 
  const tee = fur(S.intersect(0.03, S.offset(form, 0.015 * H), S.field((x, y) => (belt - 0.05 * H - y) * 0.9)), hex(o.tee));
  
  
  const skirt = ell([0, r.waist - 0.05 * H, -0.01 * H], [r.chestHalf * 0.98, 0.5 * H, r.chestDepth * 0.96]);
  const shell = S.offset(S.union(0.22 * H, form, skirt), r.jacketOff);
  const hem = girl ? r.waist + 0.02 * H : r.waist - 0.03 * H, top = o.top;
  const openW = (y) => (0.08 + Math.max(0, r.shoulder - y) / H * 0.06) * H; 
  let jacket = S.intersect(0.03, shell, S.field((x, y) => (hem - y) * 0.9));
  jacket = S.subtract(0.03, jacket, S.capsule([0, r.shoulder - 0.1 * H, 0.02 * H], [0, r.shoulder + H, 0.02 * H], 0.2 * H)); 
  jacket = S.subtract(0.02, jacket, S.field((x, y, z) => Math.max(Math.abs(x) - openW(y), 0.14 * H - z) * 0.8));
  
  jacket = S.subtract(0.05 * H, jacket, S.union(0, ...[-1, 1].map((s) => S.sphere([s * (r.shoulderX + 0.1 * H), r.shoulder - 0.2 * H, -0.02 * H], 0.2 * H))));
  const base = hex(top.base), block = hex(top.block || top.base), stripe = hex(top.stripe || top.seam), yoke = hex(top.yoke || top.base);
  jk.push(tee, fur(jacket, base), fur(S.transform(S.torus([0, 0, 0], 0.2 * H, 0.03 * H), { translate: [0, r.shoulder + 0.01 * H, 0.01 * H], rotate: [0.3, 0, 0] }), hex(o.tee))); 
  
  const band = (lo, hi) => (x, y, z) => { const d = (y - r.chest - 0.02 * H) / H + 0.22 * Math.abs(x) / H; return Math.max(lo - d, d - hi) * H * 0.9; };
  const jbox = (y0, y1) => ({ min: [-0.8 * H, y0, -0.6 * H], max: [0.8 * H, y1, 0.6 * H] });
  if (!girl) { 
    
    fine.push(tag(overlay(jacket, band(0, 0.17), block, H, { box: jbox(r.chest - 0.3 * H, r.chest + 0.34 * H), tris: 380, off: 0.028 }), RIG_BODY));
    fine.push(tag(overlay(jacket, band(0.17, 0.215), yoke, H, { box: jbox(r.chest - 0.1 * H, r.chest + 0.4 * H), tris: 160, off: 0.032 }), RIG_BODY));
    fine.push(tag(overlay(jacket, band(-0.075, -0.03), stripe, H, { box: jbox(r.chest - 0.35 * H, r.chest + 0.1 * H), tris: 160, off: 0.028 }), RIG_BODY));
    fine.push(tag(overlay(jacket, (x, y) => (y - hem - 0.13 * H) * 0.9, block, H, { box: jbox(hem - 0.05 * H, hem + 0.18 * H), tris: 180 }), RIG_BODY));
  } else { 
    fine.push(tag(overlay(jacket, (x, y) => (y - hem - 0.12 * H) * 0.9, dark(base, 0.14), H, { box: jbox(hem - 0.05 * H, hem + 0.17 * H), tris: 180 }), RIG_BODY));
    const seam = hex(top.seam), yk = (x) => r.shoulder - 0.3 * H + Math.abs(x) * 0.12;
    for (const back of [false, true]) {
      const xs = back ? [-0.46, -0.23, 0, 0.23, 0.46] : [-0.46, -0.3, -0.16];
      for (const sgn of back ? [1] : [-1, 1]) fine.push(tag(part(tube(onSurface(jacket, xs.map((x) => [sgn * x * H, yk(x * H)]), back, 0.006 * H), 0.012 * H, seam), 60, 0.01), RIG_BODY));
    }
    for (const s of [-1, 1]) fine.push(tag(part(tube(onSurface(jacket, [0, 0.33, 0.66, 1].map((t) => [s * 0.3 * H, hem + 0.14 * H + t * (yk(0.3 * H) - hem - 0.16 * H)]), false, 0.006 * H), 0.012 * H, seam), 60, 0.01), RIG_BODY));
  }
  
  const collarRing = S.subtract(0.01, S.transform(S.torus([0, 0, 0], 0.25 * H, 0.05 * H), { translate: [0, r.shoulder + 0.02 * H, -0.04 * H], rotate: [0.38, 0, 0] }),
    S.field((x, y, z) => Math.max(Math.abs(x) - 0.09 * H, 0.08 * H - z)));
  jk.push(fur(collarRing, girl ? hex(top.collar) : block));
  if (girl) for (const s of [-1, 1]) {
    jk.push(fur(S.transform(ell([0, 0, 0], [0.12 * H, 0.028 * H, 0.2 * H]), { translate: [s * 0.2 * H, r.shoulder - 0.02 * H, 0.16 * H], rotate: [0.85, s * 0.3, s * 0.5] }), hex(top.collar)));
    
    const pz = surf(shell, s * 0.28 * H, r.chest + 0.1 * H)[2];
    jk.push(fur(S.roundBox([s * 0.28 * H, r.chest + 0.1 * H, pz], [0.12 * H, 0.05 * H, 0.03 * H], 0.02 * H), dark(base, 0.08)));
  }
  fine.push(tag({ ...finePart(S.union(0.025, ...jk), 1900, 0.033), box: { min: [-0.95 * H, belt - 0.1 * H, -0.6 * H], max: [0.95 * H, r.shoulder + 0.3 * H, 0.6 * H] } }, RIG_BODY));

  
  for (const s of [-1, 1]) {
    const Sj = [s * r.shoulderX, r.shoulder - 0.14 * H, -0.03 * H], E = [s * r.elbow[0], r.elbow[1], r.elbow[2]], W = [s * r.wrist[0], r.wrist[1], r.wrist[2]];
    const dir = norm(add(W, E, -1)), up = norm(add(E, Sj, -1));
    const cap = S.union(0.1 * H, S.sphere(add(Sj, [-s * 0.02 * H, 0.01 * H, 0]), 0.185 * H), S.capsule(add(Sj, [-s * 0.2 * H, 0.1 * H, -0.02 * H]), Sj, 0.13 * H)); 
    const sbox = { min: [Math.min(s * 0.35 * H, s * (r.wrist[0] + 0.35 * H)), r.wrist[1] - 0.25 * H, -0.45 * H], max: [Math.max(s * 0.35 * H, s * (r.wrist[0] + 0.35 * H)), r.shoulder + 0.3 * H, 0.55 * H] };
    let sleeveParts = [];
    if (girl) { 
      const M = add(E, add(W, E, -1), 0.35);
      const sleeve = S.union(0.08 * H, cap, S.roundCone(Sj, E, 0.175 * H, 0.155 * H), S.roundCone(E, M, 0.155 * H, 0.145 * H));
      sleeveParts.push(fur(sleeve, base));
      sleeveParts.push(fur(S.roundCone(add(M, dir, -0.02 * H), add(M, dir, 0.09 * H), 0.17 * H, 0.16 * H), light(base, 0.18)));
      sleeveParts.push(fur(S.union(0.05 * H, S.roundCone(M, add(W, dir, -0.02 * H), 0.095 * H, 0.075 * H), ell(add(M, dir, 0.12 * H), [0.1 * H, 0.15 * H, 0.1 * H])), skin));
      if (s < 0) fine.push(tag(finePart(watch(W, dir, H), 260, 0.012), RIG_ARM)); 
      fine.push(tag({ ...finePart(S.union(0.03, ...sleeveParts), 700, 0.03), box: sbox }, RIG_ARM));
    } else {
      const Wc = add(W, dir, -0.13 * H);
      const sleeve = S.union(0.08 * H, cap, S.roundCone(Sj, E, 0.18 * H, 0.16 * H), S.roundCone(E, Wc, 0.16 * H, 0.14 * H));
      sleeveParts.push(fur(sleeve, base));
      sleeveParts.push(fur(S.roundCone(Wc, add(W, dir, -0.01 * H), 0.12 * H, 0.1 * H), hex(top.cuff))); 
      fine.push(tag({ ...finePart(S.union(0.03, ...sleeveParts), 700, 0.03), box: sbox }, RIG_ARM));
      
      const along = (x, y, z) => (x - E[0]) * dir[0] + (y - E[1]) * dir[1] + (z - E[2]) * dir[2];
      fine.push(tag(overlay(sleeve, (x, y, z) => -(along(x, y, z) + 0.02 * H) * 0.9, block, H, { box: sbox, tris: 200, off: 0.03, cell: 0.018 }), RIG_ARM));
      fine.push(tag(overlay(sleeve, (x, y, z) => { const a = along(x, y, z); return Math.max(-a - 0.07 * H, a + 0.02 * H) * 0.9; }, yoke, H, { box: sbox, tris: 80, off: 0.02 }), RIG_ARM));
      void up;
    }
    fine.push(tag(finePart(humanHand(r, s, add(W, dir, 0.01 * H), dir, skin, { curl: 0.35 }), 240, 0.012), RIG_ARM));
  }

  
  const legs = o.legs, kz = 0.05 * H; 
  if (!girl) { 
    const denim = hex(legs.denim), fade = hex(legs.fade);
    const jeansCol = (x, y, z) => {
      const thigh = sm(r.knee - 0.4 * H, r.knee + 0.2 * H, y) * (1 - sm(r.hip - 0.1 * H, r.hip + 0.2 * H, y)) * sm(0.05 * H, 0.2 * H, z);
      const knee = Math.exp(-(((y - r.knee) / (0.22 * H)) ** 2)) * sm(0, 0.2 * H, z) * 0.7;
      return mix(denim, fade, Math.min(1, thigh * 0.8 + knee));
    };
    const jl = [], jp = [S.intersect(0.05 * H, S.offset(ell([0, r.hip + 0.16 * H, -0.01 * H], [r.hipHalf, 0.34 * H, r.hipDepth]), 0.04 * H), S.field((x, y) => (y - belt) * 0.9))];
    for (const s of [-1, 1]) {
      const lx = s * r.jeansX, A = [lx, r.hip + 0.04 * H, 0], K = [s * (r.jeansX + 0.01 * H), r.knee, kz], F = [s * (r.jeansX + 0.02 * H), r.ankle + 0.5 * H, 0];
      
      
      const leg = [S.roundCone(A, K, r.jeansThigh, r.jeansKnee), S.roundCone(K, F, r.jeansKnee, r.jeansHem),
        S.transform(S.torus([0, 0, 0], r.jeansHem - 0.02 * H, 0.035 * H), { translate: [F[0], r.ankle + 0.72 * H, 0.01 * H], rotate: [0.12, 0, 0] })];
      jl.push(S.union(0.08 * H, jp[0], ...leg));
      body.push(fur(S.roundCylinder([F[0], r.ankle + 0.47 * H, 0], r.jeansHem + 0.01 * H, 0.22 * H, 0.06 * H, 0.03 * H), mix(fade, lin('#ffffff'), 0.1))); 
      body.push(fur(S.capsule([F[0], 0.35 * H, -0.03 * H], [F[0], r.ankle + 0.5 * H, 0], 0.13 * H), hex('#f4f2ec'))); 
    }
    body.push(fur(S.union(0, ...jl), jeansCol));
    body.push(fur(S.transform(S.torus([0, 0, 0], r.hipHalf + 0.04 * H, 0.035 * H), { translate: [0, belt, -0.01 * H], scale: [1, 1, (r.hipDepth + 0.04 * H) / (r.hipHalf + 0.04 * H)] }), hex(legs.belt)));
  } else { 
    const shortsCol = hex(legs.shorts);
    const sp = [S.intersect(0.05 * H, S.offset(ell([0, r.hip + 0.16 * H, -0.01 * H], [r.hipHalf, 0.34 * H, r.hipDepth]), 0.015 * H), S.field((x, y) => (y - belt) * 0.9))];
    for (const s of [-1, 1]) {
      const lx = s * r.legX, A = [lx, r.hip + 0.04 * H, 0], T = [lx, r.knee + 0.5 * H, kz * 0.6], K = [lx, r.knee, kz], F = [lx * 1.02, r.ankle + 0.3 * H, 0];
      sp.push(S.roundCone(A, T, r.thighR + 0.02 * H, 0.2 * H));
      body.push(fur(S.union(0.06 * H,
        S.roundCone(add(T, [0, 0.08 * H, 0]), K, 0.19 * H, 0.13 * H), 
        S.sphere(add(K, [0, 0.01 * H, 0.05 * H]), 0.11 * H), 
        ell([lx, r.knee - 0.38 * H, kz * 0.3 - 0.05 * H], [r.calfR * 0.9, 0.3 * H, r.calfR]), 
        S.roundCone(K, F, 0.12 * H, r.ankleR)), skin));
    }
    const shorts = S.union(0.08 * H, ...sp);
    body.push(fur(shorts, shortsCol));
    fine.push(overlay(shorts, (x, y, z) => Math.max(Math.abs(z) - 0.04 * H, r.legX + 0.12 * H - Math.abs(x), y - r.hip - 0.12 * H) * 0.9, hex(legs.stripe), H, { box: { min: [-0.8 * H, r.knee + 0.3 * H, -0.2 * H], max: [0.8 * H, r.hip + 0.2 * H, 0.2 * H] }, tris: 140 })); 
  }

  
  for (const s of [-1, 1]) {
    const x = s * (r.legX + 0.02 * H), sh = highTop(r, x, o.shoes, { collar: girl ? 0.42 : 0.5 });
    let node = sh.node;
    if (girl) { 
      const rings = [0, 1, 2, 3].map((i) => S.transform(S.torus([0, 0, 0], 0.115 * H, 0.048 * H), { translate: [x + Math.sin(i * 2.1) * 0.012 * H, (0.5 + i * 0.1) * H, -0.04 * H + Math.cos(i * 1.7) * 0.012 * H], rotate: [Math.sin(i * 1.3) * 0.12, 0, Math.cos(i * 2.2) * 0.1] }));
      node = S.union(0.02, node, fur(S.union(0.03, ...rings, S.capsule([x, 0.45 * H, -0.04 * H], [x, 0.85 * H, -0.03 * H], 0.11 * H)), hex(legs.socks)));
    }
    fine.push(finePart(node, 480, 0.022));
    fine.push(part(sh.laces, 130, 0.01), ...sh.panels);
  }

  
  const hd = humanHead(r, { skin, lips: o.lips });
  const P = hd.P, R3 = hd.R, headParts = [hd.skin];
  const strands = (c) => (x, y, z) => mix(c, light(c, 0.22), Math.max(0, Math.sin(x * 38 / H + z * 11 / H + Math.sin(y * 9 / H) * 2)) ** 3 * 0.8);
  let capNode = null;
  if (!girl) {
    
    const hl = (x, z) => { const zn = z / H; return e + (zn > 0.15 ? 0.27 : zn > -0.15 ? 0.08 + sm(-0.15, 0.15, zn) * 0.19 : 0.08 - sm(-0.15, -0.45, zn) * 0.3) * H; };
    const hairNode = S.intersect(0.02, ell(P(0, 0.1, -0.05), R3(0.395, 0.445, 0.48)), S.field((x, y, z) => (hl(x, z) - y) * 0.6));
    
    headParts.push(fur(hairNode, (x, y, z) => mix(strands(hair)(x, y, z), skin, Math.min(0.85, 0.85 * (1 - sm(e - 0.1 * H, e + 0.2 * H, y)) * sm(-0.05 * H, -0.3 * H, z)))));
    
    
    const capLine = capLineOf(e, H);
    let dome = S.intersect(0.015, ell(P(0, 0.12, -0.06), R3(0.415, 0.46, 0.495)), S.field((x, y, z) => (capLine(z) - y) * 0.85));
    dome = S.subtract(0.012, dome, ell(P(0, 0.35, 0.44), R3(0.13, 0.085, 0.16))); 
    capNode = dome;
    const brim = S.warp(S.transform(S.roundBox([0, 0, 0], [0.25 * H, 0.017 * H, 0.21 * H], 0.015 * H), { translate: P(0, -0.04, -0.61), rotate: [-0.42, 0, 0] }),
      (x, y, z) => [x, y + 0.9 * x * x / H, z], 0.08 * H);
    headParts.push(fur(dome, hex(o.cap.crown)), fur(brim, hex(o.cap.brim)), fur(S.sphere(P(0, 0.575, -0.07), 0.036 * H), hex(o.cap.button)));
  } else {
    
    const hl = (x, z) => { const zn = z / H; return e + (zn > 0.2 ? 0.29 : zn > -0.05 ? -0.02 + sm(-0.05, 0.2, zn) * 0.31 : -0.02 - sm(-0.05, -0.4, zn) * 0.38) * H; };
    const shellH = S.intersect(0.02, ell(P(0, 0.1, -0.06), R3(0.405, 0.46, 0.495)), S.field((x, y, z) => (hl(x, z) - y) * 0.6));
    const bangs = [[-0.21, 0.36, 0.3, 0.11], [-0.08, 0.4, 0.34, 0.12], [0.07, 0.41, 0.34, 0.12], [0.2, 0.37, 0.3, 0.11]].map(([x, y, z, k]) => ell(P(x, y, z), R3(k, k * 0.8, k * 0.85)));
    const wisps = [-1, 1].map((s) => S.roundCone(P(s * 0.29, 0.2, 0.2), P(s * 0.33, -0.12, 0.2), 0.05 * H, 0.025 * H));
    
    const cp = spline([P(0, 0.44, -0.42), P(0, 0.56, -0.62), P(0, 0.43, -0.8), P(0, 0.08, -0.82), P(0, -0.28, -0.7)], 10);
    const pony = S.union(0.06, ...cp.slice(1).map((q, i) => S.roundCone(cp[i], q, (0.12 + Math.sin(i / 10 * Math.PI) * 0.05 - i * 0.007) * H, (0.12 + Math.sin((i + 1) / 10 * Math.PI) * 0.05 - (i + 1) * 0.007) * H)));
    headParts.push(fur(S.union(0.04, shellH, ...bangs, ...wisps, pony), strands(hair)));
    const scr = S.displace(S.transform(S.torus([0, 0, 0], 0.1 * H, 0.055 * H), { translate: P(0, 0.47, -0.47), rotate: [-0.95, 0, 0] }),
      (x, y, z) => Math.sin(x * 70 / H) * Math.sin(y * 60 / H + z * 50 / H) * 0.01 * H, 0.012 * H);
    headParts.push(fur(scr, hex(o.hairdo.scrunchie)));
  }
  const headNode = S.union(0.012, ...headParts);
  fine.push({ ...finePart(headNode, girl ? 2100 : 1900, 0.019), box: { min: [-0.62 * H, r.shoulder - 0.05 * H, (girl ? -1.02 : -0.95) * H], max: [0.62 * H, r.crown + 0.16 * H, 0.6 * H] } });
  fine.push(...humanEyes(hd.skin, r, { iris: o.eyes, hair: o.hair, lips: o.lips, brow: girl ? 0.8 : 1 }));
  if (capNode) { 
    const strap = [-0.13, -0.065, 0, 0.065, 0.13].map((t) => { const q = surf(capNode, t * H, e + 0.29 * H, 0); return add(q, normalOf(capNode, q), 0.012 * H); });
    fine.push(part(tube(strap, 0.02 * H, hex(o.cap.brim)), 60, 0.009));
    for (const a of [0.5, 1.55, 2.6, -0.5, -1.55]) {
      const pts = [0.08, 0.35, 0.6, 0.85].map((th) => { const d = [Math.sin(th) * Math.sin(a) * 0.415, Math.cos(th) * 0.46, Math.sin(th) * Math.cos(a) * 0.495]; return add(P(0, 0.12, -0.06), d, H * 1.012); })
        .filter((q) => q[1] > capLineOf(e, H)(q[2]) + 0.02 * H);
      if (pts.length > 1) fine.push(part(tube(pts, 0.009 * H, dark(hex(o.cap.crown), 0.35)), 50, 0.009));
    }
  }
  if (girl) for (const s of [-1, 1]) fine.push(part(fur(S.transform(S.torus([0, 0, 0], 0.05 * H, 0.011 * H), { translate: P(s * 0.38, -0.25, -0.04), rotate: [0, 0, Math.PI / 2] }), hex(o.earrings)), 70, 0.006));

  
  const torso = S.union(0.05, tee, jacket);
  const ph = neckPhones(r, o.headphones, { on: S.union(0.05, jacket, collarRing) });
  fine.push(tag(finePart(ph.node, 420, 0.011), RIG_BODY));
  
  const side = o.tapePlayer.side, py = belt - 0.2 * H;
  const hipNode = S.offset(ell([0, r.hip + 0.16 * H, -0.01 * H], [r.hipHalf, 0.34 * H, r.hipDepth]), 0.04 * H);
  const hp = surf(hipNode, side * 0.47 * H, py);
  const pn = norm([side * 0.75, 0, 0.66]), pp = add(hp, pn, 0.065 * H);
  const tp = tapePlayer(r, pp, pn, o.tapePlayer);
  fine.push(tag(finePart(tp.node, 420, 0.01), RIG_BODY), ...tp.decals.map((d) => tag(d, RIG_BODY)));
  const over = (x, y, lift = 0.035) => { const q = surf(torso, x, y); return add(q, normalOf(torso, q), lift * H); };
  const cord = spline([tp.jack, add(tp.jack, [0, 0.12 * H, 0.02 * H]), over(side * 0.36 * H, hem + 0.1 * H), over(side * 0.24 * H, r.chest - 0.12 * H), over(side * 0.22 * H, r.chest + 0.25 * H), ph.jack], 22);
  
  for (let i = 0; i < cord.length - 1; i += 4) fine.push(tag(part(tube(cord.slice(i, i + 5), 0.014 * H, hex('#1c1c22')), 50, 0.011), RIG_BODY));
  if (!girl) { 
    for (const s of [-1, 1]) {
      const zp = [0, 0.25, 0.5, 0.75, 1].map((t) => { const y = hem + 0.05 * H + t * (r.shoulder - 0.2 * H - hem); return over(s * (openW(y) + 0.03 * H), y, 0.008); });
      fine.push(tag(part(tube(zp, 0.02 * H, hex('#c9ccd2')), 70, 0.012), RIG_BODY));
    }
  } else { 
    for (const s of [-1, 1]) { const q = over(s * 0.28 * H, r.chest + 0.08 * H, 0.03); fine.push(tag(part(fur(S.sphere(q, 0.028 * H), lin('#c8843a')), 40, 0.008), RIG_BODY)); }
  }

  const node = S.union(0.025, ...body);
  node.box = { min: [-0.9 * H, 0.25 * H, -0.6 * H], max: [0.9 * H, belt + 0.12 * H, 0.6 * H] };
  node.decals = fine;
  return node;
}


const capLineOf = (e, H) => (z) => { const zn = z / H; return e + (0.21 + 0.135 * zn / 0.47 + Math.min(0, zn + 0.2) * 0.45) * H; };


function watch(W, dir, H) {
  const f = S.frameFromNormal(dir, [0, 0, 1]); 
  const strap = S.place(S.torus([0, 0, 0], 0.075 * H, 0.02 * H), add(W, dir, -0.06 * H), f.X, f.Z, f.Y);
  const face = S.place(S.roundBox([0, 0, 0], [0.045 * H, 0.045 * H, 0.028 * H], 0.011 * H), add(add(W, dir, -0.06 * H), f.Y, 0.08 * H), f.X, f.Z, f.Y);
  return S.union(0.01, fur(strap, lin('#27d6c6')), fur(face, lin('#ff3d8b')));
}

export const kidKey = (opts = {}) => `kid-${opts.gender === 'girl' ? 'girl' : 'boy'}`;
export function kidArrays(opts = {}) { return buildArrays(kidKey(opts), kidNode(opts), 'kid', undefined, { tris: 1200, cell: KID_CELL }); }
