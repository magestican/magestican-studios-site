







import { SECTIONS } from './sections.js';
import { MAP, SPAWN, RESPAWN, generateMap } from './mapgen.js';
import * as testbed from './regionMaps/testbed.js';
import * as ember from './regionMaps/emberTube.js';
import * as village from './regionMaps/kazanVillage.js';
import * as shrine from './regionMaps/shrineVillage.js';
import * as coast from './regionMaps/tomoCoast.js';
import * as shell from './regionMaps/shellhaven.js';
import * as kelp from './regionMaps/kelpMaze.js';
import * as temple from './regionMaps/drownedTemple.js';

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
  
  {
    id: coast.ID, name: 'Tomo Coast', chapters: [1, 2], size: coast.SIZE, interior: false, reachable: true,
    sections: coast.SECTIONS.map((s) => s.id), entry: coast.ENTRY, spring: coast.LANDING, home: coast.LANDING,
    pack: null,
    transit: false, objective: null,
  },
  
  
  {
    id: shell.ID, name: 'Shellhaven', chapters: [2], size: shell.SIZE, interior: false, reachable: true,
    sections: shell.SECTIONS.map((s) => s.id), entry: shell.ENTRY, spring: shell.LANDING, home: shell.LANDING,
    pack: null,
    transit: false, objective: null,
  },
  
  {
    id: kelp.ID, name: 'The Kelp Maze', chapters: [2], size: kelp.SIZE, interior: false, reachable: true,
    sections: kelp.SECTIONS.map((s) => s.id), entry: kelp.ENTRY, spring: kelp.POOL_LANDING, home: kelp.ENTRY,
    pack: null,
    transit: false, objective: 'Find the pearl pool at the far end of the Kelp Maze',
  },
  
  {
    id: temple.ID, name: 'The Drowned Temple', chapters: [2], size: temple.SIZE, interior: true, reachable: true,
    sections: temple.SECTIONS.map((s) => s.id), entry: temple.ENTRY, spring: temple.POOL_LANDING, home: temple.ENTRY,
    pack: null,
    transit: false, objective: 'Follow the aisle to the singing altar',
  },
];
export const regionById = (id) => REGIONS.find((r) => r.id === id) || null;

export function regionOf(sectionId) {
  const r = REGIONS.find((g) => g.sections.includes(sectionId));
  return r ? r.id : null;
}

export const saveRegion = (s) => (s && regionById(s.region) ? s.region : HOME);

const GENERATORS = { [HOME]: generateMap, [testbed.ID]: testbed.generateTestbed, [ember.ID]: ember.generateEmberTube, [village.ID]: village.generateKazanVillage, [shrine.ID]: shrine.generateShrineVillage, [coast.ID]: coast.generateTomoCoast, [shell.ID]: shell.generateShellhaven, [kelp.ID]: kelp.generateKelpMaze, [temple.ID]: temple.generateDrownedTemple };
export function generateRegion(id) { const g = GENERATORS[id]; if (!g) throw new Error('no map for region ' + id); return g(); }



const STEPS = { [testbed.ID]: testbed.testbedSteps, [ember.ID]: ember.emberTubeSteps, [village.ID]: village.kazanVillageSteps, [shrine.ID]: shrine.shrineVillageSteps, [coast.ID]: coast.tomoCoastSteps, [shell.ID]: shell.shellhavenSteps, [kelp.ID]: kelp.kelpMazeSteps, [temple.ID]: temple.drownedTempleSteps };
export async function generateRegionSliced(id, slice) {
  if (!STEPS[id]) return generateRegion(id);
  const it = STEPS[id]();
  for (;;) { const s = it.next(); if (s.done) return s.value; await slice('map ' + id + ' ' + s.value); }
}


export function mapsToDrop(cached, current, regionCount = REGIONS.length) {
  if (regionCount <= 2) return [];
  return cached.filter((id) => id !== HOME && id !== current);
}
