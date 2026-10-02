





import { HOME } from './regions.js';
import { fromUV, toUV } from './sections.js';
import { VOLC, RIM } from './mapgen.js';
import * as ember from './regionMaps/emberTube.js';
import * as village from './regionMaps/kazanVillage.js';
import * as shrine from './regionMaps/shrineVillage.js';
import * as coast from './regionMaps/tomoCoast.js';
import * as shell from './regionMaps/shellhaven.js';

const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
const MOUTH = at(1.4, 48.8); 


const STEPS_TOP = at(0, 46.8);



const ROAD_END = at(-1.8, 85.5);
const SHRINE_AREA = { u: [-9, 9], v: [87.3, 101] };



const COAST_WEST = { u: [9.3, 24], v: [70, 81] }, COAST_SOUTH = { u: [9.3, 24], v: [81, 84.7] };
const COAST_ROAD = at(7.4, 78.3), CORAL_TOP = at(16.45, 86.4);



const SHELL_DOOR = at(12.8, 97.2), SHELL_BACK = at(13.4, 94.6);
export const DOORS = [
  { id: 'ember-in', region: HOME, at: MOUTH, to: ember.ID, toAt: ember.ENTRY, label: 'Enter the Ember Tube', after: 'initiated' },
  { id: 'ember-out', region: ember.ID, at: ember.ENTRY, to: HOME, toAt: MOUTH, label: 'Back to Mt. Kazan', after: null },
  { id: 'village-in', region: HOME, at: VOLC, r: RIM.r - 0.5, auto: true, to: village.ID, toAt: village.GATE, label: 'Kazan Village', after: null },
  { id: 'village-out', region: village.ID, at: village.GATE, to: HOME, toAt: STEPS_TOP, label: 'Down the mountain', after: null },
  { id: 'shrine-in', region: HOME, at: at(0, 94), area: SHRINE_AREA, auto: true, to: shrine.ID, toAt: shrine.GATE, label: 'Shrine Village', after: null },
  { id: 'coast-in', region: HOME, at: at(14, 77.8), area: COAST_WEST, auto: true, to: coast.ID, toAt: coast.ENTRY, label: 'Tomo Coast', after: null },
  { id: 'coast-in-south', region: HOME, at: at(16.5, 83), area: COAST_SOUTH, auto: true, to: coast.ID, toAt: coast.SOUTH_GATE, label: 'Tomo Coast', after: null },
  { id: 'coast-out', region: coast.ID, at: coast.ENTRY, to: HOME, toAt: COAST_ROAD, label: 'Back to the road', after: null },
  { id: 'coast-out-south', region: coast.ID, at: coast.SOUTH_GATE, to: HOME, toAt: CORAL_TOP, label: 'On to Coral Deep', after: null },
  { id: 'shellhaven-in', region: HOME, at: SHELL_DOOR, to: shell.ID, toAt: shell.ENTRY, label: 'Down into Shellhaven', after: null },
  { id: 'shellhaven-out', region: shell.ID, at: shell.ENTRY, to: HOME, toAt: SHELL_BACK, label: 'Up to Coral Deep', after: null },
  { id: 'shrine-out', region: shrine.ID, at: shrine.GATE, to: HOME, toAt: ROAD_END, label: 'Back up the road', after: null },
];
export const DOOR_R = 1.6; 
export const doorById = (id) => DOORS.find((d) => d.id === id) || null;

export function doorAt(flags, region, x, y, r = DOOR_R) {
  return DOORS.find((d) => d.region === region && (!d.after || (flags && flags[d.after])) && near(d, x, y, r)) || null;
}
function near(d, x, y, r) {
  if (!d.area) return Math.hypot(d.at.x - x, d.at.y - y) < (d.r || r);
  const [u, v] = toUV(x, y);
  return u >= d.area.u[0] && u <= d.area.u[1] && v >= d.area.v[0] && v <= d.area.v[1];
}
