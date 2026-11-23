







import { HZ, secs, TUNING as T } from './tuning.js';
import { ARENAS } from './arenas.js';

export const ABILITIES = Object.freeze({
  bladeLunge:  { name: 'Blade Lunge', distance: 14, time: 0.3, damage: 10, knock: 26, reach: 3.6, arc: 120, heat: 12 },
  aegis:       { name: 'Aegis', time: 2.0, arc: 140, walkMul: 0.6, lobMul: 0.5, heat: 8 },
  afterimage:  { name: 'Afterimage', distance: 8, decoyTime: 1.5, heat: 10 },
  seedBarrage: { name: 'Seed Barrage', count: 5, ring: 3, delay: 1.0, damage: 7, splash: 2.5, range: 26, aimDefault: 14, heat: 16 },
});

const angleTo = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));


function aim(m, t, inp, ctx) {
  if (inp.ax !== undefined && Math.hypot(inp.ax, inp.ay) > 0.2) {
    const [dx, dy] = ctx.norm(inp.ax, inp.ay);
    return { dx, dy, dist: inp.ad };
  }
  const target = ctx.autoAim(m, t);
  if (target) { const [dx, dy, d] = ctx.norm(target.x - t.x, target.y - t.y); return { dx, dy, dist: d }; }
  return { dx: Math.cos(t.facing), dy: Math.sin(t.facing), dist: undefined };
}


export function use(m, t, inp, events, ctx) {
  const kind = ctx.abilityOf(t);
  const A = ABILITIES[kind];
  if (!A) return false;
  const [sx, sy, smag] = ctx.norm(inp.mx || 0, inp.my || 0);
  if (kind === 'bladeLunge') {
    const a = aim(m, t, inp, ctx);
    const dx = smag > 0.2 ? sx : a.dx; const dy = smag > 0.2 ? sy : a.dy;
    t.lunge = secs(A.time); t.lungeDx = dx; t.lungeDy = dy; t.facing = Math.atan2(dy, dx); t.dash = 0;
  } else if (kind === 'aegis') {
    t.aegis = secs(A.time);
  } else if (kind === 'afterimage') {
    const dx = smag > 0.2 ? sx : Math.cos(t.facing); const dy = smag > 0.2 ? sy : Math.sin(t.facing);
    m.decoys.push({ owner: t.id, team: t.team, x: t.x, y: t.y, facing: t.facing, life: secs(A.decoyTime), alive: true, decoy: true, bells: -1e9 });
    blink(m, t, dx, dy, A.distance, ctx);
  } else if (kind === 'seedBarrage') {
    const a = aim(m, t, inp, ctx);
    const d = Math.min(a.dist ?? A.aimDefault, A.range);
    const cx = t.x + a.dx * d; const cy = t.y + a.dy * d;
    t.facing = Math.atan2(a.dy, a.dx);
    for (let i = 0; i < A.count; i++) {
      const ang = (i / A.count) * Math.PI * 2;
      m.shots.push({ kind: 'lob', seed: true, owner: t.id, team: t.team, x: cx + Math.cos(ang) * A.ring,
        y: cy + Math.sin(ang) * A.ring, life: secs(A.delay), maxLife: secs(A.delay), damage: A.damage * ctx.dmgMul(t), splash: A.splash });
    }
  }
  events.push({ type: 'ability', id: t.id, ability: kind });
  return true;
}


function blink(m, t, dx, dy, dist, ctx) {
  const arena = ARENAS[m.arena];
  const stepLen = 0.25; const edge = T.radius + 0.5;
  for (let s = stepLen; s <= dist + 1e-9; s += stepLen) {
    const nx = t.x + dx * stepLen; const ny = t.y + dy * stepLen;
    if (ctx.blockedByCover(arena, nx, ny, T.radius)) break;
    if (Math.abs(nx) > arena.w / 2 - edge || Math.abs(ny) > arena.h / 2 - edge) break;
    t.x = nx; t.y = ny;
  }
  t.vx = 0; t.vy = 0;
}



export function tickLunge(m, t, events, ctx) {
  const A = ABILITIES.bladeLunge;
  const v = A.distance / A.time;
  t.vx = t.lungeDx * v; t.vy = t.lungeDy * v;
  t.lunge -= 1;
  const touching = ctx.rivals(m, t).some((o) => Math.hypot(o.x - t.x, o.y - t.y) < T.radius * 2 + 0.4);
  if (t.lunge === 0 || touching) { t.lunge = 0; t.vx = 0; t.vy = 0; arc(m, t, events, ctx); }
}

function arc(m, t, events, ctx) {
  const A = ABILITIES.bladeLunge;
  const half = (A.arc / 2) * (Math.PI / 180);
  const mul = ctx.dmgMul(t);
  for (const o of ctx.rivals(m, t)) {
    const [nx, ny, d] = ctx.norm(o.x - t.x, o.y - t.y);
    if (d > A.reach + T.radius * 2) continue;
    if (Math.abs(angleTo(Math.atan2(ny, nx), t.facing)) > half) continue;
    ctx.damage(m, o, A.damage * mul, t.id, nx, ny, A.knock * mul, 'lunge', events);
  }
}


export function aegisBlocks(t, vx, vy) {
  if (!(t.aegis > 0)) return false;
  const half = (ABILITIES.aegis.arc / 2) * (Math.PI / 180);
  const from = Math.atan2(-vy, -vx); 
  return Math.abs(angleTo(from, t.facing)) <= half;
}

export const lifeOfBolt = (range, speed) => Math.ceil((range / speed) * HZ);
