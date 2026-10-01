


















































import {
  createSearch, chooseMove, depthFor, weighsPosition,
} from '../../../web-engine/checkers/checkersBot.js';
import { legalMoves } from '../../../web-engine/checkers/checkersRules.js';


export const SLICE_MS = 10;

export const BUDGET_MS = 1400;

export const MIN_MS = 420;












export function think({
  board, side, strength, play, stillValid = () => true, random = Math.random,
  now = () => performance.now(),
}) {
  const started = now();
  const moves = legalMoves(board, side);
  let cancelled = false;
  
  
  
  
  let frame = null;
  let timer = null;

  const finish = (move) => {
    if (cancelled || !move) return;
    
    const wait = Math.max(0, MIN_MS - (now() - started));
    timer = setTimeout(() => {
      if (cancelled || !stillValid()) return;
      play(move);
    }, wait);
  };

  if (!moves.length) return () => { cancelled = true; };
  if (moves.length === 1) {
    
    
    
    finish(moves[0]);
    return () => { cancelled = true; if (timer !== null) clearTimeout(timer); };
  }

  const search = createSearch(board, side, {
    depth: depthFor(strength),
    positional: weighsPosition(strength, random),
  });

  const slice = () => {
    if (cancelled) return;
    if (!stillValid()) { cancelled = true; return; }
    const until = now() + SLICE_MS;
    let more = true;
    while (more && now() < until) more = search.step();
    if (more && now() - started < BUDGET_MS) {
      frame = requestAnimationFrame(slice);
      return;
    }
    finish(chooseMove(search.ranked, strength, random));
  };
  frame = requestAnimationFrame(slice);

  return () => {
    cancelled = true;
    if (frame !== null) cancelAnimationFrame(frame);
    if (timer !== null) clearTimeout(timer);
  };
}
