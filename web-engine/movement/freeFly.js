






























export const FLY_SPEED = 18.0;




export const FLY_BOOST = 2.5;


export const FLY_CRAWL = 0.35;












export const FLY_DAMP = 0.0001;




export const FLY_EPSILON = 0.01;













export function stepFreeFly({ pos, vel, wish, dt, boost = false, crawl = false } = {}) {
  const p = { x: pos?.x ?? 0, y: pos?.y ?? 0, z: pos?.z ?? 0 };
  const v = { x: vel?.x ?? 0, y: vel?.y ?? 0, z: vel?.z ?? 0 };
  const step = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.1)) : 0;

  
  
  
  

  const wx = wish?.x ?? 0, wy = wish?.y ?? 0, wz = wish?.z ?? 0;
  const len = Math.hypot(wx, wy, wz);

  let speed = FLY_SPEED;
  if (boost) speed *= FLY_BOOST;
  if (crawl) speed *= FLY_CRAWL;

  
  
  
  const target = len > 0
    ? { x: (wx / len) * speed, y: (wy / len) * speed, z: (wz / len) * speed }
    : { x: 0, y: 0, z: 0 };

  const k = step > 0 ? Math.pow(FLY_DAMP, step) : 1;
  v.x = target.x + (v.x - target.x) * k;
  v.y = target.y + (v.y - target.y) * k;
  v.z = target.z + (v.z - target.z) * k;
  if (Math.abs(v.x) < FLY_EPSILON) v.x = 0;
  if (Math.abs(v.y) < FLY_EPSILON) v.y = 0;
  if (Math.abs(v.z) < FLY_EPSILON) v.z = 0;

  p.x += v.x * step;
  p.y += v.y * step;
  p.z += v.z * step;
  return { pos: p, vel: v };
}







export function flyWish(forward, right, keys = {}) {
  const f = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0);
  const r = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const u = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
  return {
    x: (forward?.x ?? 0) * f + (right?.x ?? 0) * r,
    
    
    
    y: (forward?.y ?? 0) * f + u,
    z: (forward?.z ?? 0) * f + (right?.z ?? 0) * r,
  };
}
