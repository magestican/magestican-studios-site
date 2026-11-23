














import { ANG, FP, ONE, iatan2, isin, muldiv, polar } from './fixed.js';
import { hash32 } from './rng.js';
import { unpack } from './input.js';
import { COLS, MAX_ROWS, WINDOWS } from './windows.js';

export const TICK_HZ = 60;
export const MAX_PLAYERS = 4;


export const FIELD_W = 720, FIELD_H = 1280;
export const LEFT = 24, CW = 56, TOP = 170, CH = 30, GAP = 2;
export const PADDLE_Y = 1150, PADDLE_H = 18, PADDLE_HW = 66, WIDE_HW = 104;
export const DANGER_Y = 1070;

export const HOLD_BAND = 200, HOLD_PCT = 40;
export const SHIELD_Y = 1215;
export const ECHO_Y = 104, ECHO_HW = 70;
export const EMBER_R = 11;
export const BOSS_Y = 420, BOSS_CORE_R = 46;

export const PH_PLAY = 0, PH_CLEAR = 1, PH_FAIL = 2, PH_DONE = 3;
export const MODE_GENTLE = 0, MODE_NORMAL = 1, MODE_HARD = 2;


export const C_EMPTY = 0, C_GLASS = 1, C_CATH = 2, C_LEAD = 3, C_IRON = 4, C_MIRROR = 5, C_SUN = 6, C_BEAD = 7;

export const paneValue = (t, chain) =>
  (t === C_SUN ? 200 : t === C_LEAD ? 30 : t === C_CATH ? 20 : 10) * (1 + Math.min(chain, 12));
const CELL_OF = { r: [C_GLASS, 0], g: [C_GLASS, 1], b: [C_GLASS, 2], R: [C_CATH, 0], G: [C_CATH, 1], B: [C_CATH, 2],
  L: [C_LEAD, 3], X: [C_IRON, 3], M: [C_MIRROR, 3], S: [C_SUN, 3], '*': [C_BEAD, 3] };
export const CELL_HP = [0, 1, 2, 3, 99, 2, 1, 1];

const tintable = (t) => t === C_GLASS || t === C_CATH;


export const E_LEADLING = 0, E_MOTH = 1, E_SHARDLING = 2, E_WARDEN = 3, E_BELL = 4;
export const ENEMY_KIND = { leadling: E_LEADLING, moth: E_MOTH, shardling: E_SHARDLING, warden: E_WARDEN, bell: E_BELL };
export const ENEMY_R = [15, 11, 17, 21, 19];
export const ENEMY_HP = [1, 1, 2, 4, 3];
export const ENEMY_LIGHT = [40, 25, 60, 90, 80];
export const ENTER_TICKS = 60;


export const K_WIDE = 0, K_TWIN = 1, K_SLOW = 2, K_LANCE = 3, K_CATCH = 4, K_SHIELD = 5, K_LIGHT = 6;
export const CAPSULE_KINDS = 7;
export const CAP_TICKS = 720;


export const BOSSES = Object.freeze({
  rose:   { hp: 32, guards: 10, orbit: 112, rot: 9,   bolt: 210, fan: 3, ring: 0,   spawn: 0,  regrow: 0,   echo: false },
  bell:   { hp: 40, guards: 8,  orbit: 104, rot: -11, bolt: 240, fan: 5, ring: 320, spawn: 0,  regrow: 0,   echo: false },
  echo:   { hp: 44, guards: 12, orbit: 122, rot: 13,  bolt: 190, fan: 3, ring: 0,   spawn: 0,  regrow: 0,   echo: true },
  kiln:   { hp: 38, guards: 8,  orbit: 108, rot: -15, bolt: 170, fan: 5, ring: 0,   spawn: 260, regrow: 520, echo: false },
  vesper: { hp: 50, guards: 12, orbit: 120, rot: 12,  bolt: 160, fan: 5, ring: 420, spawn: 300, regrow: 600, echo: true },
});
export const BOSS_GUARD_R = 21, BOSS_GUARD_HP = 2;

export const BOLT_FLOOR = 110, BOLT_SPREAD = 6;



export const REFIRE_WARN = 105, SURGE_WARN = 150, REFIRE_MAX = 3;

const CAP = { embers: 16, enemies: 24, caps: 12, bolts: 48, ev: 96 };
const U = (v) => v * FP;
const abs = (v) => (v < 0 ? -v : v);
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);


const SLIDE_AMP = WINDOWS.map((w) => {
  const amp = {};
  for (const [row, speed] of w.slide) {
    const r = w.rows[row] || '';
    const lead = r.length - r.replace(/^\.+/, '').length;
    const trail = r.length - r.replace(/\.+$/, '').length;
    amp[row] = { a: U(Math.min(lead, trail) * CW), speed };
  }
  return amp;
});

export const modeOf = (s) => s.mode;
export const onCount = (s) => s.players.reduce((n, p) => n + (p.on ? 1 : 0), 0);
export const windowOf = (s) => WINDOWS[s.wi];


export function rowShift(s, r) {
  const sl = SLIDE_AMP[s.wi][r];
  if (!sl || !sl.a) return 0;
  return muldiv(isin(s.tick * sl.speed / 4), sl.a, ONE);
}


export function cellXY(s, c, r) {
  return { x: U(LEFT + c * CW) + rowShift(s, r), y: U(TOP + r * CH) + s.massY };
}

function newPlayer(i) {
  return { on: 0, x: U(FIELD_W / 2), tint: i % 3, stun: 0, wide: 0, lance: 0, cat: 0, lcd: 0, need: 0, spent: 0,
    score: 0, breaks: 0, lost: 0, launch: 0, fire: 0, next: 0 };
}

export function createSim({ seed = 1, gentle = false, hard = false, stage = 0 } = {}) {
  const s = {
    tick: 0, seed: seed | 0, mode: hard ? MODE_HARD : gentle ? MODE_GENTLE : MODE_NORMAL,
    wi: 0, phase: PH_PLAY, phT: 0, wt: 0, wLost: 0, serial: 1,
    grid: { t: [], hp: [], tn: [], ot: [], oh: [], on: [], sd: [] },
    massY: 0, lanterns: 0, light: 0, lastBreak: 0, combo: 0, shield: 0, slowT: 0, rings: 0,
    players: Array.from({ length: MAX_PLAYERS }, (_, i) => newPlayer(i)),
    embers: [], enemies: [], caps: [], bolts: [],
    boss: { on: 0, kind: '', x: 0, y: 0, hp: 0, max: 0, phase: 0, t: 0, rot: 0, guards: [], beaten: 0 },
    echo: { on: 0, x: U(FIELD_W / 2), hp: 0, max: 0 },
    refire: { at: 0, cells: [] }, surge: { at: 0, dy: 0 },
    stats: { breaks: 0, bosses: 0, maxChain: 0, moths: 0, enemies: 0, caps: 0, pierce: 0, perfect: 0, windows: 0, breaches: 0 },
    stars: new Array(WINDOWS.length).fill(0),
    ev: [],
  };
  loadWindow(s, clamp(stage | 0, 0, WINDOWS.length - 1));
  return s;
}

export const LANTERNS = [99, 5, 3];
const DUSK_MUL = [60, 100, 140];      
const SPEED_BASE = [U(6), U(7), U(8)]; 

export function loadWindow(s, wi) {
  const w = WINDOWS[wi];
  s.wi = wi; s.phase = PH_PLAY; s.phT = s.tick; s.wt = s.tick; s.wLost = 0; s.lastBreak = s.tick;
  const g = s.grid;
  const n = COLS * MAX_ROWS;
  g.t = new Array(n).fill(0); g.hp = new Array(n).fill(0); g.tn = new Array(n).fill(0);
  for (let r = 0; r < w.rows.length && r < MAX_ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const d = CELL_OF[w.rows[r][c]];
      if (!d) continue;
      const i = r * COLS + c;
      g.t[i] = d[0]; g.tn[i] = d[1]; g.hp[i] = CELL_HP[d[0]];
    }
  }
  g.ot = g.t.slice(); g.oh = g.hp.slice(); g.on = g.tn.slice();
  
  
  g.sd = new Array(n).fill(0);
  s.massY = 0; s.embers = []; s.enemies = []; s.caps = []; s.bolts = []; s.shield = 0; s.slowT = 0; s.combo = 0;
  s.lanterns = LANTERNS[s.mode];
  for (const p of s.players) { p.wide = 0; p.lance = 0; p.cat = 0; p.stun = 0; p.need = p.on ? 1 : 0; p.spent = 0; }
  const n1 = Math.max(1, onCount(s));
  s.boss = { on: 0, kind: '', x: U(FIELD_W / 2), y: U(BOSS_Y), hp: 0, max: 0, phase: 0, t: 0, rot: 0, guards: [], beaten: 0 };
  if (w.boss) {
    const B = BOSSES[w.boss];
    const max = muldiv(B.hp, 2 + n1, 3) * (s.mode === MODE_HARD ? 5 : 4) / 4 | 0;
    s.boss = { ...s.boss, on: 1, kind: w.boss, hp: max, max, guards: new Array(B.guards).fill(BOSS_GUARD_HP) };
  }
  s.refire = { at: 0, cells: [] }; s.surge = { at: 0, dy: 0 };
  s.echo = { on: w.echo ? 1 : 0, x: U(FIELD_W / 2), hp: w.echo ? 8 : 0, max: w.echo ? 8 : 0 };
  ev(s, 'window', U(FIELD_W / 2), U(FIELD_H / 2), wi);
}

function ev(s, k, x, y, a = 0) {
  s.ev.push({ k, x, y, a, t: s.tick });
  if (s.ev.length > CAP.ev) s.ev.splice(0, s.ev.length - CAP.ev);
}


export function emberSpeed(s, e) {
  let v = SPEED_BASE[s.mode] + muldiv(U(1), e.heat * 4, 5);
  if (s.slowT > 0) v = muldiv(v, 3, 4);
  if (e.moth) v = muldiv(v, 3, 5);
  return v;
}


function clampAngle(a) {
  const H = ANG / 2;
  const m = ((a % H) + H) % H; 
  const MAX = (ANG * 70) / 360 | 0;
  if (m > MAX && m < H - MAX) {
    const base = a - m;
    return m < ANG / 4 ? base + MAX : base + H - MAX;
  }
  return a;
}

function setDir(s, e, a) {
  const v = polar(clampAngle(a), emberSpeed(s, e));
  e.vx = v.vx; e.vy = v.vy;
  if (e.vy === 0) e.vy = -1;
}

function respeed(s, e) { setDir(s, e, iatan2(e.vx, e.vy)); }

function newEmber(s, own, x, y) {
  if (s.embers.length >= CAP.embers) return null;
  const e = { id: s.serial++, own, x, y, vx: 0, vy: 0, held: 1, hx: 0, tint: s.players[own]?.tint ?? 0, chg: 0, heat: 0,
    moth: 0, chain: 0, age: 0, last: own };
  s.embers.push(e);
  return e;
}

function launch(s, e, seat) {
  e.held = 0;
  const jitter = (hash32(s.seed, s.tick, seat, e.id) % 360) - 180;
  setDir(s, e, ANG / 2 + jitter);
  ev(s, 'launch', e.x, e.y, seat);
}

function cellIndexAt(s, x, y) {
  const r = Math.floor((y - U(TOP) - s.massY) / U(CH));
  if (r < 0 || r >= MAX_ROWS) return -1;
  const c = Math.floor((x - U(LEFT) - rowShift(s, r)) / U(CW));
  if (c < 0 || c >= COLS) return -1;
  return r * COLS + c;
}


function cellsTouching(s, e) {
  const R = U(EMBER_R - 1);
  const out = [];
  for (const [dx, dy] of [[-R, -R], [R, -R], [-R, R], [R, R]]) {
    const i = cellIndexAt(s, e.x + dx, e.y + dy);
    if (i < 0 || s.grid.t[i] === C_EMPTY || out.includes(i)) continue;
    const r = (i / COLS) | 0, c = i % COLS;
    const p = cellXY(s, c, r);
    const px = e.x + dx, py = e.y + dy;
    if (px < p.x + U(GAP) || px > p.x + U(CW - GAP) || py < p.y + U(GAP) || py > p.y + U(CH - GAP)) continue;
    out.push(i);
  }
  return out;
}

function breakCell(s, i, e, seat) {
  const g = s.grid;
  const t = g.t[i];
  const r = (i / COLS) | 0, c = i % COLS;
  const p = cellXY(s, c, r);
  const cx = p.x + U(CW / 2), cy = p.y + U(CH / 2);
  g.t[i] = C_EMPTY; g.hp[i] = 0;
  const chain = e ? e.chain : 0;
  const value = paneValue(t, chain);
  s.light += value;
  s.massY -= t === C_SUN ? U(60) : U(4);
  if (s.massY < -U(CH * 3)) s.massY = -U(CH * 3);
  s.stats.breaks++;
  s.lastBreak = s.tick;
  if (seat >= 0 && s.players[seat]) { s.players[seat].score += value; s.players[seat].breaks++; }
  if (e) { e.chain++; if (e.chain > s.stats.maxChain) s.stats.maxChain = e.chain; }
  
  if (t === C_SUN && s.surge.at) { s.surge = { at: 0, dy: 0 }; ev(s, 'surgestop', cx, cy); }
  ev(s, t === C_SUN ? 'sun' : 'break', cx, cy, (g.tn[i] & 3) | (t << 2) | (Math.min(chain, 15) << 6));
  const roll = hash32(s.seed, i, s.tick, s.stats.breaks);
  if (t === C_BEAD || roll % 13 === 0) dropCapsule(s, cx, cy, (roll >>> 8) % CAPSULE_KINDS);
}

function damageCell(s, i, dmg, e, seat) {
  const g = s.grid;
  if (g.t[i] === C_IRON) { ev(s, 'clank', e ? e.x : 0, e ? e.y : 0); return; }
  g.hp[i] -= dmg;
  if (g.hp[i] <= 0) breakCell(s, i, e, seat);
  else ev(s, 'crack', e ? e.x : 0, e ? e.y : 0, g.t[i]);
}


function hitGrid(s, e) {
  const cells = cellsTouching(s, e);
  if (!cells.length) return false;
  let bounce = false;
  const g = s.grid;
  for (const i of cells) {
    const t = g.t[i];
    if (t === C_EMPTY) continue;
    if (t !== C_IRON && tintable(t) && e.chg > 0 && g.tn[i] === e.tint) {
      
      e.chg--; s.stats.pierce++;
      breakCell(s, i, e, e.last);
      continue;
    }
    if (t !== C_IRON && e.heat >= 4 && g.hp[i] <= 2) { breakCell(s, i, e, e.last); continue; } 
    damageCell(s, i, e.heat >= 3 ? 2 : 1, e, e.last);
    bounce = true;
  }
  return bounce;
}


function bounceRound(s, e, cx, cy, rr) {
  const a = iatan2(e.x - cx, e.y - cy);
  const nx = isin(a), ny = isin(a + ANG / 4);
  const dot = muldiv(e.vx, nx, ONE) + muldiv(e.vy, ny, ONE);
  if (dot < 0) { e.vx -= muldiv(2 * dot, nx, ONE); e.vy -= muldiv(2 * dot, ny, ONE); }
  const d = U(rr + EMBER_R + 1);
  e.x = cx + muldiv(nx, d, ONE); e.y = cy + muldiv(ny, d, ONE);
  respeed(s, e);
}

const touches = (ax, ay, bx, by, rr) => {
  const dx = (ax - bx) / FP, dy = (ay - by) / FP;
  return dx * dx + dy * dy <= rr * rr;
};

function hitPaddles(s, e) {
  if (e.vy <= 0) return false;
  const bottom = e.y + U(EMBER_R);
  if (bottom < U(PADDLE_Y) || e.y > U(PADDLE_Y + PADDLE_H)) return false;
  
  let best = -1, bd = Infinity;
  for (let i = 0; i < MAX_PLAYERS; i++) {
    const p = s.players[i];
    if (!p.on) continue;
    const hw = U(p.wide > 0 ? WIDE_HW : PADDLE_HW);
    const d = abs(e.x - p.x);
    if (d <= hw + U(EMBER_R) && d < bd) { bd = d; best = i; }
  }
  if (best < 0) return false;
  const p = s.players[best];
  const hw = U(p.wide > 0 ? WIDE_HW : PADDLE_HW) + U(EMBER_R);
  const off = clamp(muldiv(e.x - p.x, 1024, hw), -1024, 1024);
  
  if (e.chain >= 3) e.heat = Math.min(4, e.heat + 1);
  else if (e.chain === 0 && e.heat > 0) e.heat--;
  if (e.chain > 0) s.combo = Math.max(s.combo, e.chain);
  e.chain = 0;
  if (e.moth) { e.moth = 0; s.stats.moths++; s.light += 25; ev(s, 'mothburn', e.x, e.y); }
  e.tint = p.tint;
  e.chg = 3 + e.heat;
  e.last = best; 
  e.y = U(PADDLE_Y - EMBER_R);
  setDir(s, e, ANG / 2 - muldiv(off, ANG / 6, 1024));
  ev(s, 'paddle', e.x, e.y, best | (p.tint << 2));
  if (p.cat > 0 && best === e.own) { e.held = 1; e.hx = e.x - p.x; e.age = 0; }
  return true;
}

function hitEnemies(s, e) {
  for (const en of s.enemies) {
    if (en.enter > 0) continue;
    const rr = ENEMY_R[en.k];
    if (!touches(e.x, e.y, en.x, en.y, rr + EMBER_R)) continue;
    if (en.k === E_MOTH) {
      if (!e.moth) { e.moth = 1; e.heat = 0; respeed(s, e); ev(s, 'latch', e.x, e.y); }
      en.hp = 0; en.latched = 1;
      continue;
    }
    
    const shielded = en.k === E_WARDEN && e.vy < 0 && e.heat < 2;
    bounceRound(s, e, en.x, en.y, rr);
    if (shielded) { ev(s, 'shield', e.x, e.y); continue; }
    en.hp -= e.heat >= 3 ? 2 : 1;
    ev(s, en.hp <= 0 ? 'kill' : 'hit', en.x, en.y, en.k);
    if (en.hp <= 0) killEnemy(s, en, e.last);
    return true;
  }
  return false;
}

function killEnemy(s, en, seat) {
  en.hp = 0;
  s.light += ENEMY_LIGHT[en.k];
  s.stats.enemies++;
  if (seat >= 0 && s.players[seat]) s.players[seat].score += ENEMY_LIGHT[en.k];
  if (hash32(s.seed, en.id, 7) % 3 === 0) dropCapsule(s, en.x, en.y, hash32(s.seed, en.id, 9) % CAPSULE_KINDS);
}

export function bossGuardPos(s, i) {
  const b = s.boss, B = BOSSES[b.kind];
  const a = b.rot + (i * ANG) / b.guards.length;
  return { x: b.x + muldiv(isin(a), U(B.orbit), ONE), y: b.y + muldiv(isin(a + ANG / 4), U(B.orbit), ONE) };
}

function hitBoss(s, e) {
  const b = s.boss;
  if (!b.on || b.beaten) return false;
  for (let i = 0; i < b.guards.length; i++) {
    if (b.guards[i] <= 0) continue;
    const g = bossGuardPos(s, i);
    if (!touches(e.x, e.y, g.x, g.y, BOSS_GUARD_R + EMBER_R)) continue;
    bounceRound(s, e, g.x, g.y, BOSS_GUARD_R);
    b.guards[i] -= e.heat >= 3 ? 2 : 1;
    ev(s, b.guards[i] <= 0 ? 'guardbreak' : 'crack', g.x, g.y, i);
    if (b.guards[i] <= 0) { s.light += 50; s.massY -= U(6); }
    return true;
  }
  if (touches(e.x, e.y, b.x, b.y, BOSS_CORE_R + EMBER_R)) {
    bounceRound(s, e, b.x, b.y, BOSS_CORE_R);
    
    
    hurtBoss(s, e.heat >= 3 ? 3 : 2, e.last);
    return true;
  }
  return false;
}

function hurtBoss(s, dmg, seat) {
  const b = s.boss;
  b.hp -= dmg;
  s.lastBreak = s.tick; 
  ev(s, 'bosshit', b.x, b.y, b.hp);
  if (seat >= 0 && s.players[seat]) s.players[seat].score += 20 * dmg;
  s.light += 20 * dmg;
  const third = muldiv(b.max, 1, 3);
  const phase = b.hp <= third ? 2 : b.hp <= 2 * third ? 1 : 0;
  if (phase > b.phase) {
    b.phase = phase;
    ev(s, 'bossphase', b.x, b.y, phase);
    if (b.kind === 'vesper' && phase === 1) s.echo = { on: 1, x: U(FIELD_W / 2), hp: 10, max: 10 };
    if (b.kind === 'vesper' || b.kind === 'kiln') b.guards = b.guards.map(() => BOSS_GUARD_HP);
  }
  if (b.hp <= 0) {
    b.hp = 0; b.beaten = 1; s.stats.bosses++;
    s.light += 5000; s.massY = -U(CH * 3);
    for (const en of s.enemies) en.hp = 0;
    s.bolts = s.bolts.filter((t) => t.own >= 0);
    ev(s, 'bossdown', b.x, b.y, 0);
  }
}

function hitEcho(s, e) {
  const o = s.echo;
  if (!o.on || e.vy >= 0) return false;
  if (e.y - U(EMBER_R) > U(ECHO_Y + 10) || e.y < U(ECHO_Y - 14)) return false;
  if (abs(e.x - o.x) > U(ECHO_HW + EMBER_R)) return false;
  const off = clamp(muldiv(e.x - o.x, 1024, U(ECHO_HW + EMBER_R)), -1024, 1024);
  e.y = U(ECHO_Y + 10 + EMBER_R);
  setDir(s, e, muldiv(off, ANG / 7, 1024));
  o.hp -= 1;
  ev(s, o.hp <= 0 ? 'echobreak' : 'echo', e.x, e.y, o.hp);
  if (o.hp <= 0) { o.on = 0; s.light += 1500; s.massY -= U(90); }
  return true;
}



export const SEEK_AFTER = 300, SEEK_LEFT = 4, SEEK_TURN = 10, SEEK_TURN_MAX = 160;
function seekLastLight(s) {
  const dry = s.tick - s.lastBreak;
  if (dry < SEEK_AFTER) return;
  
  
  
  const cap = dry >= SEEK_AFTER * 2 ? Infinity : SEEK_LEFT;
  const left = [];
  for (let i = 0; i < s.grid.t.length; i++) {
    const t = s.grid.t[i];
    if (t !== C_EMPTY && t !== C_IRON) { left.push(i); if (left.length > cap) return; }
  }
  
  
  const goals = left.map((i) => { const p = cellXY(s, i % COLS, (i / COLS) | 0); return [p.x + U(CW / 2), p.y + U(CH / 2)]; });
  if (!goals.length && s.boss.on && !s.boss.beaten) {
    goals.push([s.boss.x, s.boss.y]);
    s.boss.guards.forEach((hp, i) => { if (hp > 0) { const g = bossGuardPos(s, i); goals.push([g.x, g.y]); } });
  }
  if (!goals.length) return;
  for (const e of s.embers) {
    if (e.held) continue;
    let best = null, bd = Infinity;
    for (const [cx, cy] of goals) {
      const d = abs(cx - e.x) + abs(cy - e.y);
      if (d < bd) { bd = d; best = [cx, cy]; }
    }
    const want = iatan2(best[0] - e.x, best[1] - e.y);
    const have = iatan2(e.vx, e.vy);
    let diff = ((want - have + ANG + ANG / 2) % ANG) - ANG / 2;
    
    
    
    
    const sp = emberSpeed(s, e);
    const turn = clamp(muldiv(sp, 652, Math.max(bd, 1)), SEEK_TURN, SEEK_TURN_MAX);
    diff = clamp(diff, -turn, turn);
    const v = polar(have + diff, sp);
    e.vx = v.vx; e.vy = v.vy === 0 ? -1 : v.vy;
  }
  if (s.tick % 30 === 0) ev(s, 'seek', 0, 0, left.length);
}

function loseEmber(s, e) {
  s.embers = s.embers.filter((x) => x !== e);
  ev(s, 'lost', e.x, U(FIELD_H), e.own);
  const p = s.players[e.own];
  if (!p || !p.on) return;
  if (s.embers.some((x) => x.own === e.own)) return;
  p.lost++; s.wLost++;
  p.need = 70; p.spent = 1;
}

function stepEmber(s, e) {
  e.age++;
  const p = s.players[e.own];
  if (e.held) {
    if (!p || !p.on) { s.embers = s.embers.filter((x) => x !== e); return; }
    e.x = p.x + e.hx; e.y = U(PADDLE_Y - EMBER_R);
    e.tint = p.tint;
    if (p.launch && e.age > 20) { e.hx = 0; e.chg = 3 + e.heat; launch(s, e, e.own); }
    return;
  }
  const n = Math.max(1, Math.ceil(Math.max(abs(e.vx), abs(e.vy)) / U(4)));
  for (let k = 0; k < n; k++) {
    const sx = (e.vx / n) | 0, sy = (e.vy / n) | 0;
    e.x += sx;
    if (e.x < U(EMBER_R)) { e.x = U(EMBER_R); e.vx = abs(e.vx); ev(s, 'wall', e.x, e.y); }
    else if (e.x > U(FIELD_W - EMBER_R)) { e.x = U(FIELD_W - EMBER_R); e.vx = -abs(e.vx); ev(s, 'wall', e.x, e.y); }
    if (hitGrid(s, e)) { e.x -= sx; e.vx = -e.vx; }
    e.y += sy;
    if (e.y < U(EMBER_R)) { e.y = U(EMBER_R); e.vy = abs(e.vy); ev(s, 'wall', e.x, e.y); }
    if (hitEcho(s, e)) continue;
    if (hitGrid(s, e)) { e.y -= sy; e.vy = -e.vy; }
    if (hitEnemies(s, e) || hitBoss(s, e)) continue;
    if (hitPaddles(s, e)) break;
    if (s.shield > 0 && e.vy > 0 && e.y + U(EMBER_R) >= U(SHIELD_Y)) {
      s.shield--; e.vy = -abs(e.vy); e.y = U(SHIELD_Y - EMBER_R); ev(s, 'shieldsave', e.x, e.y);
    }
    if (e.y - U(EMBER_R) > U(FIELD_H)) { loseEmber(s, e); return; }
  }
}


function dropCapsule(s, x, y, k) {
  if (s.caps.length >= CAP.caps) return;
  s.caps.push({ x, y, k });
}

function applyCapsule(s, seat, k) {
  const p = s.players[seat];
  s.stats.caps++;
  ev(s, 'capsule', p.x, U(PADDLE_Y), k | (seat << 4));
  
  const timed = ['wide', 'lance', 'cat'];
  const key = k === K_WIDE ? 'wide' : k === K_LANCE ? 'lance' : k === K_CATCH ? 'cat' : null;
  if (key) {
    const active = timed.filter((t) => t !== key && p[t] > 0);
    if (active.length >= 2) { active.sort((a, b) => p[a] - p[b]); p[active[0]] = 0; }
    p[key] = CAP_TICKS;
    return;
  }
  if (k === K_SLOW) s.slowT = CAP_TICKS;
  else if (k === K_SHIELD) s.shield = Math.min(3, s.shield + 1);
  else if (k === K_LIGHT) { s.light += 500; s.massY -= U(45); }
  else if (k === K_TWIN) {
    const src = s.embers.find((e) => e.own === seat && !e.held) || s.embers.find((e) => !e.held);
    const base = src || null;
    const e = newEmber(s, seat, base ? base.x : p.x, base ? base.y : U(PADDLE_Y - 40));
    if (e) { e.held = 0; e.tint = p.tint; e.chg = 3; setDir(s, e, ANG / 2 + (base ? 300 : -300)); }
  }
  for (const e of s.embers) respeed(s, e);
}

function stepCaps(s) {
  for (const c of s.caps) {
    c.y += U(3);
    if (c.y < U(PADDLE_Y - 8) || c.y > U(PADDLE_Y + PADDLE_H + 10)) continue;
    for (let i = 0; i < MAX_PLAYERS; i++) {
      const p = s.players[i];
      if (!p.on) continue;
      const hw = U((p.wide > 0 ? WIDE_HW : PADDLE_HW) + 12);
      if (abs(c.x - p.x) <= hw) { applyCapsule(s, i, c.k); c.y = U(FIELD_H * 2); break; }
    }
  }
  s.caps = s.caps.filter((c) => c.y < U(FIELD_H + 20));
}

function stepBolts(s) {
  for (const b of s.bolts) {
    b.y += b.vy; b.x += b.vx || 0;
    if (b.own >= 0) {
      const i = cellIndexAt(s, b.x, b.y);
      if (i >= 0 && s.grid.t[i] !== C_EMPTY) { damageCell(s, i, 1, null, b.own); b.y = -U(100); continue; }
      for (const en of s.enemies) {
        if (en.enter > 0 || en.hp <= 0 || !touches(b.x, b.y, en.x, en.y, ENEMY_R[en.k] + 4)) continue;
        en.hp--; ev(s, en.hp <= 0 ? 'kill' : 'hit', en.x, en.y, en.k);
        if (en.hp <= 0) killEnemy(s, en, b.own);
        b.y = -U(100); break;
      }
      if (b.y < 0) continue;
      if (s.boss.on && !s.boss.beaten && touches(b.x, b.y, s.boss.x, s.boss.y, BOSS_CORE_R + 4)) {
        hurtBoss(s, 1, b.own); b.y = -U(100);
      }
    } else if (b.y >= U(PADDLE_Y) && b.y <= U(PADDLE_Y + PADDLE_H + 8)) {
      for (let i = 0; i < MAX_PLAYERS; i++) {
        const p = s.players[i];
        if (!p.on || p.stun > 0) continue;
        if (abs(b.x - p.x) <= U((p.wide > 0 ? WIDE_HW : PADDLE_HW) + 6)) {
          p.stun = s.mode === MODE_GENTLE ? 25 : 50; ev(s, 'stun', p.x, U(PADDLE_Y), i); b.y = U(FIELD_H * 2); break;
        }
      }
    }
  }
  s.bolts = s.bolts.filter((b) => b.y > -U(40) && b.y < U(FIELD_H + 40));
}

function enemyBolt(s, x, y, vx = 0) {
  if (s.bolts.length >= CAP.bolts) return;
  s.bolts.push({ x, y, vx, vy: U(s.mode === MODE_HARD ? 6 : s.mode === MODE_GENTLE ? 4 : 5), own: -1 });
}



export function massBottom(s) {
  const g = s.grid;
  for (let r = MAX_ROWS - 1; r >= 0; r--) {
    for (let c = 0; c < COLS; c++) {
      const t = g.t[r * COLS + c];
      if (t !== C_EMPTY && t !== C_IRON) return U(TOP + (r + 1) * CH) + s.massY;
    }
  }
  return null;
}

export function breakableLeft(s) {
  let n = 0;
  for (const t of s.grid.t) if (t !== C_EMPTY && t !== C_IRON) n++;
  return n;
}

function pickSolderTarget(s, en) {
  const g = s.grid;
  const cand = [];
  for (let i = 0; i < g.t.length; i++) if (g.t[i] === C_EMPTY && !g.sd[i] && g.ot[i] !== C_EMPTY && g.ot[i] !== C_IRON) cand.push(i);
  const taken = new Set(s.enemies.filter((x) => x !== en && x.k === E_LEADLING && x.tc >= 0).map((x) => x.tc));
  const free = cand.filter((i) => !taken.has(i));
  if (!free.length) return -1;
  return free[hash32(s.seed, en.id, s.tick) % free.length];
}

function spawnEnemy(s, k) {
  if (s.enemies.length >= CAP.enemies) return;
  const id = s.serial++;
  const h = hash32(s.seed, id, s.tick, k);
  const x = U(60 + (h % (FIELD_W - 120)));
  const bottom = massBottom(s) ?? U(TOP + CH * 3);
  const y = k === E_MOTH || k === E_LEADLING ? U(40) : Math.min(bottom + U(60), U(860));
  const en = { id, k, x, y, vx: (h & 1 ? 1 : -1) * U(k === E_WARDEN ? 2 : 1), hp: ENEMY_HP[k], t: 0, st: 0, tc: -1,
    enter: ENTER_TICKS, latched: 0, bx: x };
  if (s.mode === MODE_HARD) en.hp += k === E_WARDEN ? 2 : k === E_SHARDLING || k === E_BELL ? 1 : 0;
  s.enemies.push(en);
  ev(s, 'enter', x, y, k);
}

const moveToward = (en, tx, ty, sp) => {
  const dx = tx - en.x, dy = ty - en.y;
  const a = iatan2(dx, dy);
  const d = abs(dx) + abs(dy);
  if (d <= sp) { en.x = tx; en.y = ty; return true; }
  const v = polar(a, sp);
  en.x += v.vx; en.y += v.vy;
  return false;
};

function stepEnemies(s) {
  const n = Math.max(1, onCount(s));
  const w = WINDOWS[s.wi];
  const tt = s.tick - s.wt;
  
  for (const [kind, first, every, max] of w.spawns) {
    const k = ENEMY_KIND[kind];
    const f = first * TICK_HZ;
    const iv = Math.max(60, muldiv(every * TICK_HZ, 3, 2 + n) * (s.mode === MODE_HARD ? 3 : 4) / 4 | 0);
    const cap = max + (n > 2 ? 1 : 0) + (s.mode === MODE_HARD ? 1 : 0);
    if (tt >= f && (tt - f) % iv === 0 && s.enemies.filter((e) => e.k === k).length < cap) spawnEnemy(s, k);
  }
  const bottom = massBottom(s) ?? U(TOP + CH * 2);
  for (const en of s.enemies) {
    en.t++;
    if (en.enter > 0) { en.enter--; continue; }
    if (en.k === E_LEADLING) {
      const g = s.grid;
      if (en.tc < 0 || g.t[en.tc] !== C_EMPTY) { en.tc = pickSolderTarget(s, en); en.st = 0; }
      if (en.tc < 0) { en.x += en.vx; if (en.x < U(30) || en.x > U(FIELD_W - 30)) en.vx = -en.vx; continue; }
      const r = (en.tc / COLS) | 0, c = en.tc % COLS;
      const p = cellXY(s, c, r);
      const at = moveToward(en, p.x + U(CW / 2), p.y + U(CH / 2), U(s.mode === MODE_HARD ? 2 : 1) + U(1) / 2);
      if (at) {
        en.st++;
        
        
        if (en.st >= (s.mode === MODE_GENTLE ? 280 : s.mode === MODE_HARD ? 150 : 210)) {
          const near = s.embers.some((e) => touches(e.x, e.y, en.x, en.y, CW));
          if (!near) { g.t[en.tc] = g.ot[en.tc]; g.hp[en.tc] = g.oh[en.tc]; g.tn[en.tc] = g.on[en.tc]; g.sd[en.tc] = 1; ev(s, 'solder', en.x, en.y); }
          en.tc = -1; en.st = 0;
        }
      }
    } else if (en.k === E_MOTH) {
      let best = null, bd = Infinity;
      for (const e of s.embers) {
        if (e.held || e.moth) continue;
        const d = abs(e.x - en.x) + abs(e.y - en.y);
        if (d < bd) { bd = d; best = e; }
      }
      const sp = U(s.mode === MODE_HARD ? 2 : 1) + muldiv(U(1), 4, 5);
      const wob = muldiv(isin(en.t * 40 + en.id * 300), U(1), ONE);
      if (best) moveToward(en, best.x + wob * 20, best.y, sp);
      else { en.y += U(1); en.x += wob; }
      if (en.y > U(FIELD_H)) en.hp = 0;
    } else if (en.k === E_SHARDLING) {
      const ty = Math.min(bottom + U(70), U(900));
      en.y += clamp(ty - en.y, -U(2), U(2));
      en.x = clamp(en.bx + muldiv(isin(en.t * 10 + en.id * 500), U(200), ONE), U(30), U(FIELD_W - 30));
      const every = s.mode === MODE_HARD ? 110 : s.mode === MODE_GENTLE ? 200 : 150;
      if (en.t % every === 0) { enemyBolt(s, en.x, en.y + U(18)); ev(s, 'shoot', en.x, en.y, en.k); }
    } else if (en.k === E_WARDEN) {
      const ty = Math.min(bottom + U(45), U(880));
      en.y += clamp(ty - en.y, -U(2), U(2));
      en.x += en.vx;
      if (en.x < U(30)) en.vx = abs(en.vx); else if (en.x > U(FIELD_W - 30)) en.vx = -abs(en.vx);
    } else if (en.k === E_BELL) {
      const ty = Math.min(bottom + U(55), U(860));
      en.y += clamp(ty - en.y, -U(2), U(2));
      en.x = en.bx + muldiv(isin(en.t * 16), U(36), ONE);
      if (en.t % 360 === 300) ev(s, 'bellwarn', en.x, en.y);
      if (en.t % 360 === 0) { s.massY += U(22); s.rings++; ev(s, 'ring', en.x, en.y); }
    }
  }
  s.enemies = s.enemies.filter((e) => e.hp > 0);
}


export function breakPane(s, i) { breakCell(s, i, null, -1); }






function stepSetPieces(s, w) {
  const tt = s.tick - s.wt;
  const due = (first, every) => tt >= first * TICK_HZ && (tt - first * TICK_HZ) % (every * TICK_HZ) === 0;
  const g = s.grid;
  const centre = (i) => { const p = cellXY(s, i % COLS, (i / COLS) | 0); return { x: p.x + U(CW / 2), y: p.y + U(CH / 2) }; };
  if (w.refire) {
    if (s.refire.at && s.tick >= s.refire.at) {
      for (const i of s.refire.cells) {
        if (g.t[i] !== C_EMPTY) continue;
        const c = centre(i);
        if (s.embers.some((e) => touches(e.x, e.y, c.x, c.y, CW))) continue;
        g.t[i] = g.ot[i]; g.hp[i] = g.oh[i]; g.tn[i] = g.on[i]; g.sd[i] = 1;
        ev(s, 'refire', c.x, c.y, g.tn[i] & 3);
      }
      s.refire = { at: 0, cells: [] };
    } else if (!s.refire.at && due(w.refire[0], w.refire[1])) {
      const cells = [];
      for (let i = 0; i < g.t.length && cells.length < REFIRE_MAX; i++) {
        if (g.t[i] === C_EMPTY && !g.sd[i] && g.ot[i] !== C_EMPTY && g.ot[i] !== C_IRON) cells.push(i);
      }
      if (cells.length) {
        s.refire = { at: s.tick + REFIRE_WARN, cells };
        for (const i of cells) { const c = centre(i); ev(s, 'refirewarn', c.x, c.y, REFIRE_WARN); }
      }
    }
  }
  if (w.surge) {
    if (s.surge.at && s.tick >= s.surge.at) {
      s.massY += s.surge.dy;
      ev(s, 'surge', U(FIELD_W / 2), massBottom(s) ?? U(TOP), s.surge.dy);
      s.surge = { at: 0, dy: 0 };
    } else if (!s.surge.at && due(w.surge[0], w.surge[1])) {
      const dy = (U(CH * w.surge[2]) / (s.mode === MODE_GENTLE ? 2 : 1)) | 0;
      s.surge = { at: s.tick + SURGE_WARN, dy };
      ev(s, 'surgewarn', U(FIELD_W / 2), U(TOP), SURGE_WARN);
    }
  }
}

function stepBoss(s) {
  const b = s.boss;
  if (!b.on || b.beaten) return;
  const B = BOSSES[b.kind];
  b.t++;
  const rage = 1 + b.phase;
  b.rot = (b.rot + B.rot * (b.phase === 2 ? 2 : 1) + ANG) % ANG;
  const swing = b.kind === 'bell' || b.kind === 'vesper' ? 230 : 150;
  b.x = U(FIELD_W / 2) + muldiv(isin(b.t * (4 + b.phase * 2)), U(swing), ONE);
  b.y = U(BOSS_Y) + muldiv(isin(b.t * 3 + 1000), U(40), ONE);
  
  
  
  
  const every = Math.max(BOLT_FLOOR, (B.bolt / rage) | 0) * (s.mode === MODE_HARD ? 3 : s.mode === MODE_GENTLE ? 5 : 4) / 4 | 0;
  if (b.t % every === 0) {
    for (let i = 0; i < B.fan; i++) {
      const vx = muldiv(U(1), (i - ((B.fan - 1) >> 1)) * BOLT_SPREAD, 4);
      enemyBolt(s, b.x, b.y + U(BOSS_CORE_R), vx);
    }
    ev(s, 'bossshoot', b.x, b.y, B.fan);
  }
  if (B.ring && b.t % B.ring === 0) { s.massY += U(24); s.rings++; ev(s, 'ring', b.x, b.y); }
  if (B.spawn && b.t % B.spawn === 0) spawnEnemy(s, b.kind === 'kiln' ? E_MOTH : (b.t / B.spawn) & 1 ? E_LEADLING : E_MOTH);
  if (B.regrow && b.t % B.regrow === 0) {
    const i = b.guards.findIndex((g) => g <= 0);
    if (i >= 0) { b.guards[i] = BOSS_GUARD_HP; ev(s, 'regrow', b.x, b.y, i); }
  }
}

function stepEcho(s) {
  const o = s.echo;
  if (!o.on) return;
  
  let target = U(FIELD_W / 2), hy = Infinity;
  for (const e of s.embers) if (!e.held && e.vy < 0 && e.y < hy) { hy = e.y; target = e.x; }
  const sp = U(s.mode === MODE_HARD ? 7 : s.mode === MODE_GENTLE ? 3 : 5);
  o.x += clamp(target - o.x, -sp, sp);
  o.x = clamp(o.x, U(ECHO_HW), U(FIELD_W - ECHO_HW));
}


export function step(s, inputs) {
  const w = WINDOWS[s.wi];
  for (let i = 0; i < MAX_PLAYERS; i++) {
    const p = s.players[i];
    const u = unpack(inputs[i] >>> 0);
    if (u.present && !p.on) {
      
      Object.assign(p, newPlayer(i), { on: 1, need: 1, x: U(FIELD_W / 2), tint: u.tint });
      ev(s, 'join', p.x, U(PADDLE_Y), i);
    } else if (!u.present && p.on) {
      p.on = 0;
      s.embers = s.embers.filter((e) => !(e.own === i && e.held));
      ev(s, 'leave', p.x, U(PADDLE_Y), i);
    }
    p.launch = u.launch ? 1 : 0;
    p.fire = u.fire ? 1 : 0;
    p.next = u.next ? 1 : 0;
    if (!p.on) continue;
    p.tint = u.tint;
    const hw = U(p.wide > 0 ? WIDE_HW : PADDLE_HW);
    const tx = clamp(muldiv(u.x, U(FIELD_W), 4095), hw, U(FIELD_W) - hw);
    if (p.stun > 0) p.stun--;
    else p.x += clamp(tx - p.x, -U(24), U(24));
    p.x = clamp(p.x, hw, U(FIELD_W) - hw);
    for (const k of ['wide', 'lance', 'cat']) if (p[k] > 0) p[k]--;
  }

  if (s.phase === PH_CLEAR) {
    const waited = s.tick - s.phT;
    const pressed = s.players.some((p) => p.on && p.next);
    if ((pressed && waited > TALLY_MIN_TICKS) || waited > 900) {
      if (s.wi + 1 >= WINDOWS.length) { s.phase = PH_DONE; s.phT = s.tick; ev(s, 'done', 0, 0); }
      else loadWindow(s, s.wi + 1);
    }
    s.tick++;
    return;
  }
  if (s.phase === PH_FAIL) {
    if (s.tick - s.phT > 160) loadWindow(s, s.wi);
    s.tick++;
    return;
  }
  if (s.phase === PH_DONE) { s.tick++; return; }

  
  const n = Math.max(1, onCount(s));
  let rate = muldiv(U(w.dusk) * 3 / 2, DUSK_MUL[s.mode] * (100 + 20 * (n - 1)), 100 * 100 * TICK_HZ);
  
  
  
  
  const mb = massBottom(s);
  if (mb !== null && mb >= U(DANGER_Y - HOLD_BAND)) rate = muldiv(rate, HOLD_PCT, 100);
  s.massY += rate;
  if (s.slowT > 0) s.slowT--;

  
  for (let i = 0; i < MAX_PLAYERS; i++) {
    const p = s.players[i];
    if (!p.on || s.embers.some((e) => e.own === i)) continue;
    if (p.need > 0) p.need--;
    if (p.need === 0) {
      if (p.spent && s.mode !== MODE_GENTLE) {
        if (s.lanterns <= 0) { fail(s); s.tick++; return; }
        s.lanterns--;
        ev(s, 'lantern', p.x, U(PADDLE_Y), s.lanterns);
      }
      p.spent = 0;
      newEmber(s, i, p.x, U(PADDLE_Y - EMBER_R));
    }
  }
  for (const e of s.embers.slice()) stepEmber(s, e);
  seekLastLight(s);

  
  for (let i = 0; i < MAX_PLAYERS; i++) {
    const p = s.players[i];
    if (!p.on) continue;
    if (p.lcd > 0) p.lcd--;
    if (p.lance > 0 && p.fire && p.lcd === 0 && s.bolts.length < CAP.bolts - 2) {
      const hw = U((p.wide > 0 ? WIDE_HW : PADDLE_HW) - 10);
      s.bolts.push({ x: p.x - hw, y: U(PADDLE_Y - 6), vx: 0, vy: -U(14), own: i });
      s.bolts.push({ x: p.x + hw, y: U(PADDLE_Y - 6), vx: 0, vy: -U(14), own: i });
      p.lcd = 14;
      ev(s, 'lance', p.x, U(PADDLE_Y), i);
    }
  }
  stepCaps(s);
  stepBolts(s);
  stepEnemies(s);
  stepBoss(s);
  stepEcho(s);
  stepSetPieces(s, w);

  
  const bottom = massBottom(s);
  if (bottom !== null && bottom >= U(DANGER_Y)) {
    s.stats.breaches++;
    s.massY -= U(CH * 6);
    ev(s, 'breach', U(FIELD_W / 2), U(DANGER_Y), s.lanterns);
    if (s.mode !== MODE_GENTLE) {
      s.wLost++;
      if (s.lanterns <= 0) { fail(s); s.tick++; return; }
      s.lanterns--;
    }
  }
  
  for (let r = 0; r < MAX_ROWS; r++) {
    if (U(TOP + (r + 1) * CH) + s.massY < U(DANGER_Y)) continue;
    for (let c = 0; c < COLS; c++) if (s.grid.t[r * COLS + c] === C_IRON) s.grid.t[r * COLS + c] = C_EMPTY;
  }

  if (breakableLeft(s) === 0 && (!s.boss.on || s.boss.beaten)) clear(s);
  s.tick++;
}

function fail(s) {
  s.phase = PH_FAIL; s.phT = s.tick;
  ev(s, 'fail', 0, 0, s.wi);
}






export const TALLY_MIN_TICKS = 100;
export const PAR_TICKS = (wi) => (WINDOWS[wi].boss ? 150 : 95) * TICK_HZ;

function clear(s) {
  s.phase = PH_CLEAR; s.phT = s.tick;
  s.stats.windows++;
  const time = s.tick - s.wt;
  const star = 1 + (s.wLost === 0 ? 1 : 0) + (time <= PAR_TICKS(s.wi) ? 1 : 0);
  if (s.wLost === 0) s.stats.perfect++;
  s.stars[s.wi] = Math.max(s.stars[s.wi] || 0, star);
  s.light += 1000 + (s.mode === MODE_GENTLE ? 0 : s.lanterns * 250);
  s.embers = []; s.bolts = []; s.caps = [];
  ev(s, 'clear', 0, 0, star);
}



export function snapshot(s) {
  const g = s.grid;
  return {
    ...s,
    grid: { t: g.t.slice(), hp: g.hp.slice(), tn: g.tn.slice(), ot: g.ot, oh: g.oh, on: g.on, sd: (g.sd || []).slice() },
    players: s.players.map((p) => ({ ...p })),
    embers: s.embers.map((e) => ({ ...e })),
    enemies: s.enemies.map((e) => ({ ...e })),
    caps: s.caps.map((c) => ({ ...c })),
    bolts: s.bolts.map((b) => ({ ...b })),
    boss: { ...s.boss, guards: s.boss.guards.slice() },
    echo: { ...s.echo },
    refire: { at: s.refire.at, cells: s.refire.cells.slice() },
    surge: { ...s.surge },
    stats: { ...s.stats },
    stars: s.stars.slice(),
    ev: s.ev.slice(),
  };
}


export function serialize(s) {
  return JSON.parse(JSON.stringify({ ...snapshot(s), stars: Array.from(s.stars, (v) => v || 0) }));
}

export function deserialize(o) {
  const s = snapshot(o);
  s.grid.ot = o.grid.ot.slice(); s.grid.oh = o.grid.oh.slice(); s.grid.on = o.grid.on.slice();
  return s;
}


export function stateHash(s) {
  let h = 0x811c9dc5;
  const add = (v) => { h = Math.imul(h ^ (v | 0), 0x01000193); };
  const walk = (v) => {
    if (typeof v === 'number') add(v);
    else if (typeof v === 'string') { for (let i = 0; i < v.length; i++) add(v.charCodeAt(i)); }
    else if (Array.isArray(v)) { add(v.length); for (const x of v) walk(x ?? 0); }
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k]);
  };
  for (const k of Object.keys(s)) if (k !== 'ev') walk(s[k]);
  return h >>> 0;
}
