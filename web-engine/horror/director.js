


























export const DIRECTOR = Object.freeze({
  budgetByAct: { 1: 2, 2: 4, 3: 6 },
  minPlayerDist: 9,
  cooldown: 12,
  valveHealthFrac: 0.25,
});

function h(seed, a) {
  const s = Math.sin(seed * 668265.263 + a * 374761.393) * 43758.5453;
  return s - Math.floor(s);
}

export function createDirector(seed, act, gateCount) {
  const budget = DIRECTOR.budgetByAct[Math.min(3, Math.max(1, act))] || 2;
  
  
  
  
  const marks = [];
  for (let i = 0; i < budget; i += 1) {
    marks.push(0.25 + (0.55 * (i + h(seed, i) * 0.5)) / budget);
  }
  
  const order = [];
  for (let i = 0; i < gateCount; i += 1) order.push(i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(h(seed, 100 + i) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    seed, act, budget, fired: 0, marks, order,
    cooldown: 0, lastGate: -1,
  };
}
















export const REISSUE = Object.freeze({ aheadFrac: 0.08 });

export function returnToDirector(d, { species = 'chicken', gateIndex = -1, progress = 0, creature = null } = {}) {
  return {
    ...d,
    budget: d.budget + 1,
    marks: [...d.marks, Math.min(0.97, Math.max(0, progress) + REISSUE.aheadFrac)],
    pool: [...(d.pool || []), { species, creature }],
    lastGate: gateIndex >= 0 ? gateIndex : d.lastGate,
  };
}













export function stepDirector(d, dt, ctx) {
  const n = { ...d, cooldown: Math.max(0, d.cooldown - dt) };
  if (n.fired >= n.budget) return { d: n, fire: -1, reissue: null };
  if (n.cooldown > 0) return { d: n, fire: -1, reissue: null };
  if (ctx.inStruggle || ctx.healthFrac < DIRECTOR.valveHealthFrac) return { d: n, fire: -1, reissue: null };
  if (ctx.progress < n.marks[n.fired]) return { d: n, fire: -1, reissue: null };

  
  
  for (let i = 0; i < n.order.length; i += 1) {
    const gi = n.order[(i + n.fired) % n.order.length];
    const g = ctx.gates[gi];
    if (!g || g.opened) continue;
    if (gi === n.lastGate) continue;
    if (g.dist < DIRECTOR.minPlayerDist) continue;
    if (g.kind === 'drop' && n.fired === 0) continue;
    n.fired += 1;
    n.cooldown = DIRECTOR.cooldown;
    n.lastGate = gi;
    
    let reissue = null;
    if (n.pool && n.pool.length) {
      reissue = n.pool[0];
      n.pool = n.pool.slice(1);
    }
    return { d: n, fire: gi, reissue };
  }
  return { d: n, fire: -1, reissue: null };
}
