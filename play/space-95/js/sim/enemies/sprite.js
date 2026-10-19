















import { LANTERN } from '../abilities.js';
import { contact, defeat, stepDefeated, stompBounce } from '../combat.js';
import { STEP } from '../constants.js';
import { overlaps, registerKind } from '../entities.js';
import { lightAt } from '../light.js';

export const SPRITE = Object.freeze({
  BOB: 0.6, 
  BOB_HZ: 1,
  REACH_X: 7, 
  REACH_Y: 6, 
  TELEGRAPH: 0.8, 
  FLASH: 0.15, 
  FLASH_R: 6, 
  COOLDOWN: 2.5, 
  FLUSTER: 1.2, 
  FLEE: 6, 
  FLEE_SPEED: 8, 
  AWAY: 5, 
  HOME_SPEED: 6, 
  BUMP_VX: 3, 
  BUMP_COOL: 0.3, 
  MIN_GAP: 0.4, 
  GHOST_SPEED: 1.2, 
  GHOST_GONE: 3, 
});
const SIGNALS = ['visual:pink-abdomen', 'audio:rising-whine'];

const centreY = (b) => b.y + b.h / 2;


function toward(e, tx, ty, v) {
  const dx = tx - e.x;
  const dy = ty - e.y;
  const d = Math.hypot(dx, dy);
  const m = v * STEP;
  if (d <= m) {
    e.x = tx;
    e.y = ty;
    return true;
  }
  e.x += (dx / d) * m;
  e.y += (dy / d) * m;
  return false;
}

function stepGhost(e, ctx) {
  const s = ctx.session;
  const p = ctx.player;
  const [a, b] = e.patrol;
  if (e.stage === 'gone') {
    e.st += STEP;
    if (e.st >= SPRITE.GHOST_GONE - 1e-9) {
      e.stage = 'drift';
      e.x = e.farEnd;
      e.dir = e.farEnd === a ? 1 : -1;
      ctx.events.push({ type: 'ghostAppear', id: e.id, x: e.x, y: e.y });
    }
    return;
  }
  e.x += e.dir * SPRITE.GHOST_SPEED * STEP;
  if (e.x >= b) {
    e.x = b;
    e.dir = -1;
  } else if (e.x <= a) {
    e.x = a;
    e.dir = 1;
  }
  if (lightAt(s, e.x, centreY(e))) {
    e.stage = 'gone';
    e.st = 0;
    e.farEnd = e.x - a < b - e.x ? b : a;
    ctx.events.push({ type: 'ghostBlink', id: e.id, x: e.x, y: e.y, first: !e.blinked });
    e.blinked = true;
    return;
  }
  if (contact(p, e) === 'stomp') {
    stompBounce(p);
    defeat(e, ctx, 'catch');
  }
}

registerKind('sprite', {
  sleeps: true,
  create(e) {
    e.w = 0.8;
    e.h = 0.6;
    e.home = { x: e.x, y: e.y };
    e.stage = e.ghost ? 'drift' : 'hover';
    e.st = 0;
    e.cool = 0;
    e.bumpCool = 0;
    if (e.ghost) e.dir = 1;
  },
  step(e, ctx) {
    if (stepDefeated(e)) return;
    if (e.ghost) {
      stepGhost(e, ctx);
      return;
    }
    const s = ctx.session;
    const p = ctx.player;
    e.st += STEP;
    if (e.cool > 0) e.cool -= STEP;
    if (e.bumpCool > 0) e.bumpCool -= STEP;
    const dx = e.x - p.x;
    const dy = centreY(e) - centreY(p);
    const inReach = Math.abs(dx) <= SPRITE.REACH_X && Math.abs(dy) <= SPRITE.REACH_Y;
    const bobY = e.home.y + SPRITE.BOB * Math.sin(2 * Math.PI * SPRITE.BOB_HZ * e.t);
    if (e.stage === 'fluster') {
      if (e.st >= SPRITE.FLUSTER - 1e-9) {
        e.stage = 'flee';
        e.st = 0;
        e.fleeX = e.home.x + e.away * SPRITE.FLEE;
      }
    } else if (e.stage === 'flee') {
      toward(e, e.fleeX, e.home.y + 1, SPRITE.FLEE_SPEED);
      if (e.st >= SPRITE.AWAY - SPRITE.FLUSTER - 1e-9) {
        e.stage = 'hover';
        e.st = 0;
      }
    } else {
      toward(e, e.home.x, bobY, SPRITE.HOME_SPEED); 
      if (e.stage === 'hover') {
        s.flashLast ??= Number.NEGATIVE_INFINITY;
        if (inReach && e.cool <= 0 && s.time + SPRITE.TELEGRAPH >= s.flashLast + SPRITE.MIN_GAP - 1e-9) {
          e.stage = 'telegraph';
          e.st = 0;
          s.flashLast = s.time + SPRITE.TELEGRAPH;
          ctx.events.push({ type: 'telegraph', id: e.id, attack: 'flash', seconds: SPRITE.TELEGRAPH, x: e.x, y: e.y, signals: SIGNALS });
        }
      } else if (e.stage === 'telegraph' && e.st >= SPRITE.TELEGRAPH - 1e-9) {
        const L = p.lantern;
        const lx = p.x;
        const ly = centreY(p) + LANTERN.RAISE_Y;
        if (L?.raised && Math.hypot(e.x - lx, centreY(e) - ly) <= L.r) {
          e.stage = 'fluster';
          e.st = 0;
          e.away = Math.sign(dx) || 1;
          e.cool = SPRITE.AWAY + SPRITE.COOLDOWN;
          ctx.events.push({ type: 'spriteFluster', id: e.id, x: e.x, y: e.y });
        } else {
          e.stage = 'flash';
          e.st = 0;
          ctx.events.push({ type: 'spriteFlash', id: e.id, x: e.x, y: e.y, r: SPRITE.FLASH_R, t: s.time });
          const facing = Math.abs(dx) < 0.5 || Math.sign(dx) === p.facing;
          if (L && inReach && facing && !L.raised) {
            L.dazzle = LANTERN.DAZZLE;
            ctx.events.push({ type: 'dazzled', id: e.id, x: p.x, y: p.y, seconds: LANTERN.DAZZLE });
          }
        }
      } else if (e.stage === 'flash' && e.st >= SPRITE.FLASH - 1e-9) {
        e.stage = 'hover';
        e.st = 0;
        e.cool = SPRITE.COOLDOWN;
      }
    }
    if (!overlaps(p, e)) return;
    if (contact(p, e) === 'stomp') {
      stompBounce(p);
      defeat(e, ctx, 'stomp');
    } else if (e.bumpCool <= 0) {
      p.vx = (Math.sign(p.x - e.x) || 1) * SPRITE.BUMP_VX;
      e.bumpCool = SPRITE.BUMP_COOL;
      ctx.events.push({ type: 'spriteBump', id: e.id, x: e.x, y: e.y });
    }
  },
});
