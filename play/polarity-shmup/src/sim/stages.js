








import { ANG, FP, angWrap, isin, muldiv, polar } from './fixed.js';
import { aimAt, fan, gentleSpeed, ring } from './patterns.js';
import { hash32 } from './rng.js';
import {
  BEATS, BOSS_AT, BOSS_ENTER, BOSS_HP, BOSS_TIME, BULWARK, FIRE_FLOOR, GUNSHIP, LAUNCH_EVERY, MID_LIFE, SKIFF, WARDEN_AT,
  bossFire, bossPhase, cueAt, enemyFire, enemyPos, expandBeats,
} from './stage.js';

const px = (v) => Math.round(v * FP);


export const FURNACE = 0, LOOM = 1, ANVIL = 2, TWIN = 3, CROWN = 4;
export const BOSS_NAMES = ['The Furnace', 'The Loom', 'The Anvil', 'The Twin', 'The Crown'];


const SALTPAN = Object.freeze([
  { at: 240, kind: 'skiffs', pol: 0, groups: [{ path: 'scurve', pol: 0, n: 3, cx: 0.5, dir: 1 }] },
  { at: 600, kind: 'skiffs', pol: 1, groups: [{ path: 'scurve', pol: 1, n: 3, cx: 0.5, dir: -1 }] },
  { at: 960, kind: 'skiffs', pol: 0, groups: [{ path: 'scurve', pol: 0, n: 3, cx: 0.3, dir: 1 }, { path: 'scurve', pol: 1, n: 3, cx: 0.7, dir: -1, delay: 60 }] },
  { at: 1380, kind: 'skiffs', pol: 0, groups: [{ path: 'scurve', pol: 0, n: 3, cx: 0.22, dir: 1 }, { path: 'scurve', pol: 1, n: 3, cx: 0.78, dir: -1 }] },
  { at: 2160, kind: 'wall', pol: 0, rows: 3, cols: 9, groups: [{ path: 'dive', pol: 0, n: 5, cx: 0.5, delay: 150 }] },
  { at: 2580, kind: 'turrets', pol: 1, groups: [{ path: 'ground', pol: 0, n: 1, cx: 0.3 }, { path: 'ground', pol: 1, n: 1, cx: 0.7 }, { path: 'scurve', pol: 1, n: 3, cx: 0.5, dir: 1, delay: 60 }] },
  { at: 3000, kind: 'darts', pol: 0, groups: [{ path: 'sweep', pol: 0, n: 4, dir: -1, cy: 0.12 }, { path: 'sweep', pol: 1, n: 4, dir: 1, cy: 0.24 }] },
  { at: 3900, kind: 'shuttle', pol: 1, groups: [{ path: 'shuttle', pol: 1, n: 1, cx: 0.5 }] },
  { at: 5460, kind: 'skiffs', pol: 0, groups: [{ path: 'scurve', pol: 0, n: 3, cx: 0.3, dir: 1 }, { path: 'scurve', pol: 1, n: 3, cx: 0.5, dir: -1, delay: 90 }, { path: 'scurve', pol: 0, n: 3, cx: 0.7, dir: 1, delay: 180 }] },
  { at: 5940, kind: 'turrets', pol: 1, groups: [{ path: 'ground', pol: 0, n: 1, cx: 0.2 }, { path: 'ground', pol: 1, n: 1, cx: 0.5 }, { path: 'ground', pol: 0, n: 1, cx: 0.8 }, { path: 'dive', pol: 1, n: 5, cx: 0.5, delay: 120 }] },
  { at: 6420, kind: 'darts', pol: 0, groups: [{ path: 'dive', pol: 0, n: 3, cx: 0.28 }, { path: 'dive', pol: 1, n: 3, cx: 0.72 }] },
  { at: 7260, kind: 'boss', pol: 0 },
]);




const FOUNDRY = Object.freeze([
  { at: 240, kind: 'wall', pol: 0, rows: 2, cols: 9, groups: [{ path: 'slide', pol: 0, n: 1, cx: 0.5, delay: 120 }] },
  { at: 660, kind: 'bulwark', pol: 1, groups: [{ path: 'slide', pol: 1, n: 1, cx: 0.5 }] },
  { at: 1080, kind: 'skiffs', pol: 0, groups: [{ path: 'scurve', pol: 0, n: 3, cx: 0.5, dir: 1 }, { path: 'slide', pol: 1, n: 1, cx: 0.5, delay: 180 }] },
  { at: 1500, kind: 'bulwark', pol: 0, groups: [{ path: 'slide', pol: 0, n: 1, cx: 0.28 }, { path: 'slide', pol: 1, n: 1, cx: 0.72 }] },
  { at: 2280, kind: 'turrets', pol: 0, groups: [{ path: 'ground', pol: 0, n: 1, cx: 0.3 }, { path: 'ground', pol: 1, n: 1, cx: 0.7 }, { path: 'dive', pol: 0, n: 5, cx: 0.5, delay: 90 }] },
  { at: 2700, kind: 'bulwark', pol: 0, groups: [{ path: 'slide', pol: 0, n: 1, cx: 0.5 }, { path: 'sweep', pol: 1, n: 4, dir: 1, cy: 0.14, delay: 60 }, { path: 'sweep', pol: 1, n: 4, dir: -1, cy: 0.24, delay: 120 }] },
  { at: 3120, kind: 'skiffs', pol: 1, groups: [{ path: 'scurve', pol: 1, n: 3, cx: 0.3, dir: 1 }, { path: 'scurve', pol: 0, n: 3, cx: 0.7, dir: -1, delay: 60 }, { path: 'slide', pol: 1, n: 1, cx: 0.5, delay: 180 }] },
  { at: 3960, kind: 'rampart', pol: 0, groups: [{ path: 'rampart', pol: 0, n: 1, cx: 0.5, armour: true }] },
  { at: 5520, kind: 'bulwark', pol: 0, groups: [{ path: 'slide', pol: 0, n: 1, cx: 0.2 }, { path: 'slide', pol: 1, n: 1, cx: 0.5 }, { path: 'slide', pol: 0, n: 1, cx: 0.8 }] },
  { at: 6000, kind: 'turrets', pol: 1, groups: [{ path: 'ground', pol: 1, n: 1, cx: 0.25 }, { path: 'ground', pol: 0, n: 1, cx: 0.75 }, { path: 'scurve', pol: 0, n: 3, cx: 0.5, dir: 1, delay: 60 }, { path: 'scurve', pol: 1, n: 3, cx: 0.5, dir: -1, delay: 200 }] },
  { at: 6480, kind: 'darts', pol: 0, groups: [{ path: 'dive', pol: 0, n: 3, cx: 0.3 }, { path: 'dive', pol: 1, n: 3, cx: 0.7 }] },
  { at: 7320, kind: 'boss', pol: 0 },
]);



const TWINSEA = Object.freeze([
  { at: 240, kind: 'skiffs', pol: 0, groups: [{ path: 'scurve', pol: 0, n: 3, cx: 0.3, dir: 1 }, { path: 'scurve', pol: 1, n: 3, cx: 0.7, dir: -1 }] },
  { at: 660, kind: 'wall', pol: 0, pol2: 1, rows: 4, cols: 9 },
  { at: 1080, kind: 'turrets', pol: 0, groups: [{ path: 'ground', pol: 0, n: 1, cx: 0.25 }, { path: 'ground', pol: 1, n: 1, cx: 0.75 }, { path: 'slide', pol: 0, n: 1, cx: 0.5, delay: 120 }] },
  { at: 1860, kind: 'pair', pol: 0, groups: [{ path: 'tether', pol: 0, n: 1, cx: 0.3, only: true }, { path: 'tether', pol: 1, n: 1, cx: 0.7, only: true }] },
  { at: 3420, kind: 'darts', pol: 0, groups: [{ path: 'sweep', pol: 0, n: 4, dir: 1, cy: 0.12 }, { path: 'sweep', pol: 1, n: 4, dir: -1, cy: 0.24 }] },
  { at: 3840, kind: 'bulwark', pol: 0, groups: [{ path: 'slide', pol: 0, n: 1, cx: 0.3 }, { path: 'slide', pol: 1, n: 1, cx: 0.7 }] },
  { at: 4260, kind: 'skiffs', pol: 0, groups: [{ path: 'scurve', pol: 0, n: 3, cx: 0.25, dir: 1 }, { path: 'scurve', pol: 1, n: 3, cx: 0.75, dir: -1, delay: 60 }] },
  { at: 4680, kind: 'turrets', pol: 1, groups: [{ path: 'ground', pol: 1, n: 1, cx: 0.3 }, { path: 'ground', pol: 0, n: 1, cx: 0.7 }, { path: 'dive', pol: 0, n: 5, cx: 0.5, delay: 90 }] },
  { at: 5460, kind: 'boss', pol: 0 },
]);



const HEARTFALL = Object.freeze([
  { at: 300, kind: 'wall', pol: 0, pol2: 1, rows: 4, cols: 9 },
  { at: 720, kind: 'skiffs', pol: 0, groups: [{ path: 'scurve', pol: 0, n: 3, cx: 0.3, dir: 1 }, { path: 'scurve', pol: 1, n: 3, cx: 0.7, dir: -1, delay: 60 }] },
  { at: 1140, kind: 'bulwark', pol: 0, groups: [{ path: 'slide', pol: 0, n: 1, cx: 0.3 }, { path: 'slide', pol: 1, n: 1, cx: 0.7 }] },
  { at: 1920, kind: 'darts', pol: 0, groups: [{ path: 'sweep', pol: 0, n: 4, dir: 1, cy: 0.14 }, { path: 'sweep', pol: 1, n: 4, dir: -1, cy: 0.26 }, { path: 'ground', pol: 0, n: 1, cx: 0.25, delay: 120 }, { path: 'ground', pol: 1, n: 1, cx: 0.75, delay: 120 }] },
  { at: 2340, kind: 'skiffs', pol: 1, groups: [{ path: 'scurve', pol: 1, n: 3, cx: 0.3, dir: 1 }, { path: 'scurve', pol: 0, n: 3, cx: 0.7, dir: -1, delay: 60 }, { path: 'slide', pol: 1, n: 1, cx: 0.5, delay: 120 }] },
  { at: 3120, kind: 'warden', pol: 1, groups: [{ path: 'warden', pol: 1, n: 1, cx: 0.5, armour: true }] },
  { at: 4680, kind: 'darts', pol: 0, groups: [{ path: 'dive', pol: 0, n: 3, cx: 0.3 }, { path: 'sweep', pol: 1, n: 4, dir: 1, cy: 0.16, delay: 90 }, { path: 'ground', pol: 0, n: 1, cx: 0.5, delay: 150 }] },
  { at: 5520, kind: 'boss', pol: 0 },
]);





export const STAGES = Object.freeze([
  Object.freeze({ name: 'Dustline', beats: BEATS, midAt: WARDEN_AT, bossAt: BOSS_AT, boss: FURNACE, bossHp: BOSS_HP, bossTime: BOSS_TIME }),
  Object.freeze({ name: 'Saltpan', beats: SALTPAN, midAt: 3900, bossAt: 7260, boss: LOOM, bossHp: 1300, bossTime: 6000 }),
  Object.freeze({ name: 'Foundry', beats: FOUNDRY, midAt: 3960, bossAt: 7320, boss: ANVIL, bossHp: 1400, bossTime: 6000 }),
  Object.freeze({ name: 'Twinsea', beats: TWINSEA, midAt: 1860, bossAt: 5460, boss: TWIN, bossHp: 760, bossTime: 6000 }),
  Object.freeze({ name: 'Heartfall', beats: HEARTFALL, midAt: 3120, bossAt: 5520, boss: CROWN, bossHp: 1250, bossTime: 7200 }),
]);


export const TALLY_TICKS = 720;









export const STREAM_FROM = 240;     
export const STREAM_EVERY = 80;     
export const SWOOP = 11, COLUMN = 12;

const FLIGHTS = [[SWOOP, 3, 4], [COLUMN, 3, 4], [SWOOP, 0, 3], [4, 3, 3], [SWOOP, 3, 4], [COLUMN, 0, 3]];


export function streamRests(st) {
  const rests = [[st.midAt - 60, st.midAt + MID_LIFE + 60], [st.bossAt - 120, Infinity]];
  for (const b of st.beats) if (b.kind === 'wall') rests.push([b.at - 30, b.at + 150]); 
  return rests;
}


export function streamWaves(st, seed) {
  const out = [], rests = streamRests(st);
  let f = 0;
  for (let at = STREAM_FROM; at < st.bossAt; at += STREAM_EVERY) {
    if (rests.some(([a, b]) => at >= a && at < b)) continue;
    const [path, k, n] = FLIGHTS[f % FLIGHTS.length];
    const h = hash32(seed, 61, f);
    const pol = (f >> 1) & 1;                  
    const dir = h & 1 ? 1 : -1;
    f++;
    for (let i = 0; i < n; i++) {
      let x, y = px(-24), t = at;
      if (path === SWOOP) { x = dir > 0 ? px(-20) : px(410); y = px(40 + (h % 60)); t += i * 12; }
      else if (path === COLUMN) { x = px(60 + (h % 270)); t += i * 14; }
      else { x = px(80 + (h % 230)); t += i * 22; }
      out.push({ at: t, kind: k ? 'skiff' : 'dart', k, path, pol, x, y, dir, flags: 0 });
    }
  }
  return out;
}

const memo = new Map();

export function stageWaves(n, seed) {
  const key = `${n}:${seed}`;
  let l = memo.get(key);
  if (!l) {
    const all = [...expandBeats(STAGES[n].beats, seed), ...streamWaves(STAGES[n], seed)];
    all.sort((a, b) => a.at - b.at); 
    l = Object.freeze(all.map(Object.freeze));
    if (memo.size > 32) memo.clear();
    memo.set(key, l);
  }
  return l;
}

export const stageCue = (n, lt) => cueAt(lt, STAGES[n].beats);


export function pathPos(path, x0, y0, dir, age) {
  if (path <= 3) return enemyPos(path, x0, y0, dir, age);
  if (path === SWOOP) { 
    return [x0 + dir * age * 3 * FP, y0 + Math.trunc((age * age * FP) / 110)];
  }
  if (path === COLUMN) { 
    return [x0 + Math.trunc((isin(age * 14) * dir * 18) / 256), y0 + age * 4 * FP];
  }
  if (path === 4 || path === 9) { 
    return [x0 + Math.trunc((isin(age * 10) * dir * 60) / 256), y0 + Math.trunc((age * 3 * FP) / 2)];
  }
  if (path === 5 || path === 8) { 
    const land = 150 * FP;
    if (age < 90) return [x0, y0 + muldiv(age, land - y0, 90)];
    if (age < 1200) return [x0, land];
    return [x0, land - (age - 1200) * 2 * FP];
  }
  if (path === 6) { 
    const land = 160 * FP;
    if (age < 120) return [x0, y0 + muldiv(age, land - y0, 120)];
    if (age < MID_LIFE) return [x0 + Math.trunc((isin((age - 120) * 5) * 110) / 256), land];
    return [x0, land - (age - MID_LIFE) * 2 * FP];
  }
  if (path === 10) { 
    const land = 170 * FP;
    if (age < 120) return [x0, y0 + muldiv(age, land - y0, 120)];
    if (age < MID_LIFE) return [x0 + Math.trunc((isin((age - 120) * 4) * 50) / 256), land];
    return [x0, land - (age - MID_LIFE) * 2 * FP];
  }
  
  const out = age < 60 ? age : 60;
  return [x0 + dir * out * 2 * FP + Math.trunc((isin(age * 10) * 30) / 256), y0 + Math.trunc((age * 3 * FP) / 2)];
}


export const liftedOff = (path, age, y) => y < -90 * FP && ((path === 3 && age > MID_LIFE) || ((path === 6 || path === 10) && age > MID_LIFE) ||
  ((path === 5 || path === 8) && age > 1200));


function launchTrio(kids, x, y, pol) {
  for (const dir of [-1, 0, 1]) kids.push({ k: SKIFF, path: 7, pol, x: x + dir * 12 * FP, y, dir });
}


export function fireAll(kind, path, pol, age, x, y, players, thin, out, kids) {
  if (kind <= 2) { enemyFire(kind, path, pol, age, x, y, players, thin, out); return; }
  if (y < 0 || y > FIRE_FLOOR) return;
  if (kind === SKIFF) return; 
  if (kind === BULWARK) {
    
    if (age >= 90 && age < 1200 && (age - 90) % 20 === 0) fan(out, x, y + 20 * FP, 3, 0, 160, 3 * FP / 2, pol, 1, thin);
    return;
  }
  if (kind === GUNSHIP && path === 8) {
    
    if (age < 90 || age >= 1200) return;
    const c = age - 90;
    if (c < 540) { if (c % 50 === 0) { const n = c / 50; ring(out, x, y + 20 * FP, 12, (n * ANG) / 24, 3 * FP / 2, n & 1, 1, thin); } }
    else if (c % 45 === 0) { const n = c / 45; fan(out, x, y + 20 * FP, 5, aimAt(players, x, y), 140, 5 * FP / 2, n & 1, 3, thin); }
    return;
  }
  if (kind === GUNSHIP && path === 10) {
    
    if (age >= 120 && age < MID_LIFE && (age - 120) % 50 === 0) fan(out, x, y + 20 * FP, 3, aimAt(players, x, y), 150, 2 * FP, pol, 3, thin);
    return;
  }
  if (kind === GUNSHIP) {
    if (age < 120 || age >= MID_LIFE) return;
    const c = age - 120;
    if (c % 30 === 0) { 
      const n = c / 30;
      const v = gentleSpeed(5 * FP / 2, thin);
      for (const ox of [-40, 40]) {
        if (thin && (ox < 0) === ((n & 1) === 1)) continue;
        out.push([x + ox * FP, y + 20 * FP, 0, v, n & 1, 2]);
      }
    }
    if (c % LAUNCH_EVERY === 60) launchTrio(kids, x, y + 30 * FP, Math.trunc(c / LAUNCH_EVERY) & 1);
  }
}


export const BOSS_BOX = [[150, 56], [140, 60], [150, 56], [150, 56], [150, 56]];


function loomFire(phase, fa, x, y, players, thin, out, kids) {
  if (phase === 0) {
    
    const every = thin ? 40 : 20;
    if (fa % every !== 0) return;
    const n = fa / every;
    const vx = (Math.trunc(n / 6) & 1 ? -1 : 1) * (FP / 2);
    const vy = gentleSpeed(2 * FP, thin);
    for (let i = 0; i < 6; i++) out.push([px(32 + i * 65), y + 40 * FP, vx, vy, i & 1, 1]);
    return;
  }
  if (phase === 1) {
    
    if (fa % LAUNCH_EVERY === 60) launchTrio(kids, x, y + 40 * FP, Math.trunc(fa / LAUNCH_EVERY) & 1);
    if (fa % (thin ? 12 : 6) !== 0) return;
    const a = Math.trunc((isin(fa * 10) * 700) / 65536);
    const v = gentleSpeed(5 * FP / 2, thin);
    for (let arm = 0; arm < 2; arm++) {
      const d = polar(angWrap(arm ? -a : a), v);
      out.push([x, y + 40 * FP, d.vx, d.vy, arm, 2]);
    }
    return;
  }
  
  if (fa % 60 !== 0) return;
  const n = fa / 60;
  const v = gentleSpeed(3 * FP / 2, thin);
  for (let i = 0; i < 7; i++) {
    if (thin && (i & 1)) continue;
    for (const side of [0, 1]) {
      const d = polar(angWrap(side ? ANG / 12 : -ANG / 12), v);
      out.push([px(15 + i * 60), y + 20 * FP, d.vx, d.vy, (n + side) & 1, 0]);
    }
  }
}


function anvilFire(phase, fa, x, y, players, thin, out) {
  if (phase === 0) {
    if (fa % 90 === 0) { const n = fa / 90; fan(out, x, y + 30 * FP, 5, aimAt(players, x, y), 140, 3 * FP, n & 1, 3, thin); }
    if (fa % 150 === 75) { const n = Math.trunc(fa / 150); ring(out, x, y + 30 * FP, 12, (n * ANG) / 24, 3 * FP / 2, (n + 1) & 1, 0, thin); }
    return;
  }
  if (phase === 1) {
    if (Math.trunc(fa / 60) % 3 === 2) return; 
    if (fa % (thin ? 10 : 5) !== 0) return;
    const a = angWrap(fa * 72), v = gentleSpeed(5 * FP / 2, thin);
    for (let arm = 0; arm < 2; arm++) ring(out, x, y + 30 * FP, 1, angWrap(a + arm * (ANG / 2)), v, arm, 2, false);
    return;
  }
  if (fa % 60 === 0) { const n = fa / 60; ring(out, x, y + 30 * FP, 16, (n * ANG) / 32, 2 * FP, n & 1, 1, thin); }
  if (fa % 60 === 30) { const n = Math.trunc(fa / 60); fan(out, x, y + 30 * FP, 5, aimAt(players, x, y), 120, 3 * FP, n & 1, 3, thin); }
}


export const twinPol = (side, phase) => (phase === 1 ? 1 - side : side);

export const TWIN_SPLIT = 75;


function twinFire(phase, fa, x, y, players, thin, out) {
  if (phase === 2) { 
    if (fa % (thin ? 8 : 4) !== 0) return;
    const a = angWrap(fa * 96), v = gentleSpeed(5 * FP / 2, thin);
    for (let arm = 0; arm < 2; arm++) ring(out, x, y + 30 * FP, 1, angWrap(a + arm * (ANG / 2)), v, 1, 2, false);
    return;
  }
  const hx = (side) => x + (side ? TWIN_SPLIT : -TWIN_SPLIT) * FP;
  if (phase === 0) {
    if (fa % 50 !== 0) return;
    const side = (fa / 50) & 1;
    ring(out, hx(side), y + 30 * FP, 12, ((fa / 50) * ANG) / 24, 3 * FP / 2, twinPol(side, 0), 1, thin);
    return;
  }
  if (fa % 60 !== 0) return;
  for (const side of [0, 1]) fan(out, hx(side), y + 30 * FP, 5, aimAt(players, hx(side), y), 130, 5 * FP / 2, twinPol(side, 1), 3, thin);
}


export const crownCore = (fa) => Math.trunc(fa / 240) & 1;
export const CROWN_SWITCH = 240;


function crownFire(phase, fa, seed, x, y, players, thin, out, kids) {
  if (phase === 0) { bossFire(0, fa, seed, x, y, players, thin, out); return; }
  if (phase === 1) { loomFire(1, fa, x, y, players, thin, out, kids); return; }
  if (phase === 2) { anvilFire(0, fa, x, y, players, thin, out); return; }
  const c = crownCore(fa);
  if (fa % CROWN_SWITCH < 30) return; 
  if (fa % 40 === 0) fan(out, x, y + 30 * FP, 5, aimAt(players, x, y), 130, 3 * FP, c, 3, thin);
  if (fa % 120 === 60) ring(out, x, y + 30 * FP, 12, ((fa / 120) * ANG) / 24, 3 * FP / 2, c, 1, thin);
}


export function bossFireAll(kind, phase, fa, seed, x, y, players, thin, out, kids) {
  if (kind === LOOM) loomFire(phase, fa, x, y, players, thin, out, kids);
  else if (kind === ANVIL) anvilFire(phase, fa, x, y, players, thin, out);
  else if (kind === TWIN) twinFire(phase, fa, x, y, players, thin, out);
  else if (kind === CROWN) crownFire(phase, fa, seed, x, y, players, thin, out, kids);
  else bossFire(phase, fa, seed, x, y, players, thin, out);
}


export function bossPhaseOf(kind, hp, max) {
  if (kind === TWIN) return hp * 2 > max ? 0 : hp * 4 > max ? 1 : 2;
  if (kind === CROWN) return hp * 4 > max * 3 ? 0 : hp * 2 > max ? 1 : hp * 4 > max ? 2 : 3;
  return bossPhase(hp, max);
}






export function bossDamage(kind, phase, fa, spol, sx, bx, dmg) {
  const plated = (kind === ANVIL && phase === 0) || (kind === CROWN && phase === 2);
  if (plated) return dmg > 1 ? dmg * 4 : dmg;
  if (kind === TWIN) {
    const pol = phase === 2 ? 1 : twinPol(sx < bx ? 0 : 1, phase);
    return spol === pol ? 0 : dmg;
  }
  if (kind === CROWN && phase === 3) return spol === crownCore(fa) ? 0 : dmg;
  return dmg;
}


export const bossShowsIris = (kind, phase, fa) => (kind === CROWN && phase === 3 ? crownCore(fa) === 1 : phase === 1);

export { BOSS_ENTER };
