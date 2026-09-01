
































import { readyWeapon } from './weapons.js';



export const RECOVERIES = Object.freeze([
  { id: 'boltDriver', atDeck: 1 },
  { id: 'cattleProd', atDeck: 2 },
  { id: 'flareGun', atDeck: 5 },
  { id: 'grainAuger', atDeck: 9 },
]);


export function unlockedAt(level) {
  return RECOVERIES.filter((r) => level >= r.atDeck).map((r) => r.id);
}


export function recoveredAt(level) {
  const r = RECOVERIES.find((x) => x.atDeck === level);
  return r && r.atDeck > 1 ? r.id : null;
}





export function createBench() {
  return { stored: {} };
}




const FIRST_LOAD = Object.freeze({
  boltDriver: 48, cattleProd: 0, flareGun: 10, grainAuger: 60,
});


export function stockBench(bench, level, carriedId) {
  const n = { stored: { ...bench.stored } };
  for (const id of unlockedAt(level)) {
    if (id !== carriedId && !(id in n.stored)) {
      n.stored[id] = readyWeapon(id, { ammo: FIRST_LOAD[id] ?? 0 });
    }
  }
  return n;
}


export function benchOffers(bench) {
  return RECOVERIES.map((r) => r.id).filter((id) => id in bench.stored);
}








export function nextOffer(bench, carriedId) {
  const order = RECOVERIES.map((r) => r.id);
  const offers = benchOffers(bench);
  if (!offers.length) return null;
  const at = order.indexOf(carriedId);
  const after = offers.find((id) => order.indexOf(id) > at);
  return after ?? offers[0];
}







export function benchSwap(bench, carried, takeId) {
  if (!(takeId in bench.stored)) return { bench, weapon: carried };
  const stored = { ...bench.stored };
  const weapon = stored[takeId];
  delete stored[takeId];
  stored[carried.id] = carried;
  return { bench: { stored }, weapon };
}
