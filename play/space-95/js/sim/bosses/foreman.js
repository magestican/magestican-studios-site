













import { hurtPlayer, stompBounce } from '../combat.js';
import { overlaps, registerKind, spawnEntities } from '../entities.js';
import { registerBossType } from './boss.js';

const CHARGE_SPEED = 12; 
const ERUPT_RISE = 1; 
const STUCK_SINK = 1; 
const SHOCK_H = 0.75; 
const MUD_FLIGHT = 0.6; 
const MUD_APEX = 3; 
const DOUBLE_GAP = 0.4; 

const WEAK = new Set(['shovelCharge', 'burrowAmbush', 'dizzyWobble']);

const floorY = (e) => e.arena.y0 ?? 2;
const mid = (e) => (e.arena.x0 + e.arena.x1) / 2;
const clampX = (e, x) => Math.max(e.arena.x0 + e.w / 2, Math.min(e.arena.x1 - e.w / 2, x));
const clodOn = (e, ctx) => ctx.session.entities.some((c) => c.kind === 'clod' && c.alive && c.state === 'fall' && overlaps(c, e));
const poundOn = (e, ctx) => ctx.player.ab?.pound === 'fall' && overlaps(ctx.player, e);


registerKind('mudBall', {
  create(e) {
    e.w = 0.6;
    e.h = 0.6;
  },
  step(e, ctx) {
    const u = Math.min(1, e.t / e.flight);
    e.x = e.x0 + (e.tx - e.x0) * u;
    e.y = e.y0 + (e.ty - e.y0) * u + MUD_APEX * 4 * u * (1 - u);
    if (overlaps(e, ctx.player)) {
      hurtPlayer(ctx.session, e.x);
      e.alive = false;
      ctx.events.push({ type: 'mudSplat', id: e.id, x: e.x, y: e.y, hit: true });
    } else if (u >= 1) {
      e.alive = false;
      ctx.events.push({ type: 'mudSplat', id: e.id, x: e.x, y: e.y, hit: false });
    }
  },
});

function throwMud(e, ctx, target) {
  e.mudN = (e.mudN ?? 0) + 1;
  const def = {
    id: `${e.id}-mud-${e.mudN}`,
    kind: 'mudBall',
    x: e.x,
    y: e.y + e.h,
    x0: e.x,
    y0: e.y + e.h,
    tx: target.x,
    ty: target.y,
    flight: MUD_FLIGHT,
  };
  ctx.session.entities.push(...spawnEntities([def]));
  ctx.events.push({ type: 'mudToss', id: e.id, x: target.x, y: target.y });
}


const markJo = (e, ctx) => {
  const m = { x: ctx.player.x, y: ctx.player.y };
  ctx.events.push({ type: 'mudMarker', id: e.id, x: m.x, y: m.y });
  return m;
};


function entered(e, stage) {
  const key = `${e.phase}:${e.attackIdx}:${stage}`;
  if (e.fKey === key) return false;
  e.fKey = key;
  return true;
}

registerBossType('foreman', {
  create(e) {
    e.facing = -1;
    e.mood = 'working';
  },
  attack(e, ctx, _staleAtk, stage) {
    
    
    const ph = e.phases[e.phase];
    const atk = ph.attacks[e.attackIdx % ph.attacks.length];
    const p = ctx.player;
    const enter = entered(e, stage);
    const y0 = floorY(e);
    const first = e.attackIdx === 0; 
    switch (atk.name) {
      case 'shovelCharge': {
        if (stage === 'telegraph' && enter) {
          
          
          let dir = first ? -1 : p.x < mid(e) ? -1 : 1;
          const wall = (d) => clampX(e, d < 0 ? e.arena.x0 : e.arena.x1);
          if (Math.abs(e.x - wall(dir)) < 1) dir = -dir;
          e.facing = dir;
          e.from = e.x;
          e.to = wall(dir);
          e.mood = 'digIn';
          e.y = floorY(e);
        }
        if (stage === 'active') {
          e.mood = 'charge';
          const dist = Math.abs(e.to - e.from);
          const speed = Math.max(CHARGE_SPEED, dist / (atk.active * 0.95)); 
          e.x = e.from + Math.sign(e.to - e.from) * Math.min(dist, speed * e.t);
        }
        if (stage === 'recover' && enter) {
          e.x = e.to;
          e.mood = 'stunned';
          ctx.events.push({ type: 'bossStunned', id: e.id, x: e.x, side: e.facing });
        }
        break;
      }
      case 'mudToss':
      case 'mudTossDouble': {
        if (stage === 'telegraph' && enter) {
          e.y = y0; 
          e.from = e.x;
          e.mood = 'windUp';
          e.marks = [markJo(e, ctx)];
          e.thrown = 0;
        }
        
        if (e.phase === 0 && stage === 'telegraph') e.x = e.from + (mid(e) - e.from) * Math.min(1, e.t / atk.telegraph);
        if (stage === 'active') {
          e.mood = 'throw';
          if (e.thrown === 0) {
            throwMud(e, ctx, e.marks[0]);
            e.thrown = 1;
            if (atk.name === 'mudTossDouble') e.marks.push(markJo(e, ctx));
          } else if (e.thrown === 1 && e.marks.length > 1 && e.t >= DOUBLE_GAP) {
            throwMud(e, ctx, e.marks[1]);
            e.thrown = 2;
          }
        }
        if (stage === 'recover') e.mood = 'working';
        break;
      }
      case 'burrowAmbush': {
        if (stage === 'telegraph' && enter) {
          
          
          let x = p.x;
          if (first) x = Math.abs(p.x - mid(e)) <= 4 ? (p.x < mid(e) ? e.arena.x1 : e.arena.x0) : mid(e);
          e.ringX = clampX(e, x);
          e.y = y0 - e.h - 0.5; 
          e.mood = 'burrow';
          ctx.events.push({ type: 'crackRing', id: e.id, x: e.ringX, y: y0 });
        }
        if (stage === 'active' && enter) {
          e.x = e.ringX;
          e.y = y0 + ERUPT_RISE;
          e.mood = 'erupt';
          ctx.events.push({ type: 'erupt', id: e.id, x: e.x, y: y0 });
        }
        if (stage === 'recover' && enter) {
          e.y = y0 - STUCK_SINK;
          e.mood = 'stuck';
          ctx.events.push({ type: 'bossStuck', id: e.id, x: e.x });
        }
        break;
      }
      case 'warningStomp':
      case 'quakeStomp': {
        if (stage === 'telegraph' && enter) {
          e.y = y0;
          e.mood = 'rearUp';
        }
        if (stage === 'active' && enter) {
          e.mood = 'stomp';
          
          ctx.events.push({ type: atk.name === 'warningStomp' ? 'quakeWarning' : 'shockwave', id: e.id, x: e.x, y: y0 });
        }
        if (stage === 'active' && atk.name === 'quakeStomp' && p.y >= y0 - 0.01 && p.y < y0 + SHOCK_H) hurtPlayer(ctx.session, e.x);
        if (stage === 'recover') e.mood = 'working';
        break;
      }
      case 'dizzyWobble': {
        if (stage === 'telegraph' && enter) {
          e.from = e.x;
          e.mood = 'wobble';
        }
        if (stage === 'active') e.x = e.from + (e.keystoneX - e.from) * Math.min(1, e.t / atk.active);
        if (stage === 'recover' && enter) {
          e.x = e.keystoneX;
          e.mood = 'dizzy';
          ctx.events.push({ type: 'bossDizzy', id: e.id, x: e.x });
        }
        break;
      }
    }
  },
  hit(e, ctx) {
    const s = ctx.session;
    if (e.stage === 'intro') {
      
      
      e.y = floorY(e);
      if (overlaps(ctx.player, e)) e.y = floorY(e) - e.h - 0.5;
      e.mood = 'working';
      e.fKey = null;
    }
    
    
    if (!e.phaseHurt && s.hearts < e.phaseHearts) {
      e.phaseHurt = true;
      if (e.phases[e.phase].deed) ctx.events.push({ type: 'latchShut', id: e.id });
    }
    const ph = e.phases[e.phase];
    const atk = ph.attacks[e.attackIdx % ph.attacks.length];
    const clod = clodOn(e, ctx);
    const pound = poundOn(e, ctx);
    if (!clod && !pound) return null;
    const weak = e.stage === 'recover' && WEAK.has(atk.name);
    if (!weak || e.immune > 0) {
      
      
      if (pound && !weak) {
        stompBounce(ctx.player);
        ctx.player.ab.pound = null;
        ctx.events.push({ type: 'hatBonk', id: e.id });
      }
      return 'deflect';
    }
    let how = null;
    if (atk.name === 'shovelCharge' && clod) how = 'cave-in';
    if (atk.name === 'burrowAmbush') how = 'pound'; 
    if (atk.name === 'dizzyWobble') how = 'cave-in'; 
    if (how !== ph.weakness) {
      if (pound) {
        stompBounce(ctx.player);
        ctx.player.ab.pound = null;
        ctx.events.push({ type: 'hatBonk', id: e.id });
      }
      return 'deflect';
    }
    e.mood = 'ouch';
    if (e.phase === e.phases.length - 1 && e.hp <= 1) {
      
      e.mood = 'dazed';
      ctx.events.push({ type: 'bossCelebrate', id: e.id, x: e.x, y: e.y, text: 'CAVE-IN!' });
    }
    return how;
  },
});
