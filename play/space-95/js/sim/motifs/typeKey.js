












import { defeat } from '../combat.js';
import { STEP } from '../constants.js';
import { registerKind } from '../entities.js';

const PRESS_T = 0.08; 
const ZAP_DELAY = 0.3; 
const POP_BACK = 1.0; 
const ONE_DY = 4;
const WIDE_DY = 8;

const ZAPPABLE = new Set([
  'ladybot',
  'pillbug',
  'aphid',
  'bandit',
  'snailknight',
  'antPorter',
  'wasp',
  'guard',
  'strider',
  'skiff',
  'dustmite',
]);

function keyCells(world, e) {
  const T = world.tile;
  const out = [];
  for (let r = Math.round(e.y / T); r < Math.round((e.y + e.rise) / T); r++)
    for (let c = Math.round((e.x - e.w / 2) / T); c < Math.round((e.x + e.w / 2) / T); c++) out.push([c, r]);
  return out;
}
const setKey = (world, e, on) => {
  for (const [c, r] of keyCells(world, e)) world.setSolid(c, r, on);
};


function keyTargets(e, entities) {
  const dir = e.dir;
  const live = entities.filter((o) => o.alive && ZAPPABLE.has(o.kind) && o.state !== 'dazed' && o.state !== 'scurry' && !o.hidden);
  if (e.mode === 'wide') {
    const [a, b] = e.reach;
    const lo = dir > 0 ? e.x - e.w / 2 + a : e.x + e.w / 2 - b;
    const hi = dir > 0 ? e.x + e.w / 2 + b : e.x - e.w / 2 - a;
    return live.filter((o) => o.x >= lo && o.x <= hi && Math.abs(o.y - e.y) <= WIDE_DY);
  }
  if (e.mode === 'all') {
    const far = Array.isArray(e.reach) ? e.reach[1] : e.reach;
    return live.filter((o) => (o.x - e.x) * dir > 0 && (o.x - e.x) * dir <= far && Math.abs(o.y - e.y) <= WIDE_DY);
  }
  const far = Array.isArray(e.reach) ? e.reach[1] : (e.reach ?? 16);
  const ahead = live.filter((o) => (o.x - e.x) * dir > 0 && (o.x - e.x) * dir <= far && Math.abs(o.y - e.y) <= ONE_DY);
  if (!ahead.length) return [];
  return [ahead.reduce((m, o) => (Math.abs(o.x - e.x) < Math.abs(m.x - e.x) ? o : m))];
}

registerKind('typeKey', {
  create(e) {
    e.w ??= 3;
    e.rise ??= 1;
    e.h = e.rise;
    e.mode ??= 'one';
    e.screen ??= 'monitor';
    e.key = 'up'; 
    e.placed = false;
    e.zapIn = -1;
    e.idleT = 0;
    e.dir = 1;
    e.typed = 0;
  },
  step(e, ctx) {
    const w = ctx.world;
    const p = ctx.player;
    if (!e.placed) {
      setKey(w, e, true);
      e.placed = true;
    }
    const over = Math.abs(p.x - e.x) < e.w / 2 + p.w / 2 - 1e-6;
    if (e.key === 'up') {
      const landed = p.grounded && over && Math.abs(p.y - (e.y + e.rise)) < 1e-6 && p.events.some((ev) => ev.type === 'land');
      if (landed) {
        e.key = 'press';
        e.t = 0;
        e.dir = p.facing || 1;
      }
    } else if (e.key === 'press' && e.t >= PRESS_T - 1e-9) {
      e.key = 'down';
      e.idleT = 0;
      setKey(w, e, false);
      e.typed += 1;
      e.zapIn = ZAP_DELAY;
      ctx.events.push({ type: 'keystroke', id: e.id, letter: e.letter, use: e.use ?? null, screen: e.screen, x: e.x, y: e.y });
    } else if (e.key === 'down') {
      
      const inCells = over && p.y < e.y + e.rise && p.y + p.h > e.y;
      const on = over && Math.abs(p.y - e.y) < 0.01 && p.grounded;
      e.idleT = on || inCells ? 0 : e.idleT + STEP;
      if (e.idleT >= POP_BACK && e.zapIn < 0) {
        e.key = 'up';
        setKey(w, e, true);
        ctx.events.push({ type: 'keyPop', id: e.id, x: e.x, y: e.y });
      }
    }
    if (e.zapIn >= 0) {
      e.zapIn -= STEP;
      if (e.zapIn < 0) {
        const s = ctx.session;
        s.zaps ??= {};
        for (const o of keyTargets(e, s.entities)) {
          const k = e.use ?? e.id;
          s.zaps[k] = (s.zaps[k] ?? 0) + 1;
          defeat(o, ctx, 'zap');
          ctx.events.push({
            type: 'cursorLaser',
            id: e.id,
            from: 'screen',
            screen: e.screen,
            target: o.id,
            to: { x: o.x, y: o.y + o.h / 2 },
            use: e.use ?? null,
            n: s.zaps[k],
          });
        }
      }
    }
  },
});
