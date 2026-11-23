







import { TUNING as T, HZ, DT, secs } from './tuning.js';
import { TITANS, WEAPONS, HOUSES } from './titans.js';
import { ARENAS } from './arenas.js';
import { makeRng, nextRandom } from './rng.js';
import * as Abilities from './abilities.js';
import { SLEEPER_EVENT, createSleeper, tickSleeper, reachesCore, hitCore } from './sleeper.js';

export const EVENT = Object.freeze({
  HIT: 'hit', SLAM: 'slam', CLANG: 'clang', COUNTER: 'counter', STALL: 'stall', PERFECT_VENT: 'perfectVent',
  ROUGH_VENT: 'roughVent', REDLINE: 'redline', RATTLED: 'rattled', BELL: 'bell', DROP: 'drop', FIRE: 'fire',
  DASH: 'dash', BLOCKED: 'blocked', STORM: 'storm', END: 'end', ABILITY: 'ability', REFLECT: 'reflect',
  LUMEN_FALL: 'lumenFall', LUMEN: 'lumen', LUMEN_OVERDRIVE: 'lumenOverdrive',
  ...SLEEPER_EVENT,
});

const NEVER = -1e9;

function makeTitan(id, p, spawn) {
  const frame = TITANS[p.titan] ? p.titan : 'lancer';
  const house = HOUSES.find((h) => h.id === p.house) || HOUSES[id % HOUSES.length];
  const spec = TITANS[frame];
  return {
    id, house: house.id, frame, team: p.team ?? id, rookie: !!p.rookie, cpu: p.cpu || null,
    x: spawn.x, y: spawn.y, vx: 0, vy: 0, kx: 0, ky: 0,
    facing: Math.atan2(-spawn.y, -spawn.x), 
    armour: spec.armour, maxArmour: spec.armour,
    heat: 0, redline: false, stall: 0, stallAge: 0, stallEnded: false, vented: false, overdrive: 0,
    rattle: 0, rattled: 0, lastHitAt: NEVER, lastHitBy: null,
    dash: 0, dashStart: NEVER, dashDx: 0, dashDy: 0, running: false,
    fireCd: 0, abilityCd: 0, lunge: 0, lungeDx: 0, lungeDy: 0, aegis: 0, hitstop: 0, counter: 0, counterTarget: null,
    shield: 0, alive: true, respawn: 0, lastBusyTick: NEVER, wallHitAt: NEVER, lumen: 0, lumenTime: 0,
    prevFire: false, prevBoost: false, prevAbility: false,
    bells: 0, rung: 0, ringOuts: 0, clangsWon: 0, perfectVents: 0, stalls: 0, redlineTicks: 0,
  };
}


export function createMatch({ seed = 1, arena = 'bellRing', players = [], sleeper = true } = {}) {
  const a = ARENAS[arena] ? arena : 'bellRing';
  const spawns = ARENAS[a].spawns;
  return {
    seed, tick: 0, rng: makeRng(seed), arena: a, over: false, storm: false,
    titans: players.slice(0, 8).map((p, i) => makeTitan(i, p, spawns[i % spawns.length])),
    shots: [], decoys: [], lumen: [], lumenClock: 0, sleeper: createSleeper(a, sleeper),
  };
}

export const isStorm = (m) => m.tick >= secs(T.roundTime - T.stormTime);


export function stormBounds(m) {
  const a = ARENAS[m.arena];
  const into = m.tick - secs(T.roundTime - T.stormTime);
  const f = into <= 0 ? 1 : 1 - (1 - T.stormWallMin) * Math.min(1, into / secs(T.stormWallTime));
  return { hw: (a.w / 2) * f, hh: (a.h / 2) * f };
}



function stormWall(m, t, events) {
  if (!isStorm(m) || !t.alive) return;
  const { hw, hh } = stormBounds(m);
  const ox = Math.abs(t.x) + T.radius - hw; const oy = Math.abs(t.y) + T.radius - hh;
  if (ox <= 0 && oy <= 0) return;
  if (m.tick - t.wallHitAt < secs(T.stormWallEvery)) return;
  t.wallHitAt = m.tick;
  const dx = ox > 0 ? -Math.sign(t.x) : 0; const dy = oy > 0 ? -Math.sign(t.y) : 0;
  const [nx, ny] = norm(dx, dy);
  t.kx += nx * T.stormWallKnock; t.ky += ny * T.stormWallKnock;
  damage(m, t, T.stormWallDamage, null, nx, ny, 0, 'storm', events);
}
const dmgMul = (t) => (t.heat >= T.redLine || t.overdrive > 0 ? T.redLineMul : 1) * (t.lumenTime > 0 ? T.lumenDamageMul : 1);

const heatFree = (t) => t.overdrive > 0 || t.lumenTime > 0;



function lumenSafe(m, x, y) {
  const a = ARENAS[m.arena]; const { hw, hh } = stormBounds(m);
  if (Math.abs(x) > hw - 1.2 || Math.abs(y) > hh - 1.2) return false;
  return !blockedByCover(a, x, y, 1.2);
}

function nearestSafe(m, x, y) {
  if (lumenSafe(m, x, y)) return { x, y };
  for (let r = 1; r < 40; r += 1) {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const px = x + Math.cos(a) * r; const py = y + Math.sin(a) * r;
      if (lumenSafe(m, px, py)) return { x: px, y: py };
    }
  }
  return { x: 0, y: 0 };
}
function lumenFall(m, events) {
  const cap = isStorm(m) ? T.lumenCapStorm : T.lumenCap;
  if (m.lumen.length >= cap) return;
  m.lumenClock += 1;
  if (m.lumenClock < secs(T.lumenEvery)) return;
  const { hw, hh } = stormBounds(m);
  for (let i = 0; i < 30; i++) {
    const x = (nextRandom(m.rng) * 2 - 1) * hw; const y = (nextRandom(m.rng) * 2 - 1) * hh;
    if (!lumenSafe(m, x, y)) continue;
    if (m.titans.some((t) => t.alive && Math.hypot(t.x - x, t.y - y) < T.lumenClear)) continue;
    if (m.lumen.some((c) => Math.hypot(c.x - x, c.y - y) < T.lumenClear)) continue;
    m.lumenClock = 0;
    m.lumen.push({ x, y });
    events.push({ type: EVENT.LUMEN_FALL, x, y });
    return;
  }
  
}
function lumenPickup(m, t, events) {
  for (let i = m.lumen.length - 1; i >= 0; i--) {
    const c = m.lumen[i];
    if (Math.hypot(t.x - c.x, t.y - c.y) > T.radius + T.lumenPickup) continue;
    m.lumen.splice(i, 1);
    t.lumen += 1;
    events.push({ type: EVENT.LUMEN, id: t.id, count: t.lumen });
    if (t.lumen >= T.lumenToOverdrive) {
      t.lumen = 0; t.lumenTime = secs(T.lumenTime);
      events.push({ type: EVENT.LUMEN_OVERDRIVE, id: t.id });
    }
  }
}

function lumenDrop(m, t) {
  const { hw, hh } = stormBounds(m);
  const cx = Math.max(-hw + 1.5, Math.min(hw - 1.5, t.x)); const cy = Math.max(-hh + 1.5, Math.min(hh - 1.5, t.y));
  for (let i = 0; i < t.lumen; i++) {
    const a = (i / Math.max(1, t.lumen)) * Math.PI * 2;
    m.lumen.push(nearestSafe(m, cx + Math.cos(a) * 1.5, cy + Math.sin(a) * 1.5));
  }
  t.lumen = 0; t.lumenTime = 0;
}
const rivals = (m, t) => m.titans.filter((o) => o !== t && o.alive && o.team !== t.team);

function norm(x, y) {
  const l = Math.hypot(x, y);
  return l > 1e-9 ? [x / l, y / l, l] : [0, 0, 0];
}

function autoAim(m, t) {
  const cone = ((t.rookie ? T.autoAimConeRookie : T.autoAimCone) / 2) * (Math.PI / 180);
  let best = null; let bestD = T.autoAimRange;
  for (const o of [...rivals(m, t), ...(m.decoys || []).filter((d) => d.team !== t.team)]) {
    const dx = o.x - t.x; const dy = o.y - t.y; const d = Math.hypot(dx, dy);
    let da = Math.atan2(dy, dx) - t.facing;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) <= cone && d < bestD) { best = o; bestD = d; }
  }
  return best;
}

function bountyOf(m) {
  let top = null; let topB = -1e9; let second = -1e9;
  for (const t of m.titans) {
    if (t.bells > topB) { second = topB; topB = t.bells; top = t; } else if (t.bells > second) second = t.bells;
  }
  if (m.titans.length < 2) return null;
  return top && topB - second >= T.bountyLead ? top : null;
}
export const bounty = bountyOf;

function ringBell(m, target, ringOut, events) {
  const credited = target.lastHitBy !== null && target.lastHitBy !== target.id
    && m.tick - target.lastHitAt <= secs(T.creditWindow);
  const storm = isStorm(m) ? T.stormBellMul : 1;
  if (credited) {
    const by = m.titans[target.lastHitBy];
    const value = storm * (bountyOf(m) === target ? T.bountyValue : 1);
    by.bells += value;
    events.push({ type: EVENT.BELL, target: target.id, by: by.id, value, ringOut });
  } else {
    target.bells -= 1;
    events.push({ type: EVENT.BELL, target: target.id, by: null, value: -1, ringOut });
  }
  target.rung += 1; if (ringOut) target.ringOuts += 1;
  target.alive = false; target.respawn = secs(T.respawnTime);
  target.vx = target.vy = target.kx = target.ky = 0;
  target.dash = 0; target.stall = 0; target.heat = 0; target.rattle = 0; target.rattled = 0;
  target.counter = 0; target.hitstop = 0; target.overdrive = 0; target.lunge = 0; target.aegis = 0;
  lumenDrop(m, target);
}

function damage(m, target, amount, by, dirX, dirY, knock, kind, events) {
  if (!target.alive) return;
  if (target.shield > 0) { events.push({ type: EVENT.BLOCKED, target: target.id, by }); return; }
  let d = amount;
  if (target.stall > 0) d *= T.stalledDamageMul;
  if (target.rattled > 0) d *= T.rattledDamageMul;
  target.armour -= d;
  if (by !== null) { target.lastHitBy = by; target.lastHitAt = m.tick; } 
  const missing = Math.max(0, 1 - target.armour / target.maxArmour);
  const k = knock * (1 + T.knockMissingArmourMul * missing);
  target.kx += dirX * k; target.ky += dirY * k;
  events.push({ type: EVENT.HIT, target: target.id, by, damage: d, kind });
  if (target.rattled === 0) {
    target.rattle += d * T.rattlePerDamage;
    if (target.rattle >= 100 * (target.rookie ? T.rookieRattleMul : 1)) {
      target.rattle = 0; target.rattled = secs(T.rattledTime); target.dash = 0;
      events.push({ type: EVENT.RATTLED, id: target.id });
    }
  }
  if (target.armour <= 0) { target.armour = 0; ringBell(m, target, false, events); }
}

function spawnPoint(m, t) {
  let best = null; let bestD = -1;
  for (const s of ARENAS[m.arena].spawns) {
    let d = 1e9;
    for (const o of m.titans) if (o !== t && o.alive) d = Math.min(d, Math.hypot(o.x - s.x, o.y - s.y));
    if (d > bestD) { bestD = d; best = s; }
  }
  
  const { hw, hh } = stormBounds(m);
  const cx = hw - T.radius; const cy = hh - T.radius;
  return { x: Math.max(-cx, Math.min(cx, best.x)), y: Math.max(-cy, Math.min(cy, best.y)) };
}

function fire(m, t, inp, events) {
  const w = WEAPONS[TITANS[t.frame].weapon];
  let dx; let dy; let aimDist = w.range;
  if (inp.ax !== undefined && Math.hypot(inp.ax, inp.ay) > 0.2) {
    [dx, dy] = norm(inp.ax, inp.ay);
    
    if (inp.ad !== undefined) aimDist = inp.ad;
  } else {
    const target = autoAim(m, t);
    if (target) { const n = norm(target.x - t.x, target.y - t.y); dx = n[0]; dy = n[1]; aimDist = n[2]; }
    else { dx = Math.cos(t.facing); dy = Math.sin(t.facing); }
  }
  t.facing = Math.atan2(dy, dx);
  const mul = dmgMul(t);
  if (w.kind === 'lob') {
    const d = Math.min(aimDist, w.range);
    m.shots.push({ kind: 'lob', owner: t.id, team: t.team, x: t.x + dx * d, y: t.y + dy * d,
      life: secs(w.flight), maxLife: secs(w.flight), damage: w.damage * mul, splash: w.splash });
  } else {
    const base = Math.atan2(dy, dx);
    for (let i = 0; i < w.count; i++) {
      const off = w.count === 1 ? 0 : (i / (w.count - 1) - 0.5) * w.spread * (Math.PI / 180);
      const a = base + off;
      const cx = Math.cos(a); const cy = Math.sin(a);
      m.shots.push({ kind: 'bolt', owner: t.id, team: t.team, x: t.x + cx * (T.radius + 0.3), y: t.y + cy * (T.radius + 0.3),
        vx: cx * w.speed, vy: cy * w.speed, life: Math.ceil((w.range / w.speed) * HZ), maxLife: Math.ceil((w.range / w.speed) * HZ), damage: w.damage * mul });
    }
  }
  if (!heatFree(t)) t.heat += w.heat;
  t.fireCd = secs(w.cooldown);
  events.push({ type: EVENT.FIRE, id: t.id });
}

function blockedByCover(arena, x, y, pad) {
  for (const c of arena.circles) if (Math.hypot(x - c.x, y - c.y) < c.r + pad) return true;
  for (const b of arena.boxes) if (Math.abs(x - b.x) < b.w / 2 + pad && Math.abs(y - b.y) < b.h / 2 + pad) return true;
  return false;
}

function pushOutOfCover(arena, t) {
  const r = T.radius;
  for (const c of arena.circles) {
    const [nx, ny, d] = norm(t.x - c.x, t.y - c.y);
    if (d < c.r + r) { const p = c.r + r - d; t.x += (d > 0 ? nx : 1) * p; t.y += (d > 0 ? ny : 0) * p; }
  }
  for (const b of arena.boxes) {
    const px = b.w / 2 + r - Math.abs(t.x - b.x); const py = b.h / 2 + r - Math.abs(t.y - b.y);
    if (px > 0 && py > 0) {
      if (px < py) t.x += Math.sign(t.x - b.x || 1) * px; else t.y += Math.sign(t.y - b.y || 1) * py;
    }
  }
}

function heatCheck(t, events) {
  if (t.heat >= 100) {
    t.heat = 100; t.stall = secs(T.stallTime); t.stallAge = 0; t.vented = false; t.dash = 0; t.running = false;
    t.stalls += 1;
    events.push({ type: EVENT.STALL, id: t.id });
    return true;
  }
  return false;
}

function control(m, t, inp, events) {
  const firePressed = inp.fire && !t.prevFire;
  const boostPressed = inp.boost && !t.prevBoost;

  
  if (t.counter > 0 && t.hitstop === 0 && inp.fire) {
    const o = m.titans[t.counterTarget];
    t.counter = 0;
    if (o) o.counter = 0;
    if (o && o.alive) {
      const [nx, ny] = norm(o.x - t.x, o.y - t.y);
      damage(m, o, T.counterDamage * dmgMul(t), t.id, nx, ny, T.slamKnock, 'counter', events);
      t.clangsWon += 1;
      events.push({ type: EVENT.COUNTER, by: t.id, target: o.id });
    }
    return;
  }
  if (t.hitstop > 0) return;

  
  if (t.stall > 0) {
    t.stallAge += 1;
    if (boostPressed && !t.vented) {
      t.vented = true;
      const since = t.stallAge / HZ;
      const half = (t.rookie ? T.ventWindowRookie : T.ventWindow) / 2;
      if (Math.abs(since - T.ventMarkAt) <= half + 1e-9) {
        t.stall = 0; t.heat = 0; t.overdrive = secs(T.overdriveTime); t.perfectVents += 1;
        events.push({ type: EVENT.PERFECT_VENT, id: t.id });
        return;
      }
      t.stall = Math.max(1, t.stall - secs(T.roughVentCut));
      events.push({ type: EVENT.ROUGH_VENT, id: t.id });
    }
    t.stall -= 1;
    if (t.stall === 0) { t.heat = T.stallHeatAfter; t.stallEnded = true; }
    t.vx *= 0.8; t.vy *= 0.8;
    return;
  }

  const spec = TITANS[t.frame];
  let [sx, sy, smag] = norm(inp.mx || 0, inp.my || 0);
  smag = Math.min(1, smag);
  if (smag > 0.2) t.facing = Math.atan2(sy, sx);

  
  if (inp.ability && !t.prevAbility && t.abilityCd === 0 && t.rattled === 0 && t.lunge === 0) {
    if (Abilities.use(m, t, inp, events, CTX)) {
      t.abilityCd = secs(spec.abilityCooldown);
      if (!heatFree(t)) t.heat += Abilities.ABILITIES[spec.ability].heat;
      t.lastBusyTick = m.tick;
      if (heatCheck(t, events)) return;
    }
  }
  if (t.lunge > 0) { Abilities.tickLunge(m, t, events, CTX); return; }

  const busy = !!(inp.fire || inp.boost);
  if (busy) t.lastBusyTick = m.tick;

  
  if (boostPressed && t.dash === 0 && t.rattled === 0) {
    const dx = smag > 0.2 ? sx : Math.cos(t.facing); const dy = smag > 0.2 ? sy : Math.sin(t.facing);
    t.dash = secs(T.dashTime); t.dashStart = m.tick; t.dashDx = dx; t.dashDy = dy;
    if (!heatFree(t)) t.heat += T.heatDash;
    events.push({ type: EVENT.DASH, id: t.id });
    if (heatCheck(t, events)) return;
  }
  t.running = inp.boost && !boostPressed && t.dash === 0 && t.rattled === 0;
  if (t.running && !heatFree(t)) t.heat += T.heatRunPerSec * DT;

  const speedMul = (t.running ? T.runSpeedMul : 1) * (t.overdrive > 0 ? T.overdriveSpeedMul : 1) * (t.rattled > 0 ? 0.5 : 1)
    * (t.aegis > 0 ? Abilities.ABILITIES.aegis.walkMul : 1);
  if (t.dash > 0) {
    const v = T.dashDistance / T.dashTime;
    t.vx = t.dashDx * v; t.vy = t.dashDy * v;
    t.dash -= 1;
  } else {
    const tx = sx * smag * spec.walk * speedMul; const ty = sy * smag * spec.walk * speedMul;
    t.vx += (tx - t.vx) * T.turnLerp; t.vy += (ty - t.vy) * T.turnLerp;
  }

  if (inp.fire && t.fireCd === 0 && t.rattled === 0) fire(m, t, inp, events);
  void firePressed;
  if (heatCheck(t, events)) return;
}

function cool(m, t) {
  
  if (t.stallEnded) { t.stallEnded = false; return; }
  if (t.stall > 0 || t.hitstop > 0) return;
  const idle = m.tick - t.lastBusyTick >= secs(T.coolIdleDelay);
  t.heat = Math.max(0, t.heat - (idle ? T.coolIdlePerSec : T.coolBusyPerSec) * DT);
}

function contacts(m, events) {
  const ts = m.titans;
  for (let i = 0; i < ts.length; i++) {
    for (let j = i + 1; j < ts.length; j++) {
      const a = ts[i]; const b = ts[j];
      if (!a.alive || !b.alive) continue;
      const [nx, ny, d] = norm(b.x - a.x, b.y - a.y);
      if (d >= T.radius * 2) continue;
      const ux = d > 0 ? nx : 1; const uy = d > 0 ? ny : 0;
      if (a.dash > 0 && b.dash > 0 && Math.abs(a.dashStart - b.dashStart) <= secs(T.clangWindow)) {
        for (const [t, o, s] of [[a, b, -1], [b, a, 1]]) {
          t.dash = 0; t.vx = t.vy = 0;
          t.kx = ux * s * T.clangKnock; t.ky = uy * s * T.clangKnock;
          t.hitstop = secs(T.clangHitstop); t.counter = secs(T.counterWindow); t.counterTarget = o.id;
        }
        events.push({ type: EVENT.CLANG, a: a.id, b: b.id, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      } else {
        for (const [t, o, s] of [[a, b, 1], [b, a, -1]]) {
          if (t.dash > 0 && t.team !== o.team && o.alive) {
            t.dash = 0; t.vx *= -0.2; t.vy *= -0.2;
            const mul = dmgMul(t);
            damage(m, o, T.slamDamage * mul, t.id, ux * s, uy * s, T.slamKnock * mul, 'slam', events);
            events.push({ type: EVENT.SLAM, by: t.id, target: o.id });
          }
        }
      }
      
      if (a.alive && b.alive) {
        const [mx, my, dd] = norm(b.x - a.x, b.y - a.y);
        const p = (T.radius * 2 - dd) / 2;
        if (p > 0) { const ex = dd > 0 ? mx : 1; const ey = dd > 0 ? my : 0; a.x -= ex * p; a.y -= ey * p; b.x += ex * p; b.y += ey * p; }
      }
    }
  }
}

function moveShots(m, events) {
  const arena = ARENAS[m.arena];
  const keep = [];
  for (const s of m.shots) {
    s.life -= 1;
    if (s.kind === 'lob') {
      if (s.life <= 0) {
        if (reachesCore(m, s.x, s.y, s.splash)) hitCore(m, s.owner, events);
        for (const o of m.titans) {
          if (!o.alive || o.team === s.team) continue;
          const [nx, ny, d] = norm(o.x - s.x, o.y - s.y);
          const aegisMul = o.aegis > 0 ? Abilities.ABILITIES.aegis.lobMul : 1;
          if (d < s.splash + T.radius) damage(m, o, s.damage * aegisMul, s.owner, nx, ny, 6, s.seed ? 'seed' : 'lob', events);
        }
      } else keep.push(s);
      continue;
    }
    s.x += s.vx * DT; s.y += s.vy * DT;
    if (s.life <= 0 || blockedByCover(arena, s.x, s.y, 0)) continue;
    if (reachesCore(m, s.x, s.y, 0.3)) { hitCore(m, s.owner, events); continue; }
    let hit = false;
    for (const d of m.decoys) {
      if (d.team === s.team || !d.alive) continue;
      if (Math.hypot(d.x - s.x, d.y - s.y) < T.radius + 0.3) { d.alive = false; hit = true; break; }
    }
    if (hit) continue;
    for (const o of m.titans) {
      if (!o.alive || o.id === s.owner || o.team === s.team) continue;
      if (Math.hypot(o.x - s.x, o.y - s.y) < T.radius + 0.3) {
        if (Abilities.aegisBlocks(o, s.vx, s.vy)) {
          
          s.vx = -s.vx; s.vy = -s.vy; s.owner = o.id; s.team = o.team; s.life = s.maxLife || s.life;
          events.push({ type: EVENT.REFLECT, by: o.id, x: s.x, y: s.y });
          break;
        }
        const [nx, ny] = norm(s.vx, s.vy);
        damage(m, o, s.damage, s.owner, nx, ny, 4, 'shot', events);
        hit = true; break;
      }
    }
    if (!hit) keep.push(s);
  }
  m.shots = keep;
}


const CTX = Object.freeze({ damage, norm, rivals, autoAim, blockedByCover, dmgMul,
  abilityOf: (t) => TITANS[t.frame].ability });

const SLEEPER_CTX = Object.freeze({ damage, norm, bounty: bountyOf });

export function step(m, inputs = []) {
  const events = [];
  if (m.over) return events;
  const arena = ARENAS[m.arena];
  if (!m.storm && isStorm(m)) { m.storm = true; events.push({ type: EVENT.STORM }); }

  for (const t of m.titans) {
    const inp = inputs[t.id] || {};
    if (!t.alive) {
      t.respawn -= 1;
      if (t.respawn <= 0) {
        const s = spawnPoint(m, t);
        Object.assign(t, { alive: true, x: s.x, y: s.y, armour: t.maxArmour, heat: 0, shield: secs(T.spawnShield),
          lastHitBy: null, lastHitAt: NEVER, facing: Math.atan2(-s.y, -s.x) });
        events.push({ type: EVENT.DROP, id: t.id });
      }
    } else {
      if (t.fireCd > 0) t.fireCd -= 1;
      if (t.abilityCd > 0) t.abilityCd -= 1;
      if (t.shield > 0) t.shield -= 1;
      if (t.aegis > 0) t.aegis -= 1;
      if (t.overdrive > 0) t.overdrive -= 1;
      if (t.lumenTime > 0) t.lumenTime -= 1;
      if (t.rattled > 0) t.rattled -= 1;
      if (t.hitstop === 0 && t.counter > 0) {
        t.counter -= 1;
      }
      const wasRed = t.redline;
      control(m, t, inp, events);
      if (t.hitstop > 0) t.hitstop -= 1;
      cool(m, t);
      t.redline = t.heat >= T.redLine;
      if (t.redline) t.redlineTicks += 1;
      if (t.redline && !wasRed) events.push({ type: EVENT.REDLINE, id: t.id });
      if (m.tick - t.lastHitAt > secs(T.rattleDrainDelay)) t.rattle = Math.max(0, t.rattle - T.rattleDrainPerSec * DT);
    }
    t.prevFire = !!inp.fire; t.prevBoost = !!inp.boost; t.prevAbility = !!inp.ability;
  }

  contacts(m, events);
  
  for (const t of m.titans) {
    
    if (t.alive && t.dash > 0 && reachesCore(m, t.x, t.y, T.radius + 0.4)
      && t.dashDx * (m.sleeper.x - t.x) + t.dashDy * (m.sleeper.y - t.y) > 0) {
      t.dash = 0; t.vx *= -0.2; t.vy *= -0.2; hitCore(m, t.id, events);
    }
  }

  for (const t of m.titans) {
    if (!t.alive || t.hitstop > 0) continue;
    t.x += (t.vx + t.kx) * DT; t.y += (t.vy + t.ky) * DT;
    const decay = Math.max(0, 1 - T.knockDrag * DT);
    t.kx *= decay; t.ky *= decay;
    pushOutOfCover(arena, t);
    stormWall(m, t, events);
    if (!t.alive) continue;
    const hw = arena.w / 2; const hh = arena.h / 2;
    if (arena.openEdges) {
      if (Math.abs(t.x) > hw || Math.abs(t.y) > hh) ringBell(m, t, true, events);
    } else {
      t.x = Math.max(-hw + T.radius, Math.min(hw - T.radius, t.x));
      t.y = Math.max(-hh + T.radius, Math.min(hh - T.radius, t.y));
    }
  }

  tickSleeper(m, events, SLEEPER_CTX);
  for (const t of m.titans) if (t.alive) lumenPickup(m, t, events);
  lumenFall(m, events);

  moveShots(m, events);
  for (const d of m.decoys) d.life -= 1;
  m.decoys = m.decoys.filter((d) => d.life > 0 && d.alive);

  m.tick += 1;
  if (m.tick >= secs(T.roundTime)) { m.over = true; events.push({ type: EVENT.END }); }
  void nextRandom;
  return events;
}
