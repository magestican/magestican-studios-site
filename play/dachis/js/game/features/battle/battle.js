







import { U } from '../../../engine/core/util.js';
import { toast } from '../../../engine/ui/dialog.js';
import { G, S } from '../../state.js';
import { speciesById, statsOf, TYPES, capsFor, ATTR_COLOR, attrOf, bossSpecies, makeDachi } from '../../data/species.js';
import {
  calcDamage, finalDamage, hpFraction, CAPTURE_HP, BASIC_POWER, maxMp, mpCost, mpRegen, canUse,
  finisherGain, finisherOf, bondOf, hesitateChance, nextAi, RANGE, BATTLE_PACE, capHit, bossCapturable,
  easeFor, SCOUT_TIME,
} from './rules.js';
import { chapterOf } from '../clock/clock.js';
import { showScout, hideScout } from './scoutCard.js';
import { showPick, hidePick } from './pickCard.js';
import { ableAfterFaint, guardPress, guardDrain, fullGuard } from './rules.js';
import {
  BEAM_TIME, BEAM_TICK, BEAM_SHARE, BEAM_LEN, BEAM_HALF, FLURRY_HITS, FLURRY_GAP, FLURRY_SHARE, SLAM_TIME, SLAM_R,
  TRAP_R, TRAP_ARM, TRAP_LIFE, MAX_TRAPS, DRAIN_SHARE, SHIELD_TIME, statusOf, applyStatus, tickStatus, cleanse,
  hasStatus, speedMult, missChance, parryOutcome, canParry, PARRY_WINDOW, PARRY_CD, PARRY_COUNTER, PARRY_STUN,
  TELL, impactIn, dodgeChance, WILD_PARRY, reflects, interrupts, segDist, turnToward, slamZ, trapSpot, STATUS_COLOR,
} from './techniques.js';
import { arenaRadii, arenaCentre, clampToArena, maxBattleVh, inArena, placeArena } from './arena.js';
import { mapForArena } from './arenaMap.js';
import { hitWord } from './comic.js';
let hitCount = 0; 
import { pushApart, BATTLE_AIR, fighterR, reachPlus } from '../world/crowd.js';
import { sectionById, toUV, fromUV } from '../world/sections.js';
import { makePattern } from '../capture/ritual.js';
import { dachiBillboard } from '../../art/billboards.js';
import { battleOpener } from './battleOpener.js';
import { music } from '../../music.js';
import { patternOf, patternDamageMult, tellBeats, OPEN_TIME } from './bossPattern.js';

export let B = null;
export const INTRO = 1.5;
export const BOSS_VH = 18;  

function fighter(d, x, y, side) {
  return {
    d, x, y, side, face: 1, cds: [1.2, 2.2, 3.2], basic: 0.8, guard: 0, rage: 0, dash: null, cast: null,
    lunge: 0, hurt: 0, flash: 0, vx: 0, vy: 0, orbit: Math.random() < 0.5 ? 1 : -1, walking: false,
    mp: maxMp(d), fin: 0, ai: { mode: 'circle', t: 0.6 + Math.random(), r: 1 }, approach: null, hes: 0, charge: 0,
    
    status: {}, burnAcc: 0, parry: 0, parryCd: 0, stun: 0, shield: 0, wind: 0, beam: null, flurry: null, leap: null, z: 0,
    threat: Infinity, armed: true, parried: 0,
    bb: dachiBillboard(S.stage.scene, speciesById(d.sp).stage + (speciesById(d.sp).rarity === 'legendary' ? 1.5 : 0)),
  };
}
const spOf = f => speciesById(f.d.sp);
const reach = (f, o) => reachPlus(fighterR(spOf(f).stage, !!spOf(f).boss), fighterR(spOf(o).stage, !!spOf(o).boss));


export function startBattle(wild, opts = {}) {
  const allyD = opts.ally || G.party.find(d => d.hp > 0);
  if (!allyD) return false;
  const p = G.player, W = S.W, aspect = S.stage.w / S.stage.h;
  const sec = S.cam && S.cam.sec, win = sec && W.windows ? W.windows[sec] : null;
  
  
  
  const free = !!speciesById(wild.d.sp).boss && !!(S.stage.look && S.stage.look.name === 'cel');
  const maxVh = free ? Math.max(BOSS_VH, win ? maxBattleVh(win, sectionById(sec).zoom, aspect) : 12) : win ? maxBattleVh(win, sectionById(sec).zoom, aspect) : 12;
  const { ru, rv } = arenaRadii(maxVh, aspect);
  let [cx, cy] = arenaCentre(p.x, p.y, wild.x, wild.y, ru, rv);
  
  
  
  
  let run = null;
  const isBoss = !!speciesById(wild.d.sp).boss;
  if (win && !opts.script && !isBoss) {
    const pl = placeArena(mapForArena(W), sec, p.x, p.y, wild.x, wild.y, ru, rv, win, maxVh, aspect);
    if (Math.hypot(pl.cx - cx, pl.cy - cy) > 0.5) {
      const [qu, qv] = toUV(p.x, p.y), [wu, wv] = toUV(wild.x, wild.y), [nu, nv] = toUV(pl.cx, pl.cy);
      let du = wu - qu, dv = wv - qv; const l = Math.hypot(du, dv) || 1; du /= l; dv /= l;
      const r = 1 / Math.hypot(du / ru, dv / rv);
      let [kx, ky] = fromUV(nu - du * r * 0.6, nv - dv * r * 0.6); 
      for (let k = 0; k < 10 && !W.walkable(kx, ky, 0.3); k++) { kx += (pl.cx - kx) * 0.25; ky += (pl.cy - ky) * 0.25; }
      run = { fx: p.x, fy: p.y, tx: kx, ty: ky, t: 0 };
      cx = pl.cx; cy = pl.cy;
    }
  }
  if (free) { cx = wild.x; cy = wild.y; } 
  
  for (let k = 0; k < 10 && !W.walkable(cx, cy, 0.3); k++) { cx += (p.x - cx) * 0.2; cy += (p.y - cy) * 0.2; }
  const kx0 = run ? run.tx : p.x, ky0 = run ? run.ty : p.y;
  let dx = cx - kx0, dy = cy - ky0; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
  B = {
    t: 0, cx, cy, ru, rv, maxVh, wild, opts, script: opts.script || null, boss: speciesById(wild.d.sp).boss || null, state: 'intro', timer: INTRO, swapCd: 0,
    activeIdx: Math.max(0, G.party.indexOf(allyD)), stance: 'attack',
    ally: fighter(allyD, kx0 + dx * 1.3, ky0 + dy * 1.3, 0), run,
    enemy: fighter(wild.d, cx + dx * Math.min(3, dl), cy + dy * Math.min(3, dl), 1),
    proj: [], fx: [], nums: [], callouts: [], shout: { text: opts.script ? 'W-whoa!!' : `Go, ${speciesById(allyD.sp).name}!`, t: 1.6 },
    ritual: null, capture: null, result: null, shake: 0, used: new Set(), mines: [], parries: 0, free,
  };
  if (B.boss) { B.enemy.x = wild.x; B.enemy.y = wild.y; } 
  const pat = B.boss && patternOf(B.boss); 
  if (pat) Object.assign(B.enemy, { pat, sigCd: pat.first, tellT: 0, tellAt: 0, open: 0 });
  clampArena(B.enemy);
  
  for (let k = 0; k < 12 && !W.walkable(B.enemy.x, B.enemy.y, 0.3); k++) { B.enemy.x += (kx0 - B.enemy.x) * 0.15; B.enemy.y += (ky0 - B.enemy.y) * 0.15; }
  if (B.boss) callout(B.enemy, speciesById(wild.d.sp).name, '#ff2a3a', true); 
  else G.dex.seen[wild.d.sp] = 1; 
  G.mode = 'battle';
  battleOpener({ boss: !!B.boss, name: speciesById(wild.d.sp).name }); 
  music.battle(true);
  return true;
}



export function startBossBattle(bossId, { x, y, lvl = null, onEnd } = {}) {
  const s = bossSpecies(bossId);
  const d = makeDachi(s.id, lvl ?? Math.max(s.level, capsFor(G.cycle).enemyFloor)); d.corrupt = true;
  return startBattle({ x, y, d, boss: bossId }, onEnd ? { onEnd } : {});
}




const clampPad = (f) => Math.max(fighterR(spOf(f).stage, !!spOf(f).boss), ((f.bb && f.bb.extent()) || { half: 0 }).half * 0.8) + 0.12;
function clampArena(f) { [f.x, f.y] = clampToArena(f.x, f.y, B, clampPad(f)); }

function moveBy(f, mx, my) {
  const W = S.W, ox = f.x, oy = f.y;
  if (W.walkable(f.x + mx, f.y, 0.25)) f.x += mx;
  if (W.walkable(f.x, f.y + my, 0.25)) f.y += my;
  
  if (Math.hypot(f.x - ox, f.y - oy) < Math.hypot(mx, my) * 0.3) {
    const side = f.orbit || 1;
    for (const a of [0.8 * side, -0.8 * side, 1.5 * side, -1.5 * side]) {
      const c = Math.cos(a), s = Math.sin(a), rx = mx * c - my * s, ry = mx * s + my * c;
      if (W.walkable(ox + rx, oy + ry, 0.25)) { f.x = ox + rx; f.y = oy + ry; break; }
    }
  }
  clampArena(f);
  return Math.hypot(f.x - ox, f.y - oy) < Math.hypot(mx, my) * 0.3;   
}


const CAST = 'cast';
export function shout(text) { B.shout = { text, t: 1.6 }; }
function callout(f, text, color, big = false) {
  B.callouts = B.callouts.filter(c => c.f !== f);
  B.callouts.push({ f, text, color, t: 0, life: big ? 1.9 : 1.4, big });
}


function hesitates() {
  if (B.script || Math.random() >= hesitateChance(bondOf(B.ally.d))) return false;
  B.ally.hes = 0.9; B.ally.dash = null; B.ally.approach = null;
  B.callouts = B.callouts.filter(c => c.f !== B.ally);
  shout(`${spOf(B.ally).name}...?`);
  S.sfx.play('blip');
  return true;
}

export const STANCES = ['attack', 'guard', 'away'];
const STANCE_SHOUT = { attack: 'Go get it!', guard: 'Guard! Hold your ground!', away: 'Keep away from it!' };
export function orderStance(s) {
  if (!B || B.state !== 'fight' || B.ritual || B.script || B.ally.hes > 0) return;
  if (s === 'guard') B.guardCharge = guardPress(B.guardCharge);   
  if (B.stance === s) return;
  if (hesitates()) return;
  B.stance = s; shout(STANCE_SHOUT[s]);
}

export function orderSpecial(k) {
  if (!B || B.state !== 'fight' || B.ritual) return;
  const f = B.ally, m = spOf(f).moves[k];
  if (f.cds[k] > 0) { toast(`${m.name} is recharging!`, 2200, CAST); return; }
  if (!B.script && f.mp < mpCost(m, f.d.lvl)) { toast(`Not enough MP for ${m.name}!`, 2200, CAST); return; }
  if (f.hes > 0 || f.charge > 0 || f.stun > 0 || f.beam || f.leap || f.flurry) return;
  if (hesitates()) { f.cds[k] = 0.8; return; }
  shout(`${spOf(f).name}, ${m.name}!`);
  B.used.add(k);
  useSpecial(f, B.enemy, k);
}
export const finisherReady = () => !!B && B.state === 'fight' && !B.script && !B.ritual && B.ally.fin >= 1 && B.ally.hes <= 0 && B.ally.charge <= 0 && B.ally.stun <= 0 && !B.ally.leap;
export function orderFinisher() {
  if (!finisherReady()) { if (B && B.state === 'fight' && !B.script && B.ally.fin < 1) toast('The finishing gauge is not full yet!', 2200, CAST); return; }
  if (hesitates()) return;
  shout(`NOW! ${finisherOf(B.ally.d).name}!`);
  useFinisher(B.ally);
}

function useSpecial(f, target, k) {
  const m = spOf(f).moves[k];
  f.cds[k] = m.cd;
  if (!B.script || f.side === 1) f.mp = Math.max(0, f.mp - mpCost(m, f.d.lvl));
  if (m.kind === 'dash' || m.kind === 'flurry') f.dash = { m, time: 1.2 };
  else if (m.kind === 'bolt' || m.kind === 'hex' || m.kind === 'drain') f.cast = { m, time: 0.25 };
  else if (m.kind === 'burst') f.approach = { m, time: 3.5 };   
  else if (m.kind === 'heal') {
    const mx = statsOf(f.d).maxHp, amt = Math.floor(mx * 0.3);
    f.d.hp = Math.min(mx, f.d.hp + amt); popNum(f, '+' + amt, '#7dff9a'); sparkle(f, '#7dff9a', 16);
    if (hasStatus(f.status)) { f.status = cleanse(); label(f, 'Cleansed!', '#7dff9a', 40); }
  } else if (m.kind === 'guard') { f.guard = 5; sparkle(f, '#9fd8ff', 12); buffFx(f, '#9fd8ff'); }
  else if (m.kind === 'rage') { f.rage = 6; sparkle(f, '#ff6a3d', 12); buffFx(f, '#ff6a3d'); }
  else if (m.kind === 'shield') { f.shield = SHIELD_TIME; sparkle(f, '#bfe8ff', 14); }
  else if (m.kind === 'beam') {                                   
    f.beam = { m, t: 0, charge: 0.35, tick: 0, a: Math.atan2(target.y - f.y, target.x - f.x) };
  } else if (m.kind === 'slam') {                                 
    f.leap = { m, t: 0, x0: f.x, y0: f.y, x1: target.x, y1: target.y };
    B.fx.push({ kind: 'mark', x: target.x, y: target.y, color: TYPES[m.type], t: 0, life: SLAM_TIME, r: SLAM_R });
  } else if (m.kind === 'trap') {                                 
    const [tx, ty] = trapSpot(f.x, f.y, target.x, target.y);
    const mine = B.mines.filter(q => q.owner.side === f.side);
    if (mine.length >= MAX_TRAPS) B.mines.splice(B.mines.indexOf(mine[0]), 1);
    B.mines.push({ x: tx, y: ty, owner: f, m, t: 0 });
    B.fx.push({ kind: 'toss', x: f.x, y: f.y, x1: tx, y1: ty, color: TYPES[m.type], t: 0, life: 0.4 });
  }
  callout(f, m.name, TYPES[m.type]);
  S.sfx.play(m.kind);
}
function label(f, text, color, dy = 70) { B.fx.push({ kind: 'label', f, x: f.x, y: f.y, text, color, t: 0, life: 1.1, dy }); }
function buffFx(f, color) { for (let i = 0; i < 5; i++) B.fx.push({ kind: 'up', x: f.x + (i - 2) * 0.22, y: f.y, color, t: -i * 0.08, life: 0.8 }); }




export function orderParry() {
  if (!B || B.state !== 'fight' || B.ritual) return;
  const f = B.ally;
  if (!canParry(f) || f.hes > 0) return;
  f.parry = PARRY_WINDOW; f.parryCd = PARRY_CD;
  B.fx.push({ kind: 'parryWin', x: f.x, y: f.y, t: 0, life: PARRY_WINDOW, f });
  S.sfx.play('guard');
}
export const parryReady = () => !!B && B.state === 'fight' && !B.ritual && canParry(B.ally);

function reflectShot(p, def) {
  const att = p.owner;
  p.owner = def; p.target = att; p.vx *= -1.2; p.vy *= -1.2; p.life = 1.8; p.home = 6; p.reflected = true; p.rolled = true; p.dodged = false;
}

function useFinisher(f) {
  const m = finisherOf(f.d, f.side === 1);
  f.fin = 0; f.charge = 0.9; f.dash = null; f.approach = null; f.cast = null; f.beam = null; f.flurry = null; f.wind = 0;
  callout(f, m.name, TYPES[m.type], true);
  B.shake = 0.25;
  sparkle(f, TYPES[m.type], 22);
  S.sfx.play('rage');
}




function hit(att, def, power, type, { big = false, kind = 'basic', m = null, proj = null } = {}) {
  if (def.d.hp <= 0) return;
  const dist = Math.hypot(def.x - att.x, def.y - att.y);
  const counters = !(B.script && def.side === 1);                 
  if (counters && def.parry > 0 && kind !== 'counter') {         
    const out = parryOutcome(kind, dist);
    def.parry = 0; def.parryCd = 0.25; def.parried = 0.5; B.parries++;
    callout(def, out === 'reflect' ? 'REFLECT!' : out === 'counter' ? 'PARRY! COUNTER!' : 'PARRY!', '#ffffff');
    B.fx.push({ kind: 'parry', x: def.x, y: def.y, t: 0, life: 0.45 });
    B.shake = Math.max(B.shake, 0.2); S.flash = Math.max(S.flash, 0.18);
    S.sfx.play('parry');
    if (out === 'counter') {
      att.stun = PARRY_STUN; att.dash = null; att.flurry = null; att.wind = 0;
      hit(def, att, PARRY_COUNTER, spOf(def).types[0], { kind: 'counter' });
      return 'parried';
    }
    if (out === 'reflect') { if (proj) reflectShot(proj, def); return 'reflected'; }
    return 'blocked';
  }
  if (counters && def.shield > 0 && reflects(kind)) {            
    label(def, 'REFLECT!', '#bfe8ff', 40);
    B.fx.push({ kind: 'parry', x: def.x, y: def.y, t: 0, life: 0.35, color: '#bfe8ff' });
    S.sfx.play('guard');
    if (proj) reflectShot(proj, def);
    return 'reflected';
  }
  if (counters && def.side === 0 && B.stance === 'guard' && !B.script && fullGuard(B.guardCharge, !!B.boss)) { 
    B.fx = B.fx.filter(e => !(e.kind === 'guardRing' && e.f === def));
    B.fx.push({ kind: 'guardRing', f: def, x: def.x, y: def.y, t: 0, life: 1.2 });   
    label(def, 'Guard!', '#9fd8ff', 40);
    S.sfx.play('guard');
    return 'blocked';
  }
  if (interrupts(kind) && (def.charge > 0 || def.beam || def.rage > 0 || def.cast)) { 
    if (def.charge > 0) def.fin = 0.5;                            
    def.charge = 0; def.beam = null; def.rage = 0; def.cast = null;
    label(def, 'Interrupt!', '#ffffff', 95);
  }
  let { dmg, eff, attr, crit } = calcDamage(att.d, def.d, power * (att.rage > 0 ? 1.5 : 1), type, Math.random, G.cycle);
  if (B.script === 'guardian' && att.side === 0) { dmg = capsFor(G.cycle).maxDamage; crit = true; }
  else dmg = capHit(Math.max(1, Math.round(dmg * BATTLE_PACE)), statsOf(def.d).maxHp, big || kind === 'finisher'); 
  const guarded = counters && (def.guard > 0 || def.shield > 0 || (def.side === 0 && B.stance === 'guard'));   
  const st = statusOf(m);
  if (st && !(B.script && def.side === 1)) { def.status = applyStatus(def.status, st); label(def, st === 'burn' ? 'Burned!' : st === 'slow' ? 'Slowed!' : 'Dizzy!', STATUS_COLOR[st], 10); }
  if (attr > 1) label(def, 'Attribute advantage!', ATTR_COLOR[attrOf(att.d)] || '#fff', eff > 1 ? 120 : 95);
  dmg = finalDamage(dmg, guarded, G.cycle);
  if (def.pat) { 
    const pm = patternDamageMult(def.pat, def);
    if (pm !== 1) { dmg = Math.max(1, Math.round(dmg * pm)); label(def, pm > 1 ? 'Open!' : 'Like a mountain!', pm > 1 ? '#ffe14a' : '#b8c4d0', 70); }
  }
  if (def.side === 0 && !B.script) dmg = Math.max(1, Math.round(dmg * easeFor(chapterOf(G.flags)))); 
  const floor = B.script === 'guardian' && def.side === 0 ? 1 : 0;   
  const before = def.d.hp;
  def.d.hp = Math.max(floor, def.d.hp - dmg);
  const frac = (before - def.d.hp) / statsOf(def.d).maxHp;
  att.fin = Math.min(1, att.fin + finisherGain({ dealt: frac, wild: att.side === 1 }));
  def.fin = Math.min(1, def.fin + finisherGain({ taken: frac, wild: def.side === 1 }));
  def.hurt = 0.25; def.flash = 0.12;
  if (kind === 'drain' && before > def.d.hp) {                   
    const mx = statsOf(att.d).maxHp, amt = Math.max(1, Math.floor((before - def.d.hp) * DRAIN_SHARE));
    att.d.hp = Math.min(mx, att.d.hp + amt); popNum(att, '+' + amt, '#7dff9a');
    B.fx.push({ kind: 'drain', x: def.x, y: def.y, x1: att.x, y1: att.y, f: att, t: 0, life: 0.6, color: '#7dff9a' });
  }
  const dx = def.x - att.x, dy = def.y - att.y, dl = Math.hypot(dx, dy) || 1, push = big ? 7 : kind === 'flurry' || kind === 'beam' ? 1 : 3;
  def.vx += dx / dl * push; def.vy += dy / dl * push;
  popNum(def, String(dmg), crit || big ? '#ffe14a' : eff > 1 ? '#ff8a5a' : eff < 1 ? '#b8c4d0' : '#ffffff', crit || eff > 1 || big);
  if (eff > 1) B.fx.push({ kind: 'label', f: def, x: def.x, y: def.y, text: 'Super effective!', color: '#ffb04a', t: 0, life: 1.1, dy: 70 });
  if (guarded) B.fx.push({ kind: 'label', f: def, x: def.x, y: def.y, text: 'Guard', color: '#9fd8ff', t: 0, life: 0.8, dy: 70 });
  sparkle(def, TYPES[type], big ? 30 : 10);
  
  const word = hitWord({ big, crit, eff, n: hitCount++ });
  B.fx.push({ kind: 'burst', x: def.x, y: def.y, color: TYPES[type], t: 0, life: big ? 0.5 : word ? 0.34 : 0.24, big: crit || big, corrupt: !!def.d.corrupt, f: def });
  if (word) B.fx.push({ kind: 'word', f: def, x: def.x, y: def.y, text: word, big, color: TYPES[type], t: 0, life: big ? 0.95 : 0.7 });
  if (big) { B.fx.push({ kind: 'ring', x: def.x, y: def.y, color: TYPES[type], t: 0, life: 0.7, r: 3.2 }); B.shake = 0.5; S.flash = Math.max(S.flash, 0.35); }
  else if (crit) B.shake = 0.3;
  S.sfx.play(crit || big ? 'crit' : 'hit');
}
function popNum(f, text, color, big) { B.nums.push({ f, x: f.x, y: f.y, text, color, t: 0, big }); }
function sparkle(f, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, s = 1 + Math.random() * 2.5;
    B.fx.push({ kind: 'spark', x: f.x, y: f.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, z: 0.6 + Math.random() * 0.5, vz: 1 + Math.random() * 2, color, t: 0, life: 0.5 + Math.random() * 0.4 });
  }
}

const speedOf = f => { const s = statsOf(f.d).spd; return 1.8 + 3 * s / (s + 60); };


function runPattern(f, o, dt) {
  const p = f.pat;
  f.open = Math.max(0, f.open - dt);
  if (B.script || B.ritual || f.stun > 0 || f.leap || f.dash || f.beam || f.cast) return false;
  
  
  if (f.open > 0) {
    if (!f.winded) { f.winded = true; callout(f, 'OPEN!', '#7dff9a', true); }
    f.vx = f.vy = 0; return true;
  }
  f.winded = false;
  if (f.tellT > 0) {
    const before = p.tell - f.tellT; f.tellT -= dt; const now = p.tell - f.tellT;
    for (const at of tellBeats(p)) if (at > before - 1e-6 && at <= now) S.sfx.play(p.sfx);
    if (f.tellT > 0) return true;
    f.cds[p.move] = 0; f.mp = Math.max(f.mp, mpCost(spOf(f).moves[p.move], f.d.lvl));
    useSpecial(f, o, p.move); f.open = OPEN_TIME + (f.leap || f.dash ? 1 : 0); f.sigCd = p.every;
    return true;
  }
  f.sigCd -= dt;
  if (f.sigCd > 0 || f.d.hp <= 0) return false;
  f.tellT = p.tell; f.vx = f.vy = 0;
  callout(f, p.text, '#ffcf40', true);
  return true;
}

function updateFighter(f, o, dt) {
  const slowK = speedMult(f.status);
  f.cds = f.cds.map(c => Math.max(0, c - dt * slowK));
  f.basic -= dt; f.guard -= dt; f.rage -= dt; f.hurt -= dt; f.flash -= dt; f.hes -= dt; f.lunge = Math.max(0, f.lunge - dt * 4);
  f.parry -= dt; f.parryCd -= dt; f.stun -= dt; f.shield -= dt; f.parried -= dt;
  const stance = f.side === 1 ? 'attack' : (B.ritual || B.capture || B.script === 'guardian') ? 'away' : B.stance;
  f.mp = Math.min(maxMp(f.d), f.mp + mpRegen(f.d, dt, stance === 'guard'));
  if (!B.script) f.fin = Math.min(1, f.fin + finisherGain({ dt, wild: f.side === 1 }));
  
  const ts = tickStatus(f.status, dt); f.status = ts.st;
  if (ts.burn > 0) {
    f.burnAcc += ts.burn * statsOf(f.d).maxHp * (f.side === 0 && !B.script ? easeFor(chapterOf(G.flags)) : 1);
    if (f.burnAcc >= 1 && (f.burnAcc >= 3 || !f.status.burn)) {
      const n = Math.floor(f.burnAcc); f.burnAcc -= n;
      const floor = B.script === 'guardian' && f.side === 0 ? 1 : 0;
      f.d.hp = Math.max(floor, f.d.hp - n); popNum(f, String(n), STATUS_COLOR.burn);
    }
  }
  moveBy(f, f.vx * dt, f.vy * dt); f.vx *= 0.85; f.vy *= 0.85;
  const dx = o.x - f.x, dy = o.y - f.y, dist = Math.hypot(dx, dy) || 0.01;
  if (Math.abs(dx - dy) > 0.05) f.face = dx - dy > 0 ? 1 : -1;
  f.walking = false;
  if (f.leap) {                                            
    const L = f.leap; L.t += dt;
    const k = Math.min(1, L.t / SLAM_TIME);
    f.x = L.x0 + (L.x1 - L.x0) * k; f.y = L.y0 + (L.y1 - L.y0) * k; f.z = slamZ(k); clampArena(f);
    if (k >= 1) {
      f.leap = null; f.z = 0; f.lunge = 1; B.shake = Math.max(B.shake, 0.3);
      B.fx.push({ kind: 'ring', x: f.x, y: f.y, color: TYPES[L.m.type], t: 0, life: 0.55, r: SLAM_R });
      sparkle(f, '#d8c8a8', 14);
      if (Math.hypot(o.x - f.x, o.y - f.y) < SLAM_R + (B.script ? 1.5 : 0)) hit(f, o, L.m.power, L.m.type, { kind: 'slam', m: L.m });
      f.ai = { mode: 'back', t: 0.5 };
    }
    return;
  }
  if (f.hes > 0 || f.stun > 0) return;                     
  if (f.charge > 0) {                                      
    f.charge -= dt;
    if (Math.random() < 0.8) B.fx.push({ kind: 'charge', x: f.x, y: f.y, color: TYPES[finisherOf(f.d).type], t: 0, life: 0.45, a: Math.random() * 6.28 });
    if (f.charge <= 0) { const m = finisherOf(f.d, f.side === 1); B.proj.push({ x: f.x, y: f.y, vx: dx / dist * 10, vy: dy / dist * 10, m, owner: f, target: o, life: 2.5, big: true, home: 12 }); }
    return;
  }
  if (f.beam) {                                            
    const bm = f.beam;
    if (bm.charge > 0) { bm.charge -= dt; bm.a = Math.atan2(dy, dx); return; }
    bm.t += dt; bm.tick -= dt;
    bm.a = turnToward(bm.a, Math.atan2(dy, dx), dt);
    if (bm.tick <= 0) {
      bm.tick = BEAM_TICK;
      const ex = f.x + Math.cos(bm.a) * BEAM_LEN, ey = f.y + Math.sin(bm.a) * BEAM_LEN;
      if (segDist(o.x, o.y, f.x, f.y, ex, ey) < BEAM_HALF + (B.script ? 1 : 0)) {
        const r = hit(f, o, bm.m.power * BEAM_SHARE, bm.m.type, { kind: 'beam', m: bm.m });
        if (r === 'reflected') {                             
          f.beam = null; hit(o, f, bm.m.power * BEAM_SHARE * 2, bm.m.type, { kind: 'counter' }); return;
        }
      }
    }
    if (f.beam && bm.t >= BEAM_TIME) f.beam = null;
    return;
  }
  if (f.flurry) {                                          
    const fl = f.flurry; fl.t -= dt;
    if (dist > 1.3) moveBy(f, dx / dist * 6 * dt, dy / dist * 6 * dt);
    if (fl.t <= 0) {
      fl.t = FLURRY_GAP; fl.n--; f.lunge = 1;
      B.fx.push({ kind: 'slash', x: o.x, y: o.y, color: TYPES[fl.m.type], t: 0, life: 0.2, a: Math.random() * 6.28 });
      if (dist < 1.5 && hit(f, o, fl.m.power * FLURRY_SHARE, fl.m.type, { kind: 'flurry', m: fl.m })) fl.n = 0;
      if (fl.n <= 0) { f.flurry = null; f.basic = Math.max(f.basic, 0.5); f.ai = { mode: 'back', t: 0.6 }; }
    }
    return;
  }
  if (f.wind > 0) {                                        
    f.wind -= dt;
    if (f.wind <= 0) {
      f.lunge = 1; f.basic = Math.max(0.55, 1.35 - statsOf(f.d).spd / 250);
      if (dist < 1.45 + reach(f, o)) {
        if (Math.random() < missChance(f.status)) { label(f, 'Miss', '#b8c4d0', 40); S.sfx.play('miss'); }
        else hit(f, o, BASIC_POWER, spOf(f).types[0], { kind: 'basic' });
      }
      f.ai = nextAi(f.ai, { stance, ready: false, struck: true, rng: Math.random });
    }
    return;
  }
  if (f.dash) {
    f.dash.time -= dt;
    const v = 10 * dt;
    moveBy(f, dx / dist * Math.min(v, dist), dy / dist * Math.min(v, dist)); f.walking = true;
    if (Math.random() < 0.6) B.fx.push({ kind: 'trail', x: f.x, y: f.y, color: TYPES[f.dash.m.type], t: 0, life: 0.3 });
    if (dist < 0.85 + reach(f, o)) { 
      const m = f.dash.m; f.dash = null; f.lunge = 1;
      if (m.kind === 'flurry') { f.flurry = { m, n: FLURRY_HITS, t: 0 }; return; }
      hit(f, o, m.power, m.type, { kind: 'dash', m }); f.basic = Math.max(f.basic, 0.5); f.ai = { mode: 'back', t: 0.6 };
    }
    else if (f.dash.time <= 0) f.dash = null;
    return;
  }
  if (f.cast) {
    f.cast.time -= dt;
    if (f.cast.time <= 0) {
      const m = f.cast.m; f.cast = null;
      if (m.kind === 'bolt' || m.kind === 'hex' || m.kind === 'drain') {
        const sp = m.kind === 'hex' ? 6.5 : 8;
        B.proj.push({ x: f.x, y: f.y, vx: dx / dist * sp, vy: dy / dist * sp, m, owner: f, target: o, life: 1.8, home: B.script ? 12 : 2.5 });
      }
      
      else { B.fx.push({ kind: 'ring', x: f.x, y: f.y, color: TYPES[m.type], t: 0, life: 0.5, r: 2.8 }); if (dist < (B.script ? 4.5 : 2.9)) hit(f, o, m.power, m.type, { kind: 'burst', m }); }
    }
    return;
  }
  const spd = speedOf(f) * slowK;
  if (f.approach) {                                        
    f.approach.time -= dt;
    if (dist < 1.5) { f.cast = { m: f.approach.m, time: 0.3 }; f.approach = null; }
    else if (f.approach.time <= 0) f.approach = null;
    else { moveBy(f, dx / dist * spd * 1.5 * dt, dy / dist * spd * 1.5 * dt); f.walking = true; }
    return;
  }
  if (f.pat && runPattern(f, o, dt)) return; 
  if (f.side === 1) { 
    if (f.fin >= 1 && !B.script && !B.ritual && Math.random() < dt * 0.8) { useFinisher(f); return; }
    const ready = [0, 1, 2].filter(k => {
      const m = spOf(f).moves[k];
      if (!canUse(f, k, m) || (f.pat && k === f.pat.move)) return false; 
      if (m.kind === 'heal') return hpFraction(f.d) < 0.5 || hasStatus(f.status);   
      if (m.kind === 'shield') return f.shield <= 0;
      return true;
    });
    if (ready.length && Math.random() < dt * 0.35) { useSpecial(f, o, U.pick(Math.random, ready)); return; }
  }
  
  f.ai.t -= dt;
  let struck = false, mx = 0, my = 0, pace = spd;
  const nx = dx / dist, ny = dy / dist;
  if (f.ai.mode === 'close') {
    mx = nx; my = ny; pace = spd * 1.5;
    if (dist < 1.0 + reach(f, o) && f.basic <= 0) { f.wind = TELL; return; }   
  } else if (f.ai.mode === 'back') { mx = -nx; my = -ny; pace = spd * 1.2; }
  else {
    const R = RANGE[stance] * (f.ai.r || 1), k = Math.max(-1, Math.min(1, (dist - R) / 1.2));
    const tang = stance === 'guard' ? 0.35 : 0.85;
    mx = nx * k - ny * tang * f.orbit; my = ny * k + nx * tang * f.orbit;
    pace = spd * (stance === 'away' && dist < R - 1 ? 1.3 : 0.8);
    if (Math.random() < dt * 0.25) f.orbit *= -1;          
    
    if (stance === 'guard' && dist < 1.2 + reach(f, o) && f.basic <= 0) {
      hit(f, o, BASIC_POWER, spOf(f).types[0], { kind: 'counter' }); f.lunge = 1; f.basic = 1.1;
    }
  }
  if (f.status.dizzy > 0) { const w = Math.sin(B.t * 9 + f.side * 3) * 1.4; const rx = mx - my * w, ry = my + mx * w; mx = rx; my = ry; }
  const ml = Math.hypot(mx, my);
  if (ml > 0.05) {
    f.walking = true;
    if (moveBy(f, mx / ml * pace * dt * Math.min(1, ml), my / ml * pace * dt * Math.min(1, ml)) && f.ai.mode === 'circle') f.orbit *= -1;
  }
  f.ai = nextAi(f.ai, { stance, ready: f.basic <= 0, struck, rng: Math.random });
}



function threatOn(f, o) {
  let t = Infinity;
  const dist = Math.hypot(o.x - f.x, o.y - f.y);
  if (o.wind > 0 && dist < 1.6) t = Math.min(t, o.wind);
  if (o.tellT > 0) t = Math.min(t, o.tellT); 
  if (o.dash && dist < 3.2) t = Math.min(t, Math.max(0, dist - 0.85) / 10);
  if (o.flurry && dist < 1.6) t = Math.min(t, o.flurry.t);
  if (o.leap && Math.hypot(o.leap.x1 - f.x, o.leap.y1 - f.y) < SLAM_R) t = Math.min(t, SLAM_TIME - o.leap.t);
  if (o.beam && o.beam.charge > 0) t = Math.min(t, o.beam.charge);
  for (const p of B.proj) if (p.target === f && !p.dodged) t = Math.min(t, impactIn(p, f.x, f.y));
  return t;
}
function updateCounters(f, o) {
  f.threat = B.state === 'fight' ? threatOn(f, o) : Infinity;
  
  if (f.side !== 1 || B.script) return;
  if (f.threat >= 0.3) f.armed = true;
  else if (f.armed) { f.armed = false; if (canParry(f) && Math.random() < WILD_PARRY) { f.parry = PARRY_WINDOW; f.parryCd = PARRY_CD; } }
}

export function updateBattle(dt) {
  if (!B) return;
  B.t += dt; B.swapCd -= dt; B.shake = Math.max(0, B.shake - dt); B.guardCharge = guardDrain(B.guardCharge, dt);
  if (B.shout) { B.shout.t -= dt; if (B.shout.t <= 0) B.shout = null; }
  for (const n of B.nums) n.t += dt;
  B.nums = B.nums.filter(n => n.t < 1.1);
  for (const c of B.callouts) c.t += dt;
  B.callouts = B.callouts.filter(c => c.t < c.life);
  for (const e of B.fx) { e.t += dt; if (e.kind === 'spark') { e.x += e.vx * dt; e.y += e.vy * dt; e.z += e.vz * dt; e.vz -= 6 * dt; } }
  B.fx = B.fx.filter(e => e.t < e.life);
  if (B.state === 'intro') {
    B.timer -= dt;
    if (B.timer <= 0) {
      
      
      if (B.script) B.state = 'fight';
      else { B.state = 'scout'; B.timer = SCOUT_TIME; showScout(B.enemy, () => { if (B && B.state === 'scout') B.timer = 0; }); }
    }
  } else if (B.state === 'scout') { B.timer -= dt; if (B.timer <= 0) { hideScout(); B.state = 'fight'; } }
  if (B.state !== 'intro' || !B.run) { const p = G.player; [p.x, p.y] = clampToArena(p.x, p.y, B, 0.35); } 
  if (B.run && B.run.t < 1) { 
    const R = B.run, p = G.player; R.t = Math.min(1, R.t + dt / (INTRO * 0.8));
    const e = R.t * R.t * (3 - 2 * R.t), nx = R.fx + (R.tx - R.fx) * e, ny = R.fy + (R.ty - R.fy) * e;
    p.vx = (nx - p.x) / Math.max(dt, 1e-3); p.vy = (ny - p.y) / Math.max(dt, 1e-3); p.moving = R.t < 1; p.walk = (p.walk || 0) + dt * 14;
    p.x = nx; p.y = ny;
    if (R.t >= 1) { p.vx = p.vy = 0; G.follower.x = p.x; G.follower.y = p.y - 0.6; }
  }
  else if (B.state === 'fight') {
    updateCounters(B.ally, B.enemy); updateCounters(B.enemy, B.ally);
    updateFighter(B.ally, B.enemy, dt);
    updateFighter(B.enemy, B.ally, dt);
    if (SEPARATE.on) separateFighters();
    for (const p of B.proj) {
      
      if (!p.rolled && !p.big && U.dist(p.x, p.y, p.target.x, p.target.y) < 1.5) {
        p.rolled = true;
        const t = p.target, wild = t.side === 1;
        const c = B.script && wild ? 0 : dodgeChance({ stance: wild ? 'attack' : B.stance, spd: statsOf(t.d).spd, wild, dizzy: t.status.dizzy > 0 });
        if (t.stun <= 0 && !t.leap && Math.random() < c) {
          p.dodged = true; p.home = 0;
          const sp = Math.hypot(p.vx, p.vy) || 1, side = Math.random() < 0.5 ? 1 : -1;
          t.vx += -p.vy / sp * 9 * side; t.vy += p.vx / sp * 9 * side;
          B.fx.push({ kind: 'trail', x: t.x, y: t.y, color: '#ffffff', t: 0, life: 0.35, big: true });
          callout(t, 'DODGE!', '#9fd8ff');
        }
      }
      if (p.home && !p.dodged) { 
        const tx = p.target.x - p.x, ty = p.target.y - p.y, tl = Math.hypot(tx, ty) || 1, sp = Math.hypot(p.vx, p.vy);
        const k = Math.min(1, p.home * dt / 6);
        p.vx += (tx / tl * sp - p.vx) * k; p.vy += (ty / tl * sp - p.vy) * k;
      }
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (Math.random() < (p.big ? 1 : 0.7)) B.fx.push({ kind: 'trail', x: p.x, y: p.y, color: p.m.kind === 'drain' ? '#7dff9a' : TYPES[p.m.type], t: 0, life: p.big ? 0.45 : 0.25, big: p.big });
      if (!p.dodged && U.dist(p.x, p.y, p.target.x, p.target.y) < (p.big ? 0.9 : 0.6)) {
        const r = hit(p.owner, p.target, p.m.power, p.m.type, { big: p.big, kind: p.big ? 'finisher' : p.m.kind, m: p.m, proj: p });
        if (r !== 'reflected') p.life = 0;
      }
    }
    B.proj = B.proj.filter(p => p.life > 0);
    
    for (const q of B.mines) {
      q.t += dt;
      const v = q.owner.side === 0 ? B.enemy : B.ally;
      if (q.t > TRAP_ARM && v.z < 0.3 && Math.hypot(v.x - q.x, v.y - q.y) < TRAP_R + (B.script ? 1 : 0)) {
        q.t = TRAP_LIFE;
        B.fx.push({ kind: 'ring', x: q.x, y: q.y, color: TYPES[q.m.type], t: 0, life: 0.45, r: 1.4 });
        hit(q.owner, v, q.m.power, q.m.type, { kind: 'trap', m: q.m });
      }
    }
    B.mines = B.mines.filter(q => q.t < TRAP_LIFE);
    if (B.ritual) B.ritual.t += dt;
    if (B.enemy.d.hp <= 0) endBattle('win');
    else if (B.ally.d.hp <= 0) {
      B.ritual = null;
      const next = G.party.findIndex(d => d.hp > 0);
      if (next < 0) endBattle('lose');
      else faintedPick();
    }
  } else if (B.state === 'pick') {  }
  else if (B.state === 'capture') updateCapture(dt);
  else if (B.state === 'end') { B.timer -= dt; if (B.timer <= 0) finishBattle(); }
}




export const SEPARATE = { on: true }; 
function separateFighters() {
  const pad = f => fighterR(spOf(f).stage, !!spOf(f).boss);
  const a = B.ally, e = B.enemy, bodies = [{ x: a.x, y: a.y, f: a, pad: pad(a) }, { x: e.x, y: e.y, f: e, pad: pad(e), m: spOf(e).boss ? 3 : 1 }, { x: G.player.x, y: G.player.y, fixed: true, pad: 0.22 }];
  
  
  
  const stuck = !S.W.walkable(a.x, a.y, 0.25) || !S.W.walkable(e.x, e.y, 0.25);
  const skip = (p, q) => (p.f && (p.f.leap || p.f.z > 0.3)) || (q.f && (q.f.leap || q.f.z > 0.3)) || (B.capture && (p.f === e || q.f === e));
  pushApart(bodies, { gap: BATTLE_AIR, turn: true, skip, ok: (x, y) => (stuck || S.W.walkable(x, y, 0.25)) && inArena(x, y, B, 0.4) });
  
  
  if (Math.hypot(bodies[0].x - bodies[1].x, bodies[0].y - bodies[1].y) < bodies[0].pad + bodies[1].pad && !skip(bodies[0], bodies[1])) {
    pushApart(bodies, { gap: BATTLE_AIR, turn: true, skip, ok: (x, y) => inArena(x, y, B, 0.4) });
  }
  for (const o of bodies) if (o.f) { o.f.x = o.x; o.f.y = o.y; if (!o.f.leap) clampArena(o.f); }
}



function faintedPick() {
  const gone = B.ally.d, list = ableAfterFaint(G.party, gone);
  if (list.length === 1) { toast(`${spOf(B.ally).name} fainted!`); swapTo(list[0].i, true); return; }
  B.state = 'pick'; B.ally.d.hp = 0;
  showPick(gone, list, spOf(B.enemy).types, (n) => {
    if (!B || B.state !== 'pick') return;
    hidePick(); B.state = 'fight'; swapTo(list[n].i, true);
  });
}
function swapTo(i, forced) {
  const d = G.party[i];
  if (!d || d.hp <= 0 || d === B.ally.d) return;
  const old = B.ally;
  old.bb.dispose(S.stage.scene);
  B.ally = fighter(d, old.x, old.y, 0); B.ally.cds = [1, 1.5, 2];
  B.proj = B.proj.filter(p => p.owner !== old);
  for (const q of B.mines) if (q.owner === old) q.owner = B.ally;
  for (const p of B.proj) if (p.target === old) p.target = B.ally;
  B.activeIdx = i; B.swapCd = 1.5;
  shout(forced ? `Come on, ${speciesById(d.sp).name}!` : `Switch! Go, ${speciesById(d.sp).name}!`);
  sparkle(B.ally, '#ffffff', 14);
}
export function cycleSwap() {
  if (!B || B.state !== 'fight' || B.swapCd > 0 || B.script || B.ritual) return;
  for (let k = 1; k <= 3; k++) { const i = (B.activeIdx + k) % G.party.length; if (G.party[i] && G.party[i].hp > 0 && G.party[i] !== B.ally.d) { swapTo(i); return; } }
  toast('No other companion can fight!');
}
export function useTonic() {
  if (!B || B.state !== 'fight' || B.script) return;
  if (G.items.tonic <= 0) { toast('No Berry Tonics left.'); return; }
  G.items.tonic--;
  const mx = statsOf(B.ally.d).maxHp, amt = Math.floor(mx * 0.5);
  B.ally.d.hp = Math.min(mx, B.ally.d.hp + amt);
  popNum(B.ally, '+' + amt, '#7dff9a'); sparkle(B.ally, '#7dff9a', 16);
  if (hasStatus(B.ally.status)) { B.ally.status = cleanse(); label(B.ally, 'Cleansed!', '#7dff9a', 40); }
  shout(`Drink this, ${spOf(B.ally).name}!`);
}
export function tryRun() {
  if (!B || B.state !== 'fight' || B.script) return;
  if (B.boss && !B.ritual) { toast(`${spOf(B.enemy).name} blocks the way! There is no running from this one.`); return; }
  if (B.ritual) { B.ritual = null; toast('Ritual cancelled.'); return; }
  if (Math.random() < 0.8) { toast('Got away safely!'); B.result = 'run'; finishBattle(); }
  else { toast("Couldn't escape!"); B.swapCd = 1; }
}


export const canRitual = () => !!B && B.state === 'fight' && !B.ritual && !B.script && B.enemy.d.hp > 0 && (!B.boss || bossCapturable(G.cycle)) && (hpFraction(B.enemy.d) < CAPTURE_HP || G.items.seal > 0);
export function startRitual() {
  if (!B || B.state !== 'fight' || B.ritual || B.script) return;
  if (B.boss && !bossCapturable(G.cycle)) { toast(`${spOf(B.enemy).name} cannot be befriended... not yet. (New Game+)`); return; }
  const low = hpFraction(B.enemy.d) < CAPTURE_HP;
  if (!low && G.items.seal <= 0) { toast('Too strong to befriend! Get its HP below 25% first.'); return; }
  const seal = !low;
  if (seal) G.items.seal--;
  const es = spOf(B.enemy);
  B.ritual = { pattern: makePattern(es.rarity, B.enemy.d.lvl), t: 0, i: 0, grades: [], rarity: es.rarity, seal, trail: [] };
  shout(seal ? 'Heart Seal! Be my friend!' : 'Easy... I just want to be friends.');
  S.sfx.play('heart');
}

export function finishRitual(chance) {
  const r = B.ritual; B.ritual = null;
  B.state = 'capture';
  B.capture = { t: 0, from: { x: G.player.x, y: G.player.y }, success: Math.random() < chance, chance, seal: r.seal };
  S.sfx.play('heart');
}
function updateCapture(dt) {
  const c = B.capture; c.t += dt;
  if (c.t > 0.6 && !c.absorbed) { c.absorbed = true; sparkle(B.enemy, '#ff9fd0', 18); }
  if (c.t > 0.6 && c.t < 2.6 && Math.floor(c.t / 0.6) !== c.lastWobble) { c.lastWobble = Math.floor(c.t / 0.6); S.sfx.play('wobble'); }
  if (c.t > 2.8) {
    if (c.success) endBattle('capture');
    else {
      B.state = 'fight'; B.enemy.rage = 4; B.capture = null;
      sparkle(B.enemy, '#ff4a4a', 16); toast(`${spOf(B.enemy).name} broke free!`);
    }
  }
}

function endBattle(result) {
  B.result = result; B.state = 'end'; B.timer = 1.6;
  if (result === 'win') shout(B.script === 'guardian' ? 'Y-you did it!!' : 'We did it!');
  if (result === 'capture') shout(`${spOf(B.enemy).name} is our friend now!`);
  if (result === 'lose') shout('No... everyone, retreat!');
  S.sfx.play(result === 'lose' ? 'lose' : result === 'capture' ? 'befriended' : 'win');
}


let onFinish = () => {};
export const setFinishHandler = f => { onFinish = f; };
export function finishBattle() {
  const b = B; B = null; hideScout(); hidePick();
  b.ally.bb.dispose(S.stage.scene); b.enemy.bb.dispose(S.stage.scene);
  G.mode = 'world'; G.safeTimer = 2.5;
  if (b.result === 'capture' || b.result === 'win') S.cheerUntil = performance.now() + 1300; 
  music.battle(false);
  onFinish(b);
}
