













import { SeededRng } from '../rng/seededRng.js';















export const CORRIDOR = 4;
export const WALL = 2;
export const PERIOD = CORRIDOR + WALL;









export const HEDGE_HEIGHT = 2;











export const BRAID = 0.45;



function inAnyKeepOut(x, z, keepOut) {
  for (const k of keepOut) {
    if (x >= k.x0 && x <= k.x1 && z >= k.z0 && z <= k.z1) return true;
  }
  return false;
}


export function cellsAcross(tiles) {
  return Math.max(1, Math.floor((tiles + WALL) / PERIOD));
}


export function cellRect(ox, oz, cx, cz) {
  const x0 = ox + cx * PERIOD;
  const z0 = oz + cz * PERIOD;
  return { x0, z0, x1: x0 + CORRIDOR - 1, z1: z0 + CORRIDOR - 1 };
}
















export function generateMaze({ seed = 1, ox = 0, oz = 0, w, h, keepOut = [] } = {}) {
  const rng = new SeededRng((seed ^ 0x4D415A45) >>> 0);   
  const cols = cellsAcross(w);
  const rows = cellsAcross(h);
  const hedge = new Uint8Array(w * h);
  const at = (x, z) => x + z * w;

  
  
  
  
  hedge.fill(1);

  const carveRect = (x0, z0, x1, z1) => {
    for (let z = Math.max(0, z0); z <= Math.min(h - 1, z1); z++) {
      for (let x = Math.max(0, x0); x <= Math.min(w - 1, x1); x++) hedge[at(x, z)] = 0;
    }
  };

  
  const visited = new Uint8Array(cols * rows);
  const cellAt = (cx, cz) => cx + cz * cols;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const touchesKeepOut = new Uint8Array(cols * rows);
  for (let cz = 0; cz < rows; cz++) {
    for (let cx = 0; cx < cols; cx++) {
      const r = cellRect(0, 0, cx, cz);
      for (const k of keepOut) {
        
        const kx0 = k.x0 - ox, kz0 = k.z0 - oz, kx1 = k.x1 - ox, kz1 = k.z1 - oz;
        if (r.x1 >= kx0 && r.x0 <= kx1 && r.z1 >= kz0 && r.z0 <= kz1) {
          touchesKeepOut[cellAt(cx, cz)] = 1; break;
        }
      }
    }
  }

  const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  const start = 0;
  const sx = start % cols, sz = (start / cols) | 0;
  visited[start] = 1;
  {
    const r = cellRect(0, 0, sx, sz);
    carveRect(r.x0, r.z0, r.x1, r.z1);
  }

  const stack = [[sx, sz]];
  while (stack.length) {
    const [cx, cz] = stack[stack.length - 1];
    
    
    
    const dirs = NB.slice();
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = rng.rangeI(0, i);
      const t = dirs[i]; dirs[i] = dirs[j]; dirs[j] = t;
    }
    let moved = false;
    for (const [dx, dz] of dirs) {
      const nx = cx + dx, nz = cz + dz;
      if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue;
      const ni = cellAt(nx, nz);
      if (visited[ni]) continue;
      visited[ni] = 1;
      
      const r = cellRect(0, 0, nx, nz);
      carveRect(r.x0, r.z0, r.x1, r.z1);
      
      const a = cellRect(0, 0, cx, cz);
      
      
      if (dx) {
        const wx0 = dx > 0 ? a.x1 + 1 : a.x0 - WALL;
        carveRect(wx0, a.z0, wx0 + WALL - 1, a.z1);
      } else {
        const wz0 = dz > 0 ? a.z1 + 1 : a.z0 - WALL;
        carveRect(a.x0, wz0, a.x1, wz0 + WALL - 1);
      }
      stack.push([nx, nz]);
      moved = true;
      break;
    }
    if (!moved) stack.pop();
  }

  
  
  
  
  
  const braidRng = rng.child('braid');
  for (let cz = 0; cz < rows; cz++) {
    for (let cx = 0; cx < cols; cx++) {
      const a = cellRect(0, 0, cx, cz);
      const exits = [];
      const shut = [];
      for (const [dx, dz] of NB) {
        const nx = cx + dx, nz = cz + dz;
        if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue;
        let wx, wz;
        if (dx) { wx = dx > 0 ? a.x1 + 1 : a.x0 - 1; wz = a.z0; }
        else    { wx = a.x0; wz = dz > 0 ? a.z1 + 1 : a.z0 - 1; }
        if (wx < 0 || wz < 0 || wx >= w || wz >= h) continue;
        (hedge[at(wx, wz)] ? shut : exits).push([dx, dz, wx, wz]);
      }
      if (exits.length !== 1 || !shut.length) continue;
      if (!braidRng.chance(BRAID)) continue;
      const [dx, dz] = shut[braidRng.rangeI(0, shut.length - 1)];
      if (dx) {
        const wx0 = dx > 0 ? a.x1 + 1 : a.x0 - WALL;
        carveRect(wx0, a.z0, wx0 + WALL - 1, a.z1);
      } else {
        const wz0 = dz > 0 ? a.z1 + 1 : a.z0 - WALL;
        carveRect(a.x0, wz0, a.x1, wz0 + WALL - 1);
      }
    }
  }

  
  
  for (const k of keepOut) carveRect(k.x0 - ox, k.z0 - oz, k.x1 - ox, k.z1 - oz);

  
  
  
  
  
  
  
  
  for (let cz = 0; cz < rows; cz++) {
    for (let cx = 0; cx < cols; cx++) {
      if (!touchesKeepOut[cellAt(cx, cz)]) continue;
      const a = cellRect(0, 0, cx, cz);
      for (const [dx, dz] of NB) {
        if (cx + dx < 0 || cz + dz < 0 || cx + dx >= cols || cz + dz >= rows) continue;
        if (dx) {
          const wx0 = dx > 0 ? a.x1 + 1 : a.x0 - WALL;
          carveRect(wx0, a.z0, wx0 + WALL - 1, a.z1);
        } else {
          const wz0 = dz > 0 ? a.z1 + 1 : a.z0 - WALL;
          carveRect(a.x0, wz0, a.x1, wz0 + WALL - 1);
        }
      }
    }
  }

  return {
    hedge, cols, rows, ox, oz, w, h,
    open(x, z) {
      const lx = x - ox, lz = z - oz;
      if (lx < 0 || lz < 0 || lx >= w || lz >= h) return true;   
      return hedge[at(lx, lz)] === 0;
    },
  };
}









export function walkConnected(maze) {
  const { w, h } = maze;
  const seen = new Uint8Array(w * h);
  let start = -1, total = 0;
  for (let z = 0; z < h; z++) {
    for (let x = 0; x < w; x++) {
      if (maze.hedge[x + z * w] === 0) { total++; if (start < 0) start = x + z * w; }
    }
  }
  if (start < 0) return { connected: true, reached: 0, total: 0 };
  const q = [start];
  seen[start] = 1;
  let reached = 0;
  while (q.length) {
    const i = q.pop();
    reached++;
    const x = i % w, z = (i / w) | 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (nx < 0 || nz < 0 || nx >= w || nz >= h) continue;
      const j = nx + nz * w;
      if (seen[j] || maze.hedge[j]) continue;
      seen[j] = 1;
      q.push(j);
    }
  }
  return { connected: reached === total, reached, total };
}








export function hedgeTops(maze, { minRun = 3 } = {}) {
  const { w, h } = maze;
  const solid = (x, z) => {
    if (x < 0 || z < 0 || x >= w || z >= h) return false;
    return maze.hedge[x + z * w] === 1;
  };
  
  
  
  
  
  const openBeyond = (x, z, dx, dz) => {
    for (let k = 1; k <= WALL; k++) {
      const nx = x + dx * k, nz = z + dz * k;
      if (nx < 0 || nz < 0 || nx >= w || nz >= h) return false;
      if (!solid(nx, nz)) return true;
    }
    return false;
  };
  const out = [];
  for (let z = 0; z < h; z++) {
    for (let x = 0; x < w; x++) {
      if (!solid(x, z)) continue;
      const acrossX = openBeyond(x, z, -1, 0) && openBeyond(x, z, 1, 0);
      const acrossZ = openBeyond(x, z, 0, -1) && openBeyond(x, z, 0, 1);
      if (!acrossX && !acrossZ) continue;
      
      
      
      const [rx, rz] = acrossX ? [0, 1] : [1, 0];
      let run = 1;
      for (let k = 1; k < minRun; k++) { if (solid(x + rx * k, z + rz * k)) run++; else break; }
      for (let k = 1; k < minRun; k++) { if (solid(x - rx * k, z - rz * k)) run++; else break; }
      if (run < minRun) continue;
      out.push({ x: x + maze.ox, z: z + maze.oz, axis: acrossX ? 'x' : 'z' });
    }
  }
  return out;
}
