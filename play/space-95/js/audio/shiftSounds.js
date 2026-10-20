















import { CUE_VARIANTS, cueFor, signalSounds } from './cues.js';
import { MUSIC_TRACKS } from './musicManifest.js';
import { SFX } from './sfxManifest.js';
import { SHIFT_EVENTS } from './shiftEvents.js';


export const SURFACE = {
  1: 'grass_blade',
  2: 'bark',
  3: 'dirt',
  4: 'dirt',
  5: 'leaf',
  6: 'grass_blade',
  7: 'grass_blade',
  8: 'honey',
  9: 'leaf',
  10: 'bark',
  11: 'plastic',
  12: 'metal',
  13: 'metal', 
  14: 'grass_blade', 
  15: 'silk', 
  16: 'dirt', 
  19: 'fur', 
}; 


const MUSIC = {
  1: 'orchard',
  2: 'canopy',
  3: 'orchard',
  4: 'underground',
  5: 'stripecat',
  6: 'windward',
  7: 'long-way-home',
  8: 'honeycomb',
  9: 'puddle-sea',
  10: 'gardener',
  11: 'desk',
  12: 'machine',
  13: 'crumb-express',
  14: 'night-bloom',
  15: 'silk-span',
  16: 'deep-burrow',
  17: 'dogfight', 
  18: 'kitchen', 
  19: 'stampede', 
  20: 'sovereign', 
};


export function levelMusic(level) {
  return [MUSIC[level.id ?? 0], 'main-theme'].filter(Boolean);
}


export function shiftTracks(level) {
  const own = levelMusic(level).find((id) => MUSIC_TRACKS.includes(id)) ?? 'main-theme';
  const boss = (level.entities ?? []).some((e) => e.kind === 'boss') && MUSIC_TRACKS.includes('boss-mini');
  return boss ? [own, 'boss-mini'] : [own];
}

const ALWAYS_EVENTS = [
  'jump',
  'mantle',
  'skid',
  'pit',
  'hurt',
  'bonk',
  'corner',
  'stomp',
  'kick',
  'defeat',
  'wallJump',
  'doubleJump',
  'pound',
  'ability',
  'checkpoint',
  'secret',
  'clear',
];
const ALWAYS_SOUNDS = ['land_soft', 'land_run', 'land_hard', 'bark_climb', 'bolt_beep_happy', 'bolt_beep_curious', 'bolt_boop'];

const delivered = ( n) => n in SFX;


function variantFits( type,  level) {
  if (type === 'fling') return (level.webs?.length ?? 0) > 0;
  
  if (type === 'maneSurf' && (level.entities ?? []).some((e) => e.kind === 'board' && e.surf)) return true;
  if (type === 'ploughHit') return (level.rafts ?? []).some((d) => d.plough);
  if (type === 'bonk' || type === 'maneSurf' || type === 'rideLine') return !!level.ride; 
  if (type === 'ability' || type === 'defeat') return (level.entities ?? []).some((e) => e.kind === 'tower' || e.grant === 'drill');
  return true;
}






export function shiftSounds(level) {
  const names = new Set(ALWAYS_SOUNDS);
  const surface = SURFACE[level.id ?? 0] ?? 'dirt';
  names.add(`footstep_${surface}_walk`).add(`footstep_${surface}_run`);
  for (const type of [...ALWAYS_EVENTS, ...(SHIFT_EVENTS[level.id ?? 0] ?? [])]) {
    const n = cueFor({ type }, delivered);
    if (n) names.add(n);
    for (const v of CUE_VARIANTS[type] ?? []) if (variantFits(type, level)) names.add(v);
  }
  if (level.ride) names.add('ruuma_paws'); 
  for (const e of level.entities ?? []) if (e.signals) for (const n of signalSounds(e, delivered)) names.add(n);
  return [...names].filter(delivered).sort();
}
