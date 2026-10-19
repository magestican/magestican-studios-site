








import { sweepY } from '../body.js';
import { defeat } from '../combat.js';
import { STEP } from '../constants.js';
import { ENTITY_GRAVITY, overlaps, registerKind } from '../entities.js';

const SHAKE_EDGE = 3; 
const SHAKE_DY = 0.5; 
const WOBBLE = 0.2; 
const CRUSH_DEPTH = 1; 
const MAX_FALL = 18;
const FOES = new Set(['pillbug', 'ladybot', 'aphid', 'antPorter']);

function cells(world, e) {
  const T = world.tile;
  const out = [];
  for (let r = Math.round(e.y / T); r < Math.round((e.y + e.h) / T); r++)
    for (let c = Math.round((e.x - e.w / 2) / T); c < Math.round((e.x + e.w / 2) / T); c++) out.push([c, r]);
  return out;
}
const setSolid = (world, e, on) => {
  for (const [c, r] of cells(world, e)) world.setSolid(c, r, on);
};

function crush(world, e, dy) {
  const T = world.tile;
  const c0 = Math.round((e.x - e.w / 2) / T);
  const c1 = Math.round((e.x + e.w / 2) / T) - 1;
  const rNew = Math.floor((e.y + dy + 1e-7) / T);
  for (let r = Math.floor((e.y + 1e-7) / T) - 1; r >= rNew && e.crushLeft > 0; r--) {
    let any = false;
    for (let c = c0; c <= c1; c++) if (world.breakSoil(c, r)) any = true;
    if (any) e.crushLeft -= T;
  }
}


function loosen(e, ctx, wobble) {
  if (e.state !== 'rest') return;
  e.state = 'wobble';
  e.t = wobble ? 0 : WOBBLE;
  ctx.events.push({ type: 'caveIn', id: e.id, x: e.x, y: e.y });
  for (const o of ctx.session.entities) {
    if (o.kind === 'clod' && o.alive && o.state === 'rest' && Math.abs(o.y - (e.y + e.h)) < 0.01 && Math.abs(o.x - e.x) < e.w)
      loosen(o, ctx, wobble); 
  }
}

registerKind('clod', {
  create(e) {
    e.w = 1;
    e.h = 1;
    e.state = 'rest';
    e.home = { x: e.x, y: e.y };
    e.crushLeft = CRUSH_DEPTH;
    e.placed = false;
    e.buried = 0;
  },
  step(e, ctx) {
    const w = ctx.world;
    if (!e.placed) {
      if (!w.setSolid) throw new Error('clods need a mutable world (session clones it)');
      setSolid(w, e, true);
      e.placed = true;
    }
    if (e.state === 'gone') {
      if (e.t >= e.refill) {
        Object.assign(e, { x: e.home.x, y: e.home.y, state: 'rest', crushLeft: CRUSH_DEPTH, vy: 0 });
        setSolid(w, e, true);
        ctx.events.push({ type: 'clodRefill', id: e.id, x: e.x, y: e.y });
      }
      return;
    }
    if (e.state === 'rest') {
      const p = ctx.player;
      const impact = p.events.some((ev) => ev.type === 'pound');
      if (impact && Math.abs(e.x - p.x) - e.w / 2 <= SHAKE_EDGE && Math.abs(e.y - p.y) <= SHAKE_DY) loosen(e, ctx, true);
      return;
    }
    if (e.state === 'wobble') {
      if (e.t < WOBBLE) return;
      setSolid(w, e, false);
      e.state = 'fall';
      e.vy = 0;
    }
    if (e.state === 'settled') {
      if (e.refill !== undefined && e.t >= 0.6) {
        setSolid(w, e, false);
        e.state = 'gone';
        e.t = 0;
        ctx.events.push({ type: 'clodCrumble', id: e.id, x: e.x, y: e.y });
      }
      return;
    }
    
    if (overlaps(e, ctx.player)) {
      e.alive = e.refill !== undefined;
      e.state = e.refill !== undefined ? 'gone' : 'burst';
      e.t = 0;
      ctx.events.push({ type: 'clodBurst', id: e.id, x: e.x, y: e.y });
      return;
    }
    e.vy = Math.max(-MAX_FALL, e.vy - ENTITY_GRAVITY * STEP);
    crush(w, e, e.vy * STEP);
    const my = sweepY(w, e, e.vy * STEP);
    e.y = my.y;
    for (const en of ctx.session.entities) {
      if (!en.alive || !FOES.has(en.kind) || en.state === 'dazed' || en.state === 'scurry' || !overlaps(e, en)) continue;
      defeat(en, ctx, 'cave-in');
      e.buried += 1;
      ctx.events.push({ type: 'buried', id: e.id, target: en.id, x: en.x, y: en.y });
    }
    if (my.hit) {
      e.vy = 0;
      e.state = 'settled';
      e.t = 0;
      setSolid(w, e, true);
      ctx.events.push({ type: 'clodLand', id: e.id, x: e.x, y: e.y });
    }
  },
});
