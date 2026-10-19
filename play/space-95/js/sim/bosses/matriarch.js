























import { contact, hurtPlayer, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { overlaps } from '../entities.js';
import { stopFan } from '../fan.js';
import { registerBossType } from './boss.js';

export const MATRIARCH = Object.freeze({
  W: 3.5,
  H: 3,
  BALL: 2.0, 
  SCUTTLE: 10, 
  ROLL: 10, 
  BIG_ROLL: 12, 
  CHARGE: 14, 
  BAT_UP: 5, 
  BAT_TIME: 0.8, 
  BAT_BACK: 2.5, 
  WINDOW_P1: 3.0,
  WINDOW_P2: 2.5,
  WINDOW_P3: 4.0,
  SKID: 0.8,
  BREATH: 1.0, 
  WIRE: 1.0, 
  BONK_GRACE: 0.3,
  RING_W: 1.4,
  RING_H: 1.2,
  HELP_DEATHS: 3,
  HELP_EXTRA: 1.0,
});
const ORDER = ['A', 'C', 'B'];
const PINK_LINE = ['visual:pink-line', 'audio:dust-scrape'];

function entered(e, stage) {
  const key = `${e.phase}:${e.attackIdx}:${stage}`;
  if (e.fKey === key) return false;
  e.fKey = key;
  return true;
}

const window_ = (e, base) => base + (e.deathsHere >= MATRIARCH.HELP_DEATHS ? MATRIARCH.HELP_EXTRA : 0);


function seatPlugs(e, s) {
  for (const [k, c] of Object.entries(e.cables)) {
    const h = s.hooks?.find((x) => x.id === c.plug);
    if (!h) continue;
    h.off = k === 'MAIN' ? e.phase !== 2 : false;
    h.offT = 0;
  }
}

function setBody(e, ball) {
  const s = ball ? MATRIARCH.BALL : null;
  e.w = s ?? MATRIARCH.W;
  e.h = s ?? MATRIARCH.H;
  e.ball = !!ball;
}


function roll(e, dir, speed) {
  e.x += dir * speed * STEP;
  const half = e.w / 2;
  if (dir < 0 && e.x - half <= e.fan.x1 && e.x > e.fan.x0) return 'fan';
  if (dir > 0 && e.x + half >= e.arena.x1 - 1e-6) return 'wall';
  if (dir < 0 && e.x - half <= e.arena.x0 + 1e-6) return 'wall';
  return null;
}

registerBossType('matriarch', {
  create(e) {
    e.facing = -1;
    e.mood = 'clipboard';
    e.floor = e.floor ?? e.y;
    e.plugN = 0;
    e.introKeyM = null;
    e.introPhase = -1;
    e.deathsHere = 0;
    e.surged = null;
    e.surgeCircuit = null;
    setBody(e, false);
  },
  attack(e, ctx, _stale, stage) {
    const s = ctx.session;
    const p = ctx.player;
    const ph = e.phases[e.phase];
    const atk = ph.attacks[e.attackIdx % ph.attacks.length];
    const enter = entered(e, stage);
    if (e.bonkT > 0) e.bonkT -= STEP;
    const weak = stage === 'recover' && e.weakNow === true;
    
    if (e.surged && !weak) {
      const main = e.phase === 2;
      e.surged = null;
      e.surgeCircuit = null;
      setBody(e, false);
      e.y = e.floor;
      e.interrupt = { recoverFor: window_(e, main ? MATRIARCH.WINDOW_P3 : MATRIARCH.WINDOW_P1), weakNow: true };
      e.mood = 'frizzed';
      e.harmless = true;
      if (main) {
        s.lightsOut = true;
        stopFan(s, null);
        ctx.events.push({ type: 'lightsOut', id: e.id, x: e.x, y: e.y, signals: ['visual:power-down-wave', 'audio:power-down'] });
      }
      ctx.events.push({
        type: 'frizzed',
        id: e.id,
        x: e.x,
        y: e.y,
        seconds: e.interrupt.recoverFor,
        signals: ['visual:gold-stars', 'audio:ding-ding'],
      });
      return;
    }
    if (weak) {
      e.harmless = true;
      return; 
    }
    e.harmless = e.afterHit || e.bonkT > 0;
    if (stage === 'telegraph' && enter) e.afterHit = false;
    if (e.phase === 2) e.surgeCircuit = e.cables.MAIN.circuit; 
    switch (atk.name) {
      case 'plugIn': {
        if (stage === 'telegraph' && enter) {
          
          const order = ph.order ?? ORDER;
          e.cable = order[e.plugN % order.length];
          e.plugN += 1;
        }
        const cable = e.cables[e.cable];
        if (stage === 'telegraph') {
          if (enter) {
            e.mood = 'scuttle';
            ctx.events.push({
              type: 'plugTele',
              id: e.id,
              cable: e.cable,
              x: cable.x,
              seconds: atk.telegraph,
              signals: ['visual:amber-glow', 'audio:tab-hum'],
            });
          }
          const d = cable.x - e.x;
          e.x += Math.sign(d) * Math.min(Math.abs(d), MATRIARCH.SCUTTLE * STEP);
        }
        if (stage === 'active') {
          if (enter) {
            e.x = cable.x;
            e.surgeCircuit = cable.circuit;
            e.mood = 'plugged';
            ctx.events.push({ type: 'plugIn', id: e.id, cable: e.cable, x: cable.x, plug: cable.plug });
          }
          e.harmless = true; 
        }
        if (stage === 'recover' && enter) {
          e.surgeCircuit = null;
          e.recoverFor = atk.recover;
          e.weakNow = false;
          e.mood = 'unplug';
        }
        break;
      }
      case 'dustRoll':
      case 'bigRoll': {
        const big = atk.name === 'bigRoll';
        if (stage === 'telegraph') {
          if (enter) {
            setBody(e, false);
            e.mood = 'tuck';
            const target = big && !e.decoyDone ? e.bolt.x : p.x;
            if (big && !e.decoyDone) {
              e.decoyDone = true;
              ctx.events.push({ type: 'boltDecoy', id: e.id, x: e.bolt.x, y: e.bolt.y, line: "Over here, Ma'am!" });
            }
            e.rollDir = Math.sign(target - e.x) || -1;
            e.lock = target;
            e.bounced = false;
            ctx.events.push({
              type: big ? 'bigRollLine' : 'rollLine',
              id: e.id,
              x0: Math.min(e.x, target),
              x1: Math.max(e.x, target),
              y: e.floor,
              seconds: atk.telegraph,
              signals: PINK_LINE,
            });
          }
          if (!big) {
            const d = e.nest - e.x; 
            e.x += Math.sign(d) * Math.min(Math.abs(d), MATRIARCH.SCUTTLE * STEP);
          }
        }
        if (stage === 'active') {
          if (enter) {
            setBody(e, true);
            e.mood = 'roll';
            e.bat = null;
          }
          if (e.bat) {
            
            e.harmless = true;
            e.bat.t += STEP;
            const u = Math.min(1, e.bat.t / MATRIARCH.BAT_TIME);
            e.x = e.bat.x0 + (e.bat.x1 - e.bat.x0) * u;
            e.y = e.floor + MATRIARCH.BAT_UP * 4 * u * (1 - u);
            if (u >= 1) {
              e.y = e.floor;
              setBody(e, false);
              e.mood = 'dizzy';
              e.interrupt = { recoverFor: window_(e, MATRIARCH.WINDOW_P2), weakNow: true };
              ctx.events.push({
                type: 'dizzy',
                id: e.id,
                x: e.x,
                y: e.y,
                seconds: e.interrupt.recoverFor,
                signals: ['visual:gold-stars', 'audio:ding-ding'],
              });
            }
            break;
          }
          const hit = roll(e, e.rollDir, big ? MATRIARCH.BIG_ROLL : MATRIARCH.ROLL);
          if (big && hit === 'fan') {
            e.bat = { t: 0, x0: e.x, x1: e.fan.x1 + MATRIARCH.BAT_BACK };
            ctx.events.push({ type: 'fanBat', id: 'FB', who: e.id, x: e.x, y: e.y, signals: ['visual:blade-thwap', 'audio:thwap'] });
          } else if (big && hit === 'wall') {
            setBody(e, false);
            e.mood = 'skid';
            e.interrupt = { recoverFor: MATRIARCH.SKID, weakNow: false };
            ctx.events.push({ type: 'bossSkid', id: e.id, x: e.x, y: e.y });
          } else if (!big && hit) {
            
            if (!e.bounced) {
              e.bounced = true;
              e.rollDir = -e.rollDir;
              ctx.events.push({ type: 'rollBounce', id: e.id, x: e.x, y: e.y, off: hit });
            }
          }
          if (!big && e.bounced && Math.sign(e.nest - e.x) !== e.rollDir) {
            e.x = e.nest;
            e.endActive = true;
          }
        }
        if (stage === 'recover' && enter && e.recoverFor === undefined) {
          setBody(e, false);
          e.y = e.floor;
          e.recoverFor = atk.recover;
          e.weakNow = false;
          e.mood = 'puff';
        }
        if (stage === 'recover' && e.recoverFor !== undefined && e.weakNow === false) {
          const d = e.nest - e.x; 
          e.x += Math.sign(d) * Math.min(Math.abs(d), MATRIARCH.SCUTTLE * 0.5 * STEP);
        }
        break;
      }
      case 'bunnyToss': {
        if (stage === 'telegraph' && enter) {
          e.mood = 'toss';
          e.ring = { x: p.x, y: surfaceBelow(ctx.world, p.x, p.y + 0.01) };
          ctx.events.push({
            type: 'bunnyRing',
            id: e.id,
            x: e.ring.x,
            y: e.ring.y,
            seconds: atk.telegraph + atk.active,
            signals: ['visual:pink-ring', 'audio:whoosh'],
          });
        }
        if (stage === 'recover' && enter) {
          const r = e.ring;
          ctx.events.push({ type: 'bunnyLand', id: e.id, x: r.x, y: r.y });
          if (overlaps(p, { x: r.x, y: r.y, w: MATRIARCH.RING_W, h: MATRIARCH.RING_H })) hurtPlayer(s, r.x);
          e.recoverFor = atk.recover;
          e.weakNow = false;
        }
        break;
      }
      case 'fullPower': {
        if (stage === 'telegraph' && enter) {
          if (!e.wired) {
            e.wired = true;
            e.teleFor = MATRIARCH.WIRE + atk.telegraph; 
            e.wireT = 0;
            e.mood = 'wiring';
          }
          e.chargeDir = e.chargeDir ? -e.chargeDir : Math.sign(p.x - e.x) || 1;
          ctx.events.push({
            type: 'fullPowerLine',
            id: e.id,
            x0: e.arena.x0,
            x1: e.arena.x1,
            y: e.floor,
            seconds: atk.telegraph,
            delay: e.wireT === 0 ? MATRIARCH.WIRE : 0,
            signals: ['visual:pink-line', 'audio:rising-whine'],
          });
        }
        if (stage === 'telegraph' && e.wireT !== undefined && e.wireT < MATRIARCH.WIRE) {
          e.wireT += STEP;
          e.harmless = true;
        }
        if (stage === 'active') {
          e.mood = 'charge';
          if (roll(e, e.chargeDir, MATRIARCH.CHARGE) === 'wall') e.endActive = true;
          
          if (e.chargeDir < 0 && e.x - e.w / 2 <= e.psu + 1e-6) {
            e.x = e.psu + e.w / 2;
            e.endActive = true;
          }
        }
        if (stage === 'recover' && enter && e.recoverFor === undefined) {
          e.recoverFor = atk.recover;
          e.weakNow = false;
          e.mood = 'pant';
        }
        break;
      }
    }
  },
  hit(e, ctx) {
    const s = ctx.session;
    const p = ctx.player;
    if (e.stage === 'intro') {
      e.harmless = true;
      if (e.introKeyM !== `${e.phase}:${s.deaths}`) {
        e.introKeyM = `${e.phase}:${s.deaths}`;
        if (e.introPhase === e.phase) e.deathsHere += 1;
        else {
          e.introPhase = e.phase;
          e.deathsHere = 0;
        }
        e.fKey = null;
        e.afterHit = false;
        e.bonkT = 0;
        e.surged = null;
        e.surgeCircuit = null;
        e.decoyDone = false;
        e.wired = false;
        e.wireT = undefined;
        e.chargeDir = 0;
        e.bat = null;
        e.from = { x: e.x };
        setBody(e, false);
        e.y = e.floor;
        if (e.phase === 0) e.plugN = 0;
        seatPlugs(e, s);
        s.lightsOut = false;
        e.mood = ['intro', 'shake', 'fullPower'][e.phase];
      }
      
      const d = e.nest - e.x;
      e.x += Math.sign(d) * Math.min(Math.abs(d), MATRIARCH.SCUTTLE * 0.5 * STEP);
      if (e.phase === 2) e.surgeCircuit = e.cables.MAIN.circuit; 
      return null;
    }
    const weak = e.stage === 'recover' && e.weakNow === true && !(e.immune > 0);
    const c = contact(p, e);
    const pound = p.ab?.pound === 'fall' && overlaps(p, e);
    if (weak && (c === 'stomp' || pound)) {
      stompBounce(p);
      if (p.ab) p.ab.pound = null;
      e.mood = 'ouch';
      e.recoverFor = MATRIARCH.BREATH;
      e.weakNow = false;
      e.harmless = true;
      e.afterHit = true;
      return 'stomp';
    }
    if (!weak && !e.afterHit && c === 'stomp') {
      
      stompBounce(p);
      e.bonkT = MATRIARCH.BONK_GRACE;
      e.harmless = true;
      ctx.events.push({ type: 'hatBonk', id: e.id, x: p.x, y: p.y });
      return 'deflect';
    }
    return null;
  },
});


function surfaceBelow(world, x, y) {
  const T = world.tile;
  const c = Math.floor(x / T);
  for (let r = Math.round(y / T) - 1; r >= 0; r--) if (world.solid(c, r) || world.oneWay(c, r)) return (r + 1) * T;
  return y;
}
