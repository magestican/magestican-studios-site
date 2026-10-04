







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
import * as frost from './regionMaps/frostspine.js';
import * as glacier from './regionMaps/glacierField.js';
import * as summit from './regionMaps/frozenMenagerie.js';

export const PERCHES = [
  
  
  { id: 'kazan', region: village.ID, name: 'Kazan Village', at: village.LANDING, opens: 'boss_ashlo', respawn: null },
  
  { id: 'shrine', region: shrine.ID, name: 'Shrine Village', at: shrine.LANDING, opens: 'boss_ashlo', respawn: 'initiated' },
  { id: 'tomo-coast', region: coast.ID, name: 'Tomo Coast', at: coast.LANDING, opens: 'boss_ashlo', respawn: null },
  
  { id: 'shellhaven', region: shell.ID, name: 'Shellhaven', at: shell.LANDING, opens: 'boss_ashlo', respawn: null },
  
  { id: 'kelp-maze', region: kelp.ID, name: 'Pearl Pool', at: kelp.POOL_LANDING, opens: 'boss_ashlo', respawn: null },
  
  { id: 'drowned-temple', region: temple.ID, name: 'Temple Pool', at: temple.POOL_LANDING, opens: 'boss_ashlo', respawn: null },
  
  { id: 'hollowroot', region: hollow.ID, name: 'Hollowroot', at: hollow.LANDING, opens: 'boss_leviathrum', respawn: null },
  
  { id: 'thornfield', region: thorn.ID, name: 'Meadow Pool', at: thorn.LANDING, opens: 'boss_leviathrum', respawn: null },
  
  { id: 'mother-hollow', region: mother.ID, name: 'Sap Pool', at: mother.SAP_LANDING, opens: 'boss_leviathrum', respawn: null },
  
  { id: 'vinegate', region: vine.ID, name: 'Vinegate Landing', at: vine.LANDING, opens: 'boss_bramble', respawn: null },
  
  { id: 'canopy-walk', region: canopy.ID, name: 'The Middle Storey', at: canopy.LANDING, opens: 'boss_bramble', respawn: null },
  { id: 'ruin-steps', region: ruin.ID, name: 'Temple Forecourt', at: ruin.LANDING, opens: 'boss_bramble', respawn: null },
  { id: 'obsidian-court', region: court.ID, name: 'The Glass Pool', at: court.POOL_LANDING, opens: 'boss_bramble', respawn: null },
  { id: 'fig-terraces', region: fig.ID, name: 'Terrace Landing', at: fig.LANDING, opens: 'boss_bramble', respawn: null },
  { id: 'gale-ledges', region: gale.ID, name: 'Cliff Top', at: gale.LANDING, opens: 'boss_bramble', respawn: null }, 
  
  { id: 'minehead', region: mine.ID, name: 'Minehead Camp', at: mine.LANDING, opens: 'boss_kingshade', respawn: null },
  { id: 'lantern-shaft', region: shaft.ID, name: 'The Seep', at: shaft.LANDING, opens: 'boss_kingshade', respawn: null },
  { id: 'deep-seam', region: seam.ID, name: 'The Seam Pool', at: seam.POOL_LANDING, opens: 'boss_kingshade', respawn: null },
  { id: 'frost-summit', region: summit.ID, name: 'The Summit', at: summit.LANDING, opens: 'boss_glacius', respawn: null },
  { id: 'frost-glacier', region: glacier.ID, name: 'The Glacier Field', at: glacier.LANDING, opens: 'boss_quartz', respawn: null },
  { id: 'frostspine', region: frost.ID, name: 'Base Camp', at: frost.LANDING, opens: 'boss_quartz', respawn: null },
  { id: 'echo-lake', region: echo.ID, name: 'Driftwick', at: echo.LANDING, opens: 'boss_kingshade', respawn: null },
  { id: 'geode-galleries', region: geode.ID, name: 'The Crystal Pool', at: geode.POOL_LANDING, opens: 'boss_kingshade', respawn: null },
  
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
