









































import { contact, hurtPlayer, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { spawnEntities } from '../entities.js';
import { restoreTower } from '../motifs/collapse.js';
import { registerBossType, weakTo } from './boss.js';

const CHARGE = 11; 
const SWOOP = 14; 
const REACH = 2.5; 
const SINK = 6; 
const COLLAPSE_RECENT = 0.05; 
const SOVEREIGN = Object.freeze({ FALLBACK: 12, WINDOW: 2.5 });
const HOP = 20; 
const FAN_TELE = 0.8; 
const FAN_ACTIVE = 0.3; 
const FAN_R = 1.5; 
const SPIKE_BREATH = 0.3; 

registerBossType('sovereign', {
  retry(e, ctx) {
    
    if (e.phases[e.phase].post && !e.phases[e.phase].flee) e.from = { x: e.x, y: e.y };
    const props = e.phases[e.phase].props;
    if (!props) return;
    const s = ctx.session;
    const w = ctx.world;
    const T = w.tile;
    const p = ctx.player;
    const defs = (s.level.entities ?? []).filter((d) => (props.ids ?? []).includes(d.id));
    for (const fresh of spawnEntities(defs)) {
      const i = s.entities.findIndex((o) => o.id === fresh.id);
      if (i >= 0) s.entities[i] = fresh; 
    }
    for (const [x0, x1, y0, y1] of props.soil ?? [])
      for (let c = Math.round(x0 / T); c < Math.round(x1 / T); c++)
        for (let r = Math.round(y0 / T); r < Math.round(y1 / T); r++) {
          const jo = p.x + p.w / 2 > c * T && p.x - p.w / 2 < (c + 1) * T && p.y + p.h > r * T && p.y < (r + 1) * T;
          if (!jo) w.placeSoil(c, r);
        }
    for (const t of s.entities) if (t.kind === 'tower' && (props.towers ?? []).includes(t.tag)) restoreTower(t, w, p);
    ctx.events.push({ type: 'propsReset', id: e.id, phase: e.phase });
  },
  idle(e, ctx) {
    const ph = e.phases[e.phase];
    if (!ph.perches) return;
    const p = ctx.player;
    
    const lastPerch = e.perchIdx === ph.perches.length - 1;
    const flung = lastPerch && ctx.events.some((ev) => ev.type === 'fling' && ev.vx > 0 && ev.x < e.x);
    if (!e.landed && ph.land && (flung || p.x >= ph.land.at)) {
      e.landed = true; 
      e.perchAt = { x: ph.land.x, y: ph.land.y };
      e.fan = null;
      ctx.events.push({ type: 'sovereignKnocked', id: e.id, x: ph.land.x, y: ph.land.y, by: flung ? 'fling' : 'pass' });
    }
    if (!e.landed) {
      let i = -1;
      for (const [k, pc] of ph.perches.entries()) if (p.x >= pc.at) i = k;
      if (i >= 0 && i !== e.perchIdx) {
        e.perchIdx = i;
        e.perchAt = { x: ph.perches[i].x, y: ph.perches[i].y };
        e.fanDue = ph.perches[i].fan === true;
        ctx.events.push({ type: 'sovereignHop', id: e.id, perch: i, x: e.perchAt.x, y: e.perchAt.y });
      }
    }
    if (e.perchAt) {
      hopOn(e);
      if (e.fanDue && Math.abs(e.perchAt.x - e.x) < 1e-9) {
        e.fanDue = false; 
        e.fan = { x: p.x, y: p.y, t: 0 };
        ctx.events.push({ type: 'telegraph', id: e.id, attack: 'Glitter Fan', seconds: FAN_TELE, x: p.x, y: p.y });
      }
    }
    if (e.fan) {
      e.fan.t += STEP;
      const live = e.fan.t >= FAN_TELE;
      if (live && e.fan.t - STEP < FAN_TELE)
        ctx.events.push({ type: 'bossAttack', id: e.id, attack: 'Glitter Fan', x: e.fan.x, y: e.fan.y });
      if (live && Math.abs(p.x - e.fan.x) <= FAN_R && Math.abs(p.y - e.fan.y) <= FAN_R) hurtPlayer(ctx.session, e.fan.x);
      if (e.fan.t >= FAN_TELE + FAN_ACTIVE) e.fan = null;
    }
  },
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
    e.fallbackWindow = false;
  },
  intro(e, ctx, ph) {
    if (ph.perches && e.perchAt) hopOn(e); 
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
    if (ph.flee) {
      e.harmless = true; 
      if (e.fleeing || !e.from) {
        
        
        e.from = null;
        e.x = Math.max(e.x, ctx.player.x + ph.flee.lead);
        e.y = fleeY(e, ph.flee);
      }
    }
    if (ph.post && e.from) {
      const k = Math.min(1, e.t / (e.introFor ?? ph.intro ?? 1.2));
      const ease = k * k * (3 - 2 * k);
      e.x = e.from.x + (e.post.x - e.from.x) * ease;
      e.y = e.from.y + (e.post.y - e.from.y) * ease;
    }
  },
  attack(e, ctx, atk, stage) {
    const p = ctx.player;
    e.harmless = atk.kind === 'hover' || stage === 'telegraph';
    
    const ph = e.phases[e.phase];
    e.sinceHit += STEP;
    
    if (e.sinceHit >= SOVEREIGN.FALLBACK && stage !== 'recover' && !ph.flee) {
      e.sinceHit = 0;
      e.interrupt = { recoverFor: SOVEREIGN.WINDOW, weakNow: true };
      e.spikeWindow = false;
      e.fallbackWindow = true; 
      ctx.events.push({ type: 'sovereignOpen', id: e.id, seconds: SOVEREIGN.WINDOW });
      return;
    }
    if (ph.flee) {
      e.harmless = true;
      const f = ph.flee;
      const pl = ctx.session.plane;
      if (!e.fleeing && !(pl?.stage === 'fly' && pl.x >= f.at)) return; 
      if (!e.fleeing) ctx.events.push({ type: 'sovereignFlee', id: e.id, x: e.x, y: e.y });
      e.fleeing = true;
      e.x = Math.min(f.to.x, e.x + f.speed * STEP);
      e.y = fleeY(e, f);
      return;
    }
    
    
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
    
    
    
    
    if (how === 'stomp' && (e.spikeWindow || e.fallbackWindow) && e.hp > 1 && weakTo(ph, how) && !(e.immune > 0)) {
      
      
      e.weakNow = !!e.fallbackWindow;
      e.spikeWindow = false;
      e.fallbackWindow = false;
      e.recoverFor = SPIKE_BREATH;
    }
    
    if (how && ph.crown && e.hp === 1 && weakTo(ph, how) && !(e.immune > 0))
      ctx.events.push({ type: 'cellDrop', id: e.id, x: e.x, y: e.y });
    
    if (how && ph.outro && e.hp === 1 && weakTo(ph, how) && !(e.immune > 0)) {
      ctx.events.push({ type: 'crownPop', id: e.id, x: e.x, y: e.y + e.h / 2 });
      ctx.events.push({ type: 'clockOff', id: 'swarm', x: e.x, y: e.y });
      ctx.events.push({ type: 'sovereignOutro', id: e.id, to: 'bowl', x: e.x, y: e.y });
    }
    return how;
  },
});


function hopOn(e) {
  const d = e.perchAt.x - e.x;
  e.x += Math.sign(d) * Math.min(Math.abs(d), HOP * STEP);
  e.y = e.perchAt.y;
}


function fleeY(e, f) {
  const k = f.to.x > e.post.x ? Math.max(0, Math.min(1, (e.x - e.post.x) / (f.to.x - e.post.x))) : 1;
  return e.post.y + (f.to.y - e.post.y) * k;
}


function landing(e, ctx, ph) {
  const cbs = ph.callbacks ?? [];
  
  
  
  const fruit = cbs.includes('fruitletCaught');
  e.catch = fruit ? { x0: e.x - e.w / 2, x1: e.x + e.w / 2, y0: e.y, y1: e.y + e.h } : null;
  
  if (fruit && ph.spike && e.stage === 'active' && ph.attacks[e.attackIdx % ph.attacks.length].kind === 'charge') {
    const c = e.catch;
    const f = ctx.session.entities.find(
      (x) => x.kind === 'fruitlet' && x.alive && x.x + x.w / 2 >= c.x0 && x.x - x.w / 2 <= c.x1 && x.y <= c.y1 && x.y + x.h >= c.y0,
    );
    if (f) {
      f.alive = false;
      e.caught = (e.caught ?? 0) + 1;
      ctx.events.push({ type: 'fruitletCaught', id: f.id, by: e.id, x: f.x, y: f.y, charge: true });
    }
  }
  const spiked = fruit && (e.caught ?? 0) > (e.caughtSeen ?? 0);
  e.caughtSeen = e.caught ?? 0;
  if (spiked && ph.spike) {
    
    e.sinceHit = 0;
    e.interrupt = { recoverFor: ph.spike, weakNow: true };
    e.spikeWindow = true;
    ctx.events.push({ type: 'sovereignSpiked', id: e.id, seconds: ph.spike, x: e.x, y: e.y });
    return null;
  }
  if (spiked) {
    e.sinceHit = 0;
    return 'callback';
  }
  
  
  const near = (ev) =>
    ev.boss === e.id ||
    ev.target === e.id ||
    ev.id === e.id ||
    (ev.x !== undefined && Math.hypot(ev.x - e.x, ev.y - (e.y + e.h / 2)) <= Math.max(REACH, (ev.radius ?? 0) + e.w / 2));
  
  if (cbs.includes('turret') && e.turretAt !== undefined) {
    e.turretAt = undefined;
    e.sinceHit = 0;
    return 'callback';
  }
  if (ph.flee) return null; 
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
