





import { HOME } from './regions.js';
import { fromUV, toUV } from './sections.js';
import { VOLC, RIM } from './mapgen.js';
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
import * as ruin from './regionMaps/ruinSteps.js';
import * as court from './regionMaps/obsidianCourt.js';
import * as galeMap from './regionMaps/galeLedges.js';
import * as mineMap from './regionMaps/minehead.js';
import * as shaftMap from './regionMaps/lanternShaft.js';
import * as seamMap from './regionMaps/deepSeam.js';
import * as geodeMap from './regionMaps/geodeGalleries.js';
import * as echoMap from './regionMaps/echoLake.js';
import * as frostMap from './regionMaps/frostspine.js';
import * as glacierMap from './regionMaps/glacierField.js';
import * as summitMap from './regionMaps/frozenMenagerie.js';
import * as heartMap from './regionMaps/heartOfKazan.js';
import * as galleriesMap from './regionMaps/magmaGalleries.js';
import * as vaultMap from './regionMaps/pyreVault.js';

const at = (u, v) => { const [x, y] = fromUV(u, v); return { x, y }; };
const MOUTH = at(1.4, 48.8); 


const STEPS_TOP = at(0, 46.8);



const ROAD_END = at(-1.8, 85.5);
const SHRINE_AREA = { u: [-9, 9], v: [87.3, 101] };



const COAST_WEST = { u: [9.3, 24], v: [70, 81] }, COAST_SOUTH = { u: [9.3, 24], v: [81, 84.7] };
const COAST_ROAD = at(7.4, 78.3), CORAL_TOP = at(16.45, 86.4);



const SHELL_DOOR = at(12.8, 97.2), SHELL_BACK = at(13.4, 94.6);

const TEMPLE_DOOR = at(14.5, 92.8), TEMPLE_BACK = at(16.4, 90.4);

const HOLLOW_DOOR = at(-17.6, 60.6), HOLLOW_BACK = at(-16.6, 62.4);



const VINE_NORTH = { u: [-9, 9], v: [26, 29.4] }, VINE_BACK = at(0.8, 31.5);
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
  { id: 'kelp-in', region: shell.ID, at: shell.EAST_GATE, to: kelp.ID, toAt: kelp.ENTRY, label: 'Into the Kelp Maze', after: null },
  { id: 'kelp-out', region: kelp.ID, at: kelp.ENTRY, to: shell.ID, toAt: shell.EAST_BACK, label: 'Back to Shellhaven', after: null },
  { id: 'temple-in', region: HOME, at: TEMPLE_DOOR, to: temple.ID, toAt: temple.ENTRY, label: 'Into the drowned temple', after: null },
  { id: 'temple-out', region: temple.ID, at: temple.ENTRY, to: HOME, toAt: TEMPLE_BACK, label: 'Back out to Coral Deep', after: null },
  { id: 'hollowroot-in', region: HOME, at: HOLLOW_DOOR, to: hollow.ID, toAt: hollow.ENTRY, label: 'Climb the ladder', after: null },
  { id: 'hollowroot-out', region: hollow.ID, at: hollow.ENTRY, to: HOME, toAt: HOLLOW_BACK, label: 'Climb down to the Verdant Wilds', after: null },
  { id: 'thorn-in', region: hollow.ID, at: hollow.SLIDE, to: thorn.ID, toAt: thorn.ENTRY, label: 'Ride the rope slide', after: null },
  { id: 'thorn-out', region: thorn.ID, at: thorn.ENTRY, to: hollow.ID, toAt: hollow.SLIDE_BACK, label: 'Climb back up', after: null },
  { id: 'hollow-in', region: hollow.ID, at: hollow.KNOT, to: mother.ID, toAt: mother.ENTRY, label: 'Down the knot-hole', after: null },
  { id: 'hollow-out', region: mother.ID, at: mother.ENTRY, to: hollow.ID, toAt: hollow.KNOT_BACK, label: 'Up to Hollowroot', after: null },
  { id: 'canopy-in', region: vine.ID, at: at(0.8, 29.0), area: VINE_NORTH, auto: true, to: canopy.ID, toAt: canopy.ENTRY, label: 'Up into the canopy', after: null },
  { id: 'canopy-out', region: canopy.ID, at: canopy.ENTRY, to: vine.ID, toAt: VINE_BACK, label: 'Down to Vinegate', after: null },
  
  { id: 'gale-in', region: 'vinegate', at: at(-7.0, 46.6), to: galeMap.ID, toAt: galeMap.ENTRY, label: 'Up the sea cliff', after: null },
  { id: 'gale-out', region: galeMap.ID, at: galeMap.ENTRY, to: 'vinegate', toAt: at(-4.6, 46.9), label: 'Down to the jetty', after: null },
  
  { id: 'shaft-in', region: mineMap.ID, at: mineMap.SHAFT_DOOR, to: shaftMap.ID, toAt: shaftMap.ENTRY, label: 'Down the shaft', after: null },
  { id: 'shaft-out', region: shaftMap.ID, at: shaftMap.ENTRY, to: mineMap.ID, toAt: mineMap.SHAFT_BACK, label: 'Up to the camp', after: null },
  { id: 'seam-in', region: shaftMap.ID, at: shaftMap.END, to: seamMap.ID, toAt: seamMap.ENTRY, label: 'Through the crack', after: null },
  { id: 'seam-out', region: seamMap.ID, at: seamMap.ENTRY, to: shaftMap.ID, toAt: shaftMap.END_BACK, label: 'Back to the shaft', after: null },
  { id: 'geode-in', region: mineMap.ID, at: mineMap.GEODE_DOOR, to: geodeMap.ID, toAt: geodeMap.ENTRY, label: 'Into the crystal', after: null },
  { id: 'glacier-in', region: frostMap.ID, at: frostMap.EXIT, to: glacierMap.ID, toAt: glacierMap.ENTRY, label: 'On to the glacier', after: null },
  { id: 'glacier-out', region: glacierMap.ID, at: glacierMap.ENTRY, to: frostMap.ID, toAt: frostMap.BACK, label: 'Back to the pass', after: null },
  { id: 'menagerie-in', region: glacierMap.ID, at: glacierMap.NORTH, to: summitMap.ID, toAt: summitMap.ENTRY, label: 'Into the Menagerie', after: null },
  { id: 'menagerie-out', region: summitMap.ID, at: summitMap.ENTRY, to: glacierMap.ID, toAt: glacierMap.NORTH_BACK, label: 'Out to the hollow', after: null },
  
  { id: 'heart-in', region: village.ID, at: at(-7.4, 33.0), to: heartMap.ID, toAt: heartMap.ENTRY, label: 'Down the crater', after: 'boss_glacius' },
  { id: 'heart-out', region: heartMap.ID, at: heartMap.ENTRY, to: village.ID, toAt: at(-10.4, 33.2), label: 'Up to the village', after: null },
  { id: 'galleries-in', region: heartMap.ID, at: heartMap.EXIT, to: galleriesMap.ID, toAt: galleriesMap.ENTRY, label: 'Into the galleries', after: null },
  { id: 'galleries-out', region: galleriesMap.ID, at: galleriesMap.ENTRY, to: heartMap.ID, toAt: heartMap.BACK, label: 'Back to the forge', after: null },
  { id: 'vault-in', region: galleriesMap.ID, at: galleriesMap.SOUTH, to: vaultMap.ID, toAt: vaultMap.ENTRY, label: 'Down to the vault', after: null },
  { id: 'vault-out', region: vaultMap.ID, at: vaultMap.ENTRY, to: galleriesMap.ID, toAt: galleriesMap.SOUTH_BACK, label: 'Out to the rivers', after: null },
  { id: 'echo-in', region: geodeMap.ID, at: geodeMap.ECHO_DOOR, to: echoMap.ID, toAt: echoMap.ENTRY, label: 'Down to the lake', after: null },
  { id: 'echo-out', region: echoMap.ID, at: echoMap.ENTRY, to: geodeMap.ID, toAt: geodeMap.ECHO_BACK, label: 'Up to the crystal', after: null },
  { id: 'geode-out', region: geodeMap.ID, at: geodeMap.ENTRY, to: mineMap.ID, toAt: mineMap.GEODE_BACK, label: 'Back to the camp', after: null },
  { id: 'fig-in', region: canopy.ID, at: canopy.EXIT, to: fig.ID, toAt: fig.ENTRY, label: 'On to the terraces', after: null },
  { id: 'fig-out', region: fig.ID, at: fig.ENTRY, to: canopy.ID, toAt: canopy.EXIT_BACK, label: 'Back to the canopy', after: null },
  { id: 'ruin-in', region: fig.ID, at: fig.EXIT, to: ruin.ID, toAt: ruin.ENTRY, label: 'Up to the ruins', after: null },
  { id: 'ruin-out', region: ruin.ID, at: ruin.ENTRY, to: fig.ID, toAt: fig.EXIT_BACK, label: 'Down to the terraces', after: null },
  { id: 'court-in', region: ruin.ID, at: ruin.EXIT, to: court.ID, toAt: court.ENTRY, label: 'Through the black gate', after: null },
  { id: 'court-out', region: court.ID, at: court.ENTRY, to: ruin.ID, toAt: ruin.EXIT_BACK, label: 'Out to the steps', after: null },
  { id: 'shrine-out', region: shrine.ID, at: shrine.GATE, to: HOME, toAt: ROAD_END, label: 'Back up the road', after: null },
];
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
