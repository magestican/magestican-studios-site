







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
import * as hollow from './regionMaps/hollowroot.js';
import * as thorn from './regionMaps/thornfield.js';
import * as mother from './regionMaps/motherHollow.js';
import * as vine from './regionMaps/vinegate.js';
import * as canopy from './regionMaps/canopyWalk.js';
import * as fig from './regionMaps/figTerraces.js';
import * as gale from './regionMaps/galeLedges.js';
import * as ruin from './regionMaps/ruinSteps.js';
import * as court from './regionMaps/obsidianCourt.js';
import * as mine from './regionMaps/minehead.js';
import * as shaft from './regionMaps/lanternShaft.js';
import * as seam from './regionMaps/deepSeam.js';
import * as geode from './regionMaps/geodeGalleries.js';
import * as echo from './regionMaps/echoLake.js';

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
    pack: 'assets/scenery-kazan-village.bin', 
    transit: false, objective: null,
  },
  
  {
    id: shrine.ID, name: 'Shrine Village', chapters: [1], size: shrine.SIZE, interior: false, reachable: true,
    sections: shrine.SECTIONS.map((s) => s.id), entry: shrine.GATE, spring: shrine.LANDING, home: shrine.LANDING,
    pack: 'assets/scenery-shrine-village.bin', 
    transit: false, objective: null,
  },
  
  {
    id: coast.ID, name: 'Tomo Coast', chapters: [1, 2], size: coast.SIZE, interior: false, reachable: true,
    sections: coast.SECTIONS.map((s) => s.id), entry: coast.ENTRY, spring: coast.LANDING, home: coast.LANDING,
    pack: 'assets/scenery-tomo-coast.bin', 
    transit: false, objective: null,
  },
  
  
  {
    id: shell.ID, name: 'Shellhaven', chapters: [2], size: shell.SIZE, interior: false, reachable: true,
    sections: shell.SECTIONS.map((s) => s.id), entry: shell.ENTRY, spring: shell.LANDING, home: shell.LANDING,
    pack: 'assets/scenery-shellhaven.bin', 
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
  
  
  {
    id: hollow.ID, name: 'Hollowroot', chapters: [3], size: hollow.SIZE, interior: false, reachable: true,
    sections: hollow.SECTIONS.map((s) => s.id), entry: hollow.ENTRY, spring: hollow.LANDING, home: hollow.LANDING,
    pack: 'assets/scenery-hollowroot.bin', 
    transit: false, objective: null,
  },
  
  
  {
    id: thorn.ID, name: 'Thornfield', chapters: [3], size: thorn.SIZE, interior: false, reachable: true,
    sections: thorn.SECTIONS.map((s) => s.id), entry: thorn.ENTRY, spring: thorn.LANDING, home: thorn.ENTRY,
    pack: null,
    transit: false, objective: 'Follow the garden path down the terraces to the meadow pool',
  },
  
  {
    id: mother.ID, name: 'The Mother Tree', chapters: [3], size: mother.SIZE, interior: true, reachable: true,
    sections: mother.SECTIONS.map((s) => s.id), entry: mother.ENTRY, spring: mother.SAP_LANDING, home: mother.ENTRY,
    pack: null,
    transit: false, objective: 'Follow the way down through the tree to its first seed',
  },
  
  
  {
    id: vine.ID, name: 'Vinegate Landing', chapters: [4], size: vine.SIZE, interior: false, reachable: true,
    sections: vine.SECTIONS.map((s) => s.id), entry: vine.ENTRY, spring: vine.LANDING, home: vine.LANDING,
    pack: 'assets/scenery-vinegate.bin', 
    transit: false, objective: null,
  },
  
  {
    id: canopy.ID, name: 'The Canopy Walk', chapters: [4], size: canopy.SIZE, interior: false, reachable: true,
    sections: canopy.SECTIONS.map((s) => s.id), entry: canopy.ENTRY, spring: canopy.LANDING, home: canopy.ENTRY,
    pack: null, 
    transit: false, objective: 'Cross the rope bridges to the high crown',
  },
  
  {
    id: fig.ID, name: 'The Fig Terraces', chapters: [4], size: fig.SIZE, interior: false, reachable: true,
    sections: fig.SECTIONS.map((s) => s.id), entry: fig.ENTRY, spring: fig.LANDING, home: fig.ENTRY,
    pack: null,
    transit: false, objective: 'Follow the dikes down to the temple steps',
  },
  
  {
    id: gale.ID, name: 'The Gale Ledges', chapters: [4], size: gale.SIZE, interior: false, reachable: true,
    sections: gale.SECTIONS.map((s) => s.id), entry: gale.ENTRY, spring: gale.LANDING, home: gale.ENTRY,
    pack: null, 
    transit: false, objective: 'Train on the ledges - hide from the gusts behind the crags',
  },
  
  {
    id: ruin.ID, name: 'The Ruin Steps', chapters: [4], size: ruin.SIZE, interior: false, reachable: true,
    sections: ruin.SECTIONS.map((s) => s.id), entry: ruin.ENTRY, spring: ruin.LANDING, home: ruin.ENTRY,
    pack: null,
    transit: false, objective: 'Climb the switchbacks to the black gate',
  },
  
  {
    id: court.ID, name: 'The Obsidian Court', chapters: [4], size: court.SIZE, interior: true, reachable: true,
    sections: court.SECTIONS.map((s) => s.id), entry: court.ENTRY, spring: court.POOL_LANDING, home: court.ENTRY,
    pack: null,
    transit: false, objective: null,
  },
  
  
  {
    id: mine.ID, name: 'Minehead Camp', chapters: [5], size: mine.SIZE, interior: false, reachable: true,
    sections: mine.SECTIONS.map((s) => s.id), entry: mine.ENTRY, spring: mine.LANDING, home: mine.LANDING,
    pack: 'assets/scenery-minehead.bin', 
    transit: false, objective: 'Wind down the ledge to the shaft',
  },
  
  {
    id: shaft.ID, name: 'The Lantern Shaft', chapters: [5], size: shaft.SIZE, interior: true, reachable: true,
    sections: shaft.SECTIONS.map((s) => s.id), entry: shaft.ENTRY, spring: shaft.LANDING, home: shaft.ENTRY,
    pack: null,
    transit: false, objective: 'Light the lanterns down the shaft',
  },
  
  {
    id: seam.ID, name: 'The Deep Seam', chapters: [5], size: seam.SIZE, interior: true, reachable: true,
    sections: seam.SECTIONS.map((s) => s.id), entry: seam.ENTRY, spring: seam.POOL_LANDING, home: seam.ENTRY,
    pack: null,
    transit: false, objective: 'Light every lantern - the chains drop',
  },
  
  {
    id: geode.ID, name: 'The Geode Galleries', chapters: [5], size: geode.SIZE, interior: true, reachable: true,
    sections: geode.SECTIONS.map((s) => s.id), entry: geode.ENTRY, spring: geode.POOL_LANDING, home: geode.ENTRY,
    pack: 'assets/scenery-geode-galleries.bin', 
    transit: false, objective: 'Turn the mirrors - bring the light to the crystal',
  },
  
  {
    id: echo.ID, name: 'Echo Lake', chapters: [5], size: echo.SIZE, interior: true, reachable: true,
    sections: echo.SECTIONS.map((s) => s.id), entry: echo.ENTRY, spring: echo.LANDING, home: echo.LANDING,
    pack: 'assets/scenery-echo-lake.bin', 
    transit: false, objective: 'Take a raft out to the islands',
  },
];
export const regionById = (id) => REGIONS.find((r) => r.id === id) || null;

export function regionOf(sectionId) {
  const r = REGIONS.find((g) => g.sections.includes(sectionId));
  return r ? r.id : null;
}

export const saveRegion = (s) => (s && regionById(s.region) ? s.region : HOME);

const GENERATORS = { [HOME]: generateMap, [testbed.ID]: testbed.generateTestbed, [ember.ID]: ember.generateEmberTube, [village.ID]: village.generateKazanVillage, [shrine.ID]: shrine.generateShrineVillage, [coast.ID]: coast.generateTomoCoast, [shell.ID]: shell.generateShellhaven, [kelp.ID]: kelp.generateKelpMaze, [temple.ID]: temple.generateDrownedTemple, [hollow.ID]: hollow.generateHollowroot, [thorn.ID]: thorn.generateThornfield, [mother.ID]: mother.generateMotherHollow, [vine.ID]: vine.generateVinegate, [canopy.ID]: canopy.generateCanopyWalk, [fig.ID]: fig.generateFigTerraces, [gale.ID]: gale.generateGaleLedges, [ruin.ID]: ruin.generateRuinSteps, [court.ID]: court.generateObsidianCourt, [mine.ID]: mine.generateMinehead, [shaft.ID]: shaft.generateLanternShaft, [seam.ID]: seam.generateDeepSeam, [geode.ID]: geode.generateGeodeGalleries, [echo.ID]: echo.generateEchoLake };
export function generateRegion(id) { const g = GENERATORS[id]; if (!g) throw new Error('no map for region ' + id); return g(); }



const STEPS = { [testbed.ID]: testbed.testbedSteps, [ember.ID]: ember.emberTubeSteps, [village.ID]: village.kazanVillageSteps, [shrine.ID]: shrine.shrineVillageSteps, [coast.ID]: coast.tomoCoastSteps, [shell.ID]: shell.shellhavenSteps, [kelp.ID]: kelp.kelpMazeSteps, [temple.ID]: temple.drownedTempleSteps, [hollow.ID]: hollow.hollowrootSteps, [thorn.ID]: thorn.thornfieldSteps, [mother.ID]: mother.motherHollowSteps, [vine.ID]: vine.vinegateSteps, [canopy.ID]: canopy.canopyWalkSteps, [fig.ID]: fig.figTerracesSteps, [gale.ID]: gale.galeLedgesSteps, [ruin.ID]: ruin.ruinStepsSteps, [court.ID]: court.obsidianCourtSteps, [mine.ID]: mine.mineheadSteps, [shaft.ID]: shaft.lanternShaftSteps, [seam.ID]: seam.deepSeamSteps, [geode.ID]: geode.geodeGalleriesSteps, [echo.ID]: echo.echoLakeSteps };
export async function generateRegionSliced(id, slice) {
  if (!STEPS[id]) return generateRegion(id);
  const it = STEPS[id]();
  for (;;) { const s = it.next(); if (s.done) return s.value; await slice('map ' + id + ' ' + s.value); }
}


export function mapsToDrop(cached, current, regionCount = REGIONS.length) {
  if (regionCount <= 2) return [];
  return cached.filter((id) => id !== HOME && id !== current);
}
