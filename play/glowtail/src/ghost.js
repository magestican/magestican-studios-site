






import { W, H } from './sim.js';

export const GHOST_MAX_TICKS = 6000; 
export const GHOST_TRAIL = 6; 
const CELLS = W * H;

export function createRecorder() {
  return { path: [] };
}


export function record(rec, state) {
  if (state.phase === 'dead' || rec.path.length >= GHOST_MAX_TICKS) return;
  
  
  if (state.depth?.edges === 'cube') return;
  const h = state.snake[0];
  rec.path[state.tick - 1] = state.depthIndex * CELLS + h.y * W + h.x;
}


export function pack(rec, score) {
  return { v: 1, score, path: rec.path.filter((n) => Number.isInteger(n)) };
}


export function unpack(raw) {
  if (!raw || raw.v !== 1 || !Array.isArray(raw.path) || !Number.isFinite(raw.score)) return null;
  const path = raw.path.slice(0, GHOST_MAX_TICKS);
  if (!path.every((n) => Number.isInteger(n) && n >= 0 && n < CELLS * 5)) return null;
  return { score: raw.score, path };
}





export function keeps(stored, score) {
  return score > 0 && (!stored || score > stored.score);
}





export function ghostAt(ghost, tick, depthIndex) {
  if (!ghost || tick < 1 || tick > ghost.path.length) return null;
  const cells = [];
  for (let i = tick - 1; i >= 0 && cells.length < GHOST_TRAIL; i--) {
    const n = ghost.path[i];
    if (Math.floor(n / CELLS) !== depthIndex) break;
    const k = n % CELLS;
    cells.push({ x: k % W, y: (k / W) | 0 });
  }
  return cells.length ? cells : null;
}
