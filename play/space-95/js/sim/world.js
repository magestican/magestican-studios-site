




import { TILE } from './constants.js';

const EMPTY = 0;
const SOLID = 1;
const ONE_WAY = 2;




export function gridWorld(rows) {
  const height = rows.length;
  const width = rows[0].length;
  const cells = new Uint8Array(width * height);
  for (let r = 0; r < height; r++) {
    const row = rows[height - 1 - r];
    if (row.length !== width) throw new Error(`row ${height - 1 - r} has ${row.length} cells, expected ${width}`);
    for (let c = 0; c < width; c++) {
      const ch = row[c];
      cells[r * width + c] = ch === '#' ? SOLID : ch === '=' ? ONE_WAY : EMPTY;
    }
  }
  const at = (c, r) => {
    if (c < 0 || c >= width) return SOLID;
    if (r < 0 || r >= height) return EMPTY;
    return cells[r * width + c];
  };
  return {
    width,
    height,
    tile: TILE,
    
    solid: (c, r) => at(c, r) === SOLID,
    
    oneWay: (c, r) => at(c, r) === ONE_WAY,
    
    marks: findMarks(rows),
  };
}


function findMarks(rows) {
  
  const marks = {};
  const height = rows.length;
  for (let i = 0; i < height; i++) {
    const r = height - 1 - i;
    for (let c = 0; c < rows[i].length; c++) {
      const ch = rows[i][c];
      if (ch === '#' || ch === '=' || ch === '.' || ch === ' ') continue;
      if (!marks[ch]) marks[ch] = [];
      marks[ch].push({ x: (c + 0.5) * TILE, y: r * TILE });
    }
  }
  return marks;
}
