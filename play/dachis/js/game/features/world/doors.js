




import { HOME } from './regions.js';
import { fromUV } from './sections.js';
import * as ember from './regionMaps/emberTube.js';

const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
const MOUTH = at(1.4, 48.8); 
export const DOORS = [
  { id: 'ember-in', region: HOME, at: MOUTH, to: ember.ID, toAt: ember.ENTRY, label: 'Enter the Ember Tube', after: 'initiated' },
  { id: 'ember-out', region: ember.ID, at: ember.ENTRY, to: HOME, toAt: MOUTH, label: 'Back to Mt. Kazan', after: null },
];
export const DOOR_R = 1.6; 
export const doorById = (id) => DOORS.find((d) => d.id === id) || null;

export function doorAt(flags, region, x, y, r = DOOR_R) {
  return DOORS.find((d) => d.region === region && (!d.after || (flags && flags[d.after])) && Math.hypot(d.at.x - x, d.at.y - y) < r) || null;
}
