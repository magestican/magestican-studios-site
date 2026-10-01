























































import { thinkerFor, chooseMove, thinkingShare } from '../../../web-engine/chess/chessBot.js';
import { moveKey } from '../../../web-engine/chess/moves.js';


export const SLICE_MS = 12;

export const THINK_MS = 2500;

export const FLOOR_MS = 450;










export function startThinking(position, bot, {
  onMove, onProgress = () => {}, random = Math.random, now = () => Date.now(),
} = {}) {
  const search = thinkerFor(position, bot);
  const budget = Math.max(400, THINK_MS * Math.max(0.35, bot?.strength ?? 1));
  const began = now();
  let cancelled = false;
  let timer = null;

  const finish = () => {
    if (cancelled) return;
    const move = chooseMove(search.ranked(), bot?.strength ?? 1, random);
    onMove(move ? moveKey(move) : null, { depth: search.completedDepth, nodes: search.nodes });
  };

  const slice = () => {
    if (cancelled) return;
    const sliceStart = now();
    
    while (!search.done && now() - sliceStart < SLICE_MS) search.step();
    onProgress(thinkingShare(search, bot));
    const spent = now() - began;
    
    
    
    const out = search.done || (spent >= budget && search.completedDepth >= 1);
    if (!out) { timer = setTimeout(slice, 0); return; }
    const wait = Math.max(0, FLOOR_MS - spent);
    timer = setTimeout(finish, wait);
  };

  timer = setTimeout(slice, 0);
  return {
    cancel() {
      cancelled = true;
      if (timer) clearTimeout(timer);
      timer = null;
    },
    get cancelled() { return cancelled; },
  };
}
