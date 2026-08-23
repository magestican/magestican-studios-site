
















export const ANIMAL_CALL = Object.freeze({
  cow: 'moo',
  pig: 'oink',
  chicken: 'cluck',
  sheep: 'bheee',
});





export const CALL_MOMENTS = Object.freeze({
  kill:  Object.freeze({ loudness: 1.0,  cooldownMs: 250 }),
  death: Object.freeze({ loudness: 1.0,  cooldownMs: 0 }),
  spawn: Object.freeze({ loudness: 0.55, cooldownMs: 0 }),
});

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
