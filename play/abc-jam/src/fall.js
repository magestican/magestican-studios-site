











export const GRAVITY = 30;
const RESTITUTION = 0.32;
const FRICTION = 0.72; 
const DRAG = 0.12; 
const REST_SPEED = 0.9;


const halfExtent = (a) => 0.5 * (Math.abs(Math.cos(a)) + Math.abs(Math.sin(a)));



export function loose(x, y, { away = 1, front = false, rand = Math.random } = {}) {
  return {
    x, y, front,
    vx: away * (2 + rand() * 3),
    vy: 4 + rand() * 4, 
    a: 0,
    va: away * (5 + rand() * 7),
    rest: false,
  };
}


function supportUnder(b, bodies) {
  let top = 0;
  let from = null;
  for (const o of bodies) {
    if (o === b || !o.rest) continue;
    if (Math.abs(o.x - b.x) < 0.95 && o.y < b.y && o.y + 0.5 > top) { top = o.y + 0.5; from = o; }
  }
  return { top, from };
}







export function step(bodies, dt, { core = null, walls = null } = {}) {
  const sub = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / sub;
  for (let k = 0; k < sub; k++) {
    for (const b of bodies) {
      if (b.rest) continue;
      b.vy -= GRAVITY * h;
      const d = 1 - DRAG * h;
      b.vx *= d;
      b.vy *= d;
      b.x += b.vx * h;
      b.y += b.vy * h;
      b.a += b.va * h;
      const e = halfExtent(b.a);
      
      for (const r of b.front ? [] : core || []) {
        if (!(b.y - e < r.y1 && b.y + e > r.y0 && b.x + e > r.x0 && b.x - e < r.x1)) continue;
        if (b.x < (r.x0 + r.x1) / 2) { b.x = r.x0 - e; b.vx = -Math.abs(b.vx) * RESTITUTION - 0.5; }
        else { b.x = r.x1 + e; b.vx = Math.abs(b.vx) * RESTITUTION + 0.5; }
        b.va *= -0.6;
      }
      if (walls && b.x - e < walls.x0) { b.x = walls.x0 + e; b.vx = Math.abs(b.vx) * RESTITUTION; }
      if (walls && b.x + e > walls.x1) { b.x = walls.x1 - e; b.vx = -Math.abs(b.vx) * RESTITUTION; }
      const { top, from } = supportUnder(b, bodies);
      if (b.y - e <= top && b.vy <= 0) {
        b.y = top + e;
        b.vy = -b.vy * RESTITUTION;
        b.vx *= FRICTION;
        b.va = b.va * 0.5 + b.vx * 0.8; 
        if (from && Math.abs(b.x - from.x) > 0.5) b.vx += Math.sign(b.x - from.x) * 1.5; 
        if (Math.abs(b.vy) < REST_SPEED && Math.abs(b.vx) < REST_SPEED) {
          const flat = Math.round(b.a / (Math.PI / 2)) * (Math.PI / 2); 
          b.a += (flat - b.a) * 0.35;
          b.va *= 0.5;
          b.vy = 0;
          if (Math.abs(flat - b.a) < 0.02 && Math.abs(b.vx) < 0.2) {
            b.a = flat;
            b.y = top + 0.5;
            b.vx = 0;
            b.va = 0;
            b.rest = true;
          }
        }
      }
    }
  }
  return bodies;
}
