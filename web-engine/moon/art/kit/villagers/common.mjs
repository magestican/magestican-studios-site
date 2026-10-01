








import * as S from '../../../mesh/sdf.mjs';
import { kneeBetween } from '../../../rig/skeleton.mjs';
import { smooth, mix, add, sub, mul, dot, norm, cross, dist, mirror, distToPolyline } from '../character.mjs';

export { smooth, mix, add, sub, mul, dot, norm, cross, dist, mirror, distToPolyline };

export const scaler = (k) => ({ P: (p) => [p[0] * k, p[1] * k, p[2] * k], R: (r) => r * k });





export const ANIMAL_STRETCH = Object.freeze({ arms: 0.35, legs: 0.04 });





export function biped(u, k) {
  const { P, R } = scaler(k);
  const hipL = P(u.hip), ankleL = P(u.ankle);
  const kneeL = kneeBetween(hipL, ankleL, R(u.kneeFwd));
  const shoulderL = P(u.shoulder), elbowL = P(u.elbow), wristL = P(u.wrist);
  const handL = P(u.hand.c), handTipL = P(u.hand.tip), footL = P(u.foot.c);
  const J = u.joints;
  const joints = {
    root: [0, 0, 0], hips: P(J.hips), spine: P(J.spine), chest: P(J.chest), neck: P(J.neck), head: P(J.head),
    armUpperL: shoulderL, armLowerL: elbowL, handL: wristL,
    armUpperR: mirror(shoulderL), armLowerR: mirror(elbowL), handR: mirror(wristL),
    legUpperL: hipL, legLowerL: kneeL, footL: ankleL,
    legUpperR: mirror(hipL), legLowerR: mirror(kneeL), footR: mirror(ankleL),
  };
  const toe = [footL[0], footL[1] - R(u.foot.r[1]) * 0.4, footL[2] + R(u.foot.r[2]) * 0.9];
  const tails = { handL: handTipL, handR: mirror(handTipL), footL: toe, footR: mirror(toe) };
  const T = u.torso;
  const hipsN = S.ellipsoid(P(T.hips.c), T.hips.r.map(R));
  const bellyN = S.ellipsoid(P(T.belly.c), T.belly.r.map(R));
  const chestN = S.ellipsoid(P(T.chest.c), T.chest.r.map(R));
  const side = (s) => {
    const j = (n) => joints[`${n}${s}`];
    const m = s === 'L' ? (p) => p : mirror;
    
    
    
    const hand = u.hand.kind === 'tip'
      ? S.roundCone(j('hand'), m(handTipL), R(u.foreArm[1]), R(u.hand.tipR))
      : u.hand.node ? u.hand.node(s, m) : S.ellipsoid(m(handL), u.hand.r.map(R));
    
    
    
    
    const band = (r) => Math.max(0.045, 0.65 * r);
    return {
      arm: [
        [`armUpper${s}`, S.roundCone(j('armUpper'), j('armLower'), R(u.upperArm[0]), R(u.upperArm[1])), band(R(u.upperArm[0]))],
        [`armLower${s}`, S.roundCone(j('armLower'), j('hand'), R(u.foreArm[0]), R(u.foreArm[1])), 0.045],
        [`hand${s}`, hand, 0.03],
      ],
      leg: [
        [`legUpper${s}`, S.roundCone(j('legUpper'), j('legLower'), R(u.thigh[0]), R(u.thigh[1])), band(R(u.thigh[0]))],
        [`legLower${s}`, S.roundCone(j('legLower'), j('foot'), R(u.shin[0]), R(u.shin[1])), 0.045],
        [`foot${s}`, S.ellipsoid(m(footL), u.foot.r.map(R)), 0.03],
      ],
    };
  };
  const foot = { c: footL, r: u.foot.r.map(R) };
  return {
    joints, tails, hipsN, bellyN, chestN, L: side('L'), R: side('R'),
    shoulderL, elbowL, wristL, handL, foot,
    contacts: {
      footL: [[footL[0], 0, footL[2] - foot.r[2] * 0.8], [footL[0], 0, footL[2] + foot.r[2] * 0.85]],
      footR: [[-footL[0], 0, footL[2] - foot.r[2] * 0.8], [-footL[0], 0, footL[2] + foot.r[2] * 0.85]],
    },
  };
}

export const unionOf = (k, parts) => S.union(k, parts.map(([, n]) => n));




export function frontPoint(node, x, y, z0 = 1.0, z1 = -0.6) {
  let z = z0;
  while (z > z1) {
    const d = node.d(x, y, z);
    if (d <= 0) {
      let hi = z + 0.004, lo = z;
      while (node.d(x, y, hi) <= 0) hi += 0.004;
      for (let i = 0; i < 40; i++) { const m = (hi + lo) / 2; if (node.d(x, y, m) > 0) hi = m; else lo = m; }
      return [x, y, (hi + lo) / 2];
    }
    z -= Math.max(0.0015, Math.min(d * 0.7, 0.02));
  }
  throw new Error(`frontPoint: no surface along -Z at (${x}, ${y})`);
}




export function flap(root, up, face, { centre, r, cup, cupR, inner, cutK = 0.012 }) {
  const Y = norm(up), Z = norm(sub(face, mul(Y, dot(face, Y)))), X = cross(Y, Z);
  const outer = S.place(S.ellipsoid(centre, r), root, X, Y, Z);
  if (!cup) return { outer, node: outer, X, Y, Z };
  const cut = S.place(S.ellipsoid(cup, cupR), root, X, Y, Z);
  return { outer, node: (paint) => S.subtract(cutK, paint(outer), S.paint(cut, { color: inner }), { cutColor: true }), X, Y, Z };
}









export function topShell(o) {
  const torsoN = S.union(0.035, o.torso);
  const wearField = o.sleeve > 0 ? S.union(0.03, torsoN, ...o.arms) : torsoN;
  const dirs = o.shoulders.map((s, i) => norm(sub(o.elbows[i], s)));
  const lens = o.shoulders.map((s, i) => dist(s, o.elbows[i]));
  
  
  
  
  
  const sleeveR = o.sleeveR ?? 0.13;
  const region = (x, y, z) => {
    let r = Math.max(o.hemY(x, z) - y, y - o.neckY(x, z));
    const p = [x, y, z];
    for (let i = 0; i < 2; i++) {
      const q = sub(p, o.shoulders[i]);
      if (o.sleeve > 0) {
        const along = dot(q, dirs[i]);
        const radial = Math.hypot(q[0] - dirs[i][0] * along, q[1] - dirs[i][1] * along, q[2] - dirs[i][2] * along);
        r = Math.max(r, Math.min(along - lens[i] * o.sleeve, sleeveR - radial));
      } else {
        r = Math.max(r, o.armhole - Math.hypot(q[0], q[1], q[2]));
      }
    }
    return r;
  };
  const surf = (extra) => S.displace(wearField, (x, y, z) => -(extra) - o.folds(x, y, z), 0.03);
  const shape = o.fuse
    ? S.intersect(0.006, surf(o.off + 2 * o.thick), S.field(region))
    : S.intersect(0.006, S.shell(surf(o.off + o.thick), o.thick), S.field(region));
  return { node: S.paint(shape, { color: o.color, material: o.material || 'cloth' }), wearField, outer: S.offset(wearField, o.off + 2 * o.thick), region };
}




export function knitScarf({ at, R, r, tilt, body, tailSide, tailLen, colors, squash = 0.8 }) {
  const [a, b] = colors;
  const roll = S.transform(S.torus([0, 0, 0], R, r), { translate: at, rotate: [tilt[0], 0, tilt[1]], scale: [1, squash, 1] });
  const top = [at[0] + tailSide * R * 0.55, at[1] - r * 0.4, at[2] + R * 0.8];
  const bot = S.projectToSurface(body, [top[0] + tailSide * 0.02, top[1] - tailLen, top[2] + 0.3]);
  const f = S.frameFromNormal(S.normalAt(body, ...bot), sub(top, bot));
  const len = dist(top, bot);
  const strip = S.place(S.roundBox([0, -len / 2, 0], [r * 1.05, len / 2 + 0.01, r * 0.32], r * 0.3), add(top, mul(f.Z, r * 0.7)), f.X, f.Y, f.Z);
  
  const knit = (x, y, z) => {
    const rib = 0.5 + 0.5 * Math.sin((x * 3 + z * 2.2 + y * 1.3) * 90);
    const stripe = y < top[1] - len * 0.55 && smooth(0.35, 0.6, 0.5 + 0.5 * Math.sin((top[1] - y) * 95)) > 0.5;
    const c = stripe ? b : a;
    return mix(c, mul(c, 0.86), rib * 0.45);
  };
  const folds = (x, y, z) => 0.0025 * Math.sin((x * 3 + z * 2.2 + y * 1.3) * 90);
  return S.paint(S.displace(S.union(r * 0.7, roll, strip), (x, y, z) => -folds(x, y, z), 0.003), { material: 'cloth', color: knit });
}



export function spectacles(eyes, skull, { ring = 0.058, lift = 0.022, wire = 0.0055, segs = 14, templeBack = 0.14 }) {
  const out = [];
  const centres = [];
  for (const e of eyes) {
    const n = norm(add(mul(S.normalAt(skull, ...e), 0.75), [0, 0, 0.25]));
    const f = S.frameFromNormal(n, [0, 1, 0]);
    const c = add(e, mul(n, lift));
    centres.push({ c, f });
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2 + 0.2;
      pts.push(add(c, add(mul(f.X, Math.cos(a) * ring), mul(f.Y, Math.sin(a) * ring * 0.94))));
    }
    out.push({ pts, radii: pts.map(() => wire) });
  }
  const [A, B] = centres;
  const inner = (C, D) => add(C.c, mul(norm(sub(D.c, C.c)), ring));
  const pa = inner(A, B), pb = inner(B, A);
  const mid = add(mul(add(pa, pb), 0.5), [0, 0.012, 0.006]);
  out.push({ pts: [pa, mid, pb], radii: [wire, wire, wire] });
  for (const C of centres) {
    const outward = norm([Math.sign(C.c[0]) || 1, 0, 0]);
    const start = add(C.c, mul(outward, ring));
    const end = S.projectToSurface(skull, add(start, [Math.sign(C.c[0]) * 0.03, 0.01, -templeBack]));
    const lifted = add(end, mul(S.normalAt(skull, ...end), 0.008));
    out.push({ pts: [start, add(mul(add(start, lifted), 0.5), mul(outward, 0.012)), lifted], radii: [wire, wire, wire * 0.8] });
  }
  return out;
}
