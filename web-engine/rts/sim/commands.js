














import { dist2 } from '../fixed.js';
import { HOLD_MAX } from '../territory.js';
import { STATE, ORDER, unitSpec, isArmy, isGatherer } from './world.js';
import { armyCentre } from './movement.js';
import { train, build, cancel } from './production.js';


export const CMD = Object.freeze({
  MOVE: 'move',
  ATTACK: 'attack',
  CAPTURE: 'capture',
  TRAIN: 'train',
  BUILD: 'build',
  CANCEL: 'cancel',
  TOGGLE: 'toggle',
  STANCE: 'stance',
});












export function resolveSelection(m, seat, sel) {
  const w = m.w;
  const out = [];
  for (let i = 0; i < w.u.count; i += 1) {
    if (!w.u.alive[i] || w.u.owner[i] !== seat) continue;
    const spec = unitSpec(w, i);
    switch (sel && sel.kind) {
      case 'all': out.push(i); break;
      case 'army': if (isArmy(spec)) out.push(i); break;
      case 'gather': if (isGatherer(spec)) out.push(i); break;
      case 'group': if (spec.id === sel.key) out.push(i); break;
      case 'ids': if (sel.ids && sel.ids.includes(w.u.id[i])) out.push(i); break;
      case 'box': {
        if (w.u.x[i] >= sel.x0 && w.u.x[i] <= sel.x1
            && w.u.y[i] >= sel.y0 && w.u.y[i] <= sel.y1) out.push(i);
        break;
      }
      
      
      
      
      default: break;
    }
  }
  return out;
}











export function attackTarget(m, seat) {
  const w = m.w;
  const from = armyCentre(w, seat);
  const origin = from.weight > 0 ? from : fallbackOrigin(m, seat);
  const sc = w.sectors.length;
  const vis = m.presence.visible;

  let best = -1;
  let bestD2 = 0;
  for (let s = 0; s < sc; s += 1) {
    const sec = w.sectors[s];
    if (!vis[seat * sc + s]) continue;
    const enemyOwned = sec.owner !== null && sec.owner !== seat;
    let enemyThere = false;
    if (!enemyOwned) {
      for (let p = 0; p < m.playerCount; p += 1) {
        if (p === seat) continue;
        if (m.presence.weights[s * m.playerCount + p] > 0) { enemyThere = true; break; }
      }
    }
    if (!enemyOwned && !enemyThere) continue;
    const d2 = dist2(origin.x, origin.y, sec.cx, sec.cy);
    if (best < 0 || d2 < bestD2) { best = s; bestD2 = d2; }
  }
  return best;
}






















export function captureTarget(m, seat) {
  const w = m.w;
  const from = armyCentre(w, seat);
  const origin = from.weight > 0 ? from : fallbackOrigin(m, seat);
  const sc = w.sectors.length;

  let best = -1;
  let bestScore = 0;
  for (let s = 0; s < sc; s += 1) {
    const sec = w.sectors[s];
    if (sec.owner === seat) continue;
    const d2 = dist2(origin.x, origin.y, sec.cx, sec.cy);
    
    
    
    let score = Math.floor(d2 / 1000000);
    if (sec.owner !== null) score += 400 + Math.floor((sec.hold * 400) / HOLD_MAX);
    if (best < 0 || score < bestScore) { best = s; bestScore = score; }
  }
  return best;
}

function fallbackOrigin(m, seat) {
  
  const w = m.w;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const s of w.sectors) {
    if (s.owner !== seat) continue;
    sx += s.cx; sy += s.cy; n += 1;
  }
  if (n > 0) return { x: Math.floor(sx / n), y: Math.floor(sy / n), weight: 0 };
  const spawn = w.map.spawns.find((s) => s.seat === seat);
  return spawn ? { x: spawn.x, y: spawn.y, weight: 0 } : { x: 0, y: 0, weight: 0 };
}










export function applyCommand(m, c) {
  const w = m.w;
  const seat = c.p;
  if (seat < 0 || seat >= m.playerCount) return;

  switch (c.c) {
    case CMD.MOVE: {
      for (const i of resolveSelection(m, seat, c.sel)) {
        w.u.orderType[i] = ORDER.MOVE;
        w.u.orderX[i] = c.x;
        w.u.orderY[i] = c.y;
        w.u.orderArg[i] = -1;
        w.u.state[i] = STATE.MOVING;
      }
      break;
    }
    case CMD.ATTACK: {
      const s = c.sector >= 0 ? c.sector : attackTarget(m, seat);
      if (s < 0) break;
      const sec = w.sectors[s];
      for (const i of resolveSelection(m, seat, c.sel || { kind: 'army' })) {
        if (!isArmy(unitSpec(w, i))) continue;
        w.u.orderType[i] = ORDER.ATTACK;
        w.u.orderX[i] = sec.cx;
        w.u.orderY[i] = sec.cy;
        w.u.orderArg[i] = s;
        w.u.state[i] = STATE.MOVING;
      }
      m.lastOrderSector = s;
      break;
    }
    case CMD.CAPTURE: {
      const s = c.sector >= 0 ? c.sector : captureTarget(m, seat);
      if (s < 0) break;
      const sec = w.sectors[s];
      
      
      
      
      
      
      
      
      
      for (const i of resolveSelection(m, seat, c.sel || { kind: 'all' })) {
        w.u.orderType[i] = ORDER.CAPTURE;
        w.u.orderX[i] = sec.cx;
        w.u.orderY[i] = sec.cy;
        w.u.orderArg[i] = s;
        w.u.state[i] = STATE.MOVING;
      }
      m.lastOrderSector = s;
      break;
    }
    case CMD.TRAIN:
      train(w, m.banks, m.queues, seat, c.unit);
      break;
    case CMD.BUILD:
      build(w, m.banks, m.queues, seat, c.building, c.sector);
      break;
    case CMD.CANCEL:
      cancel(w, m.banks, m.queues, seat, c.index);
      break;
    case CMD.TOGGLE:
      if (Object.prototype.hasOwnProperty.call(m.automation[seat], c.key)) {
        m.automation[seat][c.key] = !!c.value;
      }
      break;
    default:
      break;
  }
}
