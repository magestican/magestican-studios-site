





















export const FIELD_MM = 1200000;


export const TICKS_PER_SECOND = 20;
export const MS_PER_TICK = 1000 / TICKS_PER_SECOND;


export const MATCH_TICKS = 600 * TICKS_PER_SECOND;


export const ticks = (seconds) => Math.round(seconds * TICKS_PER_SECOND);

export const clamp = (v, lo, hi) => (v < lo ? lo : (v > hi ? hi : v));


export function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}


export function withinMm(ax, ay, bx, by, rMm) {
  return dist2(ax, ay, bx, by) <= rMm * rMm;
}











export function isqrt(n) {
  if (n <= 0) return 0;
  if (n < 4) return 1;
  
  
  let x = 1;
  let bits = 0;
  let v = n;
  while (v > 0) { v = Math.floor(v / 2); bits += 1; }
  x = Math.pow(2, Math.ceil(bits / 2));
  for (;;) {
    const y = Math.floor((x + Math.floor(n / x)) / 2);
    if (y >= x) break;
    x = y;
  }
  return x;
}


export function distMm(ax, ay, bx, by) {
  return isqrt(dist2(ax, ay, bx, by));
}














export function stepToward(x, y, tx, ty, stepMm) {
  const dx = tx - x;
  const dy = ty - y;
  const d = isqrt(dx * dx + dy * dy);
  if (d === 0 || d <= stepMm) return [tx, ty, true];
  
  
  
  
  const nx = x + Math.trunc((dx * stepMm) / d);
  const ny = y + Math.trunc((dy * stepMm) / d);
  return [nx, ny, false];
}









export const BRADS = 4096;


const SIN_TABLE = (() => {
  const t = new Int32Array(BRADS);
  for (let i = 0; i < BRADS; i += 1) {
    
    
    
    
    
    t[i] = Math.round(Math.sin((i * 2 * Math.PI) / BRADS) * 4096);
  }
  return t;
})();


export const sin4096 = (brad) => SIN_TABLE[((brad % BRADS) + BRADS) % BRADS];


export const cos4096 = (brad) => sin4096(brad + BRADS / 4);








export function angleTo(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0 && dy === 0) return 0;

  
  
  
  
  
  
  
  
  const q = dy >= 0 ? (dx >= 0 ? 0 : 1) : (dx < 0 ? 2 : 3);
  let lo = q * (BRADS / 4);
  let hi = lo + BRADS / 4;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    
    
    const cross = dy * cos4096(mid) - dx * sin4096(mid);
    if (cross > 0) lo = mid; else hi = mid;
  }
  return lo % BRADS;
}










export function facing8(brad) {
  const a = ((brad % BRADS) + BRADS) % BRADS;
  return Math.floor((a + BRADS / 16) / (BRADS / 8)) % 8;
}
