















import { FP, muldiv } from './fixed.js';
import { MOVE_MAX, unpack } from './input.js';
import { FIELD_H, FIELD_W } from './patterns.js';
import { next as rngNext } from './rng.js';
import { ARMOUR, BOSS_ENTER, BOSS_REST, ENEMY_HP, ENEMY_R, ENEMY_SCORE, OTHER_ONLY, bossPhase, bossPos, isMid, rowSpawns } from './stage.js';
import {
  BOSS_BOX, STAGES, TALLY_TICKS, bossDamage, bossFireAll, bossPhaseOf, fireAll, liftedOff, pathPos, stageWaves,
} from './stages.js';

export const TICK_HZ = 60;
export const MAX_PLAYERS = 4;
export const BULLET_CAP = 2048;
export const SHOT_CAP = 256;
export const ENEMY_CAP = 48;
export const BOOM_RING = 16;





export const FIRE_RING = 64;

const SPEED = 9 * FP / 2;       
const FOCUS_SPEED = 2 * FP;
const HIT_R = 3 * FP;           
const ABSORB_R = 14 * FP;       
export const BULLET_R = [4 * FP, 6 * FP, 3 * FP, 5 * FP];
const SHOT_EVERY = 5;
const SHOT_SPEED = 14 * FP;
const INVULN = 120, GENTLE_SHIELD = 180;
const START_LIVES = 3, START_BOMBS = 2;
export const BURST_COST = 40;   











export const HEAT_MAX = 4, HEAT_START = 2, HEAT_CLEAN = 900;
export const thinAt = (gentle, heat, hard = false) => (hard ? false : gentle ? heat < 3 : heat === 0);


export const hardHp = (hp, hard) => (hard ? Math.max(1, muldiv(hp, 5, 4)) : hp);
export const bossMax = (S, n, hard) => hardHp(muldiv(S.bossHp, 1 + n, 2), hard);



export const NEXT_READY = 120;
const heatHp = (hp, heat) => Math.max(1, muldiv(hp, 8 + heat, 10));
const BURST_SHOTS = 8, BURST_DMG = 4, BURST_TURN = 64, BURST_VMAX = 6 * FP;





export const CHAIN_SET = 3;
export const chainBonus = (chain) => 100 << Math.min(chain - 1, 8);
export const burstDamage = (chain) => BURST_DMG + Math.min(chain, 8);

export const bossBonus = (stage) => 20000 + 10000 * stage;

export const BOOM_DEFLECT = 8, BOOM_BOSS = 9;








export const DUET_R = 64;
export const REVIVE_TICKS = 90;
const REVIVE_R = 30;
const POD_DRIFT = FP / 2;


export const teamScore = (s) => s.players.reduce((n, p) => n + (p.on ? p.score : 0), 0);


const SPAWN_X = [0.2, 0.4, 0.6, 0.8].map((f) => Math.round(FIELD_W * f));
const SPAWN_Y = FIELD_H - 120 * FP;

function newPlayer(i) {
  return { on: 0, x: SPAWN_X[i], y: SPAWN_Y, iris: 0, energy: 0, lives: START_LIVES, bombs: START_BOMBS, brl: 0,
    inv: 0, cool: 0, score: 0, bombHeld: 0, absorbed: 0, hits: 0, bursts: 0, kills: 0, duet: 0, pod: 0, rev: 0, revives: 0 };
}

const newBoss = () => ({ on: 0, kind: 0, hp: 0, max: 0, phase: 0, age: 0, fa: 0, rest: 0, x: FIELD_W >> 1, y: -120 * FP, kills: 0, beaten: 0 });

export function createSim({ seed = 1, gentle = true, hard = false, stage = 0 } = {}) {
  const st = Math.max(0, Math.min(STAGES.length - 1, stage | 0));
  return {
    tick: 0,
    stage: st,   
    st0: 0,      
    done: 0,     
    chain: 0, chainN: 0, chainPol: 0, maxChain: 0, sbest: 0, deflects: 0,
    bests: [0, 0, 0, 0, 0], 
    seed: seed | 0,
    gentle: gentle && !hard ? 1 : 0,
    hard: hard ? 1 : 0,
    rng: seed | 0,
    wi: 0,       
    clear: 0,    
    over: 0,     
    boss: newBoss(),
    players: [0, 1, 2, 3].map(newPlayer),
    
    nb: 0,
    bx: new Int32Array(BULLET_CAP), by: new Int32Array(BULLET_CAP),
    bvx: new Int32Array(BULLET_CAP), bvy: new Int32Array(BULLET_CAP),
    bpol: new Uint8Array(BULLET_CAP), bkind: new Uint8Array(BULLET_CAP),
    ns: 0,
    sx: new Int32Array(SHOT_CAP), sy: new Int32Array(SHOT_CAP), svx: new Int32Array(SHOT_CAP),
    sown: new Uint8Array(SHOT_CAP), sdmg: new Uint8Array(SHOT_CAP), spol: new Uint8Array(SHOT_CAP),
    ne: 0, serial: 0,
    ek: new Uint8Array(ENEMY_CAP), ep: new Uint8Array(ENEMY_CAP), epath: new Uint8Array(ENEMY_CAP),
    ehp: new Int32Array(ENEMY_CAP), eage: new Int32Array(ENEMY_CAP), eid: new Int32Array(ENEMY_CAP),
    ex0: new Int32Array(ENEMY_CAP), ey0: new Int32Array(ENEMY_CAP), edir: new Int8Array(ENEMY_CAP),
    ex: new Int32Array(ENEMY_CAP), ey: new Int32Array(ENEMY_CAP), ef: new Uint8Array(ENEMY_CAP),
    
    nboom: 0, boomX: new Int32Array(BOOM_RING), boomY: new Int32Array(BOOM_RING), boomK: new Uint8Array(BOOM_RING),
    nfire: 0, fireX: new Int32Array(FIRE_RING), fireY: new Int32Array(FIRE_RING), fireP: new Uint8Array(FIRE_RING),
    sparks: 0, 
    
    nbomb: 0, bombT: 0, bombX: 0, bombY: 0, bombPol: 0, bombSeat: 0, bombCut: 0,
    
    heat: HEAT_START, calm: 0, bossN: 0,
  };
}

const clampX = (v) => (v < 8 * FP ? 8 * FP : v > FIELD_W - 8 * FP ? FIELD_W - 8 * FP : v);
const clampY = (v) => (v < 60 * FP ? 60 * FP : v > FIELD_H - 24 * FP ? FIELD_H - 24 * FP : v);


function d2px(ax, ay, bx, by) {
  const dx = (ax - bx) >> 8, dy = (ay - by) >> 8;
  return dx * dx + dy * dy;
}

function removeBullet(s, i) {
  const j = --s.nb;
  s.bx[i] = s.bx[j]; s.by[i] = s.by[j]; s.bvx[i] = s.bvx[j]; s.bvy[i] = s.bvy[j];
  s.bpol[i] = s.bpol[j]; s.bkind[i] = s.bkind[j];
}

function removeShot(s, i) {
  const j = --s.ns;
  s.sx[i] = s.sx[j]; s.sy[i] = s.sy[j]; s.svx[i] = s.svx[j]; s.sown[i] = s.sown[j]; s.sdmg[i] = s.sdmg[j]; s.spol[i] = s.spol[j];
}

const ENEMY_ARRAYS = ['ek', 'ep', 'epath', 'ehp', 'eage', 'eid', 'ex0', 'ey0', 'edir', 'ex', 'ey', 'ef'];
function removeEnemy(s, i) {
  const j = --s.ne;
  for (const k of ENEMY_ARRAYS) s[k][i] = s[k][j];
}

function boom(s, x, y, kind) {
  const n = s.nboom % BOOM_RING;
  s.boomX[n] = x; s.boomY[n] = y; s.boomK[n] = kind; s.nboom++;
}

function addShot(s, x, y, vx, owner, dmg, pol) {
  if (s.ns >= SHOT_CAP) return;
  const n = s.ns++;
  s.sx[n] = x; s.sy[n] = y; s.svx[n] = vx; s.sown[n] = owner; s.sdmg[n] = dmg; s.spol[n] = pol;
}


function addEnemy(s, w) {
  if (s.ne >= ENEMY_CAP) return;
  const e = s.ne++;
  const kind = w.k;
  const scale = isMid(kind) ? 1 + presentCount(s) : 2;
  s.ek[e] = kind; s.ep[e] = w.pol; s.epath[e] = w.path; s.ehp[e] = hardHp(heatHp(muldiv(w.hp || ENEMY_HP[kind], scale, 2), s.heat), s.hard === 1); 
  s.eage[e] = 0; s.eid[e] = ++s.serial; s.ex0[e] = w.x; s.ey0[e] = w.y; s.edir[e] = w.dir; s.ef[e] = w.flags | 0;
  s.ex[e] = w.x; s.ey[e] = w.y;
}


function chainKill(s, owner, pol) {
  if (s.chainN > 0 && s.chainPol !== pol) { s.chain = 0; s.chainN = 0; } 
  s.chainPol = pol;
  if (++s.chainN < CHAIN_SET) return;
  s.chainN = 0;
  s.chain++;
  owner.score += chainBonus(s.chain);
  if (s.chain > s.maxChain) s.maxChain = s.chain;
  if (s.chain > s.sbest) s.sbest = s.chain;
  if (s.chain > s.bests[s.stage]) s.bests[s.stage] = s.chain;
}


function nextStage(s, t) {
  if (s.stage + 1 >= STAGES.length) { s.done = t; return; }
  s.stage++; s.st0 = t + 1; s.wi = 0; s.clear = 0;
  s.boss = newBoss();
  s.nb = 0; s.ns = 0; s.ne = 0;
  s.chain = 0; s.chainN = 0; s.sbest = 0;
  for (const p of s.players) { p.bombs = Math.max(p.bombs, START_BOMBS); if (p.on && p.lives > 0) p.inv = INVULN; }
}

function pushSpawns(s, list) {
  for (const [x, y, vx, vy, pol, kind] of list) {
    if (s.nb >= BULLET_CAP) break;
    const n = s.nb++;
    s.bx[n] = x; s.by[n] = y; s.bvx[n] = vx; s.bvy[n] = vy; s.bpol[n] = pol; s.bkind[n] = kind;
    
    const last = (s.nfire - 1) & (FIRE_RING - 1);
    if (s.nfire && s.fireX[last] === x && s.fireY[last] === y) continue;
    const f = s.nfire & (FIRE_RING - 1);
    s.fireX[f] = x; s.fireY[f] = y; s.fireP[f] = pol; s.nfire++;
  }
}

const bossHittable = (s) => s.boss.on && s.boss.age >= BOSS_ENTER;

export const stageOf = (s) => STAGES[s.stage];

export const stageTick = (s) => s.tick - s.st0;
const presentCount = (s) => s.players.reduce((n, p) => n + (p.on ? 1 : 0), 0);


function burstTarget(s, x, y) {
  if (bossHittable(s)) return [s.boss.x, s.boss.y];
  let best = -1, bd = Infinity;
  for (let e = 0; e < s.ne; e++) {
    if (s.ey[e] < 0) continue;
    const d = d2px(x, y, s.ex[e], s.ey[e]);
    if (d < bd) { bd = d; best = e; }
  }
  return best < 0 ? null : [s.ex[best], s.ey[best]];
}














export const BOMB_DMG = 24, BOMB_CUT_SCORE = 10, BOMB_INV = 90;
function bomb(s, i, p, t) {
  p.bombs--;
  p.brl = 0; 
  p.inv = Math.max(p.inv, BOMB_INV);
  const cut = s.nb;
  s.nb = 0;
  p.score += BOMB_CUT_SCORE * cut;
  for (let e = s.ne - 1; e >= 0; e--) {
    if (s.ey[e] < 0 || s.ey[e] > FIELD_H || s.ex[e] < 0 || s.ex[e] > FIELD_W) continue; 
    s.ehp[e] -= BOMB_DMG;
    if (s.ehp[e] <= 0) {
      p.score += ENEMY_SCORE[s.ek[e]]; p.kills++;
      boom(s, s.ex[e], s.ey[e], s.ek[e]);
      removeEnemy(s, e);
    }
  }
  if (bossHittable(s)) {
    const B = s.boss;
    const hurt = Math.min(Math.max(1, (B.max / 10) | 0), B.hp - 1);
    if (hurt > 0) { B.hp -= hurt; p.score += 10 * hurt; bossPhaseCheck(s); }
  }
  s.nbomb++; s.bombT = t; s.bombX = p.x; s.bombY = p.y; s.bombPol = p.iris; s.bombCut = cut; s.bombSeat = i;
}













export const BOMB_RELOAD = 60 * 60;
export function bombReload(s, p, ended) {
  if (s.hard === 1 || ended || p.bombs >= START_BOMBS || p.inv > 0) return;
  const B = s.boss;
  if (B.on && B.phase === bossPhaseOf(B.kind, 1, B.max)) return;
  p.brl = (p.brl | 0) + 1;
  if (p.brl >= BOMB_RELOAD) { p.brl = 0; p.bombs++; }
}


function bossPhaseCheck(s) {
  const B = s.boss;
  const ph = bossPhaseOf(B.kind, B.hp, B.max);
  if (ph !== B.phase) { B.phase = ph; B.fa = 0; B.rest = BOSS_REST; s.nb = 0; }
}





export function step(s, inputs) {
  const t = s.tick;
  const lt = t - s.st0;
  const S = STAGES[s.stage];
  const ended = s.clear > 0 || s.over > 0;
  const thin = thinAt(s.gentle === 1, s.heat, s.hard === 1);
  let next = false;

  
  for (let i = 0; i < MAX_PLAYERS; i++) {
    const p = s.players[i];
    const k = unpack(inputs[i] >>> 0);
    if (!k.present) { p.on = 0; continue; }
    if (k.next) next = true;
    if (!p.on) { Object.assign(p, newPlayer(i), { on: 1, score: p.score, inv: INVULN }); }
    if (p.lives <= 0) { 
      if (p.pod) p.y = clampY(p.y + POD_DRIFT);
      continue;
    }
    const sp = k.focus ? FOCUS_SPEED : SPEED;
    p.x = clampX(p.x + muldiv(k.x, sp, MOVE_MAX));
    p.y = clampY(p.y + muldiv(k.y, sp, MOVE_MAX));
    p.iris = k.iris ? 1 : 0;
    if (p.inv > 0) p.inv--;
    if (k.bomb && !p.bombHeld && p.bombs > 0 && !ended) bomb(s, i, p, t);
    p.bombHeld = k.bomb ? 1 : 0;
    bombReload(s, p, ended);
    if (p.energy >= BURST_COST && !ended) {
      
      p.energy -= BURST_COST; p.bursts++;
      const dmg = burstDamage(s.chain);
      for (let n = 0; n < BURST_SHOTS; n++) addShot(s, p.x, p.y - 8 * FP, (n - (BURST_SHOTS - 1) / 2) * FP, i, dmg, p.iris);
    }
    if (p.cool > 0) p.cool--;
    else if (s.ns + 2 <= SHOT_CAP && !ended) {
      p.cool = SHOT_EVERY;
      for (const ox of [-6 * FP, 6 * FP]) addShot(s, p.x + ox, p.y - 10 * FP, 0, i, 1, p.iris);
    }
  }

  
  for (let i = 0; i < MAX_PLAYERS; i++) {
    const p = s.players[i];
    if (!p.on || !p.pod) continue;
    let touched = false;
    for (let j = 0; j < MAX_PLAYERS && !touched; j++) {
      const q = s.players[j];
      touched = j !== i && q.on && q.lives > 0 && d2px(p.x, p.y, q.x, q.y) < REVIVE_R * REVIVE_R;
    }
    p.rev = touched ? p.rev + 1 : 0;
    if (p.rev >= REVIVE_TICKS) { p.pod = 0; p.rev = 0; p.lives = 1; p.inv = INVULN; p.revives++; }
  }
  for (const p of s.players) p.duet = 0;
  for (let i = 0; i < MAX_PLAYERS; i++) {
    const p = s.players[i];
    if (!p.on || p.lives <= 0 || p.duet) continue;
    let best = -1, bd = DUET_R * DUET_R;
    for (let j = i + 1; j < MAX_PLAYERS; j++) {
      const q = s.players[j];
      if (!q.on || q.lives <= 0 || q.duet || q.iris === p.iris) continue;
      const d = d2px(p.x, p.y, q.x, q.y);
      if (d < bd) { bd = d; best = j; }
    }
    if (best >= 0) { p.duet = best + 1; s.players[best].duet = i + 1; }
  }

  
  const spawns = [], kids = [];
  if (!ended) {
    const list = stageWaves(s.stage, s.seed);
    while (s.wi < list.length && list[s.wi].at <= lt) {
      const w = list[s.wi++];
      if (w.at < lt) continue; 
      if (w.kind === 'row') { rowSpawns(w, spawns); continue; }
      addEnemy(s, w);
    }
    if (lt === S.bossAt) {
      const max = bossMax(S, Math.max(1, presentCount(s)), s.hard === 1);
      Object.assign(s.boss, { on: 1, kind: S.boss, hp: max, max, phase: 0, age: 0, fa: 0, rest: 0 });
      s.bossN = Math.max(1, presentCount(s));
    }
  }
  
  
  if (s.boss.on && s.boss.hp > 0 && !ended) {
    const n = Math.max(1, presentCount(s));
    if (s.bossN > 0 && n !== s.bossN) { 
      const max = bossMax(S, n, s.hard === 1);
      s.boss.hp = Math.max(1, muldiv(s.boss.hp, max, s.boss.max));
      s.boss.max = max;
      s.bossN = n;
    }
  }
  
  if (!ended && presentCount(s) > 0 && t - s.calm >= HEAT_CLEAN) { s.calm = t; if (s.heat < HEAT_MAX) s.heat++; }

  
  for (let e = s.ne - 1; e >= 0; e--) {
    const age = s.eage[e];
    const [x, y] = pathPos(s.epath[e], s.ex0[e], s.ey0[e], s.edir[e], age);
    s.ex[e] = x; s.ey[e] = y;
    const gone = y > FIELD_H + 60 * FP || x < -60 * FP || x > FIELD_W + 60 * FP || liftedOff(s.epath[e], age, y);
    if (gone) { removeEnemy(s, e); continue; }
    if (!ended) fireAll(s.ek[e], s.epath[e], s.ep[e], age, x, y, s.players, thin, spawns, kids);
    s.eage[e] = age + 1;
  }

  
  const B = s.boss;
  if (B.on) {
    const [x, y] = bossPos(B.age);
    B.x = x; B.y = y;
    if (B.age >= S.bossTime) { B.on = 0; s.clear = t; }
    else if (B.age >= BOSS_ENTER) {
      if (B.rest > 0) B.rest--;
      else if (!ended) { bossFireAll(B.kind, B.phase, B.fa, s.seed, x, y, s.players, thin, spawns, kids); B.fa++; }
    }
    B.age++;
  }
  pushSpawns(s, spawns);
  for (const w of kids) addEnemy(s, w);

  
  for (let i = s.ns - 1; i >= 0; i--) {
    if (s.sdmg[i] > 1) {
      const tg = burstTarget(s, s.sx[i], s.sy[i]);
      if (tg) {
        const dx = tg[0] - s.sx[i];
        s.svx[i] += dx > 0 ? BURST_TURN * 4 : dx < 0 ? -BURST_TURN * 4 : 0;
        if (s.svx[i] > BURST_VMAX) s.svx[i] = BURST_VMAX; else if (s.svx[i] < -BURST_VMAX) s.svx[i] = -BURST_VMAX;
      }
    }
    s.sx[i] += s.svx[i];
    s.sy[i] -= SHOT_SPEED;
    if (s.sy[i] < -20 * FP || s.sx[i] < -20 * FP || s.sx[i] > FIELD_W + 20 * FP) { removeShot(s, i); continue; }
    const owner = s.players[s.sown[i]];
    const dmg = s.sdmg[i];
    const [bw, bh] = BOSS_BOX[B.kind];
    if (bossHittable(s) && Math.abs(s.sx[i] - B.x) < bw * FP && Math.abs(s.sy[i] - B.y) < bh * FP) {
      const hurt = bossDamage(B.kind, B.phase, B.fa, s.spol[i], s.sx[i], B.x, dmg);
      if (hurt === 0) { 
        s.deflects++;
        boom(s, s.sx[i], s.sy[i], BOOM_DEFLECT);
        removeShot(s, i);
        continue;
      }
      owner.score += 10 * hurt;
      B.hp -= hurt;
      if (B.hp <= 0) {
        B.on = 0; B.kills++; B.beaten = 1; s.clear = t; owner.score += bossBonus(s.stage); owner.kills++;
        boom(s, B.x, B.y, BOOM_BOSS);
      } else bossPhaseCheck(s);
      removeShot(s, i);
      continue;
    }
    for (let e = 0; e < s.ne; e++) {
      const r = ENEMY_R[s.ek[e]];
      if (s.ey[e] < -20 * FP || d2px(s.sx[i], s.sy[i], s.ex[e], s.ey[e]) >= r * r) continue;
      if ((s.ef[e] & OTHER_ONLY) && s.spol[i] === s.ep[e]) { 
        s.deflects++;
        boom(s, s.sx[i], s.sy[i], BOOM_DEFLECT);
        removeShot(s, i);
        break;
      }
      s.ehp[e] -= (s.ef[e] & ARMOUR) && dmg > 1 ? dmg * 4 : dmg;
      owner.score += 10;
      if (s.ehp[e] <= 0) {
        owner.score += ENEMY_SCORE[s.ek[e]]; owner.kills++;
        chainKill(s, owner, s.ep[e]);
        boom(s, s.ex[e], s.ey[e], s.ek[e]);
        removeEnemy(s, e);
      }
      removeShot(s, i);
      break;
    }
  }

  
  for (let b = s.nb - 1; b >= 0; b--) {
    s.bx[b] += s.bvx[b]; s.by[b] += s.bvy[b];
    const x = s.bx[b], y = s.by[b];
    if (x < -16 * FP || x > FIELD_W + 16 * FP || y < -16 * FP || y > FIELD_H + 16 * FP) { removeBullet(s, b); continue; }
    for (let i = 0; i < MAX_PLAYERS; i++) {
      const p = s.players[i];
      if (!p.on || p.lives <= 0) continue;
      const d = d2px(x, y, p.x, p.y);
      if (s.bpol[b] === p.iris || p.duet) { 
        if (d < (ABSORB_R >> 8) ** 2) {
          p.energy = Math.min(p.energy + 1, 999); p.absorbed++; p.score += 5;
          const [r, u] = rngNext(s.rng); s.rng = r; s.sparks += 1 + (u & 3);
          removeBullet(s, b); break;
        }
      } else {
        const rr = (HIT_R + BULLET_R[s.bkind[b]]) >> 8;
        if (d < rr * rr && p.inv === 0) {
          p.hits++;
          if (s.heat > 0) s.heat--;
          s.calm = t;
          if (s.gentle) p.inv = GENTLE_SHIELD; 
          else { p.lives--; p.inv = INVULN; if (p.lives <= 0) { p.pod = 1; p.rev = 0; p.duet = 0; } }
          removeBullet(s, b); break;
        }
      }
    }
  }

  
  if (s.clear > 0) s.nb = 0;
  if (!s.gentle && !s.over && !s.clear) {
    let flying = 0, alive = 0;
    for (const p of s.players) if (p.on) { flying++; if (p.lives > 0) alive++; }
    if (flying > 0 && alive === 0) s.over = t;
  }
  
  
  if (s.clear > 0 && !s.over && !s.done) {
    const last = s.stage + 1 >= STAGES.length;
    if (last ? t >= s.clear + TALLY_TICKS : next && t >= s.clear + NEXT_READY) nextStage(s, t);
  }

  s.tick = t + 1;
  return s;
}

const ARRAYS = ['bx', 'by', 'bvx', 'bvy', 'bpol', 'bkind', 'sx', 'sy', 'svx', 'sown', 'sdmg', 'spol', ...ENEMY_ARRAYS, 'boomX', 'boomY', 'boomK',
  'fireX', 'fireY', 'fireP'];


export function snapshot(s) {
  const c = { ...s, boss: { ...s.boss }, players: s.players.map((p) => ({ ...p })), bests: s.bests.slice() };
  for (const k of ARRAYS) c[k] = s[k].slice();
  return c;
}

const TYPED = { Int32Array, Uint8Array, Int8Array };






export function serialize(s) {
  const o = { ...s, boss: { ...s.boss }, players: s.players.map((p) => ({ ...p })), bests: s.bests.slice() };
  for (const k of ARRAYS) o[k] = { $t: s[k].constructor.name, n: s[k].length, v: Array.from(s[k]) };
  return o;
}

export function deserialize(o) {
  const s = { ...o, boss: { ...o.boss }, players: o.players.map((p) => ({ ...p })), bests: o.bests.slice() };
  for (const k of ARRAYS) {
    
    if (!o[k] && k.startsWith('fire')) { s[k] = k === 'fireP' ? new Uint8Array(FIRE_RING) : new Int32Array(FIRE_RING); s.nfire = 0; continue; }
    const T = TYPED[o[k].$t];
    if (!T) throw new Error('serialize: unknown array ' + k);
    const a = new T(o[k].n);
    a.set(o[k].v);
    s[k] = a;
  }
  if (s.hard === undefined) s.hard = 0;
  for (const p of s.players) if (p.brl === undefined) p.brl = 0; 
  return s;
}

const PLAYER_KEYS = ['on', 'x', 'y', 'iris', 'energy', 'lives', 'bombs', 'inv', 'cool', 'score', 'bombHeld', 'absorbed', 'hits',
  'bursts', 'kills', 'duet', 'pod', 'rev', 'revives', 'brl'];
const BOSS_KEYS = ['on', 'kind', 'hp', 'max', 'phase', 'age', 'fa', 'rest', 'x', 'y', 'kills', 'beaten'];


export function stateHash(s) {
  let h = 0x811c9dc5;
  const add = (v) => { h = Math.imul(h ^ (v | 0), 0x01000193); };
  add(s.tick); add(s.seed); add(s.gentle); add(s.hard); add(s.rng); add(s.sparks); add(s.wi); add(s.clear); add(s.over);
  add(s.stage); add(s.st0); add(s.done); add(s.chain); add(s.chainN); add(s.chainPol); add(s.maxChain); add(s.sbest);
  add(s.deflects); for (const b of s.bests) add(b);
  for (const k of BOSS_KEYS) add(s.boss[k]);
  for (const p of s.players) for (const k of PLAYER_KEYS) add(p[k]);
  add(s.nb);
  for (let i = 0; i < s.nb; i++) { add(s.bx[i]); add(s.by[i]); add(s.bvx[i]); add(s.bvy[i]); add(s.bpol[i]); add(s.bkind[i]); }
  add(s.ns);
  for (let i = 0; i < s.ns; i++) { add(s.sx[i]); add(s.sy[i]); add(s.svx[i]); add(s.sown[i]); add(s.sdmg[i]); add(s.spol[i]); }
  add(s.ne); add(s.serial);
  for (let i = 0; i < s.ne; i++) for (const k of ENEMY_ARRAYS) add(s[k][i]);
  add(s.nboom);
  add(s.heat); add(s.calm); add(s.bossN);
  add(s.nbomb); add(s.bombT); add(s.bombX); add(s.bombY); add(s.bombPol); add(s.bombSeat); add(s.bombCut);
  return h >>> 0;
}
