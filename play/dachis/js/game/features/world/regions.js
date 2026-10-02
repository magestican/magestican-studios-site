







import { SECTIONS } from './sections.js';
import { MAP, SPAWN, RESPAWN, generateMap } from './mapgen.js';
import * as testbed from './regionMaps/testbed.js';

export const HOME = 'kazan-isle';
export const REGIONS = [
  {
    id: HOME, name: 'Kazan Isle', chapters: [1, 2, 3], size: MAP, interior: false, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: SPAWN, spring: RESPAWN.shrine, home: RESPAWN.kazan,
    pack: 'assets/scenery-forms.bin',
  },
  {
    id: testbed.ID, name: 'Testbed', chapters: [], size: testbed.SIZE, interior: false, reachable: false,
    sections: testbed.SECTIONS.map((s) => s.id), entry: testbed.ENTRY, spring: testbed.SPRING, home: testbed.ENTRY,
    pack: null,
  },
];
export const regionById = (id) => REGIONS.find((r) => r.id === id) || null;

export function regionOf(sectionId) {
  const r = REGIONS.find((g) => g.sections.includes(sectionId));
  return r ? r.id : null;
}

export const saveRegion = (s) => (s && regionById(s.region) ? s.region : HOME);

const GENERATORS = { [HOME]: generateMap, [testbed.ID]: testbed.generateTestbed };
export function generateRegion(id) { const g = GENERATORS[id]; if (!g) throw new Error('no map for region ' + id); return g(); }
