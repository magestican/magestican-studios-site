



import { parseFen, moveToIccs } from './xiangqiRules.js';
import { chooseMove, seededRng } from './xiangqiBot.js';

self.onmessage = (e) => {
  const { fen, level, seed, id } = e.data || {};
  let mv = null;
  try {
    const m = chooseMove(parseFen(fen), { level, rng: seededRng(seed || 1) });
    mv = m ? moveToIccs(m) : null;
  } catch {
    mv = null;
  }
  self.postMessage({ id, mv });
};
