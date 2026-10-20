












import { defeat, hurtPlayer, stepDefeated } from './combat.js';
import { STEP } from './constants.js';
import { overlaps, registerKind } from './entities.js';
import { launch } from './launch.js';
import { createPlayer } from './player.js';
import { makePath, pathAt } from './slipstream.js';

const OFF_TIME = 0.6; 
const OFF_DROP = 3; 
const WAVE_TIME = 1.2; 
const CREST = 0.7; 
const LAUNCH_VY = 24; 
const LAUNCH_VX = 6; 
const START_AT = 0.3; 


const laneOf = (level) => (level.ride ? level.rafts?.find((d) => d.id === level.ride) : null);


function distAtX(d, x) {
  const path = makePath({ x: d.points[0][0], y: d.points[0][1], path: d.points.slice(1) });
  let lo = 0;
  let hi = path.len;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (pathAt(path, mid).x < x) lo = mid;
    else hi = mid;
  }
  return lo;
}


export function startRide(s, at) {
  const d = laneOf(s.level);
  if (!d) return;
  const w = d.w ?? 26;
  const dist = distAtX(d, at.x - START_AT * w);
  s.laneOffset ??= {};
  s.laneOffset[d.id] = s.time - dist / (d.speed ?? 6);
  s.offT = 0;
}


export function rideDeck(s) {
  const d = laneOf(s.level);
  if (!d || !s.rafts) return null;
  return s.rafts.list.find((r) => r.lane === d.id) ?? null;
}


export function stepRide(s) {
  const deck = rideDeck(s);
  if (!deck) return;
  const p = s.player;
  stepRideDeed(s);
  if (s.dead > 0 || s.pitFall > 0) return;
  const onDeck = p.grounded && p.raft === deck.id;
  
  
  const overDeck = Math.abs(p.x - deck.x) <= deck.w / 2;
  const off = (p.grounded && !onDeck) || p.y < deck.y - OFF_DROP || (!p.grounded && !overDeck);
  s.offT = off ? (s.offT ?? 0) + STEP : 0;
  if (s.offT >= OFF_TIME) {
    s.offT = 0;
    const cost = s.level.pitCost ?? 'none';
    if (cost === 'heart') s.hearts -= 1;
    s.events.push({ type: 'snag', x: p.x, y: p.y, signals: ['visual:paperclip', 'audio:tether-snag'] });
    s.snags = (s.snags ?? 0) + 1;
    const np = createPlayer(deck.x - deck.w / 4, deck.y, 1);
    np.abilities = s.abilities;
    s.player = np;
    s.invuln = Math.max(s.invuln, 1.2);
    if (s.hearts <= 0) s.events.push({ type: 'down' });
  }
}

registerKind('maneWave', {
  create(e) {
    e.w = 0;
    e.h = 0;
    e.state = 'wait';
  },
  step(e, ctx) {
    const s = ctx.session;
    const deck = rideDeck(s);
    if (!deck) return;
    const head = deck.x + deck.w / 2;
    if (e.state === 'wait') {
      if (head >= e.x) {
        e.state = 'run';
        e.t = 0;
        ctx.events.push({ type: 'maneWave', id: e.id, use: e.use ?? null });
      }
      return;
    }
    if (e.state !== 'run') return;
    const k = e.t / WAVE_TIME;
    if (k >= 1) {
      e.state = 'done';
      e.alive = false;
      return;
    }
    e.crest = head - k * deck.w; 
    const p = ctx.player;
    if (!e.surfed && p.grounded && p.raft === deck.id && Math.abs(p.x - e.crest) <= CREST) {
      e.surfed = true;
      launch(p, LAUNCH_VY, { cut: true }); 
      p.carryVx = deck.vx + LAUNCH_VX;
      ctx.events.push({ type: 'maneSurf', id: e.id, use: e.use ?? null, x: p.x, y: p.y });
    }
  },
});

registerKind('obstacle', {
  create(e) {
    e.w ??= 1;
    e.h ??= 1;
  },
  step(e, ctx) {
    const p = ctx.player;
    if (!overlaps(p, e)) return;
    if (hurtPlayer(ctx.session, p.x + 2)) ctx.events.push({ type: 'bonk', id: e.id, skin: e.skin ?? 'lintel', x: p.x, y: p.y });
  },
});



registerKind('perchBug', {
  create(e) {
    e.w = 0.9;
    e.h = 0.7;
  },
  step(e, ctx) {
    if (stepDefeated(e)) return;
    if (overlaps(ctx.player, e)) defeat(e, ctx, 'scan');
  },
});





function stepRideDeed(s) {
  const deed = s.entities.find(
    (e) => e.kind === 'intel' && e.condition?.noHurtFrom !== undefined && !e.alive && !s.found.has(String(e.id)),
  );
  if (!deed || s.rideDeedDone) return;
  const p = s.player;
  const c = deed.condition;
  if (s.events.some((e) => e.type === 'respawn')) s.rideDeedHurt = false;
  if (p.x >= c.noHurtFrom && s.events.some((e) => e.type === 'hurt' || e.type === 'snag')) {
    if (!s.rideDeedHurt) s.events.push({ type: 'deedLost', id: deed.id });
    s.rideDeedHurt = true;
  }
  if (p.x >= c.at && !s.rideDeedHurt) {
    deed.alive = true;
    s.rideDeedDone = true;
    s.events.push({ type: 'deedEarned', id: deed.id });
  }
}
