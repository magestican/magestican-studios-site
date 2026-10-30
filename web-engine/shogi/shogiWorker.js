



import { parseSfen, moveToUsi } from './shogiRules.js';
import { chooseMove, seededRng } from './shogiBot.js';

self.onmessage = (e) => {
  const { sfen, level, seed, id } = e.data || {};
  let usi = null;
  try {
    const m = chooseMove(parseSfen(sfen), { level, rng: seededRng(seed || 1) });
    usi = m ? moveToUsi(m) : null;
  } catch {
    usi = null;
  }
  self.postMessage({ id, usi });
};
