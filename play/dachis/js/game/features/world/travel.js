







import { RESPAWN } from './mapgen.js';
import { HOME, regionById } from './regions.js';
import * as testbed from './regionMaps/testbed.js';
import * as ember from './regionMaps/emberTube.js';
import * as village from './regionMaps/kazanVillage.js';
import * as shrine from './regionMaps/shrineVillage.js';
import * as coast from './regionMaps/tomoCoast.js';
import * as shell from './regionMaps/shellhaven.js';
import * as kelp from './regionMaps/kelpMaze.js';
import * as temple from './regionMaps/drownedTemple.js';

export const PERCHES = [
  
  
  { id: 'kazan', region: village.ID, name: 'Kazan Village', at: village.LANDING, opens: 'boss_ashlo', respawn: null },
  
  { id: 'shrine', region: shrine.ID, name: 'Shrine Village', at: shrine.LANDING, opens: 'boss_ashlo', respawn: 'initiated' },
  { id: 'tomo-coast', region: coast.ID, name: 'Tomo Coast', at: coast.LANDING, opens: 'boss_ashlo', respawn: null },
  
  { id: 'shellhaven', region: shell.ID, name: 'Shellhaven', at: shell.LANDING, opens: 'boss_ashlo', respawn: null },
  
  { id: 'kelp-maze', region: kelp.ID, name: 'Pearl Pool', at: kelp.POOL_LANDING, opens: 'boss_ashlo', respawn: null },
  
  { id: 'drowned-temple', region: temple.ID, name: 'Temple Pool', at: temple.POOL_LANDING, opens: 'boss_ashlo', respawn: null },
  
  { id: 'testbed', region: testbed.ID, name: 'Testbed Meadow', at: testbed.ENTRY, opens: null, respawn: null },
  { id: 'ember-tube', region: ember.ID, name: 'Ember Tube Spring', at: ember.ENTRY, opens: 'boss_ashlo', respawn: null },
];
export const perchById = (id) => PERCHES.find((p) => p.id === id) || null;



const WAKE_POINTS = [{ region: HOME, at: RESPAWN.kazan, respawn: null }, { region: HOME, at: RESPAWN.shrine, respawn: 'initiated' }];
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
  for (const p of [...PERCHES, ...WAKE_POINTS]) {
    if (p.region !== region || (p.respawn && !flags[p.respawn])) continue;
    const d = Math.hypot(p.at.x - x, p.at.y - y);
    if (d < bd) { best = p.at; bd = d; }
  }
  const r = regionById(region) || regionById(HOME);
  return best || r.home;
}
