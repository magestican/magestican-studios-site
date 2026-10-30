




import { replay } from './goMatch.js';
import { toSgf } from './goRules.js';
import { chooseMove, seededRng } from './goBot.js';

self.onmessage = (e) => {
  const { n, rules, moves, level, seed, id } = e.data || {};
  let mv = null;
  try {
    const m = replay({ n, rules, moves: moves || [] });
    mv = toSgf(chooseMove(m.pos, { level, rules, rng: seededRng(seed || 1) }), n);
  } catch {
    mv = null;
  }
  self.postMessage({ id, mv });
};
