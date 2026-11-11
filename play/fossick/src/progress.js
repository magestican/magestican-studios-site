





export const PRIZES = Object.freeze(['first', 'mint', 'chalk', 'limestone', 'slate', 'survey', 'favourites', 'fossils', 'allMint']);

const setOf = (cabinet, id) => cabinet.find((c) => c.id === id) || cabinet[0];
const idsOf = (set) => set.drawers.flatMap((d) => d.levels.map((l) => l.id));





export function goalFor(cabinet, best, setId) {
  const ids = idsOf(setOf(cabinet, setId));
  const free = ids.find((id) => !best[id]);
  if (free) return { kind: 'free', id: free };
  const mint = ids.find((id) => best[id] !== 'mint');
  if (mint) return { kind: 'mint', id: mint };
  return { kind: 'done', id: ids[0] };
}


export function tallyFor(cabinet, best, setId) {
  const ids = idsOf(setOf(cabinet, setId));
  return { freed: ids.filter((id) => best[id]).length, mint: ids.filter((id) => best[id] === 'mint').length, total: ids.length };
}


export function prizesFrom(cabinet, best) {
  const every = cabinet.flatMap(idsOf);
  const has = {
    first: every.some((id) => best[id]),
    mint: every.some((id) => best[id] === 'mint'),
    allMint: every.length > 0 && every.every((id) => best[id] === 'mint'),
  };
  for (const layer of ['chalk', 'limestone', 'slate', 'survey']) {
    has[layer] = cabinet.some((c) => c.drawers.some((d) => d.id === layer && d.levels.every((l) => best[l.id])));
  }
  for (const set of cabinet) has[set.id] = idsOf(set).every((id) => best[id]);
  return PRIZES.filter((p) => has[p]);
}


export const newPrizes = (before, after) => after.filter((p) => !before.includes(p));


export function nextStreak(streak, levelId, result) {
  if (result === 'won') return { id: levelId, losses: 0 };
  return { id: levelId, losses: streak && streak.id === levelId ? streak.losses + 1 : 1 };
}


export function tipFor(streak, result) {
  if (!streak || streak.losses < 2) return null;
  if (result === 'fallen') return 'tipFallen';
  if (result === 'broken') return 'tipBroken';
  return null;
}
