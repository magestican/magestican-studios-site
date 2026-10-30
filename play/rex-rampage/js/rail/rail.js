

import { add, len, lerp, norm, sub, v3 } from '../combat/vec.js';

const SAMPLES = 512;
const DEFAULT_SPEED = 6; 



function tj(ti, a, b) {
  return ti + Math.max(1e-4, Math.sqrt(len(sub(b, a)))); 
}


function segment(p0, p1, p2, p3, u) {
  const t0 = 0;
  const t1 = tj(t0, p0, p1);
  const t2 = tj(t1, p1, p2);
  const t3 = tj(t2, p2, p3);
  const t = t1 + (t2 - t1) * u;
  const l = (a, b, ta, tb) => (tb - ta < 1e-9 ? a : lerp(a, b, (t - ta) / (tb - ta)));
  const a1 = l(p0, p1, t0, t1);
  const a2 = l(p1, p2, t1, t2);
  const a3 = l(p2, p3, t2, t3);
  const b1 = l(a1, a2, t0, t2);
  const b2 = l(a2, a3, t1, t3);
  return l(b1, b2, t1, t2);
}


export function createRail(points) {
  const n = points.length;
  const ext = [add(points[0], sub(points[0], points[1])), ...points, add(points[n - 1], sub(points[n - 1], points[n - 2]))];
  const segs = n - 1;
  const pointAt = (s) => {
    const k = Math.min(segs - 1, Math.floor(s * segs));
    const u = s * segs - k;
    return segment(ext[k], ext[k + 1], ext[k + 2], ext[k + 3], u);
  };
  
  const pos = [];
  const dist = [0];
  for (let i = 0; i <= SAMPLES; i++) {
    pos.push(pointAt(i / SAMPLES));
    if (i) dist.push(dist[i - 1] + len(sub(pos[i], pos[i - 1])));
  }
  const length = dist[SAMPLES];
  return {
    length,
    at(d) {
      const x = Math.min(length, Math.max(0, d));
      let lo = 0;
      let hi = SAMPLES;
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (dist[m] <= x) lo = m;
        else hi = m;
      }
      const span = dist[hi] - dist[lo] || 1;
      const p = lerp(pos[lo], pos[hi], (x - dist[lo]) / span);
      const tangent = norm(sub(pos[hi], pos[lo]));
      return { pos: p, tangent: len(tangent) ? tangent : v3(0, 0, -1) };
    },
  };
}


export function speedAt(speeds, d) {
  if (!speeds.length) return DEFAULT_SPEED;
  if (d <= speeds[0].d) return speeds[0].v;
  for (let i = 1; i < speeds.length; i++) {
    const a = speeds[i - 1];
    const b = speeds[i];
    if (d <= b.d) return a.v + ((b.v - a.v) * (d - a.d)) / (b.d - a.d || 1);
  }
  return speeds[speeds.length - 1].v;
}
