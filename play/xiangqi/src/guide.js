








import { pseudoMoves, typeOf, ownerOf, rowOf, colOf, SIZE } from '../../../web-engine/xiangqi/xiangqiRules.js';

const SLIDERS = new Set(['R', 'C']);


export function guideFor(p, sq) {
  const board = new Array(SIZE).fill(null);
  board[sq] = p;
  const color = ownerOf(p);
  const pos = { board, turn: color, idle: 0, move: 1, kings: { r: -1, b: -1 } };
  const out = [];
  const seen = new Set();
  for (const m of pseudoMoves(pos)) {
    const dr = rowOf(m.to) - rowOf(sq);
    const dc = colOf(m.to) - colOf(sq);
    if (SLIDERS.has(typeOf(p))) {
      const key = `${Math.sign(dr)},${Math.sign(dc)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ kind: 'slide', dr: Math.sign(dr), dc: Math.sign(dc) });
    } else {
      out.push({ kind: Math.max(Math.abs(dr), Math.abs(dc)) > 1 ? 'jump' : 'step', dr, dc });
    }
  }
  return out;
}
