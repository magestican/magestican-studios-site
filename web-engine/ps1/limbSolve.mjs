




































const clamp = (v, a, b) => Math.max(a, Math.min(b, v));



export const ELBOW_PREF = [-0.38, -1.0];   
export const KNEE_PREF = [1.0, -0.22];     










export function solve2(a, t, l1, l2, pref, violation) {
  const dx = t[0] - a[0];
  const dz = t[1] - a[1];
  const raw = Math.hypot(dx, dz);
  const d = Math.min(raw, (l1 + l2) * 0.998) || 1e-6;
  const cos = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const half = Math.acos(cos);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const base = raw < 0.04
    ? Math.atan2(pref[1], pref[0])
    : Math.atan2(dz, dx);

  
  const pick = (bend) => {
    const ang = base + bend * half;
    return [a[0] + Math.cos(ang) * l1, a[1] + Math.sin(ang) * l1];
  };
  const A = pick(1);
  const B = pick(-1);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (violation) {
    const vA = violation(a, A, t);
    const vB = violation(a, B, t);
    const okA = vA <= 0;
    const okB = vB <= 0;
    if (okA !== okB) return okA ? A : B;
    if (!okA && !okB) return vA <= vB ? A : B;
  }

  
  const ux = dx / d;
  const uz = dz / d;
  const offOf = (E) => {
    const ex = E[0] - a[0];
    const ez = E[1] - a[1];
    const along = ex * ux + ez * uz;
    return [ex - ux * along, ez - uz * along];
  };
  const pl = Math.hypot(pref[0], pref[1]) || 1;
  const px = pref[0] / pl;
  const pz = pref[1] / pl;
  const score = (E) => {
    const o = offOf(E);
    return o[0] * px + o[1] * pz;
  };
  return score(A) >= score(B) ? A : B;
}









export function wingHeight(shoulder, elb, hand) {
  return elb[1] - Math.max(shoulder[1], hand[1]);
}


























export const noWing = (shoulder, elb, hand) => wingHeight(shoulder, elb, hand) <= 0;

export const elbow = (shoulder, hand, upper, fore) =>
  solve2(shoulder, hand, upper, fore, ELBOW_PREF, wingHeight);


























export function kneeTurn(hip, kn, foot) {
  const ax = kn[0] - hip[0];
  const az = kn[1] - hip[1];
  const bx = foot[0] - kn[0];
  const bz = foot[1] - kn[1];
  const len = Math.hypot(ax, az) * Math.hypot(bx, bz);
  if (!len) return -1;
  return (ax * bz - az * bx) / len;
}

export function kneeFlexes(hip, kn, foot) {
  const ax = kn[0] - hip[0];
  const az = kn[1] - hip[1];
  const bx = foot[0] - kn[0];
  const bz = foot[1] - kn[1];
  const len = Math.hypot(ax, az) * Math.hypot(bx, bz);
  if (!len) return true;
  
  
  return (ax * bz - az * bx) / len <= 1e-3;
}

export const knee = (hip, foot, thigh, shin) =>
  
  
  
  solve2(hip, foot, thigh, shin, KNEE_PREF, (h, k, f) => kneeTurn(h, k, f) - 1e-3);

