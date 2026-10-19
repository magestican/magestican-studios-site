



























import { contact, hurtPlayer, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { overlaps, spawnEntities } from '../entities.js';
import { DROP_TIME } from '../kickables.js';
import { dropTwig } from '../twig.js';
import { registerBossType } from './boss.js';

const WINDOW = [3.0, 3.0, 4.0]; 
const HELP_DEATHS = 3; 
const HELP_EXTRA = 1.0; 
const BREATH = 1.0; 
const TEACH = 4.0; 
const CUT_TIME = 1.0; 
const LUNGE = 3; 
const STEP_BACK = 4; 
const SWEEP_REACH = 8; 
const FIRST_SWEEP = { telegraph: 1.2, reach: 5 };
const STRIKE_NEAR = 6; 
const PARRY_GRACE = 0.3; 
const FRUIT_CAP = 3; 
const MOVE_TIME = 1.2; 
const DAMAGING = new Set(['shearSweep', 'shearStrike', 'twigFling', 'scissorSweep']);
const LINE_SIGNALS = ['visual:pink-line', 'audio:whetstone-shing'];
const ARC_SIGNALS = ['visual:pink-arc', 'audio:rising-whine'];
const DROP_SIGNALS = ['visual:green-shadow', 'audio:snip'];
const CUT_SIGNALS = ['visual:pink-line', 'audio:whetstone-shing'];



const geo = (e) => e.geo;

function defaultGeo(e) {
  const o = e.arena.x0 - 227;
  const floor = e.arena.y0 + 0.5; 
  return {
    floor,
    gap: { x0: o + 238, x1: o + 246 }, 
    sag: e.sagId ?? null, 
    hang: { x: o + 242, y: floor + 3 },
    sit: { x: o + 242 },
    windfall: [o + 231, o + 234, o + 251],
    ...(e.geo ?? {}),
  };
}


function entered(e, stage) {
  const key = `${e.phase}:${e.attackIdx}:${stage}`;
  if (e.fKey === key) return false;
  e.fKey = key;
  return true;
}


function stance(e, ctx) {
  const g = geo(e);
  if (e.phase === 0) return { x: e.home.x, y: g.floor };
  if (e.phase === 1) return { x: g.hang.x, y: g.hang.y };
  const f = ctx.world.floorAt?.({ x: g.sit.x, y: g.floor, w: 0.02, h: 1 });
  return { x: g.sit.x, y: f ? f.y : g.floor };
}


function catchBox(e) {
  const g = geo(e);
  if (e.phase === 0) return { x0: e.x - 4.5, x1: e.x - 1.5, y0: g.floor, y1: g.floor + 2.5 };
  if (e.phase === 1) return { x0: g.gap.x0 + 1, x1: g.gap.x1 - 1, y0: g.floor - 0.5, y1: g.floor + 3 };
  return { x0: e.x - 3, x1: e.x + 3, y0: e.y, y1: e.y + 2.5 };
}


function headBox(e) {
  const g = geo(e);
  if (e.phase === 0) return { x: e.x - 3, y: g.floor, w: 3, h: 2.5 };
  if (e.phase === 1) return { x: g.hang.x, y: g.floor + 0.5, w: 3, h: 2 };
  return { x: e.x, y: e.y + 0.5, w: 3, h: 2 };
}


function surfaceBelow(world, x, y) {
  const T = world.tile;
  const c = Math.floor(x / T);
  for (let r = Math.round(y / T) - 1; r >= 0; r--) if (world.solid(c, r) || world.oneWay(c, r)) return (r + 1) * T;
  return y;
}

const myFruit = (e, ctx) => ctx.session.entities.filter((f) => f.alive && f.kind === 'fruitlet' && f.by === e.id);


function dropFruit(e, ctx, spots) {
  const alive = myFruit(e, ctx);
  for (let i = 0; i < alive.length + spots.length - FRUIT_CAP; i++) {
    alive[i].alive = false;
    ctx.events.push({ type: 'fruitletPuff', id: alive[i].id, x: alive[i].x, y: alive[i].y });
  }
  for (const s of spots) {
    e.fruitN = (e.fruitN ?? 0) + 1;
    const def = { id: `${e.id}-fruitlet-${e.fruitN}`, kind: 'fruitlet', x: s.x, y: s.y, drop: true, by: e.id };
    ctx.session.entities.push(...spawnEntities([def]));
    ctx.events.push({ type: 'fruitletDrop', id: def.id, x: s.x, y: s.y, t: DROP_TIME, signals: DROP_SIGNALS, use: e.phases[e.phase].use });
  }
}


function snipSpot(e, ctx) {
  const p = ctx.player;
  const g = geo(e);
  let x;
  if (e.phase === 0) {
    const front = e.x - e.w / 2;
    x = p.x + 1.5;
    if (x > front - 5) x = front - 7;
    x = Math.max(e.arena.x0 + 0.5, x);
  } else {
    const left = p.x < (g.gap.x0 + g.gap.x1) / 2;
    if (left) {
      x = p.x + 1.5;
      if (x > g.gap.x0 - 2) x = g.gap.x0 - 3;
      x = Math.max(e.arena.x0 + 0.5, x);
    } else {
      x = p.x - 1.5;
      if (x < g.gap.x1 + 2) x = g.gap.x1 + 3;
      x = Math.min(e.arena.x1 - 0.5, x);
    }
  }
  return { x, y: surfaceBelow(ctx.world, x, g.floor + 4) };
}


function nearEdge(e, p) {
  const g = geo(e);
  if (Math.abs(p.y - g.floor) > 0.5) return false;
  return (p.x >= g.gap.x0 - STRIKE_NEAR && p.x <= g.gap.x0) || (p.x >= g.gap.x1 && p.x <= g.gap.x1 + STRIKE_NEAR);
}

function breath(e, secs, weak) {
  e.recoverFor = secs;
  e.weakNow = weak;
}

const boxHit = (p, b) => overlaps(p, { x: (b.x0 + b.x1) / 2, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 });

registerBossType('mantis', {
  create(e) {
    e.facing = -1;
    e.mood = 'tidy';
    e.home = { x: e.x, y: e.y };
    e.geo = defaultGeo(e);
    e.shape = e.phase; 
    e.caught = 0;
    e.caughtSeen = 0;
    e.introPhase = -1;
    e.deathsHere = 0;
  },
  attack(e, ctx, _staleAtk, stage) {
    const ph = e.phases[e.phase];
    const atk = ph.attacks[e.attackIdx % ph.attacks.length];
    const p = ctx.player;
    const g = geo(e);
    const enter = entered(e, stage);
    e.phaseT += STEP;
    e.catch = catchBox(e);
    
    const weak = stage === 'recover' && e.weakNow === true;
    if (e.caught > e.caughtSeen) {
      e.caughtSeen = e.caught;
      e.taught = true;
      e.teachHold = false;
      if (!weak) {
        const secs = WINDOW[e.phase] + (e.deathsHere >= HELP_DEATHS ? HELP_EXTRA : 0);
        e.interrupt = { recoverFor: secs, weakNow: true };
        e.mood = 'munch';
        ctx.events.push({
          type: 'sourBite',
          id: e.id,
          x: e.x,
          y: e.y,
          seconds: secs,
          signals: ['visual:gold-stars', 'audio:pucker-squeak'],
        });
        e.harmless = true;
        return;
      }
    }
    if (!e.taught && e.phaseT >= TEACH) e.taught = true;
    if (e.parryT > 0) e.parryT -= STEP;
    
    e.harmless = e.afterHit || e.parryT > 0;
    if (stage === 'telegraph' && enter) e.afterHit = false;
    
    const home = stance(e, ctx);
    if (e.phase === 0) {
      if (!(stage === 'active' && atk.name === 'shearSweep') && !weak) {
        const d = home.x - e.x;
        e.x += Math.sign(d) * Math.min(Math.abs(d), STEP_BACK * STEP);
      }
      e.y = home.y;
    } else {
      e.x = home.x;
      e.y = home.y;
    }
    if (weak) return; 
    switch (atk.name) {
      case 'thinSnip':
      case 'windfall': {
        if (stage === 'telegraph') e.mood = 'reachUp';
        if (stage === 'active' && enter) {
          e.mood = 'snip';
          const spots =
            atk.name === 'windfall' ? g.windfall.map((x) => ({ x, y: surfaceBelow(ctx.world, x, g.floor + 4) })) : [snipSpot(e, ctx)];
          dropFruit(e, ctx, spots);
        }
        if (stage === 'recover') {
          if (enter && e.recoverFor === undefined) breath(e, atk.recover, false);
          
          if (!e.taught) {
            e.recoverFor = Math.max(e.t + 1, atk.recover);
            e.teachHold = true;
          } else if (e.teachHold) {
            e.teachHold = false; 
            e.recoverFor = Math.max(atk.recover, e.t);
          }
          e.mood = 'tidy';
        }
        break;
      }
      case 'shearSweep': {
        if (stage === 'telegraph' && enter) {
          const first = !e.sweepDone;
          e.reach = first ? FIRST_SWEEP.reach : SWEEP_REACH;
          if (first) e.teleFor = FIRST_SWEEP.telegraph;
          e.mood = 'whet';
          const front = home.x - LUNGE - e.w / 2;
          ctx.events.push({
            type: 'shearLine',
            id: e.id,
            x0: front - e.reach,
            x1: front,
            y: g.floor,
            seconds: first ? FIRST_SWEEP.telegraph : atk.telegraph,
            signals: LINE_SIGNALS,
          });
        }
        if (stage === 'active') {
          if (enter) e.sweepDone = true;
          e.mood = 'sweep';
          e.x = home.x - LUNGE * Math.min(1, e.t / atk.active);
          const front = e.x - e.w / 2;
          if (boxHit(p, { x0: front - e.reach, x1: front, y0: g.floor, y1: g.floor + 1 })) hurtPlayer(ctx.session, e.x);
        }
        if (stage === 'recover' && enter && e.recoverFor === undefined) breath(e, atk.recover, false);
        break;
      }
      case 'shearStrike':
      case 'twigFling': {
        if (stage === 'telegraph' && enter) {
          e.strike = atk.name === 'shearStrike' && nearEdge(e, p);
          if (e.strike) {
            e.lock = p.x;
            e.mood = 'raise';
            ctx.events.push({ type: 'strikeArc', id: e.id, x: e.lock, y: g.floor, seconds: atk.telegraph, signals: ARC_SIGNALS });
          } else {
            e.mood = 'fling';
            e.twigN = (e.twigN ?? 0) + 1;
            dropTwig(ctx, `${e.id}-twig-${e.twigN}`, p.x, surfaceBelow(ctx.world, p.x, p.y + 0.01), { by: e.id });
          }
        }
        if (stage === 'active' && e.strike) {
          e.mood = 'chop';
          if (boxHit(p, { x0: e.lock - 1, x1: e.lock + 1, y0: g.floor, y1: g.floor + 3 })) hurtPlayer(ctx.session, e.lock);
        }
        if (stage === 'recover' && enter && e.recoverFor === undefined) {
          breath(e, atk.recover, false); 
          if (e.strike) {
            e.mood = 'stuckBlade';
            ctx.events.push({ type: 'bladeStuck', id: e.id, x: e.lock, y: g.floor, seconds: atk.recover });
          }
        }
        break;
      }
      case 'scissorSweep': {
        if (stage === 'telegraph' && enter) {
          e.mood = 'whet';
          for (const side of [-1, 1])
            ctx.events.push({
              type: 'shearLine',
              id: e.id,
              x0: side < 0 ? e.x - 8.5 : e.x + 1.5,
              x1: side < 0 ? e.x - 1.5 : e.x + 8.5,
              y: g.floor,
              seconds: atk.telegraph,
              signals: LINE_SIGNALS,
            });
        }
        if (stage === 'active') {
          e.mood = 'scissor';
          for (const [x0, x1] of [
            [e.x - 8.5, e.x - 1.5],
            [e.x + 1.5, e.x + 8.5],
          ])
            if (boxHit(p, { x0, x1, y0: g.floor - 1.5, y1: g.floor + 1 })) hurtPlayer(ctx.session, e.x);
        }
        if (stage === 'recover' && enter && e.recoverFor === undefined) breath(e, atk.recover, false);
        break;
      }
    }
    if (!DAMAGING.has(atk.name) && stage !== 'active') e.mood = e.mood ?? 'tidy';
  },
  hit(e, ctx) {
    const s = ctx.session;
    const p = ctx.player;
    if (e.stage === 'intro') {
      
      e.harmless = true;
      e.catch = null;
      if (e.introKey !== `${e.phase}:${s.deaths}`) {
        e.introKey = `${e.phase}:${s.deaths}`;
        if (e.introPhase === e.phase) e.deathsHere += 1;
        else {
          e.introPhase = e.phase;
          e.deathsHere = 0;
        }
        e.fKey = null;
        e.taught = false;
        e.teachHold = false;
        e.sweepDone = false;
        e.phaseT = 0;
        e.afterHit = false;
        e.parryT = 0;
        e.from = { x: e.x, y: e.y };
        e.moveT0 = e.shape === e.phase ? 0 : null;
        for (const f of s.entities)
          if (f.alive && ((f.kind === 'fruitlet' && f.by === e.id) || (f.kind === 'twig' && f.by === e.id))) f.alive = false;
        e.caughtSeen = e.caught;
        if (e.shape !== e.phase && e.phase > 0) {
          const gp = geo(e).gap;
          const cuts = e.phase === 1 ? [gp.x0, gp.x1] : [gp.x0 - 2, gp.x1 + 2];
          ctx.events.push({ type: 'pruneCut', id: e.id, phase: e.phase, xs: cuts, seconds: CUT_TIME, signals: CUT_SIGNALS });
        }
      }
      if (e.shape !== e.phase && e.t >= CUT_TIME) {
        e.shape = e.phase; 
        e.moveT0 = e.t;
      }
      if (e.phase === 2 && e.shape === 2 && geo(e).sag) {
        ctx.world.sag ??= {};
        ctx.world.sag[geo(e).sag] = true; 
      }
      const to = e.moveT0 === null ? e.from : stance(e, ctx);
      const u = e.moveT0 === null ? 0 : Math.min(1, (e.t - e.moveT0) / MOVE_TIME);
      e.x = e.from.x + (to.x - e.from.x) * u;
      e.y = e.from.y + (to.y - e.from.y) * u;
      e.mood = e.phase === 0 ? 'turn' : e.phase === 1 ? 'prune' : 'top';
      return null;
    }
    const weak = e.stage === 'recover' && e.weakNow === true && !(e.immune > 0);
    if (weak) {
      const head = headBox(e);
      const c = contact(p, head);
      const pound = p.ab?.pound === 'fall' && overlaps(p, head);
      if (c === 'stomp' || pound) {
        stompBounce(p);
        if (p.ab) p.ab.pound = null;
        e.mood = 'ouch';
        e.recoverFor = BREATH;
        e.weakNow = false;
        e.harmless = true;
        e.afterHit = true;
        if (e.phase === e.phases.length - 1 && e.hp === 1) {
          
          e.catch = null;
          if (geo(e).sag && ctx.world.sag) ctx.world.sag[geo(e).sag] = false;
          ctx.events.push({ type: 'dishDrop', id: e.id, x: e.dish?.x ?? e.x, y: e.dish?.y ?? e.y });
        }
        return 'stomp';
      }
      return null;
    }
    
    if (e.afterHit) return null; 
    const c = contact(p, e);
    const ch = contact(p, headBox(e));
    if (c === 'stomp' || ch === 'stomp') {
      stompBounce(p);
      e.parryT = PARRY_GRACE;
      e.harmless = true;
      ctx.events.push({ type: 'parry', id: e.id, x: p.x, y: p.y });
      return 'deflect';
    }
    return null;
  },
});
