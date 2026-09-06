




















































import { FIELD_MM } from '../fixed.js';
import { SECTOR_VALUE, createSector } from '../territory.js';
import {
  rasterise, rotate180, pieces, absorbSpecks, seedOf, MIRRORED,
} from './shapes.js';
import { buildElevation, cliffStepBetween } from './elevation.js';
import { sectorOutlines } from './outline.js';

































export const CELLS_PER_SIDE = 96;
export const CELL_MM = FIELD_MM / CELLS_PER_SIDE;   


export const HALF_FIELD_MM = FIELD_MM / 2;












export function centreOffset(sum, cells) {
  return (sum * CELL_MM + cells * (CELL_MM / 2 - HALF_FIELD_MM)) / cells;
}






























export const MIN_BORDER_CELLS = 8;





























export function buildMap(def) {
  const hasSketch = def.sketch !== undefined;
  const hasRegions = Array.isArray(def.regions);
  
  
  
  
  if (hasSketch === hasRegions) {
    throw new Error(`${def.id}: give exactly one of sketch and regions`);
  }

  const letters = [];
  const indexOfLetter = new Map();
  const declare = (ch) => {
    if (indexOfLetter.has(ch)) return;
    indexOfLetter.set(ch, letters.length);
    letters.push(ch);
  };
  let sectorOfCell;

  if (hasSketch) {
    
    
    
    
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

    
    
    
    
    
    for (const row of rows) {
      for (const ch of row) {
        if (ch === '.') continue;             
        declare(ch);
      }
    }

    
    sectorOfCell = new Uint8Array(CELLS_PER_SIDE * CELLS_PER_SIDE);
    for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
      const sy = Math.floor(cy / scale);
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        const sx = Math.floor(cx / scale);
        sectorOfCell[cy * CELLS_PER_SIDE + cx] = indexOfLetter.get(rows[sy][sx]);
      }
    }
  } else {
    
    
    
    
    
    for (const r of def.regions) {
      if (indexOfLetter.has(r.letter)) {
        throw new Error(`${def.id}: region '${r.letter}' is listed twice`);
      }
      if (!r.region || typeof r.region.f !== 'function') {
        throw new Error(`${def.id}: region '${r.letter}' is not a shapes.js region`);
      }
      if (r.region === MIRRORED && !def.mirror) {
        throw new Error(
          `${def.id}: region '${r.letter}' is MIRRORED but the map declares no mirror, `
          + 'so nothing would ever fill it in',
        );
      }
      declare(r.letter);
    }
    sectorOfCell = rasterise(def.regions.map((r) => r.region), CELLS_PER_SIDE, CELL_MM);
    
    
    
    
    
    
    
    
    
    
    
    absorbSpecks(sectorOfCell, CELLS_PER_SIDE, letters.length);
  }

  for (const ch of letters) {
    if (!def.sectors[ch]) throw new Error(`${def.id}: map uses '${ch}' with no sector defined`);
  }
  for (const ch of Object.keys(def.sectors)) {
    if (!indexOfLetter.has(ch)) throw new Error(`${def.id}: sector '${ch}' is defined but unused`);
  }
  if (letters.length > 255) throw new Error(`${def.id}: more than 255 sectors`);

  
  
  
  
  
  
  
  
  let partnerIdx = null;
  if (def.mirror) {
    if (def.mirror !== 'rot180') throw new Error(`${def.id}: unknown mirror '${def.mirror}'`);
    if (!def.symmetry) throw new Error(`${def.id}: mirror needs a symmetry table`);
    partnerIdx = new Int32Array(letters.length);
    for (let i = 0; i < letters.length; i += 1) {
      const p = def.symmetry[letters[i]];
      const j = indexOfLetter.get(p);
      if (j === undefined) {
        throw new Error(`${def.id}: '${letters[i]}' has no partner in the symmetry table`);
      }
      partnerIdx[i] = j;
    }
    rotate180(sectorOfCell, CELLS_PER_SIDE, partnerIdx);
  }

  
  
  
  
  
  
  
  
  
  const heightOfCell = def.elevation
    ? buildElevation({
      n: CELLS_PER_SIDE,
      cellMm: CELL_MM,
      seed: seedOf(def.id),
      features: def.elevation.features || [],
      baseDm: def.elevation.baseDm || 0,
      baseWaveMm: def.elevation.baseWaveMm || 300_000,
    })
    : new Int16Array(CELLS_PER_SIDE * CELLS_PER_SIDE);
  if (def.mirror) {
    for (let cy = CELLS_PER_SIDE / 2; cy < CELLS_PER_SIDE; cy += 1) {
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        heightOfCell[cy * CELLS_PER_SIDE + cx] = heightOfCell[
          (CELLS_PER_SIDE - 1 - cy) * CELLS_PER_SIDE + (CELLS_PER_SIDE - 1 - cx)];
      }
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  for (let i = 0; i < letters.length; i += 1) {
    const parts = pieces(sectorOfCell, CELLS_PER_SIDE, i);
    if (parts.length === 0) {
      throw new Error(
        `${def.id}: sector '${letters[i]}' owns no cells - it was drawn and then `
        + 'covered over. Raise its weight, or delete it.',
      );
    }
    if (parts.length > 1) {
      
      
      
      
      
      
      throw new Error(
        `${def.id}: sector '${letters[i]}' is in ${parts.length} disconnected pieces (`
        + parts.map((q) => `${q.size} cells from ${q.cx},${q.cy} walled in by `
          + q.around.map((t) => `${letters[t.region]} x ${t.edges}`).join(', ')).join('; ')
        + '). Its centroid would land in none of them, and every rally and every '
        + 'bot order aimed at it would send an army onto ground its owner does '
        + 'not hold.',
      );
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
  const touching = new Map();               
  const key = (a, b) => (a < b ? `${a},${b}` : `${b},${a}`);
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
    for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
      const here = sectorOfCell[cy * CELLS_PER_SIDE + cx];
      
      if (cx + 1 < CELLS_PER_SIDE) {
        const r = sectorOfCell[cy * CELLS_PER_SIDE + cx + 1];
        if (r !== here) {
          const k = key(here, r);
          bump(touching, k);
          if (!cliffStepBetween(heightOfCell, CELLS_PER_SIDE, cx, cy, cx + 1, cy)) bump(border, k);
        }
      }
      if (cy + 1 < CELLS_PER_SIDE) {
        const d = sectorOfCell[(cy + 1) * CELLS_PER_SIDE + cx];
        if (d !== here) {
          const k = key(here, d);
          bump(touching, k);
          if (!cliffStepBetween(heightOfCell, CELLS_PER_SIDE, cx, cy, cx, cy + 1)) bump(border, k);
        }
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
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      cx: HALF_FIELD_MM + Math.trunc(centreOffset(sumX[i], cells[i])),
      cy: HALF_FIELD_MM + Math.trunc(centreOffset(sumY[i], cells[i])),
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
    
    
    
    
    playable: def.playable !== false,
    cellsPerSide: CELLS_PER_SIDE,
    cellMm: CELL_MM,
    sectorOfCell,
    





    heightOfCell,
    




    outlines: sectorOutlines(sectorOfCell, CELLS_PER_SIDE, CELL_MM, letters.length),
    





    touching: Object.freeze(Object.fromEntries(touching)),
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
