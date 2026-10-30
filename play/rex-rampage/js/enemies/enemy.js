





import { add, len, lerp, norm, scale, sub, v3 } from '../combat/vec.js';

const EYE = 1.6;
const LEAP_S = 0.9;
const RETREAT_S = 1.2;
const LEAVE_S = 1.2;
const HOLD_S = 1.6; 





export const KINDS = {
  compy: { hp: 2, r: 0.35, speed: 9, attack: 1, attackDist: 2.2, points: 50, target: 'enemy' },
  raptor: { hp: 6, r: 0.6, speed: 12, attack: 1, attackDist: 2.8, points: 150, target: 'enemy' },
  dilo: { hp: 10, r: 0.8, speed: 6, attack: 1, attackDist: 9, points: 300, target: 'enemy' },
  merc: { hp: 8, r: 0.5, speed: 5, attack: 1, attackDist: 14, points: 200, target: 'enemy' },
  pteranodon: { hp: 5, r: 0.7, speed: 14, attack: 1, attackDist: 4, points: 250, target: 'enemy', fly: true },
  spino: { hp: 30, r: 1.2, speed: 8, attack: 1, attackDist: 6, points: 800, target: 'enemy' },
  gunboat: { hp: 20, r: 1.5, speed: 0, attack: 1, attackDist: 22, points: 600, target: 'enemy', fixed: true, maxAttacks: 3 },
  ankylo: { hp: 25, r: 1.1, speed: 5, attack: 1, attackDist: 5, points: 700, target: 'enemy' },
  trike: { hp: 18, r: 1.1, speed: 13, attack: 1, attackDist: 4, points: 500, target: 'enemy' },
  rex: { hp: 40, r: 1.4, speed: 16, attack: 1, attackDist: 5, points: 2000, target: 'enemy', maxAttacks: 3 },
  heli: { hp: 40, r: 2, speed: 0, attack: 1, attackDist: 30, points: 1500, target: 'enemy', fixed: true, fly: true, maxAttacks: 4 },
  barrel: { hp: 3, r: 0.7, speed: 0, attack: 0, attackDist: 0, points: 100, target: 'shootable' },
  hostage: { hp: 999, r: 0.5, speed: 0, attack: 0, attackDist: 0, points: 0, target: 'hostage' },
  rock: { hp: 2, r: 0.8, speed: 0, attack: 1, attackDist: 3, points: 100, target: 'shootable', proj: true, flight: 1.6 },
  shell: { hp: 3, r: 0.4, speed: 0, attack: 1, attackDist: 2, points: 100, target: 'shootable', proj: true, flight: 1.4 },
  rocket: { hp: 2, r: 0.35, speed: 0, attack: 1, attackDist: 2, points: 100, target: 'shootable', proj: true, flight: 1.5 },
  plate: { hp: 8, r: 0.55, speed: 0, attack: 0, attackDist: 0, points: 400, target: 'enemy', part: true },
  jaw: { hp: 30, r: 0.9, speed: 0, attack: 0, attackDist: 0, points: 3000, target: 'enemy', part: true },
  varga: { hp: 20, r: 0.6, speed: 0, attack: 0, attackDist: 0, points: 10000, target: 'enemy', part: true },
};




const rightOf = (fwd) => norm(v3(-fwd.z, 0, fwd.x));

function firstState(k, leap) {
  if (k.part) return 'part';
  if (k.proj) return 'incoming';
  if (k.fixed) return 'hold';
  if (k.target !== 'enemy') return 'idle';
  return leap ? 'enter' : 'approach';
}






export function spawnEnemy(ev, frame, index, hpScale, id) {
  const k = KINDS[ev.kind];
  if (!k) throw new Error(`unknown enemy kind '${ev.kind}'`);
  const spread = ev.spread ?? 0;
  const lane = index === 0 ? 0 : (index % 2 ? 1 : -1) * Math.ceil(index / 2);
  const side = ev.place.side + (spread / 2) * lane * 0.5;
  const ahead = ev.place.ahead + (index % 3) * 1.5;
  const fwd = norm(v3(frame.tangent.x, 0, frame.tangent.z));
  const ground = frame.pos.y - EYE;
  const base = add(add(frame.pos, scale(fwd, ahead)), scale(rightOf(fwd), side));
  const pos = v3(base.x, ground + k.r + (ev.place.up ?? 0), base.z);
  return {
    id,
    kind: ev.kind,
    wave: ev.wave ?? null,
    target: k.target,
    r: k.r,
    hp: Math.ceil(k.hp * hpScale),
    maxHp: Math.ceil(k.hp * hpScale),
    points: k.points,
    dead: false,
    deadT: 0,
    state: firstState(k, ev.leap),
    pos,
    from: pos,
    t: 0,
    ring: 0,
    telegraphLeft: 0,
    slot: Math.max(-1.4, Math.min(1.4, lane * 0.7)),
    attacks: 0,
    gone: false,
    
    offset: { ahead, side, up: pos.y - frame.pos.y },
  };
}

function attackSpot(e, cam) {
  const k = KINDS[e.kind];
  const fwd = norm(v3(cam.fwd.x, 0, cam.fwd.z));
  const p = add(add(cam.pos, scale(fwd, k.attackDist)), scale(rightOf(fwd), e.slot));
  return v3(p.x, k.fly ? cam.pos.y - 0.2 : cam.pos.y - EYE + k.r, p.z);
}

function ridePos(e, cam) {
  const fwd = norm(v3(cam.fwd.x, 0, cam.fwd.z));
  const p = add(add(cam.pos, scale(fwd, e.offset.ahead)), scale(rightOf(fwd), e.offset.side));
  return v3(p.x, cam.pos.y + e.offset.up, p.z);
}






export function stepEnemy(e, dt, cam, d) {
  const k = KINDS[e.kind];
  if (e.dead) {
    e.state = 'dead';
    e.ring = 0;
    e.deadT += dt;
    return { attack: 0 };
  }
  e.t += dt;
  if (e.state === 'part' || e.state === 'idle') return { attack: 0 };
  if (e.state === 'leave') {
    const fwd = norm(v3(cam.fwd.x, 0, cam.fwd.z));
    const out = add(scale(rightOf(fwd), e.slot < 0 ? -1 : 1), scale(fwd, -0.5));
    e.pos = add(e.pos, scale(norm(out), Math.max(8, k.speed) * dt));
    if (e.t >= LEAVE_S) e.gone = true;
    return { attack: 0 };
  }
  if (e.state === 'incoming') {
    const u = Math.min(1, e.t / (d.telegraph * k.flight));
    e.pos = lerp(e.from, attackSpot(e, cam), u);
    e.ring = u;
    if (u < 1) return { attack: 0 };
    e.gone = true;
    return { attack: k.attack };
  }
  if (k.fixed) {
    e.pos = ridePos(e, cam);
    if (e.state === 'hold' && e.t >= HOLD_S) startTelegraph(e, d);
    else if (e.state === 'telegraph') {
      e.telegraphLeft -= dt;
      e.ring = Math.min(1, 1 - e.telegraphLeft / d.telegraph);
      if (e.telegraphLeft <= 1e-6) return { attack: afterAttack(e, k, 'hold') };
    }
    return { attack: 0 };
  }
  
  
  const v = cam.vel;
  if (v) {
    const carry = v3(v.x * dt, 0, v.z * dt);
    if (e.state === 'enter') e.from = add(e.from, carry);
    else if (e.state === 'approach' || e.state === 'retreat') e.pos = add(e.pos, carry);
  }
  if (e.state === 'enter') {
    const u = Math.min(1, e.t / LEAP_S);
    const spot = attackSpot(e, cam);
    const p = lerp(e.from, spot, u);
    e.pos = v3(p.x, p.y + 3 * 4 * u * (1 - u), p.z);
    if (u >= 1) startTelegraph(e, d);
  } else if (e.state === 'approach') {
    const spot = attackSpot(e, cam);
    const to = sub(spot, e.pos);
    const dist = len(to);
    const stepLen = k.speed * dt;
    if (dist <= Math.max(0.3, stepLen)) {
      e.pos = spot;
      startTelegraph(e, d);
    } else e.pos = add(e.pos, scale(to, stepLen / dist));
  } else if (e.state === 'telegraph') {
    e.pos = attackSpot(e, cam);
    e.telegraphLeft -= dt;
    e.ring = Math.min(1, 1 - e.telegraphLeft / d.telegraph);
    if (e.telegraphLeft <= 1e-6) return { attack: afterAttack(e, k, 'retreat') };
  } else if (e.state === 'retreat') {
    const away = norm(v3(e.pos.x - cam.pos.x, 0, e.pos.z - cam.pos.z));
    e.pos = add(e.pos, scale(away, k.speed * 0.5 * dt));
    if (e.t >= RETREAT_S) {
      e.state = 'approach';
      e.t = 0;
    }
  }
  return { attack: 0 };
}


function afterAttack(e, k, next) {
  e.attacks++;
  e.state = e.attacks >= (k.maxAttacks ?? 2) ? 'leave' : next;
  e.t = 0;
  e.ring = 0;
  return k.attack;
}


export function leave(e) {
  if (e.dead || e.state === 'part' || e.state === 'incoming' || e.state === 'idle') return;
  e.state = 'leave';
  e.t = 0;
  e.ring = 0;
}

function startTelegraph(e, d) {
  e.t = 0;
  e.state = 'telegraph';
  e.telegraphLeft = d.telegraph;
  e.ring = 0;
}
