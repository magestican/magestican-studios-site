





import { HOME } from './regions.js';
import { toUV } from './sections.js';
import { rowsOf } from './manifests.js';




export const DOORS = rowsOf('doors');
export const DOOR_R = 1.6; 
export const doorById = (id) => DOORS.find((d) => d.id === id) || null;






export function walkThrough(st, map, door) {
  if (st.map !== map) { st.map = map; st.held = door; return null; } 
  if (!door) { st.held = null; return null; }
  return door === st.held ? null : door;
}


export const opensBeforeStarter = (d) => d.region !== HOME || d.id === 'village-in';
export function doorAt(flags, region, x, y, r = DOOR_R) {
  return DOORS.find((d) => d.region === region && (!d.after || (flags && flags[d.after])) && (opensBeforeStarter(d) || (flags && flags.starter)) && near(d, x, y, r)) || null;
}
function near(d, x, y, r) {
  if (!d.area) return Math.hypot(d.at.x - x, d.at.y - y) < (d.r || r);
  const [u, v] = toUV(x, y);
  return u >= d.area.u[0] && u <= d.area.u[1] && v >= d.area.v[0] && v <= d.area.v[1];
}
