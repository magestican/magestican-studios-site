



import { sweepX, sweepY } from './body.js';
import { FALL_GRAVITY, GRAVITY, STEP } from './constants.js';

export const ENTITY_GRAVITY = GRAVITY * FALL_GRAVITY * 0.8;


const KINDS = {};



const WAKE_RANGE = 14;
const WAKE_RANGE_Y = 9; 






export function registerKind(kind, impl) {
  KINDS[kind] = impl;
}


export function spawnEntities(defs) {
  return defs
    .map((d) => {
      const impl = KINDS[d.kind];
      if (!impl) throw new Error(`unknown entity kind ${d.kind} (${d.id})`);
      const e = { vx: 0, vy: 0, alive: true, state: 'idle', t: 0, facing: -1, grounded: false, ...d, px: d.x, py: d.y };
      impl.create(e);
      
      
      e.w ??= 0.5;
      e.h ??= 0.5;
      return e;
    })
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}


export function stepEntities(list, ctx) {
  for (const e of list) {
    if (!e.alive) continue;
    if (e.webFlung) continue; 
    e.px = e.x;
    e.py = e.y;
    const impl = KINDS[e.kind];
    if (e.swept) continue; 
    if (e.flip) continue; 
    if (e.spun !== undefined) continue; 
    
    if (e.dozing && ctx.player.ab?.pound === 'fall' && overlaps(ctx.player, e)) e.dozing = false;
    if (e.dozing) {
      
      
      const p = ctx.player;
      
      
      
      const ww = e.wakeWhen;
      if (ww && !e.alert) {
        const side = ww.dir ?? (Math.sign(ww.x - e.x) || 1);
        if ((p.x - ww.x) * side >= 0 && Math.abs(p.y - e.y) <= (ww.dy ?? 3)) {
          e.wakeIn = 0;
          e.alert = true;
        }
      }
      if (e.wakeIn === undefined) {
        const pound = p.events.find((ev) => ev.type === 'pound');
        if ((pound && Math.hypot(pound.x - e.x, pound.y - e.y) <= 8) || overlaps(p, e)) e.wakeIn = 1.1;
      }
      if (e.wakeIn !== undefined) e.wakeIn -= STEP;
      if (e.wakeIn !== undefined && e.wakeIn <= 0) {
        e.dozing = false;
        e.awake = true;
        ctx.events.push({ type: 'wake', id: e.id, yawn: !e.alert });
      }
      continue;
    }
    if (impl.sleeps && !e.awake && ctx.session?.train) e.awake = true; 
    if (impl.sleeps && !e.awake) {
      if (Math.abs(ctx.player.x - e.x) > (e.wake ?? WAKE_RANGE) || Math.abs(ctx.player.y - e.y) > (e.wakeY ?? WAKE_RANGE_Y)) continue;
      if (e.wakeGrounded && !ctx.player.grounded) continue; 
      e.awake = true;
      ctx.events.push({ type: 'wake', id: e.id });
    }
    e.t += STEP;
    impl.step(e, ctx);
  }
}


export function moveBody(e, world, gravity = true) {
  if (gravity) e.vy -= ENTITY_GRAVITY * STEP;
  const mx = sweepX(world, e, e.vx * STEP);
  e.x = mx.x;
  const my = sweepY(world, e, e.vy * STEP);
  e.y = my.y;
  const landed = my.hit && e.vy < 0;
  if (my.hit) e.vy = 0;
  e.grounded = landed;
  return { wall: mx.hit, landed, ceiling: my.hit && !landed };
}


export function groundAhead(e, world, dir) {
  const T = world.tile;
  const c = Math.floor((e.x + dir * (e.w / 2 + 0.05)) / T);
  const r = Math.round(e.y / T) - 1;
  return world.solid(c, r) || world.oneWay(c, r);
}


export function overlaps(a, b, pad = 0) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
}
