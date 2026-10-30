







import { EMPTY, play } from '../../../web-engine/go/goRules.js';


export function guideFor(pos) {
  const b = pos.board;
  const atari = [];
  const atariLibs = new Set();
  const done = new Uint8Array(b.size);
  for (let p = 0; p < b.size; p += 1) {
    if (!b.cells[p] || done[p]) continue;
    const { stones, libs } = b.chain(p);
    for (const q of stones) done[q] = 1;
    if (libs.length === 1) { atari.push(...stones); atariLibs.add(libs[0]); }
  }
  const illegal = [];
  for (let p = 0; p < b.size; p += 1) if (b.cells[p] === EMPTY && !play(pos, p)) illegal.push(p);
  return { atari: atari.sort((x, y) => x - y), atariLibs: [...atariLibs].sort((x, y) => x - y), illegal };
}


export const libertiesAt = (pos, p) => pos.board.chain(p);
