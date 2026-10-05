









export const CELL = 2, HOLD = 1.0, WARN = 0.55, DOWN = 2.8, RISE = 0.6;
export const key = (c, r) => c + ',' + r;
export const fresh = () => ({ cols: {} });
const has = (f, c, r) => r >= 0 && r < f.grid.length && c >= 0 && c < f.grid[0].length && f.grid[r][c] === '.';
const colOf = (st, k) => st.cols[k] || (st.cols[k] = { load: 0, phase: 'up', t: 0 });
export const phaseOf = (st, c, r) => (st.cols[key(c, r)] || { phase: 'up' }).phase;
export const solid = (f, st, c, r) => has(f, c, r) && ['up', 'sink'].includes(phaseOf(st, c, r));

export function tick(f, st, here, dt) {
  const hk = here && has(f, here[0], here[1]) ? key(here[0], here[1]) : null;
  if (hk) {
    const col = colOf(st, hk);
    if (col.phase === 'up') { col.load += dt; if (col.load >= HOLD) { col.phase = 'sink'; col.t = 0; } }
  }
  for (const [k, col] of Object.entries(st.cols)) {
    if (k !== hk && col.phase === 'up') col.load = 0; 
    if (col.phase === 'up') continue;
    col.t += dt;
    if (col.phase === 'sink' && col.t >= WARN) { col.phase = 'down'; col.t = 0; }
    else if (col.phase === 'down' && col.t >= DOWN) { col.phase = 'rise'; col.t = 0; }
    else if (col.phase === 'rise' && col.t >= RISE) { col.phase = 'up'; col.t = 0; col.load = 0; }
  }
  return hk && !['up', 'sink'].includes(st.cols[hk].phase) ? 'dunk' : null;
}

export function depthOf(st, c, r) {
  const col = st.cols[key(c, r)]; if (!col) return 0;
  return col.phase === 'sink' ? 0.25 * col.t / WARN : col.phase === 'down' ? 1 : col.phase === 'rise' ? 1 - col.t / RISE : 0;
}

export function path(f) {
  const R = f.grid.length, C = f.grid[0].length, prev = {}, q = [];
  for (let c = 0; c < C; c++) if (has(f, c, 0)) { q.push([c, 0]); prev[key(c, 0)] = null; }
  while (q.length) {
    const [c, r] = q.shift();
    if (r === R - 1) { const out = []; let k = key(c, r); while (k) { out.unshift(k.split(',').map(Number)); k = prev[k]; } return out; }
    for (const [dc, dr] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { const n = key(c + dc, r + dr); if (has(f, c + dc, r + dr) && !(n in prev)) { prev[n] = key(c, r); q.push([c + dc, r + dr]); } }
  }
  return null;
}
