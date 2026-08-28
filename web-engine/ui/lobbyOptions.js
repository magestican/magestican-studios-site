



























export const OPTION_ON = '1';
export const OPTION_OFF = '0';

export const LOBBY_OPTIONS = Object.freeze([
  Object.freeze({
    id: 'gore',
    
    
    
    
    
    key: 'tb.mature',
    name: 'Gore',
    why: 'Red voxel blood, and the announcer gets meaner.',
    
    
    
    fallback: false,
  }),
  Object.freeze({
    id: 'muted',
    key: 'tb.muted',
    name: 'Mute everything',
    why: 'Silences the weapons, the announcer and the music.',
    fallback: false,
  }),
  Object.freeze({
    id: 'reducedMotion',
    key: 'tb.reducedMotion',
    name: 'Reduced motion',
    
    
    
    
    
    why: 'Stops explosions shaking the camera.',
    fallback: false,
  }),
]);

export const OPTION_IDS = Object.freeze(LOBBY_OPTIONS.map((o) => o.id));

export function optionById(id) {
  return LOBBY_OPTIONS.find((o) => o.id === id) || null;
}






export function readOption(store, id) {
  const opt = optionById(id);
  if (!opt) return false;
  const raw = store?.getItem?.(opt.key);
  if (raw == null) return opt.fallback;
  return raw === OPTION_ON;
}

export function writeOption(store, id, on) {
  const opt = optionById(id);
  if (!opt) return false;
  store?.setItem?.(opt.key, on ? OPTION_ON : OPTION_OFF);
  return !!on;
}


export function readAllOptions(store) {
  const out = {};
  for (const o of LOBBY_OPTIONS) out[o.id] = readOption(store, o.id);
  return out;
}
