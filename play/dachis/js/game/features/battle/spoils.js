



import { xpToNext } from './rules.js';




export function xpRun(lvl0, xp0, lvl1, xp1, cap = Infinity) {
  const out = [];
  for (let L = lvl0; L <= lvl1; L++) {
    const need = xpToNext(L), from = L === lvl0 ? xp0 : 0, last = L === lvl1;
    if (last && L >= cap) { out.push({ lvl: L, from: need, to: need, need, up: false, max: true }); break; }
    out.push({ lvl: L, from, to: last ? xp1 : need, need, up: !last });
  }
  return out;
}


export function statGain(before, after) {
  return [['maxHp', 'HP'], ['atk', 'ATK'], ['def', 'DEF'], ['spd', 'SPD']]
    .map(([k, label]) => ({ label, n: (after[k] || 0) - (before[k] || 0) })).filter((s) => s.n > 0);
}



export const DROP = { tonic: 0.25, candy: 0.06 };
export function rollDrops(rand, { boss = false } = {}) {
  if (boss) return [{ item: 'candy', n: 2 }, { item: 'tonic', n: 1 }];
  const out = [];
  if (rand() < DROP.tonic) out.push({ item: 'tonic', n: 1 });
  if (rand() < DROP.candy) out.push({ item: 'candy', n: 1 });
  return out;
}


export const fillTime = (seg) => 0.25 + 0.75 * Math.min(1, Math.max(0, (seg.to - seg.from) / seg.need));
