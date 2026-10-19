












import { defeat } from './combat.js';
import { STEP } from './constants.js';
import { registerKind } from './entities.js';
import { stopFan } from './fan.js';

export const SURGE = Object.freeze({
  SPEED: 25, 
  HIT_DELAY: 0.05, 
  TAIL: 0.6, 
});



registerKind('plug', {
  create(e) {
    e.w = 0.6;
    e.h = 0.6;
  },
  step() {},
});


const CACHE = new WeakMap();
function circuitPaths(c) {
  let paths = CACHE.get(c);
  if (paths) return paths;
  paths = [];
  for (const pts of c.lines) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    
    let start = 0;
    if (paths.length) {
      let best = Number.POSITIVE_INFINITY;
      for (const q of paths) {
        const n = nearestOn(q, pts[0][0], pts[0][1]);
        if (n.d < best) {
          best = n.d;
          start = n.along;
        }
      }
    }
    paths.push({ pts, cum, start, len: cum[cum.length - 1] });
  }
  CACHE.set(c, paths);
  return paths;
}


function nearestOn(q, x, y) {
  let best = { d: Number.POSITIVE_INFINITY, along: 0 };
  for (let i = 1; i < q.pts.length; i++) {
    const [ax, ay] = q.pts[i - 1];
    const [bx, by] = q.pts[i];
    const L2 = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
    const k = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / L2));
    const d = Math.hypot(ax + (bx - ax) * k - x, ay + (by - ay) * k - y);
    if (d < best.d) best = { d, along: q.start + q.cum[i - 1] + k * Math.sqrt(L2) };
  }
  return best;
}


export function clipOf(c, x, y) {
  let best = { d: Number.POSITIVE_INFINITY, along: 0 };
  for (const q of circuitPaths(c)) {
    const n = nearestOn(q, x, y);
    if (n.d < best.d) best = n;
  }
  return best;
}


function circuitLength(c) {
  return Math.max(...circuitPaths(c).map((q) => q.start + q.len));
}

const circuitById = (level, id) => (level.circuits ?? []).find((c) => c.id === id) ?? null;


export function startSurge(s, id, from) {
  const c = circuitById(s.level, id);
  if (!c) return;
  s.surges ??= [];
  s.surges.push({ circuit: id, front: 0, hits: 0, done: [] });
  s.events.push({
    type: 'surge',
    circuit: id,
    x: from.x,
    y: from.y,
    speed: SURGE.SPEED,
    signals: ['visual:spark-race', 'audio:surge-zap'],
  });
  for (const f of s.fans?.list ?? []) if (f.def.stopOn === id) stopFan(s, f.id);
}





export function stepSurge(s) {
  const p = s.player;
  for (const e of p.events) if (e.type === 'plugYank') startSurge(s, e.circuit, e);
  
  for (const h of s.hooks ?? []) {
    if (!h.plug || !h.off || !h.reseat) continue;
    h.offT = (h.offT ?? 0) + STEP;
    if (h.offT >= h.reseat - 1e-9) {
      h.off = false;
      h.offT = 0;
      s.events.push({ type: 'plugReseat', id: h.id, x: h.x, y: h.y });
    }
  }
  if (!s.surges?.length) return;
  const ctx = { world: s.world, session: s, player: p, events: s.events };
  for (const sp of s.surges) {
    sp.front += SURGE.SPEED * STEP;
    const c = circuitById(s.level, sp.circuit);
    const reach = sp.front - SURGE.SPEED * SURGE.HIT_DELAY;
    for (const e of s.entities) {
      if (!e.alive || sp.done.includes(e.id)) continue;
      if (e.kind === 'boss') {
        if (e.surgeCircuit === sp.circuit && reach >= circuitLength(c)) {
          sp.done.push(e.id);
          e.surged = sp.circuit;
        }
        continue;
      }
      if (!e.lead || e.circuit !== sp.circuit || e.state === 'dazed' || e.state === 'scurry') continue;
      if (reach < clipOf(c, e.x, e.y + e.h / 2).along) continue;
      sp.done.push(e.id);
      sp.hits += 1;
      e.facing = e.facing || 1;
      defeat(e, ctx, 'surge');
      s.events.push({ type: 'surgeHit', id: e.id, circuit: sp.circuit, n: sp.hits, x: e.x, y: e.y, use: e.use ?? null });
    }
    if (sp.front >= circuitLength(c) + SURGE.SPEED * SURGE.TAIL) sp.over = true;
  }
  s.surges = s.surges.filter((sp) => !sp.over);
}
