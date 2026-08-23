








































const VOX_AIR = 0;
const VOX_HAY = 10;




export const CLEARANCE = 2;




export const MAX_STEP_UP = 1;



export const MAX_DROP = 3;


const DEFAULT_SIZE = 80;
const DEFAULT_HEIGHT = 12;





export const REUSE_RADIUS = 5;


const SNAP_RADIUS = 8;
export const MAX_FIELDS = 6;




export const MIN_MAROON_DROP = 2;



export const MAROON_SCAN_MAX = 512;

const INF = 65535;          
const COST_ORTH = 10;       
const COST_DIAG = 14;       



const NEIGHBOURS = [
  [ 1,  0, COST_ORTH], [-1,  0, COST_ORTH],
  [ 0,  1, COST_ORTH], [ 0, -1, COST_ORTH],
  [ 1,  1, COST_DIAG], [ 1, -1, COST_DIAG],
  [-1,  1, COST_DIAG], [-1, -1, COST_DIAG],
];




function blocking(grid, x, y, z) {
  if (typeof grid.get === 'function') {
    const v = grid.get(x, y, z);
    return v !== VOX_AIR && v !== VOX_HAY;
  }
  
  
  return grid.isSolid(x + 0.5, y + 0.5, z + 0.5);
}











export function surfaceYAt(grid, x, z, maxY = DEFAULT_HEIGHT) {
  const top = maxY - CLEARANCE;
  for (let y = 0; y < top; y++) {
    if (!blocking(grid, x, y, z)) continue;
    let clear = true;
    for (let h = 1; h <= CLEARANCE; h++) {
      if (blocking(grid, x, y + h, z)) { clear = false; break; }
    }
    if (clear) return y + 1;
  }
  return -1;
}




export class NavGraph {
  constructor(grid) {
    this.grid = grid;
    this.sx = grid.sx ?? DEFAULT_SIZE;
    this.sz = grid.sz ?? DEFAULT_SIZE;
    this.maxY = grid.sy ?? DEFAULT_HEIGHT;
    
    this.surface = new Int8Array(this.sx * this.sz);
    for (let z = 0; z < this.sz; z++) {
      for (let x = 0; x < this.sx; x++) {
        this.surface[x + z * this.sx] = surfaceYAt(grid, x, z, this.maxY);
      }
    }
    this.fields = new Map();   
    this.clock = 0;            
    this.fieldBuilds = 0;      
  }

  idx(x, z) {
    if (x < 0 || z < 0 || x >= this.sx || z >= this.sz) return -1;
    return x + z * this.sx;
  }

  surfaceAt(x, z) {
    const i = this.idx(x, z);
    return i < 0 ? -1 : this.surface[i];
  }

  walkable(x, z) { return this.surfaceAt(x, z) >= 0; }

  
  canEnter(x, z, fromY) {
    const s = this.surfaceAt(x, z);
    if (s < 0) return false;
    const rise = s - fromY;
    return rise <= MAX_STEP_UP && -rise <= MAX_DROP;
  }

  
  _linked(i, j) {
    const a = this.surface[i], b = this.surface[j];
    return a >= 0 && b >= 0 && Math.abs(a - b) <= MAX_STEP_UP;
  }

  
  fieldFor(goalX, goalZ) {
    const snapped = this._nearestWalkable(goalX, goalZ, SNAP_RADIUS);
    if (snapped < 0) return null;             

    const hit = this.fields.get(snapped);
    if (hit) { hit.used = ++this.clock; return hit; }

    
    
    let best = null, bestD = Infinity;
    const gx = snapped % this.sx, gz = (snapped / this.sx) | 0;
    for (const f of this.fields.values()) {
      const d = Math.max(Math.abs(f.gx - gx), Math.abs(f.gz - gz));
      if (d < bestD) { bestD = d; best = f; }
    }
    if (best && bestD <= REUSE_RADIUS) { best.used = ++this.clock; return best; }

    if (this.fields.size >= MAX_FIELDS) {
      let oldest = null;
      for (const [k, f] of this.fields) if (!oldest || f.used < oldest[1].used) oldest = [k, f];
      if (oldest) this.fields.delete(oldest[0]);
    }
    const field = this._buildField(snapped);
    this.fields.set(snapped, field);
    return field;
  }

  
  
  
  
  _nearestWalkable(x, z, radius) {
    if (this.walkable(x, z)) return this.idx(x, z);
    for (let r = 1; r <= radius; r++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;   
          if (this.walkable(x + dx, z + dz)) return this.idx(x + dx, z + dz);
        }
      }
    }
    return -1;
  }

  
  
  
  
  
  
  _buildField(goalIdx) {
    this.fieldBuilds++;
    const n = this.sx * this.sz;
    const dist = new Uint16Array(n).fill(INF);
    const buckets = [];
    dist[goalIdx] = 0;
    buckets[0] = [goalIdx];

    for (let d = 0; d < buckets.length; d++) {
      const bucket = buckets[d];
      if (!bucket) continue;
      for (let k = 0; k < bucket.length; k++) {
        const i = bucket[k];
        if (dist[i] !== d) continue;          
        const x = i % this.sx, z = (i / this.sx) | 0;
        for (let nb = 0; nb < NEIGHBOURS.length; nb++) {
          const [dx, dz, cost] = NEIGHBOURS[nb];
          const nx = x + dx, nz = z + dz;
          const j = this.idx(nx, nz);
          if (j < 0 || !this._linked(i, j)) continue;
          
          
          if (dx && dz) {
            const a = this.idx(x + dx, z), b = this.idx(x, z + dz);
            if (a < 0 || b < 0 || !this._linked(i, a) || !this._linked(i, b)) continue;
          }
          const nd = d + cost;
          if (nd >= INF || nd >= dist[j]) continue;
          dist[j] = nd;
          (buckets[nd] ??= []).push(j);
        }
      }
      buckets[d] = null;                       
    }
    return { dist, gx: goalIdx % this.sx, gz: (goalIdx / this.sx) | 0, used: ++this.clock };
  }

  
  
  descend(field, i) {
    const here = field.dist[i];
    if (here === INF) return -1;
    const x = i % this.sx, z = (i / this.sx) | 0;
    let best = -1, bestD = here;
    for (let nb = 0; nb < NEIGHBOURS.length; nb++) {
      const [dx, dz] = NEIGHBOURS[nb];
      const j = this.idx(x + dx, z + dz);
      if (j < 0 || !this._linked(i, j)) continue;
      if (dx && dz) {
        const a = this.idx(x + dx, z), b = this.idx(x, z + dz);
        if (a < 0 || b < 0 || !this._linked(i, a) || !this._linked(i, b)) continue;
      }
      if (field.dist[j] < bestD) { bestD = field.dist[j]; best = j; }
    }
    return best;
  }

  
  
  
  
  anchorTile(field, x, z, radius = 3) {
    const tx = Math.floor(x), tz = Math.floor(z);
    const i = this.idx(tx, tz);
    if (i >= 0 && field.dist[i] !== INF) return i;
    for (let r = 1; r <= radius; r++) {
      let best = -1, bestD = INF;
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const j = this.idx(tx + dx, tz + dz);
          if (j < 0 || field.dist[j] >= bestD) continue;
          bestD = field.dist[j]; best = j;
        }
      }
      if (best >= 0) return best;
    }
    return -1;
  }

  
  
  
  
  clearWalk(x0, z0, x1, z1) {
    const dx = x1 - x0, dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.ceil(len / 0.5));
    let prev = this.surfaceAt(Math.floor(x0), Math.floor(z0));
    if (prev < 0) return false;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const sy = this.surfaceAt(Math.floor(x0 + dx * t), Math.floor(z0 + dz * t));
      if (sy < 0 || Math.abs(sy - prev) > MAX_STEP_UP) return false;
      prev = sy;
    }
    return true;
  }

  
  
  
  
  waypoint(field, x, z, lookahead = 8) {
    const start = this.anchorTile(field, x, z);
    if (start < 0) return null;
    const chain = [];
    let cur = start;
    for (let k = 0; k < lookahead; k++) {
      const next = this.descend(field, cur);
      if (next < 0) break;
      chain.push(next);
      cur = next;
    }
    if (!chain.length) {
      
      return { x: field.gx + 0.5, z: field.gz + 0.5, arrived: true };
    }
    for (let k = chain.length - 1; k >= 0; k--) {
      const j = chain[k];
      const wx = (j % this.sx) + 0.5, wz = ((j / this.sx) | 0) + 0.5;
      if (this.clearWalk(x, z, wx, wz)) return { x: wx, z: wz, arrived: false };
    }
    const j = chain[0];
    return { x: (j % this.sx) + 0.5, z: ((j / this.sx) | 0) + 0.5, arrived: false };
  }

  reachable(field, x, z) {
    return this.anchorTile(field, x, z) >= 0;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  escapeFromIsland(field, x, z, { minDrop = MIN_MAROON_DROP, maxTiles = MAROON_SCAN_MAX } = {}) {
    if (!field) return null;
    const start = this.idx(Math.floor(x), Math.floor(z));
    if (start < 0 || this.surface[start] < 0) return null;
    if (field.dist[start] !== INF) return null;      

    
    
    
    
    const depth = new Map([[start, 0]]);
    const queue = [start];
    let best = null, bestDepth = Infinity;
    for (let qi = 0; qi < queue.length; qi++) {
      const i = queue[qi];
      const d = depth.get(i);
      
      
      
      if (d > bestDepth || depth.size > maxTiles) break;
      const sx0 = i % this.sx, sz0 = (i / this.sx) | 0;
      const si = this.surface[i];
      for (let nb = 0; nb < NEIGHBOURS.length; nb++) {
        const [dx, dz] = NEIGHBOURS[nb];
        const j = this.idx(sx0 + dx, sz0 + dz);
        if (j < 0) continue;
        const sj = this.surface[j];
        if (sj < 0) continue;
        if (this._linked(i, j)) {
          if (!depth.has(j)) { depth.set(j, d + 1); queue.push(j); }
          continue;
        }
        
        
        
        if (si - sj < minDrop) continue;
        if (field.dist[j] === INF) continue;
        if (!best || d < bestDepth
            || (d === bestDepth && field.dist[j] < best.routeDist)) {
          bestDepth = d;
          best = {
            x: sx0 + 0.5, z: sz0 + 0.5,           
            toX: (j % this.sx) + 0.5,             
            toZ: ((j / this.sx) | 0) + 0.5,
            drop: si - sj, routeDist: field.dist[j], tiles: d,
          };
        }
      }
    }
    return best;
  }
}









const GRAPHS = new WeakMap();
let graphBuilds = 0;

export function navGraphFor(grid) {
  let g = GRAPHS.get(grid);
  if (!g) { g = new NavGraph(grid); GRAPHS.set(grid, g); graphBuilds++; }
  return g;
}



export function navFieldFor(grid, goalX, goalZ) {
  return navGraphFor(grid).fieldFor(Math.floor(goalX), Math.floor(goalZ));
}

export function navStats(grid) {
  const g = grid ? GRAPHS.get(grid) : null;
  return { graphBuilds, fieldBuilds: g ? g.fieldBuilds : 0, fields: g ? g.fields.size : 0 };
}

export function resetNavStats() { graphBuilds = 0; }
