



















import { UNITS, BUILDINGS } from '../roster.js';
import { CELLS_PER_SIDE, CELL_MM } from '../maps/mapFormat.js';
import { UNIT_KINDS, BUILDING_KINDS } from './world.js';








const CAPTURE_WEIGHT = new Int32Array(UNIT_KINDS.map((k) => UNITS[k].captureWeight));
const VISION_MM = new Int32Array(UNIT_KINDS.map((k) => UNITS[k].visionMm));
const BUILDING_VISION_MM = new Int32Array(BUILDING_KINDS.map((k) => BUILDINGS[k].visionMm));


export function createPresenceBuffers(sectorCount, playerCount) {
  return {
    
    weights: new Int32Array(sectorCount * playerCount),
    
    visible: new Uint8Array(playerCount * sectorCount),
    
    scored: new Int32Array(playerCount),
    sectorCount,
    playerCount,
  };
}








export function measurePresence(w, buf) {
  buf.weights.fill(0);
  buf.visible.fill(0);

  const u = w.u;
  const map = w.map;
  const pc = buf.playerCount;
  const sc = buf.sectorCount;

  for (let i = 0; i < u.count; i += 1) {
    if (!u.alive[i]) continue;
    const owner = u.owner[i];
    if (owner < 0) continue;
    const kind = u.kind[i];

    
    
    
    const cx = clampCell(Math.floor(u.x[i] / CELL_MM));
    const cy = clampCell(Math.floor(u.y[i] / CELL_MM));
    const sector = map.sectorOfCell[cy * CELLS_PER_SIDE + cx];
    u.sector[i] = sector;

    
    
    
    
    
    const cw = CAPTURE_WEIGHT[kind] * u.members[i];
    if (cw > 0) buf.weights[sector * pc + owner] += cw;

    lightSectorsAround(map, buf, owner, u.x[i], u.y[i], VISION_MM[kind], sc);
  }

  
  
  
  const b = w.b;
  for (let i = 0; i < b.count; i += 1) {
    if (!b.alive[i]) continue;
    const owner = b.owner[i];
    if (owner < 0) continue;
    
    
    
    if (b.building[i] > 0) continue;
    lightSectorsAround(w.map, buf, owner, b.x[i], b.y[i], BUILDING_VISION_MM[b.kind[i]], sc);
  }

  
  
  
  for (let s = 0; s < sc; s += 1) {
    const owner = w.sectors[s].owner;
    if (owner !== null) buf.visible[owner * sc + s] = 1;
  }
}

const clampCell = (c) => (c < 0 ? 0 : (c >= CELLS_PER_SIDE ? CELLS_PER_SIDE - 1 : c));










function lightSectorsAround(map, buf, owner, xMm, yMm, rangeMm, sectorCount) {
  if (rangeMm <= 0) return;
  const r2 = rangeMm * rangeMm;
  const cxMin = clampCell(Math.floor((xMm - rangeMm) / CELL_MM));
  const cxMax = clampCell(Math.floor((xMm + rangeMm) / CELL_MM));
  const cyMin = clampCell(Math.floor((yMm - rangeMm) / CELL_MM));
  const cyMax = clampCell(Math.floor((yMm + rangeMm) / CELL_MM));
  const rowBase = owner * sectorCount;
  for (let cy = cyMin; cy <= cyMax; cy += 1) {
    
    
    const py = cy * CELL_MM + (CELL_MM >> 1);
    const dy = py - yMm;
    const dy2 = dy * dy;
    if (dy2 > r2) continue;
    for (let cx = cxMin; cx <= cxMax; cx += 1) {
      const px = cx * CELL_MM + (CELL_MM >> 1);
      const dx = px - xMm;
      if (dx * dx + dy2 > r2) continue;
      buf.visible[rowBase + map.sectorOfCell[cy * CELLS_PER_SIDE + cx]] = 1;
    }
  }
}


export const canSee = (buf, player, sector) => buf.visible[player * buf.sectorCount + sector] === 1;


export const weightIn = (buf, sector, player) => buf.weights[sector * buf.playerCount + player];


export function totalWeightOf(buf, player) {
  let t = 0;
  for (let s = 0; s < buf.sectorCount; s += 1) t += buf.weights[s * buf.playerCount + player];
  return t;
}
