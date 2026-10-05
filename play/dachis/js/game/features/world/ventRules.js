










export const CELL = 2;
export const key = (c, r) => c + ',' + r;
const kind = (room, c, r) => (r < 0 || r >= room.grid.length || c < 0 || c >= room.grid[0].length ? null : room.grid[r][c]);
export function cooled(room, open, ch) {
  let n = 0; room.valves.forEach((v, i) => { if (open.has(i) && v.flips.includes(ch)) n++; });
  return n % 2 === 1;
}
export function walkable(room, open, c, r) {
  const k = kind(room, c, r);
  return k === '.' || (!!k && k !== '#' && cooled(room, open, k));
}
export function region(room, open) {
  const seen = new Set(), q = [];
  if (walkable(room, open, room.entry, 0)) { seen.add(key(room.entry, 0)); q.push([room.entry, 0]); }
  while (q.length) {
    const [c, r] = q.pop();
    for (const [dc, dr] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
      const n = key(c + dc, r + dr);
      if (!seen.has(n) && walkable(room, open, c + dc, r + dr)) { seen.add(n); q.push([c + dc, r + dr]); }
    }
  }
  return seen;
}
export const atExit = (room, reg) => reg.has(key(room.exit, room.grid.length - 1));

const canTurn = (reg, v) => [[0, 0], [0, 1], [1, 0], [-1, 0], [0, -1]].some(([dc, dr]) => reg.has(key(v.at[0] + dc, v.at[1] + dr)));
export function solve(room) {
  const enc = (s) => [...s].sort().join(','), q = [[new Set(), 0]], seen = new Set(['']);
  while (q.length) {
    const [open, n] = q.shift(), reg = region(room, open);
    if (atExit(room, reg)) return n;
    room.valves.forEach((v, i) => {
      if (!canTurn(reg, v)) return;
      const nx = new Set(open); if (nx.has(i)) nx.delete(i); else nx.add(i);
      const k = enc(nx); if (!seen.has(k)) { seen.add(k); q.push([nx, n + 1]); }
    });
  }
  return -1;
}
