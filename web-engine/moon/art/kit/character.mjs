




export const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const norm = (a) => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const mirror = (p) => [-p[0], p[1], p[2]];


export function densify(pts, per) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let s = 0; s < per; s++) out.push(add(pts[i], mul(sub(pts[i + 1], pts[i]), s / per)));
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export function distToPolyline(p, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], ab = sub(pts[i + 1], a);
    const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / (dot(ab, ab) || 1)));
    best = Math.min(best, dist(p, add(a, mul(ab, t))));
  }
  return best;
}



export function strand(md, pts, radii, color, sides, material = 'fur') {
  const n = pts.length;
  const rings = [];
  let N = null;
  let len = 0;
  for (let i = 0; i < n - 1; i++) {
    const t = norm(sub(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)]));
    if (!N) {
      const a = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      N = norm(sub(a, mul(t, dot(a, t))));
    } else {
      N = norm(sub(N, mul(t, dot(N, t))));
    }
    const Bn = cross(t, N);
    if (i > 0) len += dist(pts[i], pts[i - 1]);
    const ring = [];
    for (let j = 0; j < sides; j++) {
      const ang = (j / sides) * Math.PI * 2;
      const dir = add(mul(N, Math.cos(ang)), mul(Bn, Math.sin(ang)));
      ring.push(md.vertex(material, add(pts[i], mul(dir, radii[i])), dir, color, [j / sides, len * 10]));
    }
    rings.push({ ring, t });
  }
  for (let i = 0; i < rings.length - 1; i++) {
    const r0 = rings[i].ring, r1 = rings[i + 1].ring;
    for (let j = 0; j < sides; j++) {
      const j1 = (j + 1) % sides;
      md.tri(material, r0[j], r0[j1], r1[j1]);
      md.tri(material, r0[j], r1[j1], r1[j]);
    }
  }
  const last = rings[rings.length - 1];
  const tip = md.vertex(material, pts[n - 1], norm(sub(pts[n - 1], pts[n - 2])), color, [0.5, (len + dist(pts[n - 1], pts[n - 2])) * 10]);
  for (let j = 0; j < sides; j++) md.tri(material, last.ring[j], last.ring[(j + 1) % sides], tip);
  const first = rings[0];
  const cap = md.vertex(material, sub(pts[0], mul(first.t, radii[0] * 0.5)), mul(first.t, -1), color, [0.5, 0]);
  for (let j = 0; j < sides; j++) md.tri(material, cap, first.ring[(j + 1) % sides], first.ring[j]);
}
