












export const CHAR_SCALE = 0.78; 
export const VIEW_ZOOM = 0.9; 

export const BODY_R = { kid: 0.22, dachi: 0.2, elder: 0.26 };


export const GAP = 0.62;

export const FOLLOW = 1.3;






export function pushApart(bodies, { gap = GAP, k = 1, ok = () => true, skip = () => false } = {}) {
  let pushed = 0;
  const mass = (o) => (o.fixed ? Infinity : o.m ?? 1);
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
    const a = bodies[i], b = bodies[j], ma = mass(a), mb = mass(b);
    if ((ma === Infinity && mb === Infinity) || skip(a, b)) continue;
    let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d >= gap) continue;
    if (d < 1e-6) { dx = 1; dy = 0; d = 1e-6; } 
    const over = (gap - d) * k, ux = dx / Math.max(d, 1e-6), uy = dy / Math.max(d, 1e-6);
    const sa = ma === Infinity ? 0 : mb === Infinity ? 1 : mb / (ma + mb), sb = mb === Infinity ? 0 : ma === Infinity ? 1 : ma / (ma + mb);
    const ax = a.x - ux * over * sa, ay = a.y - uy * over * sa, bx = b.x + ux * over * sb, by = b.y + uy * over * sb;
    const okA = sa && ok(ax, ay), okB = sb && ok(bx, by);
    if (okA) { a.x = ax; a.y = ay; }
    if (okB) { b.x = bx; b.y = by; }
    
    
    if (!okA && okB && mb !== Infinity && sa) { const cx = b.x + ux * over * sa, cy = b.y + uy * over * sa; if (ok(cx, cy)) { b.x = cx; b.y = cy; } }
    if (!okB && okA && ma !== Infinity && sb) { const cx = a.x - ux * over * sb, cy = a.y - uy * over * sb; if (ok(cx, cy)) { a.x = cx; a.y = cy; } }
    pushed++;
  }
  return pushed;
}


export function minGap(bodies) {
  let min = Infinity, pair = null;
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
    const d = Math.hypot(bodies[i].x - bodies[j].x, bodies[i].y - bodies[j].y);
    if (d < min) { min = d; pair = [i, j]; }
  }
  return { min, pair };
}
