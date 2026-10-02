







import { RESPAWN } from './mapgen.js';
import { HOME, regionById } from './regions.js';
import * as testbed from './regionMaps/testbed.js';

export const PERCHES = [
  { id: 'kazan', region: HOME, name: 'Kazan Village', at: RESPAWN.kazan, opens: 'boss_ashlo', respawn: null },
  { id: 'shrine', region: HOME, name: 'Shrine Village', at: RESPAWN.shrine, opens: 'boss_ashlo', respawn: 'initiated' },
  
  { id: 'testbed', region: testbed.ID, name: 'Testbed Meadow', at: testbed.ENTRY, opens: null, respawn: null },
];
export const perchById = (id) => PERCHES.find((p) => p.id === id) || null;
export const VISIT_R = 3;     
export const PERCH_R = 2.4;   

const reachable = (p, dev) => dev || !!(regionById(p.region) || {}).reachable;

export function perchesOpen(flags = {}, { dev = false } = {}) {
  return PERCHES.filter((p) => (!p.opens || flags[p.opens]) && reachable(p, dev));
}
export const visited = (flags, id) => !!(flags && flags.perches && flags.perches[id]);

export function perchAt(region, x, y, r = VISIT_R) {
  let best = null, bd = r;
  for (const p of PERCHES) {
    if (p.region !== region) continue;
    const d = Math.hypot(p.at.x - x, p.at.y - y);
    if (d <= bd) { best = p; bd = d; }
  }
  return best;
}

export function visit(flags, region, x, y) {
  const p = perchAt(region, x, y);
  if (!p || visited(flags, p.id)) return null;
  (flags.perches || (flags.perches = {}))[p.id] = 1;
  return p.id;
}


export function destinations(flags, fromId, opts) {
  if (!perchesOpen(flags, opts).some((p) => p.id === fromId)) return [];
  return perchesOpen(flags, opts).filter((p) => p.id === fromId || visited(flags, p.id)).map((p) => ({ ...p, here: p.id === fromId }));
}

export const canFly = (flags, fromId, opts) => destinations(flags, fromId, opts).some((d) => !d.here);



export const FADE = 0.25, FLIGHT_MIN = 2.2;
export function flightPhase(t, ready) {
  if (t < FADE) return { phase: 'takeoff', k: t / FADE };
  if (!ready || t < FADE + FLIGHT_MIN) return { phase: 'fly', k: Math.min(1, (t - FADE) / FLIGHT_MIN) };
  return { phase: 'land', k: 1 };
}



export function respawnPoint(region, flags = {}, x = 0, y = 0) {
  let best = null, bd = Infinity;
  for (const p of PERCHES) {
    if (p.region !== region || (p.respawn && !flags[p.respawn])) continue;
    const d = Math.hypot(p.at.x - x, p.at.y - y);
    if (d < bd) { best = p.at; bd = d; }
  }
  const r = regionById(region) || regionById(HOME);
  return best || r.home;
}
