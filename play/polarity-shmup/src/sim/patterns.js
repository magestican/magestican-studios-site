








import { ANG, FP, angWrap, iatan2, isin, polar } from './fixed.js';
import { hash32 } from './rng.js';

export const FIELD_W = 390 * FP;
export const FIELD_H = 844 * FP;


export const PHASE_TICKS = 600;


export function bossAt(t) {
  
  return {
    x: (FIELD_W >> 1) + Math.trunc((isin(t * 3) * 120) / 256),
    y: 170 * FP + Math.trunc((isin(t * 6) * 24) / 256),
  };
}

function nearestPlayer(players, x, y) {
  let best = null, bd = Infinity;
  for (const p of players) {
    if (!p.on) continue;
    const dx = (p.x - x) / FP, dy = (p.y - y) / FP; 
    const d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}


function ring(t, seed, boss, out) {
  if (t % 30 !== 0) return;
  const n = t / 30;
  const off = hash32(seed, 1, n) % ANG;
  const pol = n & 1;
  for (let i = 0; i < 24; i++) {
    const v = polar(angWrap(off + (i * ANG) / 24), 2 * FP + (FP >> 1));
    out.push([boss.x, boss.y, v.vx, v.vy, pol, pol ? 1 : 0]);
  }
}


function spiral(t, seed, boss, out) {
  if (t % 4 !== 0) return;
  const rate = 40 + (hash32(seed, 2, Math.trunc(t / PHASE_TICKS)) % 40);
  const a = angWrap(t * rate);
  for (let arm = 0; arm < 2; arm++) {
    const v = polar(angWrap(a + arm * (ANG / 2)), 3 * FP);
    out.push([boss.x, boss.y, v.vx, v.vy, arm, 2]);
  }
}


function fan(t, seed, boss, players, out) {
  if (t % 45 !== 0) return;
  const target = nearestPlayer(players, boss.x, boss.y);
  const aim = target ? iatan2(target.x - boss.x, target.y - boss.y) : 0;
  const pol = hash32(seed, 3, t) & 1;
  for (let i = -3; i <= 3; i++) {
    const v = polar(angWrap(aim + i * 90), 4 * FP);
    out.push([boss.x, boss.y, v.vx, v.vy, pol, 3]);
  }
}

export const PATTERNS = Object.freeze(['ring', 'spiral', 'fan']);


export function patternAt(t, seed) {
  const phase = Math.trunc(t / PHASE_TICKS);
  return PATTERNS[(phase + (hash32(seed, 4, Math.trunc(phase / 3)) % 3)) % 3];
}


export function spawnsAt(t, seed, players) {
  const out = [];
  if (t < 60) return out;
  const boss = bossAt(t);
  const p = patternAt(t, seed);
  if (p === 'ring') ring(t, seed, boss, out);
  else if (p === 'spiral') spiral(t, seed, boss, out);
  else fan(t, seed, boss, players, out);
  return out;
}
