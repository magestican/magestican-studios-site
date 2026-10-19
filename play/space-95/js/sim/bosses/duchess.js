



















import { sweepX, sweepY } from '../body.js';
import { contact, hurtPlayer, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { overlaps, registerKind, spawnEntities } from '../entities.js';
import { honeyAt, honeyStuckEvent } from '../honey.js';
import { registerBossType } from './boss.js';

const CHARGE_SPEED = 11; 
const SWOOP_SPEED = 16; 
const DIVE_SPEED = 20; 
const FLY_SPEED = 14; 
const HOP_TIME = 0.6; 
const HOP_APEX = 3; 
const STUCK_P1 = 3.0; 
const STUNNED = 2.5; 
const STUCK_SWOOP = 3.0; 
const SKID = 0.8; 
const STUCK_CROWN = 4.0; 
const RISE = 1.0; 
const BREATH = 1.0; 
const SINK_WAIST = 0.5; 
const SINK_CROWN = 1.5; 
const HOVER_ABOVE = 2.5; 
const PUFF_FLIGHT = 0.6; 
const PUFF_APEX = 3; 
const DOUBLE_GAP = 0.4; 
const ESCAPE_POP = 0.5; 
const ESCAPE_SPEED = 12; 

const MOVES = new Set(['hornCharge', 'royalSwoop', 'royalDive']);
const LINE_SIGNALS = ['visual:pink-line', 'audio:wing-buzz'];
const RING_SIGNALS = ['visual:pink-ring', 'audio:wing-roar'];


registerKind('glitterPuff', {
  create(e) {
    e.w = 0.7;
    e.h = 0.7;
  },
  step(e, ctx) {
    const u = Math.min(1, e.t / e.flight);
    e.x = e.x0 + (e.tx - e.x0) * u;
    e.y = e.y0 + (e.ty - e.y0) * u + PUFF_APEX * 4 * u * (1 - u);
    if (overlaps(e, ctx.player)) {
      hurtPlayer(ctx.session, e.x);
      e.alive = false;
      ctx.events.push({ type: 'glitterSplat', id: e.id, x: e.x, y: e.y, hit: true });
    } else if (u >= 1) {
      e.alive = false;
      ctx.events.push({ type: 'glitterSplat', id: e.id, x: e.x, y: e.y, hit: false });
    }
  },
});

const floorY = (e) => e.arena.y0;
const vatMid = (e) => (e.vat.x0 + e.vat.x1) / 2;
const dais = (e) => ({ x: e.dais.x, y: e.dais.y + HOVER_ABOVE });
const hole = (e) => ({ x: e.hole.x, y: e.arena.y1 - e.h });


function entered(e, stage) {
  const key = `${e.phase}:${e.attackIdx}:${stage}`;
  if (e.fKey === key) return false;
  e.fKey = key;
  return true;
}


function flyTo(e, pt) {
  const dx = pt.x - e.x;
  const dy = pt.y - e.y;
  const d = Math.hypot(dx, dy);
  const v = FLY_SPEED * STEP;
  if (d <= v) {
    e.x = pt.x;
    e.y = pt.y;
    return true;
  }
  e.x += (dx / d) * v;
  e.y += (dy / d) * v;
  return false;
}

function throwPuff(e, ctx, target) {
  e.puffN = (e.puffN ?? 0) + 1;
  const def = {
    id: `${e.id}-puff-${e.puffN}`,
    kind: 'glitterPuff',
    x: e.x,
    y: e.y + e.h,
    x0: e.x,
    y0: e.y + e.h,
    tx: target.x,
    ty: target.y,
    flight: PUFF_FLIGHT,
  };
  ctx.session.entities.push(...spawnEntities([def]));
  ctx.events.push({ type: 'glitterToss', id: e.id, x: target.x, y: target.y });
}

const markJo = (e, ctx) => {
  const m = { x: ctx.player.x, y: ctx.player.y };
  ctx.events.push({ type: 'glitterMarker', id: e.id, x: m.x, y: m.y });
  return m;
};


function breath(e, secs, weak) {
  e.recoverFor = secs;
  e.weakNow = weak;
  e.vx = 0;
  e.vy = 0;
}


function window(e, secs, weak) {
  e.endActive = true;
  breath(e, secs, weak);
}

registerBossType('duchess', {
  create(e) {
    e.facing = -1;
    e.mood = 'lounge';
    e.flies = true;
    e.dais ??= { x: e.x, y: e.y };
    e.hole ??= { x: e.x };
  },
  attack(e, ctx, _staleAtk, stage) {
    const ph = e.phases[e.phase];
    const atk = ph.attacks[e.attackIdx % ph.attacks.length];
    const p = ctx.player;
    const w = ctx.world;
    const enter = entered(e, stage);
    const first = e.attackIdx === 0; 
    const y0 = floorY(e);
    e.harmless = stage !== 'active' || !MOVES.has(atk.name);
    switch (atk.name) {
      case 'hornCharge': {
        if (stage === 'telegraph' && enter) {
          const L = e.arena.x0 + e.w / 2 + 0.5;
          const R = e.arena.x1 - e.w / 2 - 0.5;
          const far = Math.abs(p.x - L) > Math.abs(p.x - R) ? L : R;
          e.from = { x: e.x, y: e.y };
          e.to = { x: far, y: y0 };
          e.dir = first ? Math.sign(vatMid(e) - far) : Math.sign(p.x - far) || Math.sign(vatMid(e) - far);
          e.facing = e.dir;
          e.mood = 'hopDown';
        }
        if (stage === 'telegraph') {
          const u = Math.min(1, e.t / HOP_TIME);
          e.x = e.from.x + (e.to.x - e.from.x) * u;
          e.y = e.from.y + (e.to.y - e.from.y) * u + HOP_APEX * 4 * u * (1 - u);
          if (u >= 1) e.mood = 'scrape';
        }
        if (stage === 'active') {
          e.mood = 'charge';
          const mx = sweepX(w, e, e.dir * CHARGE_SPEED * STEP);
          e.x = mx.x;
          e.y = y0;
          const h = honeyAt(w, e.x, e.y);
          if (h) {
            window(e, STUCK_P1, true);
            e.y = h.y - SINK_WAIST;
            e.mood = 'stuck';
            ctx.events.push({ ...honeyStuckEvent(e, h), use: ph.use ?? h.use ?? null });
          } else if (mx.hit) {
            window(e, STUNNED, true);
            e.mood = 'stunned';
            ctx.events.push({ type: 'bossStunned', id: e.id, x: e.x, side: e.dir });
          }
        }
        if (stage === 'recover' && enter && e.recoverFor === undefined) breath(e, SKID, false); 
        break;
      }
      case 'glitterFan':
      case 'glitterFanDouble': {
        if (stage === 'telegraph' && enter) {
          e.marks = [markJo(e, ctx)];
          e.thrown = 0;
          e.mood = 'fan';
        }
        
        if (stage === 'telegraph' || stage === 'active') {
          if (e.phase === 0) e.y = y0;
          else flyTo(e, dais(e));
        }
        if (stage === 'active') {
          if (e.thrown === 0) {
            throwPuff(e, ctx, e.marks[0]);
            e.thrown = 1;
            if (atk.name === 'glitterFanDouble') e.marks.push(markJo(e, ctx));
          } else if (e.thrown === 1 && e.marks.length > 1 && e.t >= DOUBLE_GAP) {
            throwPuff(e, ctx, e.marks[1]);
            e.thrown = 2;
          }
        }
        if (stage === 'recover' && enter) breath(e, atk.recover, false);
        if (stage === 'recover' && e.phase > 0) flyTo(e, dais(e));
        break;
      }
      case 'royalSwoop': {
        if (stage === 'telegraph' && enter) {
          const c = { x: p.x, y: p.y + p.h / 2 };
          e.lock = first && e.bolt ? { ...e.bolt } : c;
          e.mood = 'rear';
          ctx.events.push({
            type: 'swoopLine',
            id: e.id,
            x: e.x,
            y: e.y + e.h / 2,
            tx: e.lock.x,
            ty: e.lock.y,
            atBolt: first && !!e.bolt,
            signals: LINE_SIGNALS,
          });
        }
        if (stage === 'telegraph') flyTo(e, dais(e));
        if (stage === 'active' && enter) {
          const dx = e.lock.x - e.x;
          const dy = e.lock.y - (e.y + e.h / 2);
          const d = Math.hypot(dx, dy) || 1;
          e.vx = (dx / d) * SWOOP_SPEED;
          e.vy = (dy / d) * SWOOP_SPEED;
          e.facing = Math.sign(dx) || e.facing;
          e.mood = 'swoop';
        }
        if (stage === 'active' && !e.endActive) {
          const y1 = e.y;
          const mx = sweepX(w, e, e.vx * STEP);
          e.x = mx.x;
          const my = sweepY(w, e, e.vy * STEP, true); 
          const h = w.honey?.find((v) => e.x >= v.x0 && e.x < v.x1 && y1 >= v.y - 1e-9 && my.y <= v.y + 1e-9);
          if (h && e.vy < 0) {
            window(e, STUCK_SWOOP, true);
            e.y = h.y - SINK_WAIST;
            e.mood = 'stuck';
            ctx.events.push({ ...honeyStuckEvent(e, h), use: ph.use ?? h.use ?? null });
          } else if (mx.hit) {
            window(e, STUNNED, true);
            e.y = sweepY(w, e, -60).y; 
            e.mood = 'stunned';
            ctx.events.push({ type: 'bossStunned', id: e.id, x: e.x, y: e.y, side: Math.sign(e.vx) });
          } else if (my.hit) {
            window(e, SKID, false);
            e.y = my.y;
            e.mood = 'skid';
            ctx.events.push({ type: 'bossSkid', id: e.id, x: e.x, y: e.y });
          } else e.y = my.y;
        }
        if (stage === 'recover' && enter && e.recoverFor === undefined) breath(e, SKID, false); 
        break;
      }
      case 'royalDive': {
        if (stage === 'telegraph' && enter) {
          e.mood = 'hover';
          const mid = vatMid(e);
          ctx.events.push({ type: 'diveRing', id: e.id, x: mid, x0: mid - e.w / 2, x1: mid + e.w / 2, y: e.vat.y, signals: RING_SIGNALS });
        }
        if (stage === 'telegraph') flyTo(e, { x: vatMid(e), y: hole(e).y });
        if (stage === 'active' && !e.endActive) {
          e.mood = 'dive';
          e.x = vatMid(e);
          const y1 = e.y;
          e.y -= DIVE_SPEED * STEP;
          const h = w.honey?.find((v) => e.x >= v.x0 && e.x < v.x1 && y1 >= v.y - 1e-9 && e.y <= v.y + 1e-9);
          if (h) {
            window(e, STUCK_CROWN + RISE, true);
            e.y = h.y - SINK_CROWN;
            e.mood = 'stuckCrown';
            ctx.events.push({ ...honeyStuckEvent(e, h), use: ph.use ?? h.use ?? null });
          }
        }
        if (stage === 'recover' && enter && e.recoverFor === undefined) breath(e, RISE, false);
        if (stage === 'recover' && e.weakNow && e.t >= STUCK_CROWN - 1e-9) {
          e.weakNow = false; 
          e.mood = 'rise';
          ctx.events.push({ type: 'bossFree', id: e.id, x: e.x, y: e.y });
        }
        if (stage === 'recover' && e.weakNow === false) flyTo(e, hole(e));
        break;
      }
    }
  },
  hit(e, ctx) {
    const s = ctx.session;
    const p = ctx.player;
    if (e.stage === 'intro') {
      
      e.harmless = true;
      e.fKey = null;
      e.vx = 0;
      e.vy = 0;
      e.mood = e.phase === 0 ? 'lounge' : 'fly';
      flyTo(e, e.phase === 0 ? e.dais : e.phase === 1 ? dais(e) : hole(e));
    }
    
    if (!e.phaseHurt && s.hearts < e.phaseHearts) {
      e.phaseHurt = true;
      if (e.phases[e.phase].deed) ctx.events.push({ type: 'deedLost', id: e.id });
    }
    const c = contact(p, e);
    const pound = p.ab?.pound === 'fall' && overlaps(p, e) && p.y >= e.y + e.h * 0.45;
    if (!c && !pound) return null;
    const weak = e.stage === 'recover' && e.weakNow === true && !(e.immune > 0);
    if (weak && (c === 'stomp' || pound)) {
      stompBounce(p);
      if (p.ab) p.ab.pound = null;
      e.mood = 'ouch';
      
      e.recoverFor = BREATH;
      e.weakNow = false;
      e.harmless = true;
      e.y = Math.max(e.y, floorY(e));
      return 'stomp';
    }
    if (c === 'stomp' && !weak) {
      stompBounce(p); 
      ctx.events.push({ type: 'hornBonk', id: e.id });
      return 'deflect';
    }
    return null; 
  },
  escape(e, ctx) {
    
    e.harmless = true;
    if (e.t < ESCAPE_POP) {
      e.y = Math.max(e.y, floorY(e));
      e.mood = 'popFree';
      return;
    }
    e.mood = 'escape';
    const target = { x: e.hole.x, y: e.arena.y1 + 6 };
    const dx = target.x - e.x;
    const dy = target.y - e.y;
    const d = Math.hypot(dx, dy);
    const v = ESCAPE_SPEED * STEP;
    if (d <= v) {
      e.alive = false;
      ctx.events.push({ type: 'bossGone', id: e.id, x: e.x, y: e.y });
      return;
    }
    e.x += (dx / d) * v;
    e.y += (dy / d) * v;
  },
});
