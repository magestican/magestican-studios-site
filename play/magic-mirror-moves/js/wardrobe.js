





export const KEY_PREFIX = 'mmm.best.stars.';
const LEVELS = ['little', 'big'];


export const keyFor = (level, costume) => `${KEY_PREFIX}${level}.${costume}`;




export function emptyWardrobe(ids) {
  return { little: Object.fromEntries(ids.map((id) => [id, 0])), big: Object.fromEntries(ids.map((id) => [id, 0])) };
}


export function readWardrobe(get, ids) {
  const w = emptyWardrobe(ids);
  for (const level of LEVELS)
    for (const id of ids) {
      const n = Math.floor(Number(get(keyFor(level, id))));
      w[level][id] = Number.isFinite(n) ? Math.max(0, Math.min(3, n)) : 0;
    }
  return w;
}


const best = (w, id) => Math.max(w.little[id] ?? 0, w.big[id] ?? 0);


export const countStarred = (w, ids) => ids.filter((id) => best(w, id) >= 1).length;

const countThree = (w, ids) => ids.filter((id) => best(w, id) >= 3).length;


export const PRIZES = [
  { id: 'first', name: 'First star', icon: 'star', got: (w, ids) => countStarred(w, ids) >= 1 },
  { id: 'three', name: 'Three-star show', icon: 'sparkle', got: (w, ids) => countThree(w, ids) >= 1 },
  { id: 'c3', name: 'Three costumes starred', icon: 'heart', got: (w, ids) => countStarred(w, ids) >= 3 },
  { id: 'c6', name: 'Six costumes starred', icon: 'rainbow', got: (w, ids) => countStarred(w, ids) >= 6 },
  { id: 'c11', name: 'Every costume starred', icon: 'crown', got: (w, ids) => countStarred(w, ids) >= ids.length },
  { id: 't3', name: 'Three shining costumes', icon: 'comet', got: (w, ids) => countThree(w, ids) >= 3 },
  { id: 't6', name: 'Six shining costumes', icon: 'planet', got: (w, ids) => countThree(w, ids) >= 6 },
  { id: 'big', name: 'Big star show', icon: 'bolt', got: (w, ids) => ids.some((id) => (w.big[id] ?? 0) >= 3) },
  { id: 'gold', name: 'Golden wardrobe', icon: 'coin', got: (w, ids) => countThree(w, ids) >= ids.length },
].map((p) =>  (p));


export const prizesOf = (w, ids) => PRIZES.filter((p) => p.got(w, ids)).map((p) => p.id);





export function award(w, costumes, level, stars) {
  const ids = Object.keys(w.little);
  const next = { little: { ...w.little }, big: { ...w.big } };
  
  const writes = [];
  const lv = level === 'big' ? 'big' : 'little';
  for (const id of costumes) {
    if (!(id in next[lv]) || stars <= next[lv][id]) continue;
    next[lv][id] = Math.min(3, stars);
    writes.push([keyFor(lv, id), String(next[lv][id])]);
  }
  const had = new Set(prizesOf(w, ids));
  const newPrizes = PRIZES.filter((p) => p.got(next, ids) && !had.has(p.id));
  return { wardrobe: next, writes, newPrizes };
}


export function nextGoal(w, ids) {
  const none = ids.find((id) => best(w, id) < 1);
  if (none) return { kind: 'star', costume: none };
  const notThree = ids.find((id) => best(w, id) < 3);
  if (notThree) return { kind: 'three', costume: notThree };
  return { kind: 'done' };
}







export function adviceAfter(recent, level) {
  const [a, b] = recent.slice(-2);
  if (recent.length < 2 || a !== 1 || b !== 1) return null;
  return level === 'big' ? 'little' : 'stand_back';
}
