










import { FP, muldiv } from './fixed.js';
import { MOVE_MAX, unpack } from './input.js';
import { FIELD_H, FIELD_W, bossAt, spawnsAt } from './patterns.js';
import { next as rngNext } from './rng.js';

export const TICK_HZ = 60;
export const MAX_PLAYERS = 4;
export const BULLET_CAP = 2048;
export const SHOT_CAP = 256;

const SPEED = 9 * FP / 2;       
const FOCUS_SPEED = 2 * FP;
const HIT_R = 3 * FP;           
const ABSORB_R = 14 * FP;       
const BULLET_R = [4 * FP, 6 * FP, 3 * FP, 5 * FP];
const SHOT_EVERY = 5;
const SHOT_SPEED = 14 * FP;
const BOSS_R = 44 * FP;
const BOSS_HP = 3000;
const INVULN = 120;
const BOMB_R = 160 * FP;
const START_LIVES = 3, START_BOMBS = 2;


const SPAWN_X = [0.2, 0.4, 0.6, 0.8].map((f) => Math.round(FIELD_W * f));
const SPAWN_Y = FIELD_H - 120 * FP;

function newPlayer(i) {
  return { on: 0, x: SPAWN_X[i], y: SPAWN_Y, iris: 0, energy: 0, lives: START_LIVES, bombs: START_BOMBS,
    inv: 0, cool: 0, score: 0, bombHeld: 0, absorbed: 0, hits: 0 };
}

export function createSim({ seed = 1 } = {}) {
  return {
    tick: 0,
    seed: seed | 0,
    rng: seed | 0,
    boss: { hp: BOSS_HP, x: bossAt(0).x, y: bossAt(0).y, kills: 0 },
    players: [0, 1, 2, 3].map(newPlayer),
    
    nb: 0,
    bx: new Int32Array(BULLET_CAP), by: new Int32Array(BULLET_CAP),
    bvx: new Int32Array(BULLET_CAP), bvy: new Int32Array(BULLET_CAP),
    bpol: new Uint8Array(BULLET_CAP), bkind: new Uint8Array(BULLET_CAP),
    ns: 0,
    sx: new Int32Array(SHOT_CAP), sy: new Int32Array(SHOT_CAP), sown: new Uint8Array(SHOT_CAP),
    sparks: 0, 
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
  s.sx[i] = s.sx[j]; s.sy[i] = s.sy[j]; s.sown[i] = s.sown[j];
}





export function step(s, inputs) {
  const t = s.tick;

  
  for (let i = 0; i < MAX_PLAYERS; i++) {
    const p = s.players[i];
    const k = unpack(inputs[i] >>> 0);
    if (!k.present) { p.on = 0; continue; }
    if (!p.on) { Object.assign(p, newPlayer(i), { on: 1, score: p.score, inv: INVULN }); }
    if (p.lives <= 0) continue; 
    const sp = k.focus ? FOCUS_SPEED : SPEED;
    p.x = clampX(p.x + muldiv(k.x, sp, MOVE_MAX));
    p.y = clampY(p.y + muldiv(k.y, sp, MOVE_MAX));
    p.iris = k.iris ? 1 : 0;
    if (p.inv > 0) p.inv--;
    if (k.bomb && !p.bombHeld && p.bombs > 0) {
      p.bombs--;
      p.inv = Math.max(p.inv, 60);
      for (let b = s.nb - 1; b >= 0; b--) if (d2px(s.bx[b], s.by[b], p.x, p.y) < (BOMB_R >> 8) ** 2) removeBullet(s, b);
    }
    p.bombHeld = k.bomb ? 1 : 0;
    if (p.cool > 0) p.cool--;
    else if (s.ns + 2 <= SHOT_CAP) {
      p.cool = SHOT_EVERY;
      for (const ox of [-6 * FP, 6 * FP]) { s.sx[s.ns] = p.x + ox; s.sy[s.ns] = p.y - 10 * FP; s.sown[s.ns] = i; s.ns++; }
    }
  }

  
  const bp = bossAt(t);
  s.boss.x = bp.x; s.boss.y = bp.y;
  for (const [x, y, vx, vy, pol, kind] of spawnsAt(t, s.seed, s.players)) {
    if (s.nb >= BULLET_CAP) break;
    const n = s.nb++;
    s.bx[n] = x; s.by[n] = y; s.bvx[n] = vx; s.bvy[n] = vy; s.bpol[n] = pol; s.bkind[n] = kind;
  }

  
  for (let i = s.ns - 1; i >= 0; i--) {
    s.sy[i] -= SHOT_SPEED;
    if (s.sy[i] < 0) { removeShot(s, i); continue; }
    if (d2px(s.sx[i], s.sy[i], s.boss.x, s.boss.y) < (BOSS_R >> 8) ** 2) {
      const owner = s.players[s.sown[i]];
      owner.score += 10;
      if (--s.boss.hp <= 0) { s.boss.kills++; s.boss.hp = BOSS_HP + s.boss.kills * 500; owner.score += 5000; }
      removeShot(s, i);
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
      if (s.bpol[b] === p.iris) {
        if (d < (ABSORB_R >> 8) ** 2) {
          p.energy = Math.min(p.energy + 1, 999); p.absorbed++; p.score += 1;
          const [r, u] = rngNext(s.rng); s.rng = r; s.sparks += 1 + (u & 3);
          removeBullet(s, b); break;
        }
      } else {
        const rr = (HIT_R + BULLET_R[s.bkind[b]]) >> 8;
        if (d < rr * rr && p.inv === 0) {
          p.lives--; p.hits++; p.inv = INVULN;
          removeBullet(s, b); break;
        }
      }
    }
  }

  s.tick = t + 1;
  return s;
}


export function snapshot(s) {
  return {
    ...s,
    boss: { ...s.boss },
    players: s.players.map((p) => ({ ...p })),
    bx: s.bx.slice(), by: s.by.slice(), bvx: s.bvx.slice(), bvy: s.bvy.slice(), bpol: s.bpol.slice(), bkind: s.bkind.slice(),
    sx: s.sx.slice(), sy: s.sy.slice(), sown: s.sown.slice(),
  };
}

const PLAYER_KEYS = ['on', 'x', 'y', 'iris', 'energy', 'lives', 'bombs', 'inv', 'cool', 'score', 'bombHeld', 'absorbed', 'hits'];


export function stateHash(s) {
  let h = 0x811c9dc5;
  const add = (v) => { h = Math.imul(h ^ (v | 0), 0x01000193); };
  add(s.tick); add(s.seed); add(s.rng); add(s.sparks);
  add(s.boss.hp); add(s.boss.x); add(s.boss.y); add(s.boss.kills);
  for (const p of s.players) for (const k of PLAYER_KEYS) add(p[k]);
  add(s.nb);
  for (let i = 0; i < s.nb; i++) { add(s.bx[i]); add(s.by[i]); add(s.bvx[i]); add(s.bvy[i]); add(s.bpol[i]); add(s.bkind[i]); }
  add(s.ns);
  for (let i = 0; i < s.ns; i++) { add(s.sx[i]); add(s.sy[i]); add(s.sown[i]); }
  return h >>> 0;
}
