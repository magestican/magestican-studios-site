







import { ANG, FP, angWrap, isin, muldiv } from './fixed.js';
import { FIELD_H, FIELD_W, aimAt, fan, gentleSpeed, ring } from './patterns.js';
import { hash32 } from './rng.js';


export const SCROLL = 162;


export const MIN_BEAT_GAP = 360;

export const WARDEN_AT = 4200;
export const BOSS_AT = 7560;
export const WARDEN_LIFE = 1320;   
export const BOSS_TIME = 6000;     
export const BOSS_ENTER = 180;     
export const BOSS_REST = 180;      
export const BOSS_HP = 1200;       
export const WARDEN_HP = 260;


export const DART = 0, TURRET = 1, WARDEN = 2, SKIFF = 3, BULWARK = 4, GUNSHIP = 5;
export const ENEMY_HP = [6, 30, WARDEN_HP, 4, 240, 300];
export const ENEMY_SCORE = [100, 300, 3000, 150, 1000, 3000];

export const ENEMY_R = [16, 26, 44, 14, 26, 40];

export const ARMOUR = 1, OTHER_ONLY = 2;
export const KIND_FLAGS = [0, 0, 0, 0, ARMOUR, 0];

export const isMid = (k) => k === WARDEN || k === GUNSHIP;
export const MID_LIFE = WARDEN_LIFE;

export const LAUNCH_EVERY = 240;

const px = (v) => Math.round(v * FP);





export const BEATS = Object.freeze([
  { at: 240, kind: 'wall', pol: 0, rows: 3, cols: 9 },
  { at: 600, kind: 'wall', pol: 0, rows: 4, cols: 11 },
  { at: 1020, kind: 'wall', pol: 1, rows: 3, cols: 9 },
  { at: 1440, kind: 'wall', pol: 1, pol2: 0, rows: 6, cols: 9 },
  { at: 2160, kind: 'darts', pol: 0, groups: [{ path: 'dive', pol: 0, n: 5, cx: 0.5 }] },
  { at: 2520, kind: 'darts', pol: 1, groups: [{ path: 'sweep', pol: 1, n: 5, dir: 1, cy: 0.16 }] },
  { at: 2880, kind: 'darts', pol: 0, groups: [{ path: 'sweep', pol: 0, n: 4, dir: -1, cy: 0.12 }, { path: 'sweep', pol: 1, n: 4, dir: 1, cy: 0.24 }] },
  { at: 3300, kind: 'turrets', pol: 1, groups: [{ path: 'ground', pol: 1, n: 1, cx: 0.26 }, { path: 'ground', pol: 0, n: 1, cx: 0.74 }] },
  { at: WARDEN_AT, kind: 'warden', pol: 1, groups: [{ path: 'warden', pol: 1, n: 1, cx: 0.5 }] },
  { at: 5640, kind: 'darts', pol: 0, groups: [{ path: 'dive', pol: 0, n: 3, cx: 0.28 }, { path: 'dive', pol: 1, n: 3, cx: 0.72 }] },
  { at: 6000, kind: 'darts', pol: 1, groups: [{ path: 'sweep', pol: 1, n: 5, dir: 1, cy: 0.14 }, { path: 'sweep', pol: 0, n: 5, dir: -1, cy: 0.26 }] },
  { at: 6360, kind: 'turrets', pol: 0, groups: [{ path: 'ground', pol: 0, n: 1, cx: 0.2 }, { path: 'ground', pol: 1, n: 1, cx: 0.5 }, { path: 'ground', pol: 0, n: 1, cx: 0.8 }] },
  { at: 6780, kind: 'darts', pol: 1, groups: [{ path: 'dive', pol: 1, n: 5, cx: 0.5 }] },
  { at: BOSS_AT, kind: 'boss', pol: 0 },
]);

export const PATHS = { dive: 0, sweep: 1, ground: 2, warden: 3, scurve: 4, slide: 5, shuttle: 6, launch: 7, rampart: 8, pair: 9, tether: 10 };
const KIND_OF = { dive: DART, sweep: DART, ground: TURRET, warden: WARDEN, scurve: SKIFF, launch: SKIFF, slide: BULWARK,
  shuttle: GUNSHIP, rampart: GUNSHIP, pair: SKIFF, tether: GUNSHIP };
const KIND_NAME = ['dart', 'turret', 'warden', 'skiff', 'bulwark', 'gunship'];


export function expandBeats(beats, seed) {
  const out = [];
  beats.forEach((b, bi) => {
    if (b.kind === 'wall') {
      const span = Math.trunc(FIELD_W / b.cols);
      const off = (hash32(seed, 21, bi) % (span >> 1)) - (span >> 2);
      const gap = hash32(seed, 22, bi) % (b.cols - 1);
      for (let r = 0; r < b.rows; r++) {
        const second = b.pol2 !== undefined && r >= b.rows / 2;
        out.push({ at: b.at + r * 40 + (second ? 60 : 0), kind: 'row', pol: second ? b.pol2 : b.pol, x: off, cols: b.cols, gap });
      }
      if (!b.groups) return; 
    }
    if (b.kind === 'boss') return;
    b.groups.forEach((g, gi) => {
      for (let k = 0; k < g.n; k++) {
        const jit = px((hash32(seed, 23 + gi, bi * 16 + k) % 25) - 12);
        let x, y, dir = g.dir || 0, at = b.at + (g.delay || 0);
        if (g.path === 'dive') {
          const side = k - ((g.n - 1) >> 1);
          x = px(390 * g.cx + side * 42) + jit;
          y = px(-30);
          at += Math.abs(side) * 14;
          dir = side < 0 ? -1 : 1;
        } else if (g.path === 'sweep') {
          x = dir > 0 ? px(-20) : FIELD_W + px(20);
          y = px(844 * g.cy) + jit;
          at += k * 16;
        } else if (g.path === 'scurve' || g.path === 'pair') {
          
          x = px(390 * g.cx) + jit;
          y = px(-24);
          at += k * 24;
          dir = g.dir || 1;
        } else {
          x = px(390 * g.cx) + jit;
          y = g.path === 'ground' ? px(-40) : px(-70);
        }
        const k2 = KIND_OF[g.path];
        out.push({ at, kind: KIND_NAME[k2], k: k2, path: PATHS[g.path], pol: g.pol, x, y, dir, flags: KIND_FLAGS[k2] | (g.only ? OTHER_ONLY : 0) | (g.armour ? ARMOUR : 0) });
      }
    });
  });
  out.sort((a, b) => a.at - b.at); 
  return out;
}


let memoSeed = null, memoList = null;

export function waveList(seed) {
  if (memoSeed !== seed) { memoList = Object.freeze(expandBeats(BEATS, seed).map(Object.freeze)); memoSeed = seed; }
  return memoList;
}


export function cueAt(t, beats = BEATS) {
  for (const b of beats) {
    const d = b.at - t;
    if (d >= 1 && d <= 120 && b.kind !== 'warden' && b.kind !== 'shuttle' && b.kind !== 'boss') return b.pol;
  }
  return -1;
}


export function rowSpawns(row, out) {
  const span = Math.trunc(FIELD_W / row.cols);
  for (let i = 0; i < row.cols; i++) {
    if (i === row.gap || i === row.gap + 1) continue; 
    out.push([row.x + span * i + (span >> 1), px(-10), 0, 320, row.pol, 1]);
  }
}


export function enemyPos(path, x0, y0, dir, age) {
  if (path === 0) { 
    if (age < 90) return [x0, y0 + age * 2 * FP];
    if (age < 300) return [x0 + Math.trunc((isin(age * 16) * 10) / 256), y0 + 180 * FP];
    const d = age - 300;
    return [x0 + dir * d * 3 * FP, y0 + 180 * FP + d * FP];
  }
  if (path === 1) return [x0 + dir * age * 2 * FP, y0 + Math.trunc((isin(age * 12) * 24) / 256)]; 
  if (path === 2) return [x0, y0 + age * SCROLL]; 
  
  const land = 200 * FP;
  if (age < 120) return [x0, y0 + muldiv(age, land - y0, 120)];
  if (age < WARDEN_LIFE) return [x0 + Math.trunc((isin((age - 120) * 4) * 70) / 256), land];
  return [x0, land - (age - WARDEN_LIFE) * 2 * FP];
}


export const FIRE_FLOOR = FIELD_H - 160 * FP;


export function enemyFire(kind, path, pol, age, x, y, players, thin, out) {
  if (y < 0 || y > FIRE_FLOOR) return;
  if (kind === DART) {
    const when = path === 0 ? age === 100 || age === 220 : age === 60 || age === 130;
    if (when) fan(out, x, y, 1, aimAt(players, x, y), 0, 2 * FP, pol, 0, false);
    return;
  }
  if (kind === TURRET) {
    if (age >= 90 && (age - 90) % 100 === 0) {
      fan(out, x, y, thin ? 1 : 3, aimAt(players, x, y), 110, gentleSpeed(5 * FP / 2, thin), pol, 3, false);
    }
    return;
  }
  
  if (age < 120 || age >= WARDEN_LIFE) return;
  const c = (age - 120) % 900;
  if (c < 420 && c % 42 === 0) {
    const n = Math.trunc(c / 42);
    ring(out, x, y, 12, (n * ANG) / 24, 2 * FP, n & 1, 1, thin);
  } else if (c >= 540 && c < 780 && (c - 540) % 48 === 0) {
    const n = Math.trunc((c - 540) / 48);
    fan(out, x, y, 5, aimAt(players, x, y), 120, 3 * FP, n & 1, 3, thin);
  }
}


export function bossPos(age) {
  if (age < BOSS_ENTER) return [FIELD_W >> 1, -120 * FP + muldiv(age, 300 * FP, BOSS_ENTER)];
  const a = age - BOSS_ENTER;
  return [(FIELD_W >> 1) + Math.trunc((isin(a * 3) * 90) / 256), 180 * FP + Math.trunc((isin(a * 6) * 16) / 256)];
}


export const bossPhase = (hp, max) => (hp * 3 > max * 2 ? 0 : hp * 3 > max ? 1 : 2);


export function bossFire(phase, fa, seed, x, y, players, thin, out) {
  if (phase === 0) {
    if (fa % 36 === 0) { const n = Math.trunc(fa / 36); ring(out, x, y + 30 * FP, 20, hash32(seed, 31, n) % ANG, 2 * FP, n & 1, n & 1 ? 1 : 0, thin); }
    return;
  }
  if (phase === 1) {
    
    if (fa % (thin ? 10 : 5) !== 0) return;
    const rate = 64 + (seed >>> 0) % 32;
    const a = angWrap(fa * rate);
    for (let arm = 0; arm < 2; arm++) {
      const v = gentleSpeed(5 * FP / 2, thin);
      ring(out, x, y + 30 * FP, 1, angWrap(a + arm * (ANG / 2)), v, arm, 2, false);
    }
    return;
  }
  if (fa % 54 === 0) { const n = Math.trunc(fa / 54); fan(out, x, y + 30 * FP, 7, aimAt(players, x, y), 90, 4 * FP, n & 1, 3, thin); }
  if (fa % 80 === 40) { const n = Math.trunc(fa / 80); ring(out, x, y + 30 * FP, 14, (n * ANG) / 28, 3 * FP / 2, (n + 1) & 1, 0, thin); }
}
