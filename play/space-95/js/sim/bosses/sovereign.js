
























import { contact, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { registerBossType, weakTo } from './boss.js';

const CHARGE = 11; 
const SWOOP = 14; 
const REACH = 2.5; 
const SINK = 6; 
const COLLAPSE_RECENT = 0.05; 
const SOVEREIGN = Object.freeze({ FALLBACK: 12, WINDOW: 2.5 });

registerBossType('sovereign', {
  create(e) {
    const ph = e.phases[e.phase]; 
    if (ph.arena) e.arena = ph.arena;
    if (ph.post) {
      e.x = ph.post.x;
      e.y = ph.post.y;
      e.introOf = e.phase; 
    }
    if (ph.crown) e.crowned = true; 
    e.post = { x: e.x, y: e.y };
    e.sinceHit = 0;
  },
  intro(e, ctx, ph) {
    if (e.introOf !== e.phase) {
      e.introOf = e.phase;
      if (ph.arena) e.arena = ph.arena;
      if (ph.post) {
        e.from = { x: e.x, y: e.y };
        e.post = { x: ph.post.x, y: ph.post.y };
      }
      if (ph.crown && !e.crowned) {
        e.crowned = true;
        ctx.events.push({ type: 'crowning', id: e.id, x: e.x, y: e.y });
        ctx.events.push({ type: 'cellSnatch', id: e.id, x: e.x, y: e.y });
      }
    }
    if (ph.crown) e.harmless = true; 
    if (ph.post && e.from) {
      const k = Math.min(1, e.t / (ph.intro ?? 1.2));
      const ease = k * k * (3 - 2 * k);
      e.x = e.from.x + (e.post.x - e.from.x) * ease;
      e.y = e.from.y + (e.post.y - e.from.y) * ease;
    }
  },
  attack(e, ctx, atk, stage) {
    const p = ctx.player;
    e.harmless = atk.kind === 'hover' || stage === 'telegraph';
    
    e.sinceHit += STEP;
    if (e.sinceHit >= SOVEREIGN.FALLBACK && stage !== 'recover') {
      e.sinceHit = 0;
      e.interrupt = { recoverFor: SOVEREIGN.WINDOW, weakNow: true };
      ctx.events.push({ type: 'sovereignOpen', id: e.id, seconds: SOVEREIGN.WINDOW });
      return;
    }
    
    
    const ph = e.phases[e.phase];
    if (ph.windowY !== undefined && stage === 'recover' && e.weakNow === true) {
      e.y += (ph.windowY - e.y) * Math.min(1, SINK * STEP);
      e.lock = null; 
      return;
    }
    if (atk.kind === 'charge') {
      if (stage === 'telegraph') e.dir = p.x < e.x ? -1 : 1;
      if (stage === 'active') e.x += (e.dir ?? 1) * CHARGE * STEP;
    } else if (atk.kind === 'swoop') {
      if (stage === 'telegraph' && !e.lock) e.lock = { x: p.x, y: p.y };
      if (stage === 'active' && e.lock) {
        const dx = e.lock.x - e.x;
        const dy = e.lock.y - e.y;
        const d = Math.hypot(dx, dy);
        const step = SWOOP * STEP;
        if (d <= step) {
          e.x = e.lock.x;
          e.y = e.lock.y;
          e.endActive = true;
        } else {
          e.x += (dx / d) * step;
          e.y += (dy / d) * step;
        }
      }
      if (stage === 'recover') {
        e.lock = null;
        e.y += (e.post.y - e.y) * Math.min(1, 3 * STEP); 
      }
    }
  },
  hit(e, ctx) {
    const ph = e.phases[e.phase];
    if (e.stage === 'intro') {
      e.sinceHit = 0;
      e.lock = null;
      if (ph.crown) return null; 
    }
    const how = landing(e, ctx, ph);
    
    if (how && ph.crown && e.hp === 1 && weakTo(ph, how) && !(e.immune > 0))
      ctx.events.push({ type: 'cellDrop', id: e.id, x: e.x, y: e.y });
    return how;
  },
});


function landing(e, ctx, ph) {
  const cbs = ph.callbacks ?? [];
  
  
  
  const fruit = cbs.includes('fruitletCaught');
  e.catch = fruit ? { x0: e.x - e.w / 2, x1: e.x + e.w / 2, y0: e.y, y1: e.y + e.h } : null;
  const spiked = fruit && (e.caught ?? 0) > (e.caughtSeen ?? 0);
  e.caughtSeen = e.caught ?? 0;
  if (spiked) {
    e.sinceHit = 0;
    return 'callback';
  }
  
  
  const near = (ev) =>
    ev.boss === e.id ||
    ev.target === e.id ||
    ev.id === e.id ||
    (ev.x !== undefined && Math.hypot(ev.x - e.x, ev.y - (e.y + e.h / 2)) <= Math.max(REACH, (ev.radius ?? 0) + e.w / 2));
  const cb = ctx.events.find((ev) => cbs.includes(ev.type) && near(ev));
  if (cb) {
    e.sinceHit = 0;
    return 'callback';
  }
  
  
  
  const col = e.collapseAt;
  e.collapseAt = null;
  if (col && cbs.includes('collapseHit') && ctx.session.time - col.t <= COLLAPSE_RECENT + 1e-9) {
    ctx.events.push({ type: 'collapseHit', id: col.id, tag: col.tag, target: e.id, kind: 'boss', use: col.use ?? null, chain: col.chain });
    e.sinceHit = 0;
    return 'callback';
  }
  
  
  
  if (cbs.includes('heaveLaunch')) {
    const p = ctx.player;
    if (p.events.some((ev) => ev.type === 'heaveLaunch')) e.heaveRide = true;
    else if (p.grounded) e.heaveRide = false;
    if (e.heaveRide && contact(p, e) === 'stomp') {
      stompBounce(p);
      
      
      
      if (e.immune > 0) return null;
      e.heaveRide = false;
      e.sinceHit = 0;
      return 'callback';
    }
  }
  
  if (cbs.includes('flockBurst'))
    for (const r of ctx.session.flock?.bursts ?? []) {
      if ((e.ringsSeen ?? []).includes(r.id)) continue;
      if (Math.hypot(r.x - e.x, r.cy - (e.y + e.h / 2)) > r.r + e.w / 2) continue;
      e.ringsSeen = [...(e.ringsSeen ?? []), r.id];
      e.sinceHit = 0;
      return 'callback';
    }
  const weakWindow = e.stage === 'recover' && e.weakNow !== false;
  if (contact(ctx.player, e) === 'stomp') {
    stompBounce(ctx.player);
    if (weakWindow) {
      e.sinceHit = 0;
      return 'stomp';
    }
    ctx.events.push({ type: 'parry', id: e.id }); 
  }
  return null;
}
