











export const POP = Object.freeze({
  
  durationS: 0.55,
  
  staggerS: 0.09,
  
  arcM: 0.9,
  
  spreadM: 0.55,
  
  shrinkFromU: 0.72,
  shrinkTo: 0.45,
});



function unit(seed, i, salt) {
  let h = Math.imul((seed | 0) ^ 0x27d4eb2d, 0x165667b1) ^ Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(salt, 0x85ebca77);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

export function createPop({ from, count, seed = 1, startS = 0, good = null }, cfg = POP) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const a = unit(seed, i, 1) * Math.PI * 2;
    const r = cfg.spreadM * (0.45 + 0.55 * unit(seed, i, 2));
    items.push({ delayS: i * cfg.staggerS, spreadX: Math.sin(a) * r, spreadZ: Math.cos(a) * r, spin: unit(seed, i, 3) * Math.PI * 2 });
  }
  return { good, from: { x: from.x, y: from.y, z: from.z }, startS, items, cfg };
}

const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function popItemAt(pop, i, nowS, to) {
  const { cfg, from } = pop;
  const it = pop.items[i];
  const s = nowS - pop.startS - it.delayS;
  if (s < 0) return { visible: false, landed: false, u: 0, x: from.x, y: from.y, z: from.z, scale: 1, spin: it.spin };
  const u = Math.min(1, s / cfg.durationS);
  const along = 1 - (1 - u) * (1 - u); 
  const burst = Math.sin(Math.PI * u);  
  return {
    visible: u < 1,
    landed: u >= 1,
    u,
    x: from.x + (to.x - from.x) * along + it.spreadX * burst,
    y: from.y + (to.y - from.y) * u + cfg.arcM * 4 * u * (1 - u),
    z: from.z + (to.z - from.z) * along + it.spreadZ * burst,
    scale: 1 - (1 - cfg.shrinkTo) * smooth(cfg.shrinkFromU, 1, u),
    spin: it.spin + u * Math.PI * 3,
  };
}

export function landedCount(pop, nowS) {
  const s = nowS - pop.startS - pop.cfg.durationS;
  if (s < 0) return 0;
  return Math.min(pop.items.length, Math.floor(s / pop.cfg.staggerS + 1e-9) + 1);
}

export const popDone = (pop, nowS) => landedCount(pop, nowS) === pop.items.length;
