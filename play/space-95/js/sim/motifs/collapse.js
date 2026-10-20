


























import { defeat } from '../combat.js';
import { STEP } from '../constants.js';
import { registerKind } from '../entities.js';

export const TOWER = Object.freeze({
  LEAN: (10 * Math.PI) / 180, 
  WOBBLE: 0.25, 
  STRUCK: 0.1, 
  FALL0: 0.45, 
  FALL_N: 0.05, 
  STONE_R: 0.4, 
});


const FOES = new Set(['guard', 'pillbug', 'ladybot', 'aphid', 'bandit', 'antPorter', 'dustmite', 'snailknight', 'wasp', 'strider']);

const footCells = (world, f) => {
  const T = world.tile;
  const out = [];
  for (let c = Math.round(f[0] / T); c < Math.round(f[1] / T); c++)
    for (let r = Math.round(f[2] / T); r < Math.round(f[3] / T); r++) out.push([c, r]);
  return out;
};


export function stonesAt(P, a, n, lean) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({ x: P.x + lean * Math.sin(a) * (i + 0.5), y: P.y + Math.cos(a) * (i + 0.5) });
  return out;
}


function samples(P, a, n, lean) {
  const out = [];
  for (let s = 0.5; s <= n + 1e-9; s += 0.25) out.push({ x: P.x + lean * Math.sin(a) * s, y: P.y + Math.cos(a) * s });
  return out;
}

const blocked = (world, pts) => {
  const T = world.tile;
  return pts.some((q) => world.solid(Math.floor(q.x / T), Math.floor(q.y / T)));
};


const restPivot = (e) => ({ x: e.x, y: e.y });


export function pivotOf(e, struck) {
  const f = e.foot;
  return { x: e.lean > 0 ? f[1] : f[0], y: struck ? f[3] : f[2] };
}





export function restAngle(world, P, n, lean) {
  const step = (0.25 * Math.PI) / 180;
  let a = TOWER.LEAN;
  for (; a <= Math.PI; a += step) if (blocked(world, samples(P, a + step, n, lean))) return a;
  return Math.PI;
}


export function sweepPoints(P, end, n, lean) {
  const out = [];
  for (let a = TOWER.LEAN; a <= end + 1e-9; a += Math.PI / 180) out.push(...samples(P, a, n, lean));
  out.push(...samples(P, end, n, lean));
  return out;
}


export const pointInBox = (q, b, r = TOWER.STONE_R) => Math.abs(q.x - b.x) < b.w / 2 + r && q.y > b.y - r && q.y < b.y + b.h + r;

function overlapsJo(p, c, r, T) {
  return c * T < p.x + p.w / 2 && (c + 1) * T > p.x - p.w / 2 && r * T < p.y + p.h && (r + 1) * T > p.y;
}

function wobble(e, ctx, by, root) {
  if (e.state !== 'rest') return;
  e.state = 'wobble';
  e.st = 0;
  e.by = by;
  e.chain = root;
  e.wobbleFor = by === 'foot' ? TOWER.WOBBLE : TOWER.STRUCK;
  ctx.events.push({ type: 'towerWobble', id: e.id, tag: e.tag, by, x: e.x, y: e.y, signals: ['visual:wobble', 'audio:creak'] });
}


function land(e, ctx) {
  e.state = 'settled';
  e.st = 0;
  e.pending = true;
  e.stones = stonesAt(e.pivot, e.angle, e.n, e.lean);
  ctx.events.push({ type: 'towerLand', id: e.id, tag: e.tag, x: e.stones[e.n - 1].x, y: e.stones[e.n - 1].y, chain: e.chain });
}






function place(e, ctx) {
  const w = ctx.world;
  const T = w.tile;
  const p = ctx.player;
  const placed = [];
  let burst = 0;
  for (const st of stonesAt(e.pivot, e.angle, e.n, e.lean)) {
    const c0 = Math.round((st.x - 0.5) / T);
    const r0 = Math.round((st.y - 0.5) / T);
    let hitJo = false;
    for (let c = c0; c < c0 + 2; c++) for (let r = r0; r < r0 + 2; r++) if (overlapsJo(p, c, r, T)) hitJo = true;
    if (hitJo) {
      burst += 1; 
      continue;
    }
    for (let c = c0; c < c0 + 2; c++) for (let r = r0; r < r0 + 2; r++) if (w.placeSoil(c, r)) placed.push([c, r]);
  }
  
  placed.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const rubble = [];
  for (const cell of placed) {
    let [c, r] = cell;
    while (r > 0 && !w.solid(c, r - 1) && !overlapsJo(p, c, r - 1, T)) {
      w.breakSoil(c, r);
      w.placeSoil(c, r - 1);
      r -= 1;
    }
    rubble.push([c, r]);
  }
  e.rubble = rubble;
  e.pending = false;
  e.st = 0;
  ctx.events.push({ type: 'rubble', id: e.id, tag: e.tag, cells: rubble.length, burst });
  if (burst) ctx.events.push({ type: 'stoneBurst', id: e.id, n: burst, x: p.x, y: p.y });
}


export function removeTower(e, world) {
  for (const [c, r] of e.rubble ?? []) world.breakSoil(c, r);
  for (const [c, r] of footCells(world, e.foot)) world.breakSoil(c, r);
  e.rubble = [];
  e.pending = false;
  e.state = 'gone';
  e.removed = true;
}


export function restoreTower(e, world, player) {
  const T = world.tile;
  for (const [c, r] of e.rubble ?? []) world.breakSoil(c, r);
  e.rubble = [];
  for (const [c, r] of footCells(world, e.foot)) if (!player || !overlapsJo(player, c, r, T)) world.placeSoil(c, r);
  e.state = 'rest';
  e.pending = false;
  e.removed = false;
  e.st = 0;
  e.angle = TOWER.LEAN;
  e.pivot = restPivot(e);
  e.stones = stonesAt(e.pivot, TOWER.LEAN, e.n, e.lean);
}

registerKind('tower', {
  create(e) {
    e.w = 0;
    e.h = 0;
    e.state = e.hidden ? 'gone' : 'rest';
    e.removed = !!e.hidden;
    e.angle = TOWER.LEAN;
    e.pivot = restPivot(e);
    e.stones = stonesAt(e.pivot, TOWER.LEAN, e.n, e.lean);
    e.rubble = [];
    e.st = 0;
  },
  step(e, ctx) {
    const w = ctx.world;
    const s = ctx.session;
    e.st = (e.st ?? 0) + STEP;
    if (e.state === 'rest') {
      if (footCells(w, e.foot).every(([c, r]) => !w.soil(c, r))) wobble(e, ctx, 'foot', e.id);
      return;
    }
    if (e.state === 'wobble') {
      if (e.st < e.wobbleFor - 1e-9) return;
      e.state = 'fall';
      e.st = 0;
      e.pivot = pivotOf(e, e.by !== 'foot');
      e.endAngle = restAngle(w, e.pivot, e.n, e.lean);
      e.fallFor = TOWER.FALL0 + TOWER.FALL_N * e.n;
      e.hitIds = [];
      ctx.events.push({ type: 'towerTopple', id: e.id, tag: e.tag, by: e.by, dir: e.lean, chain: e.chain, x: e.pivot.x, y: e.pivot.y });
      return;
    }
    if (e.state === 'fall') {
      const u = Math.min(1, e.st / e.fallFor);
      let a = TOWER.LEAN + (e.endAngle - TOWER.LEAN) * u * u;
      
      let stop = false;
      if (blocked(w, samples(e.pivot, a, e.n, e.lean))) {
        a = e.angle;
        stop = true;
      }
      e.angle = a;
      e.stones = stonesAt(e.pivot, a, e.n, e.lean);
      const pts = samples(e.pivot, a, e.n, e.lean);
      for (const o of s.entities) {
        if (!o.alive || o === e) continue;
        if (o.kind === 'tower') {
          
          if (o.state === 'rest' && pts.some((q) => o.stones.some((t) => Math.hypot(t.x - q.x, t.y - q.y) < 2 * TOWER.STONE_R + 0.2)))
            wobble(o, ctx, e.id, e.chain);
          continue;
        }
        if (o.kind === 'boss') {
          
          if (!e.hitIds.includes(o.id) && pts.some((q) => pointInBox(q, o))) {
            e.hitIds.push(o.id);
            o.collapseAt = { id: e.id, tag: e.tag, use: e.use, t: s.time, chain: e.chain };
          }
          continue;
        }
        if (!FOES.has(o.kind) || o.state === 'dazed' || o.state === 'scurry' || e.hitIds.includes(o.id)) continue;
        if (!pts.some((q) => pointInBox(q, o))) continue;
        e.hitIds.push(o.id);
        if (o.dozing) o.dozing = false; 
        o.awake = true;
        o.wakeIn = undefined;
        defeat(o, ctx, 'collapse');
        const key = `collapse:${e.chain}`;
        s.bowls[key] = (s.bowls[key] ?? 0) + 1;
        ctx.events.push({
          type: 'collapseHit',
          id: e.id,
          tag: e.tag,
          target: o.id,
          kind: o.kind,
          n: s.bowls[key],
          use: e.use ?? null,
          chain: e.chain,
          x: o.x,
          y: o.y,
        });
      }
      if (u >= 1 || stop) land(e, ctx);
      return;
    }
    if (e.state === 'settled' && e.pending) {
      const busy = s.entities.some((o) => o.kind === 'tower' && o.chain === e.chain && (o.state === 'wobble' || o.state === 'fall'));
      if (!busy) place(e, ctx);
      return;
    }
    if (e.state === 'settled' && e.refill !== undefined) {
      if (!e.trickled && e.st >= e.refill - 1) {
        e.trickled = true;
        ctx.events.push({ type: 'towerTrickle', id: e.id, tag: e.tag, x: e.x, y: e.y });
      }
      if (e.st >= e.refill) {
        e.trickled = false;
        restoreTower(e, w, ctx.player);
        ctx.events.push({ type: 'towerRefill', id: e.id, tag: e.tag, x: e.x, y: e.y });
      }
    }
  },
});
