
















export const ANIMAL_CALL = Object.freeze({
  cow: 'moo',
  pig: 'oink',
  chicken: 'cluck',
  sheep: 'bheee',
  
  
  
  
  goat: 'bleat',
  duck: 'quack',
  donkey: 'bray',
  goose: 'honk',
});





export const CALL_MOMENTS = Object.freeze({
  kill:  Object.freeze({ loudness: 1.0,  cooldownMs: 250 }),
  death: Object.freeze({ loudness: 1.0,  cooldownMs: 0 }),
  spawn: Object.freeze({ loudness: 0.55, cooldownMs: 0 }),

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  
  
  jump: Object.freeze({ loudness: 0.45, cooldownMs: 1200 }),

  
  
  
  peerDeath: Object.freeze({ loudness: 0.5, cooldownMs: 900 }),
});







export const PEER_HEARING_M = 45;

export function peerDeathLoudness(distance, base = CALL_MOMENTS.peerDeath.loudness) {
  if (!Number.isFinite(distance) || distance <= 0) return base;
  if (distance >= PEER_HEARING_M) return 0;
  return base * (1 - distance / PEER_HEARING_M);
}

export function callFor(character) {
  return ANIMAL_CALL[character] || null;
}

export function loudnessFor(moment) {
  return CALL_MOMENTS[moment]?.loudness ?? 1.0;
}

export function emptyVoiceState() {
  return { spawnedOnce: false, lastAt: {} };
}










export function shouldCall(state, moment, nowMs) {
  const cfg = CALL_MOMENTS[moment];
  if (!cfg || !state) return false;

  if (moment === 'spawn') {
    if (state.spawnedOnce) return false;
    state.spawnedOnce = true;
    return true;
  }

  state.lastAt = state.lastAt || {};
  const last = state.lastAt[moment] ?? -Infinity;
  if (nowMs - last < cfg.cooldownMs) return false;
  state.lastAt[moment] = nowMs;
  return true;
}

























export const ANIMAL_LEVEL = 2.6;

export const ANIMAL_TRIM = Object.freeze({
  cow: 1.00,
  pig: 0.90,       
  chicken: 1.05,
  sheep: 2.30,     
  
  
  
  
  
  
  
  
  
  
  goat: 1.78,
  duck: 1.35,
  donkey: 1.12,
  goose: 1.43,
});


export function voiceGain(character, loudness = 1.0) {
  return loudness * ANIMAL_LEVEL * (ANIMAL_TRIM[character] ?? 1);
}
