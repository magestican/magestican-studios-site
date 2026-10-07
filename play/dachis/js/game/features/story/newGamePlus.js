











import { STARTERS } from '../../data/species.js';

export const PATHS =  (['power', 'wisdom', 'adventure']);


export const startersOwned = (dex) => PATHS.filter((p) => !!(dex && dex.caught && dex.caught[STARTERS[p]]));



export function starterChoices(dex) {
  const owned = startersOwned(dex), left = PATHS.filter((p) => !owned.includes(p));
  return left.length ? left : PATHS.slice();
}



export const plusReady = (save) => !!(save && save.flags && save.flags.ending);



export function newGamePlus(save) {
  const box = (save.box || []).map(( d) => ({ ...d }));
  const has = ( uid) => box.some(( d) => d.uid === uid);
  const flags = save.flags || {};
  return {
    cycle: (save.cycle || 1) + 1,
    name: save.name, gender: save.gender,
    box,
    dex: { seen: { ...((save.dex && save.dex.seen) || {}) }, caught: { ...((save.dex && save.dex.caught) || {}) } },
    items: { seal: 3, tonic: 5, candy: 0 },
    flags: { taken: {}, ...(flags.ach ? { ach: { ...flags.ach } } : {}), rejoin: (save.party || []).filter(has).slice(0, 2) },
  };
}
