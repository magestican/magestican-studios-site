







import { SECTIONS } from './sections.js';
import { MAP, SPAWN, RESPAWN, generateMap } from './mapgen.js';
import * as testbed from './regionMaps/testbed.js';
import * as ember from './regionMaps/emberTube.js';
import * as village from './regionMaps/kazanVillage.js';
import * as shrine from './regionMaps/shrineVillage.js';

export const HOME = 'kazan-isle';
export const REGIONS = [
  {
    id: HOME, name: 'Kazan Isle', chapters: [1, 2, 3], size: MAP, interior: false, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: SPAWN, spring: RESPAWN.shrine, home: RESPAWN.kazan,
    pack: 'assets/scenery-forms.bin',
    
    
    transit: true, objective: null,
  },
  {
    id: testbed.ID, name: 'Testbed', chapters: [], size: testbed.SIZE, interior: false, reachable: false,
    sections: testbed.SECTIONS.map((s) => s.id), entry: testbed.ENTRY, spring: testbed.SPRING, home: testbed.ENTRY,
    pack: null,
    transit: false, objective: 'Walk the Long Meadow to the Far Field',
  },
  
  {
    id: ember.ID, name: 'Ember Tube', chapters: [1], size: ember.SIZE, interior: false, reachable: true,
    sections: ember.SECTIONS.map((s) => s.id), entry: ember.ENTRY, spring: ember.SPRING, home: ember.ENTRY,
    pack: null,
    transit: false, objective: 'Follow the torches through the Ember Tube',
  },
  
  
  {
    id: village.ID, name: 'Kazan Village', chapters: [1], size: village.SIZE, interior: false, reachable: true,
    sections: village.SECTIONS.map((s) => s.id), entry: village.GATE, spring: village.LANDING, home: village.SPAWN,
    pack: null,
    transit: false, objective: null,
  },
  
  {
    id: shrine.ID, name: 'Shrine Village', chapters: [1], size: shrine.SIZE, interior: false, reachable: true,
    sections: shrine.SECTIONS.map((s) => s.id), entry: shrine.GATE, spring: shrine.LANDING, home: shrine.LANDING,
    pack: null,
    transit: false, objective: null,
  },
];
export const regionById = (id) => REGIONS.find((r) => r.id === id) || null;

export function regionOf(sectionId) {
  const r = REGIONS.find((g) => g.sections.includes(sectionId));
  return r ? r.id : null;
}

export const saveRegion = (s) => (s && regionById(s.region) ? s.region : HOME);

const GENERATORS = { [HOME]: generateMap, [testbed.ID]: testbed.generateTestbed, [ember.ID]: ember.generateEmberTube, [village.ID]: village.generateKazanVillage, [shrine.ID]: shrine.generateShrineVillage };
export function generateRegion(id) { const g = GENERATORS[id]; if (!g) throw new Error('no map for region ' + id); return g(); }



const STEPS = { [testbed.ID]: testbed.testbedSteps, [ember.ID]: ember.emberTubeSteps, [village.ID]: village.kazanVillageSteps, [shrine.ID]: shrine.shrineVillageSteps };
export async function generateRegionSliced(id, slice) {
  if (!STEPS[id]) return generateRegion(id);
  const it = STEPS[id]();
  for (;;) { const s = it.next(); if (s.done) return s.value; await slice('map ' + id + ' ' + s.value); }
}


export function mapsToDrop(cached, current, regionCount = REGIONS.length) {
  if (regionCount <= 2) return [];
  return cached.filter((id) => id !== HOME && id !== current);
}
