













const SAMPLE = 0.25; 
const DEFAULT_BEND = 8; 


export function buildRail(spec) {
  const prims = [];
  let [x, y] = spec.start;
  for (const pc of spec.pieces) {
    if (pc[0] === 'line') {
      prims.push({ t: 'line', x0: x, y0: y, x1: pc[1], y1: pc[2], r: pc[3] ?? spec.bend ?? DEFAULT_BEND });
      [x, y] = [pc[1], pc[2]];
    } else if (pc[0] === 'arc') {
      const [, cx, cy, sweep] = pc;
      const r = Math.hypot(x - cx, y - cy);
      const a0 = Math.atan2(y - cy, x - cx);
      const a1 = a0 + (sweep * Math.PI) / 180;
      prims.push({ t: 'arc', cx, cy, r, a0, a1 });
      [x, y] = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
    } else throw new Error(`rail ${spec.id}: unknown piece ${pc[0]}`);
  }
  
  const out = [];
  for (let i = 0; i < prims.length; i++) {
    const p = prims[i];
    const q = prims[i + 1];
    if (p.t !== 'line' || !q || q.t !== 'line') {
      out.push(p);
      continue;
    }
    const l1 = Math.hypot(p.x1 - p.x0, p.y1 - p.y0);
    const l2 = Math.hypot(q.x1 - q.x0, q.y1 - q.y0);
    const d1 = [(p.x1 - p.x0) / l1, (p.y1 - p.y0) / l1];
    const d2 = [(q.x1 - q.x0) / l2, (q.y1 - q.y0) / l2];
    const turn = Math.atan2(d1[0] * d2[1] - d1[1] * d2[0], d1[0] * d2[0] + d1[1] * d2[1]);
    if (Math.abs(turn) < 1e-6) {
      out.push(p);
      continue;
    }
    const t = p.r * Math.tan(Math.abs(turn) / 2);
    
    if (t > l1 + 1e-9 || t > l2 + 1e-9)
      throw new Error(`rail ${spec.id}: a ${p.r} u bend at (${p.x1}, ${p.y1}) needs ${t.toFixed(2)} u of straight each side`);
    const ax = p.x1 - d1[0] * t;
    const ay = p.y1 - d1[1] * t;
    const side = turn > 0 ? 1 : -1; 
    const cx = ax - side * d1[1] * p.r;
    const cy = ay + side * d1[0] * p.r;
    const a0 = Math.atan2(ay - cy, ax - cx);
    out.push({ ...p, x1: ax, y1: ay });
    out.push({ t: 'arc', cx, cy, r: p.r, a0, a1: a0 + turn });
    q.x0 = p.x1 + d2[0] * t;
    q.y0 = p.y1 + d2[1] * t;
  }
  const xs = [spec.start[0]];
  const ys = [spec.start[1]];
  const cum = [0];
  const rad = [];
  const push = (px, py, r) => {
    const n = xs.length - 1;
    const d = Math.hypot(px - xs[n], py - ys[n]);
    if (d < 1e-9) return;
    xs.push(px);
    ys.push(py);
    cum.push(cum[n] + d);
    rad.push(r);
  };
  for (const p of out) {
    if (p.t === 'line') {
      push(p.x0, p.y0, Number.POSITIVE_INFINITY); 
      push(p.x1, p.y1, Number.POSITIVE_INFINITY);
    } else {
      const n = Math.max(2, Math.ceil((Math.abs(p.a1 - p.a0) * p.r) / SAMPLE));
      for (let k = 1; k <= n; k++) {
        const a = p.a0 + ((p.a1 - p.a0) * k) / n;
        push(p.cx + p.r * Math.cos(a), p.cy + p.r * Math.sin(a), p.r);
      }
    }
  }
  return { id: spec.id, xs, ys, cum, rad, length: cum[cum.length - 1], spec };
}


function segAt(rail, s) {
  const { cum } = rail;
  if (s <= 0) return 0;
  if (s >= rail.length) return cum.length - 2;
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= s) lo = mid;
    else hi = mid;
  }
  return lo;
}





export function posAt(rail, s) {
  const i = segAt(rail, s);
  const x0 = rail.xs[i];
  const y0 = rail.ys[i];
  const len = rail.cum[i + 1] - rail.cum[i];
  const hx = (rail.xs[i + 1] - x0) / len;
  const hy = (rail.ys[i + 1] - y0) / len;
  const u = s - rail.cum[i];
  return { x: x0 + hx * u, y: y0 + hy * u, hx, hy, r: rail.rad[i] };
}


export function radiusAt(rail, s) {
  if (s < 0 || s > rail.length) return Number.POSITIVE_INFINITY;
  return rail.rad[segAt(rail, s)];
}


export function nearestOnRail(rail, x, y) {
  let best = { s: 0, d: Number.POSITIVE_INFINITY };
  for (let i = 0; i < rail.xs.length - 1; i++) {
    const ax = rail.xs[i];
    const ay = rail.ys[i];
    const bx = rail.xs[i + 1];
    const by = rail.ys[i + 1];
    const L2 = (bx - ax) ** 2 + (by - ay) ** 2;
    const u = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / L2));
    const d = Math.hypot(ax + (bx - ax) * u - x, ay + (by - ay) * u - y);
    if (d < best.d) best = { s: rail.cum[i] + u * Math.sqrt(L2), d };
  }
  return best;
}


export function crossing(ra, rb) {
  for (let i = 0; i < ra.xs.length - 1; i++)
    for (let j = 0; j < rb.xs.length - 1; j++) {
      const [x1, y1, x2, y2] = [ra.xs[i], ra.ys[i], ra.xs[i + 1], ra.ys[i + 1]];
      const [x3, y3, x4, y4] = [rb.xs[j], rb.ys[j], rb.xs[j + 1], rb.ys[j + 1]];
      const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (Math.abs(den) < 1e-12) continue;
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
      const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
      if (t < 0 || t > 1 || u < 0 || u > 1) continue;
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1),
        sa: ra.cum[i] + t * (ra.cum[i + 1] - ra.cum[i]),
        sb: rb.cum[j] + u * (rb.cum[j + 1] - rb.cum[j]),
      };
    }
  return null;
}
