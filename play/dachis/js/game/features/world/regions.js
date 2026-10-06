







import { SECTIONS } from './sections.js';
import { MAP, SPAWN, RESPAWN, generateMap, HOME } from './mapgen.js';
import { MANIFESTS } from './manifests.js';
import { dressLairs } from './lairDressing.js';

export { HOME };
export const REGIONS = [
  {
    id: HOME, name: 'Kazan Isle', chapters: [1, 2, 3], size: MAP, interior: false, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: SPAWN, spring: RESPAWN.shrine, home: RESPAWN.kazan,
    pack: 'assets/scenery-forms.bin',
    
    
    transit: true, objective: null,
  },
];
REGIONS.push(...MANIFESTS.map((m) => m.region)); 
export const regionById = (id) => REGIONS.find((r) => r.id === id) || null;

export function regionOf(sectionId) {
  const r = REGIONS.find((g) => g.sections.includes(sectionId));
  return r ? r.id : null;
}

export const saveRegion = (s) => (s && regionById(s.region) ? s.region : HOME);

export const GENERATORS = { [HOME]: generateMap, ...Object.fromEntries(MANIFESTS.map((m) => [m.region.id, m.generate])) };

export function generateRegion(id) { const g = GENERATORS[id]; if (!g) throw new Error('no map for region ' + id); const W = g(); dressLairs(W, id, HOME); return W; }



export const STEPS = Object.fromEntries(MANIFESTS.filter((m) => m.steps).map((m) => [m.region.id, m.steps]));
export async function generateRegionSliced(id, slice) {
  if (!STEPS[id]) return generateRegion(id);
  const it = STEPS[id]();
  for (;;) { const s = it.next(); if (s.done) { dressLairs(s.value, id, HOME); return s.value; } await slice('map ' + id + ' ' + s.value); }
}


export function mapsToDrop(cached, current, regionCount = REGIONS.length) {
  if (regionCount <= 2) return [];
  return cached.filter((id) => id !== HOME && id !== current);
}
