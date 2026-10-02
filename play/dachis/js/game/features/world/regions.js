








import { SECTIONS } from './sections.js';
import { MAP, SPAWN, RESPAWN } from './mapgen.js';

export const HOME = 'kazan-isle';
export const REGIONS = [
  {
    id: HOME, name: 'Kazan Isle', chapters: [1, 2, 3], size: MAP, interior: false, reachable: true,
    sections: SECTIONS.map((s) => s.id), entry: SPAWN, spring: RESPAWN.shrine, home: RESPAWN.kazan,
    pack: 'assets/scenery-forms.bin',
  },
  {
    id: 'testbed', name: 'Testbed', chapters: [], size: 32, interior: false, reachable: false,
    sections: ['testbed-a', 'testbed-b'], entry: { x: 16, y: 16 }, spring: { x: 16, y: 18 }, home: { x: 16, y: 16 },
    pack: null,
  },
];
export const regionById = (id) => REGIONS.find((r) => r.id === id) || null;

export function regionOf(sectionId) {
  const r = REGIONS.find((g) => g.sections.includes(sectionId));
  return r ? r.id : null;
}

export const saveRegion = (s) => (s && regionById(s.region) ? s.region : HOME);
