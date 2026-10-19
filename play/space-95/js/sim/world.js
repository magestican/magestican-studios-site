









import { TILE } from './constants.js';

const EMPTY = 0;
const SOLID = 1;
const ONE_WAY = 2;
const BARK = 3;
const SOIL = 4;
const CODES = { '#': SOLID, '=': ONE_WAY, '|': BARK, '%': SOIL };




export function gridWorld(rows) {
  const height = rows.length;
  const width = rows[0].length;
  const cells = new Uint8Array(width * height);
  for (let r = 0; r < height; r++) {
    const row = rows[height - 1 - r];
    if (row.length !== width) throw new Error(`row ${height - 1 - r} has ${row.length} cells, expected ${width}`);
    for (let c = 0; c < width; c++) cells[r * width + c] = CODES[row[c]] ?? EMPTY;
  }
  return makeWorld(cells, width, height, findMarks(rows));
}

function makeWorld(cells, width, height, marks, slickMask = null) {
  const at = (c, r) => {
    if (c < 0 || c >= width) return SOLID;
    if (r < 0 || r >= height) return EMPTY;
    return cells[r * width + c];
  };
  let hasSoil = false;
  for (let i = 0; i < cells.length && !hasSoil; i++) hasSoil = cells[i] === SOIL;
  let mask = slickMask; 
  const slickAt = (c, r) => c >= 0 && c < width && r >= 0 && r < height && mask[r * width + c] === 1;
  return {
    width,
    height,
    tile: TILE,
    mutable: hasSoil,
    
    solid: (c, r) => {
      const v = at(c, r);
      return v === SOLID || v === SOIL;
    },
    
    oneWay: (c, r) => at(c, r) === ONE_WAY,
    
    bark: (c, r) => c >= 0 && c < width && at(c, r) === BARK,
    
    soil: (c, r) => c >= 0 && c < width && at(c, r) === SOIL,
    
    slick: mask ? slickAt : undefined,
    
    markSlick(c, r) {
      if (c < 0 || c >= width || r < 0 || r >= height) return;
      if (!mask) {
        mask = new Uint8Array(width * height);
        this.slick = slickAt;
      }
      mask[r * width + c] = 1;
    },
    
    breakSoil(c, r) {
      if (c < 0 || c >= width || r < 0 || r >= height || cells[r * width + c] !== SOIL) return false;
      cells[r * width + c] = EMPTY;
      return true;
    },
    
    setSolid(c, r, on) {
      if (c < 0 || c >= width || r < 0 || r >= height) return;
      cells[r * width + c] = on ? SOLID : EMPTY;
    },
    
    code: (c, r) => (c < 0 || c >= width || r < 0 || r >= height ? -1 : cells[r * width + c]),
    
    setCode(c, r, v) {
      if (c < 0 || c >= width || r < 0 || r >= height || v < 0) return;
      cells[r * width + c] = v;
    },
    
    clone: () => makeWorld(cells.slice(), width, height, marks, mask ? mask.slice() : null),
    
    marks,
  };
}


function findMarks(rows) {
  
  const marks = {};
  const height = rows.length;
  for (let i = 0; i < height; i++) {
    const r = height - 1 - i;
    for (let c = 0; c < rows[i].length; c++) {
      const ch = rows[i][c];
      if (ch in CODES || ch === '.' || ch === ' ') continue;
      if (!marks[ch]) marks[ch] = [];
      marks[ch].push({ x: (c + 0.5) * TILE, y: r * TILE });
    }
  }
  return marks;
}
