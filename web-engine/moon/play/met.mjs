































export const MET_CAT = 'cat';

export const MET_MOLE = 'mole';


export const villagerKey = (id) => `villager:${id}`;

export { guestKey } from './guests.mjs';

const ok = (k) => typeof k === 'string' && k.length > 0 && k.length <= 40;


export function readMet(list) {
  return new Set(Array.isArray(list) ? list.filter(ok) : []);
}


export function metList(met) {
  return [...(met || [])].filter(ok).sort();
}


export const hasMet = (met, key) => Boolean(met && met.has(key));





export function meet(met, key) {
  if (!met || !ok(key)) return false;
  if (met.has(key)) return false;
  met.add(key);
  return true;
}


export const visitsOf = (met, key) => (hasMet(met, key) ? 1 : 0);
