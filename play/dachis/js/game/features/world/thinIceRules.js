









export const CELL = 2;
export const key = (c, r) => c + ',' + r;
export const fresh = () => ({ walked: new Set(), holes: new Set() });
const kind = (room, c, r) => (r < 0 || r >= room.grid.length || c < 0 || c >= room.grid[0].length ? null : room.grid[r][c]);
export const thinCells = (room) => room.grid.flatMap((row, r) => [...row].map((k, c) => (k === '.' ? key(c, r) : null))).filter(Boolean);

export function blocked(room, st, c, r) {
  const k = kind(room, c, r);
  return k === '#' || (k === '.' && st.holes.has(key(c, r)));
}

export function step(room, st, from, to) {
  if (from && kind(room, from[0], from[1]) === '.') st.holes.add(key(...from));
  if (to && kind(room, to[0], to[1]) === '.') st.walked.add(key(...to));
}
export const done = (room, st) => thinCells(room).every((k) => st.walked.has(k));
const N4 = [[0, 1], [0, -1], [1, 0], [-1, 0]];

export function stuck(room, st, c, r) {
  if (kind(room, c, r) !== '.') return false;
  for (const [dc, dr] of N4) {
    const nc = c + dc, nr = r + dr;
    if (nr < 0 && nc === room.entry) return false;
    if (nr >= room.grid.length && nc === room.exit && done(room, st)) return false;
    if (kind(room, nc, nr) === '.' && !blocked(room, st, nc, nr)) return false;
  }
  return true;
}

export function path(room) {
  const cells = new Set(thinCells(room)), R = room.grid.length, start = [room.entry, 0], end = key(room.exit, R - 1);
  if (!cells.has(key(...start)) || !cells.has(end)) return null;
  const seen = new Set(), out = [];
  const go = (c, r) => {
    const k = key(c, r); seen.add(k); out.push([c, r]);
    if (seen.size === cells.size && k === end) return true;
    if (k !== end) for (const [dc, dr] of N4) { const n = key(c + dc, r + dr); if (cells.has(n) && !seen.has(n) && go(c + dc, r + dr)) return true; }
    seen.delete(k); out.pop(); return false;
  };
  return go(...start) ? out : null;
}

export function ways(room, cap = 50) {
  const cells = new Set(thinCells(room)), R = room.grid.length, start = [room.entry, 0], end = key(room.exit, R - 1);
  if (!cells.has(key(...start)) || !cells.has(end)) return 0;
  let n = 0; const seen = new Set();
  const go = (c, r) => {
    if (n >= cap) return;
    const k = key(c, r); seen.add(k);
    if (k === end) { if (seen.size === cells.size) n++; }
    else for (const [dc, dr] of N4) { const q = key(c + dc, r + dr); if (cells.has(q) && !seen.has(q)) go(c + dc, r + dr); }
    seen.delete(k);
  };
  go(...start);
  return n;
}
