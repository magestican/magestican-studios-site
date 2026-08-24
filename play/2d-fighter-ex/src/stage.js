











import { SeededRng } from '../../../web-engine/rng/seededRng.js';
import { BIOMES, STAGE_BIOME, GRID_LINE, CELL_PX } from './palette.js';

export const STAGE_WIDTH = 1440;
export const STAGE_HEIGHT = 271;




export const GROUND_Y = 205;






export function buildStage(seed = 'fighter-ex') {
  const rng = seededFrom(seed);
  const p = BIOMES[STAGE_BIOME];
  const cells = [];

  const cols = Math.ceil(STAGE_WIDTH / CELL_PX);
  const groundRow = Math.floor(GROUND_Y / CELL_PX);
  const rows = Math.ceil(STAGE_HEIGHT / CELL_PX);

  for (let cxi = 0; cxi < cols; cxi += 1) {
    
    
    const canopy = 2 + rng.rangeI(0, 2);
    for (let r = 0; r < canopy; r += 1) {
      cells.push({ cx: cxi, cy: r, fill: p.wall });
    }

    
    const trunk = rng.chance(0.09);
    for (let r = canopy; r < groundRow; r += 1) {
      cells.push({ cx: cxi, cy: r, fill: trunk && r >= canopy ? p.door : p.floor });
    }

    
    for (let r = groundRow; r < rows; r += 1) {
      cells.push({ cx: cxi, cy: r, fill: p.wall });
    }

    
    
    
    if (rng.chance(0.13)) {
      cells.push({ cx: cxi, cy: groundRow - 1, fill: p.exit });
    }
  }

  return cells;
}

function seededFrom(seed) {
  if (typeof seed === 'number') return new SeededRng(seed || 1);
  return new SeededRng(1).child(String(seed));
}


export function drawStage(ctx, cells) {
  for (const c of cells) {
    const x = c.cx * CELL_PX;
    const y = c.cy * CELL_PX;
    ctx.fillStyle = c.fill;
    ctx.fillRect(x, y, CELL_PX, CELL_PX);
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, CELL_PX - 1, CELL_PX - 1);
  }
}
