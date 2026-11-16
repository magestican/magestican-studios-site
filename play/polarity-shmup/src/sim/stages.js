








import { ANG, FP, angWrap, isin, muldiv, polar } from './fixed.js';
import { fan, gentleSpeed } from './patterns.js';
import {
  BEATS, BOSS_AT, BOSS_ENTER, BOSS_HP, BOSS_TIME, BULWARK, FIRE_FLOOR, GUNSHIP, LAUNCH_EVERY, MID_LIFE, SKIFF, WARDEN_AT,
  bossFire, cueAt, enemyFire, enemyPos, expandBeats,
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





export const STAGES = Object.freeze([
  Object.freeze({ name: 'Dustline', beats: BEATS, midAt: WARDEN_AT, bossAt: BOSS_AT, boss: FURNACE, bossHp: BOSS_HP, bossTime: BOSS_TIME }),
  Object.freeze({ name: 'Saltpan', beats: SALTPAN, midAt: 3900, bossAt: 7260, boss: LOOM, bossHp: 1300, bossTime: 6000 }),
]);


export const TALLY_TICKS = 720;

const memo = new Map();

export function stageWaves(n, seed) {
  const key = `${n}:${seed}`;
  let l = memo.get(key);
  if (!l) {
    l = Object.freeze(expandBeats(STAGES[n].beats, seed).map(Object.freeze));
    if (memo.size > 32) memo.clear();
    memo.set(key, l);
  }
  return l;
}

export const stageCue = (n, lt) => cueAt(lt, STAGES[n].beats);


export function pathPos(path, x0, y0, dir, age) {
  if (path <= 3) return enemyPos(path, x0, y0, dir, age);
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
  
  const out = age < 60 ? age : 60;
  return [x0 + dir * out * 2 * FP + Math.trunc((isin(age * 10) * 30) / 256), y0 + Math.trunc((age * 3 * FP) / 2)];
}


export const liftedOff = (path, age, y) => y < -90 * FP && ((path === 3 && age > MID_LIFE) || (path === 6 && age > MID_LIFE) ||
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


export function bossFireAll(kind, phase, fa, seed, x, y, players, thin, out, kids) {
  if (kind === LOOM) loomFire(phase, fa, x, y, players, thin, out, kids);
  else bossFire(phase, fa, seed, x, y, players, thin, out);
}

export { BOSS_ENTER };
