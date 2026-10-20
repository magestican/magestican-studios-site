










import { INVULN_TIME } from './combat.js';
import { STEP } from './constants.js';
import { createPlayer } from './player.js';
import { litHobUnder } from './temperature.js';

export const RESCUE_WINDOW = 6.5; 
const HOLD = 0.2; 
const STILL = 0.3; 
const STILL_VX = 0.5; 


function unsteady(s) {
  const p = s.player;
  if (p.raft || p.webOn || p.ride || p.climbing) return true;
  if (litHobUnder(s, p)) return true;
  if (s.level.heaves?.length && p.heaveOn) return true;
  const T = s.world.tile;
  const r = Math.round(p.y / T) - 1;
  for (const e of s.entities)
    if (e.frozen && e.cells?.some(([c, rr]) => rr === r && c * T < p.x + p.w / 2 && (c + 1) * T > p.x - p.w / 2)) return true;
  return false;
}


export function stepRescue(s, input) {
  if (s.train || s.plane) return;
  const p = s.player;
  if (s.dead === 0 && s.pitFall === 0 && s.punt === 0 && s.dunk === 0) {
    s.groundT = p.grounded && Math.abs(p.vx) < STILL_VX && !unsteady(s) ? (s.groundT ?? 0) + STEP : 0;
    if (s.groundT >= STILL) s.rescueSpot = { x: p.x, y: p.y, facing: p.facing };
  }
  
  if (s.calm && !input.jump && !input.dash) s.calm = false;
  const offer = s.rescue;
  if (!offer) return;
  if (s.time > offer.until) {
    s.rescue = null;
    s.events.push({ type: 'rescueGone' });
    return;
  }
  
  const both = !!input.jump && !!input.dash && ((s.chordT ?? 0) > 0 || s.dead > 0 || p.grounded);
  s.chordT = both ? (s.chordT ?? 0) + STEP : 0;
  if (s.chordT >= HOLD - 1e-9) rescue(s);
}


export function offerRescue(s, lifeLost) {
  if (s.train || s.plane || !s.rescueSpot) return;
  s.rescue = { spot: { ...s.rescueSpot }, until: s.time + RESCUE_WINDOW, lifeLost };
  s.chordT = 0;
  s.events.push({
    type: 'rescueOffer',
    seconds: RESCUE_WINDOW,
    x: s.rescueSpot.x,
    y: s.rescueSpot.y,
    signals: ['visual:rescue-ring', 'audio:bolt-call'],
  });
}

function rescue(s) {
  const { spot, lifeLost } = s.rescue;
  s.rescue = null;
  s.chordT = 0;
  if (lifeLost) s.lives += 1;
  if (s.dead > 0 || lifeLost) s.deaths = Math.max(0, s.deaths - 1);
  s.dead = 0;
  s.pitFall = 0;
  s.punt = 0;
  s.dunk = 0;
  s.hearts = Math.max(1, s.hearts);
  const p = createPlayer(spot.x, spot.y, spot.facing ?? 1);
  p.abilities = s.abilities;
  s.player = p;
  s.invuln = INVULN_TIME;
  s.safe = { x: spot.x, y: spot.y };
  s.safeLand = s.safe;
  s.groundT = 0;
  s.calm = true;
  s.events.push({ type: 'rescued', x: spot.x, y: spot.y });
}
