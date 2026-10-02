

import { T } from '../world/mapgen.js';

export function mapForArena(W) {
  const tile = (x, y) => W.idx(Math.floor(x), Math.floor(y));
  const inside = (x, y) => x >= 0 && y >= 0 && x < W.N && y < W.N;
  return {
    walkable: (x, y, r) => inside(x, y) && W.walkable(x, y, r),
    reachable: (x, y) => inside(x, y) && !!W.reach[tile(x, y)],
    road: (x, y) => inside(x, y) && W.type[tile(x, y)] === T.PATH,
    sectionAt: (x, y) => W.sectionAt(x, y),
    groundAt: (x, y) => W.groundAt(x, y),
  };
}
