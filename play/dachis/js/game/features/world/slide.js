






export const CELL = 2;
export const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const at = (grid, c, r) => (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length ? null : grid[r][c]);

export function slideFrom(grid, c, r, dc, dr) {
  for (;;) {
    const nc = c + dc, nr = r + dr;
    if (nr < 0) return { c, r, off: 'south' };
    if (nr >= grid.length) return { c, r, off: 'north' };
    const k = at(grid, nc, nr);
    if (k === null || k === '#') return { c, r, off: null }; 
    c = nc; r = nr;
    if (k === 'o') return { c, r, off: null };
  }
}


export function solve(grid) {
  const W = grid[0].length, seen = new Set(), q = [];
  for (let c = 0; c < W; c++) {
    if (at(grid, c, 0) === '#') continue;
    const s = at(grid, c, 0) === 'o' ? { c, r: 0, off: null } : slideFrom(grid, c, 0, 0, 1);
    if (s.off === 'north') return 1;
    if (!s.off) q.push([s.c, s.r, 1]);
  }
  while (q.length) {
    const [c, r, n] = q.shift(), key = c + ',' + r;
    if (seen.has(key)) continue;
    seen.add(key);
    for (const [dc, dr] of DIRS) {
      const s = slideFrom(grid, c, r, dc, dr);
      if (s.off === 'north') return n + 1;
      if (!s.off && !(s.c === c && s.r === r)) q.push([s.c, s.r, n + 1]);
    }
  }
  return -1;
}


export function snapDir(wu, wv) {
  return Math.abs(wu) > Math.abs(wv) ? [Math.sign(wu), 0] : [0, Math.sign(wv) || 1];
}
