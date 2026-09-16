












import { PLAYER_RADIUS_M } from '../world/collision.mjs';

const STEPS = (() => {
  const out = [];
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (dx === 0 && dz === 0) continue;
      const a = Math.abs(dx), b = Math.abs(dz);
      if ((a === 2 && b !== 1) || (b === 2 && a !== 1)) continue; 
      out.push([dx, dz, Math.hypot(dx, dz)]);
    }
  }
  return out;
})();


export function walkGrid(world, { minX, maxX, minZ, maxZ, cellM = 0.2, radius = PLAYER_RADIUS_M } = {}) {
  const nx = Math.floor((maxX - minX) / cellM) + 1;
  const nz = Math.floor((maxZ - minZ) / cellM) + 1;
  const open = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = minX + i * cellM, z = minZ + j * cellM;
      if (Math.hypot(x, z) > world.walkEdgeM - radius) continue;
      open[j * nx + i] = world.deepest(x, z, radius) ? 0 : 1;
    }
  }
  return { cellM, minX, minZ, nx, nz, open };
}


function heap() {
  const a = [];
  return {
    get size() { return a.length; },
    push(c, i) {
      a.push([c, i]);
      let k = a.length - 1;
      while (k > 0) {
        const p = (k - 1) >> 1;
        if (a[p][0] <= a[k][0]) break;
        [a[p], a[k]] = [a[k], a[p]];
        k = p;
      }
    },
    pop() {
      const top = a[0];
      const last = a.pop();
      if (a.length) {
        a[0] = last;
        let k = 0;
        for (;;) {
          const l = 2 * k + 1, r = l + 1;
          let m = k;
          if (l < a.length && a[l][0] < a[m][0]) m = l;
          if (r < a.length && a[r][0] < a[m][0]) m = r;
          if (m === k) break;
          [a[m], a[k]] = [a[k], a[m]];
          k = m;
        }
      }
      return top;
    },
  };
}

function nearestOpen(grid, x, z) {
  const i0 = Math.round((x - grid.minX) / grid.cellM), j0 = Math.round((z - grid.minZ) / grid.cellM);
  for (let r = 0; r < 20; r++) {
    let best = -1, bestD = Infinity;
    for (let dj = -r; dj <= r; dj++) {
      for (let di = -r; di <= r; di++) {
        const i = i0 + di, j = j0 + dj;
        if (i < 0 || j < 0 || i >= grid.nx || j >= grid.nz || !grid.open[j * grid.nx + i]) continue;
        const d = Math.hypot(di, dj);
        if (d < bestD) { bestD = d; best = j * grid.nx + i; }
      }
    }
    if (best >= 0) return best;
  }
  return -1;
}






export function walkDistance(grid, from, goal) {
  const { nx, nz, open, cellM, minX, minZ } = grid;
  const start = nearestOpen(grid, from.x, from.z);
  if (start < 0) return Infinity;
  const dist = new Float64Array(nx * nz).fill(Infinity);
  dist[start] = 0;
  const q = heap();
  q.push(0, start);
  while (q.size) {
    const [d, k] = q.pop();
    if (d > dist[k]) continue;
    const i = k % nx, j = (k - i) / nx;
    if (goal(minX + i * cellM, minZ + j * cellM)) return d * cellM;
    for (const [dx, dz, len] of STEPS) {
      const ii = i + dx, jj = j + dz;
      if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
      const kk = jj * nx + ii;
      if (!open[kk]) continue;
      
      if (Math.abs(dx) === 2 && !open[j * nx + i + Math.sign(dx)]) continue;
      if (Math.abs(dz) === 2 && !open[(j + Math.sign(dz)) * nx + i]) continue;
      if (Math.abs(dx) === 1 && Math.abs(dz) === 1 && (!open[j * nx + ii] || !open[jj * nx + i])) continue;
      const nd = d + len;
      if (nd < dist[kk]) {
        dist[kk] = nd;
        q.push(nd, kk);
      }
    }
  }
  return Infinity;
}








export function walkPath(grid, from, to, { cost = null } = {}) {
  const { nx, nz, open, cellM, minX, minZ } = grid;
  const start = nearestOpen(grid, from.x, from.z);
  const goal = nearestOpen(grid, to.x, to.z);
  if (start < 0 || goal < 0) return null;
  const dist = new Float64Array(nx * nz).fill(Infinity);
  const prev = new Int32Array(nx * nz).fill(-1);
  dist[start] = 0;
  const q = heap();
  q.push(0, start);
  let found = start === goal;
  while (q.size && !found) {
    const [d, k] = q.pop();
    if (d > dist[k]) continue;
    if (k === goal) { found = true; break; }
    const i = k % nx, j = (k - i) / nx;
    for (const [dx, dz, len] of STEPS) {
      const ii = i + dx, jj = j + dz;
      if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
      const kk = jj * nx + ii;
      if (!open[kk]) continue;
      if (Math.abs(dx) === 2 && !open[j * nx + i + Math.sign(dx)]) continue;
      if (Math.abs(dz) === 2 && !open[(j + Math.sign(dz)) * nx + i]) continue;
      if (Math.abs(dx) === 1 && Math.abs(dz) === 1 && (!open[j * nx + ii] || !open[jj * nx + i])) continue;
      const nd = d + len * (cost ? (cost[k] + cost[kk]) / 2 : 1);
      if (nd < dist[kk]) {
        dist[kk] = nd;
        prev[kk] = k;
        q.push(nd, kk);
      }
    }
  }
  if (!found) return null;
  const cells = [];
  for (let k = goal; k >= 0; k = k === start ? -1 : prev[k]) cells.push(k);
  cells.reverse();
  const points = cells.map((k) => ({ x: minX + (k % nx) * cellM, z: minZ + Math.floor(k / nx) * cellM }));
  let metres = 0;
  for (let n = 1; n < points.length; n++) metres += Math.hypot(points[n].x - points[n - 1].x, points[n].z - points[n - 1].z);
  return { metres, points };
}


export function openAt(grid, x, z) {
  const i = Math.round((x - grid.minX) / grid.cellM), j = Math.round((z - grid.minZ) / grid.cellM);
  if (i < 0 || j < 0 || i >= grid.nx || j >= grid.nz) return false;
  return Boolean(grid.open[j * grid.nx + i]);
}
