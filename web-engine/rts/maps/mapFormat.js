

























import { FIELD_MM } from '../fixed.js';
import { SECTOR_VALUE, createSector } from '../territory.js';


export const CELLS_PER_SIDE = 48;
export const CELL_MM = FIELD_MM / CELLS_PER_SIDE;   















export const MIN_BORDER_CELLS = 4;



















export function buildMap(def) {
  
  
  
  
  const raw = Array.isArray(def.sketch)
    ? def.sketch
    : String(def.sketch).split(String.fromCharCode(10));
  const rows = raw.map((r) => r.trim()).filter((r) => r.length > 0);
  const side = rows.length;
  if (side === 0) throw new Error(`${def.id}: empty sketch`);
  for (let r = 0; r < side; r += 1) {
    if (rows[r].length !== side) {
      throw new Error(
        `${def.id}: sketch row ${r} is ${rows[r].length} characters, expected ${side} `
        + '(the sketch must be square, or the map is silently skewed)',
      );
    }
  }
  if (CELLS_PER_SIDE % side !== 0) {
    throw new Error(`${def.id}: sketch of ${side} does not divide ${CELLS_PER_SIDE}`);
  }
  const scale = CELLS_PER_SIDE / side;

  
  
  
  
  
  const letters = [];
  const indexOfLetter = new Map();
  for (const row of rows) {
    for (const ch of row) {
      if (ch === '.') continue;             
      if (!indexOfLetter.has(ch)) {
        indexOfLetter.set(ch, letters.length);
        letters.push(ch);
      }
    }
  }
  for (const ch of letters) {
    if (!def.sectors[ch]) throw new Error(`${def.id}: sketch uses '${ch}' with no sector defined`);
  }
  for (const ch of Object.keys(def.sectors)) {
    if (!indexOfLetter.has(ch)) throw new Error(`${def.id}: sector '${ch}' is defined but unused`);
  }
  if (letters.length > 255) throw new Error(`${def.id}: more than 255 sectors`);

  
  const sectorOfCell = new Uint8Array(CELLS_PER_SIDE * CELLS_PER_SIDE);
  for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
    const sy = Math.floor(cy / scale);
    for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
      const sx = Math.floor(cx / scale);
      sectorOfCell[cy * CELLS_PER_SIDE + cx] = indexOfLetter.get(rows[sy][sx]);
    }
  }

  
  const cells = new Array(letters.length).fill(0);
  const sumX = new Array(letters.length).fill(0);
  const sumY = new Array(letters.length).fill(0);
  for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
    for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
      const s = sectorOfCell[cy * CELLS_PER_SIDE + cx];
      cells[s] += 1;
      sumX[s] += cx;
      sumY[s] += cy;
    }
  }

  
  const border = new Map();                 
  const key = (a, b) => (a < b ? `${a},${b}` : `${b},${a}`);
  for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
    for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
      const here = sectorOfCell[cy * CELLS_PER_SIDE + cx];
      
      if (cx + 1 < CELLS_PER_SIDE) {
        const r = sectorOfCell[cy * CELLS_PER_SIDE + cx + 1];
        if (r !== here) border.set(key(here, r), (border.get(key(here, r)) || 0) + 1);
      }
      if (cy + 1 < CELLS_PER_SIDE) {
        const d = sectorOfCell[(cy + 1) * CELLS_PER_SIDE + cx];
        if (d !== here) border.set(key(here, d), (border.get(key(here, d)) || 0) + 1);
      }
    }
  }
  const cut = new Set((def.cuts || []).map(([a, b]) => key(indexOfLetter.get(a), indexOfLetter.get(b))));
  const neighbours = letters.map(() => []);
  
  
  
  for (const k of [...border.keys()].sort()) {
    if (border.get(k) < MIN_BORDER_CELLS) continue;
    if (cut.has(k)) continue;
    const [a, b] = k.split(',').map(Number);
    neighbours[a].push(b);
    neighbours[b].push(a);
  }

  
  const sectors = letters.map((ch, i) => {
    const spec = def.sectors[ch];
    if (!SECTOR_VALUE[spec.kind]) throw new Error(`${def.id}: sector '${ch}' has kind ${spec.kind}`);
    return createSector({
      id: i,
      kind: spec.kind,
      yieldPct: spec.yieldPct,
      
      
      
      cx: Math.floor((sumX[i] * CELL_MM) / cells[i]) + CELL_MM / 2,
      cy: Math.floor((sumY[i] * CELL_MM) / cells[i]) + CELL_MM / 2,
      cells: cells[i],
      neighbours: neighbours[i],
    });
  });

  const spawns = def.spawns.map((s) => {
    const idx = indexOfLetter.get(s.sector);
    if (idx === undefined) throw new Error(`${def.id}: spawn in unknown sector '${s.sector}'`);
    return { seat: s.seat, sector: idx, x: sectors[idx].cx, y: sectors[idx].cy };
  });

  return Object.freeze({
    id: def.id,
    name: def.name,
    symmetry: def.symmetry || null,
    intent: def.intent || '',
    players: def.players,
    cellsPerSide: CELLS_PER_SIDE,
    cellMm: CELL_MM,
    sectorOfCell,
    letters,
    sectors,
    spawns,
  });
}










export function sectorAt(map, xMm, yMm) {
  const cx = Math.min(CELLS_PER_SIDE - 1, Math.max(0, Math.floor(xMm / CELL_MM)));
  const cy = Math.min(CELLS_PER_SIDE - 1, Math.max(0, Math.floor(yMm / CELL_MM)));
  return map.sectorOfCell[cy * CELLS_PER_SIDE + cx];
}


export function reachable(map, from, depth) {
  const seen = new Set([from]);
  let frontier = [from];
  for (let d = 0; d < depth; d += 1) {
    const next = [];
    for (const s of frontier) {
      for (const n of map.sectors[s].neighbours) {
        if (seen.has(n)) continue;
        seen.add(n);
        next.push(n);
      }
    }
    frontier = next;
  }
  return [...seen].sort((a, b) => a - b);
}


export function connectedFrom(map, from) {
  return reachable(map, from, map.sectors.length);
}


export function mapValue(map) {
  let t = 0;
  for (const s of map.sectors) t += SECTOR_VALUE[s.kind];
  return t;
}
