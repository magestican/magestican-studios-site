





































export const KILLS_TO_EARN = 3;


export const DURATION = 30;










export const HEADS = 3;


export const HEAD_RANGE = 26;


export const HEAD_COOLDOWN = 0.75;









export const HEAD_PHASE = HEAD_COOLDOWN / HEADS;


export const HEAD_DAMAGE = 18;


export const PLACE_RANGE = 34;


export const EMERGE_TIME = 1.1;


export const PORTAL_RADIUS = 2.6;









export const NECK_REACH = 4.2;


export function earned(killsSinceLast) {
  return (killsSinceLast ?? 0) >= KILLS_TO_EARN;
}


export function killsRemaining(killsSinceLast) {
  return Math.max(0, KILLS_TO_EARN - (killsSinceLast ?? 0));
}


















export function headOffset(i, t, reach = NECK_REACH) {
  const base = (i / HEADS) * Math.PI * 2;
  
  
  const sway = Math.sin(t * 1.7 + base) * 0.55 + Math.sin(t * 0.9 + base * 2.1) * 0.45;
  const angle = base + sway * 0.9;
  const lean = 0.55 + 0.45 * Math.sin(t * 1.3 + base);
  return {
    x: Math.cos(angle) * reach * lean,
    z: Math.sin(angle) * reach * lean,
    
    
    y: 3.4 + Math.sin(t * 2.1 + base) * 0.85,
  };
}










export function emergence(t, emergeTime = EMERGE_TIME) {
  if (!(t > 0)) return 0;
  if (t >= emergeTime) return 1;
  const u = t / emergeTime;
  return 1 - (1 - u) * (1 - u) * (1 - u);
}


export function alive(t, duration = DURATION) {
  return t >= 0 && t < duration;
}


export function remaining(t, duration = DURATION) {
  return Math.max(0, duration - t);
}


export function createSandworm({ x, y, z, team, ownerId }) {
  return {
    x, y, z, team, ownerId,
    t: 0,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    lastShot: Array.from(
      { length: HEADS },
      (_, i) => EMERGE_TIME - HEAD_COOLDOWN + i * HEAD_PHASE,
    ),
  };
}












export function pickTarget(from, targets, team, range = HEAD_RANGE) {
  let best = null;
  let bestD = range;
  for (const c of targets || []) {
    if (!c || c.alive === false) continue;
    if (c.team === team) continue;             
    const d = Math.hypot(c.x - from.x, (c.y ?? 0) - (from.y ?? 0), c.z - from.z);
    if (d <= bestD) { bestD = d; best = c; }
  }
  return best;
}












export function stepSandworm(worm, dt, targets, opts = {}) {
  const cooldown = opts.cooldown ?? HEAD_COOLDOWN;
  const damage = opts.damage ?? HEAD_DAMAGE;
  const range = opts.range ?? HEAD_RANGE;
  const shots = [];
  worm.t += dt;
  if (!alive(worm.t, opts.duration ?? DURATION)) return shots;
  if (emergence(worm.t, opts.emergeTime ?? EMERGE_TIME) < 1) return shots;

  for (let i = 0; i < HEADS; i += 1) {
    if (worm.t - worm.lastShot[i] < cooldown) continue;
    const off = headOffset(i, worm.t, opts.reach ?? NECK_REACH);
    const from = { x: worm.x + off.x, y: worm.y + off.y, z: worm.z + off.z };
    const target = pickTarget(from, targets, worm.team, range);
    
    
    
    worm.lastShot[i] = worm.t;
    if (!target) continue;
    shots.push({ head: i, from, target, damage });
  }
  return shots;
}







export function canPlace(playerPos, point, range = PLACE_RANGE) {
  if (!playerPos || !point) return false;
  return Math.hypot(point.x - playerPos.x, point.z - playerPos.z) <= range;
}
