


































import { ITEMS } from './items.js';
import { sampleAt } from './trackPath.js';






export const TABLE = Object.freeze([
  Object.freeze({
    upTo: 0.001,   
    weights: Object.freeze({
      cowpat: 34, haybale: 26, egg: 22, scarecrow: 14, feedbag: 4,
    }),
  }),
  Object.freeze({
    upTo: 0.34,    
    weights: Object.freeze({
      cowpat: 24, haybale: 18, egg: 22, scarecrow: 14, feedbag: 14, rooster: 8,
    }),
  }),
  Object.freeze({
    upTo: 0.67,    
    weights: Object.freeze({
      cowpat: 12, haybale: 10, egg: 16, scarecrow: 12,
      feedbag: 18, tripleFeedbag: 10, rooster: 18, thunder: 4,
    }),
  }),
  Object.freeze({
    upTo: 0.9,     
    weights: Object.freeze({
      egg: 8, scarecrow: 8, feedbag: 14, tripleFeedbag: 20,
      rooster: 24, thunder: 16, tractor: 10,
    }),
  }),
  Object.freeze({
    upTo: 1.0,     
    weights: Object.freeze({
      feedbag: 8, tripleFeedbag: 20, rooster: 18, thunder: 22, tractor: 32,
    }),
  }),
]);


export function bandFor(position, fieldSize) {
  if (position <= 1) return TABLE[0];
  const frac = fieldSize <= 1 ? 0 : (position - 1) / (fieldSize - 1);
  return TABLE.find((row) => frac <= row.upTo) ?? TABLE[TABLE.length - 1];
}













export function drawItem(position, fieldSize, rng, { lapsLeft = 9 } = {}) {
  const band = bandFor(position, fieldSize);
  const entries = Object.entries(band.weights).filter(([id]) => {
    if (id === 'tractor' && lapsLeft < 0.5) return false;
    if (id === 'thunder' && lapsLeft < 0.15) return false;
    return true;
  });
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return ITEMS.feedbag;
  let roll = rng() * total;
  for (const [id, w] of entries) {
    roll -= w;
    if (roll <= 0) return ITEMS[id];
  }
  return ITEMS[entries[entries.length - 1][0]];
}






export function layoutItemBoxes(path, stops, { perRow = 5, margin = 3 } = {}) {
  const boxes = [];
  for (const s of stops) {
    const c = sampleAt(path, s);
    const usable = Math.max(1, c.width / 2 - margin);
    for (let i = 0; i < perRow; i += 1) {
      const t = perRow === 1 ? 0 : (i / (perRow - 1)) * 2 - 1;
      boxes.push({
        uid: `box-${Math.round(s)}-${i}`,
        x: c.x + c.nx * usable * t,
        y: c.y,
        z: c.z + c.nz * usable * t,
        s,
        
        
        
        respawn: 0,
      });
    }
  }
  return boxes;
}
