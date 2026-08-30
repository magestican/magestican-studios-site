
















export const POWER_UP_MS = 20_000;      








export const CAPSULE_HALF_HEIGHT = 0.65;   
export const CAPSULE_RADIUS      = 0.32;   
export const EYE_OFFSET          = 0.55;   
export const BASE_HIT_RADIUS     = 0.7;    


export const PLAYER_HEIGHT_M = 2 * (CAPSULE_HALF_HEIGHT + CAPSULE_RADIUS);

export const EYE_HEIGHT_M = CAPSULE_HALF_HEIGHT + CAPSULE_RADIUS + EYE_OFFSET;




export const DOORWAY_CLEARANCE_M = 2.0;





export const MIN_CAPSULE_RADIUS      = 0.14;   
export const MIN_CAPSULE_HALF_HEIGHT = 0.16;
export const MIN_HIT_SCALE           = 0.6;    
export const EYE_CEILING_GAP         = 0.35;   




export const POWER_UPS = Object.freeze({
  'protein-shake': Object.freeze({
    id: 'protein-shake',
    zone: 'gym',
    name: 'PROTEIN SHAKE',
    hud: 'GIANT',
    emoji: '🥤',
    tint: 0xff5fa2,
    blurb: 'Twice the size for 20 seconds — and twice the target.',
    visualScale: 2.0,
    fireRateMul: 1.0,
  }),
  'cheese-wheel': Object.freeze({
    id: 'cheese-wheel',
    zone: 'dairy',
    name: 'CHEESE WHEEL',
    hud: 'MINI',
    emoji: '🧀',
    tint: 0xf0b429,
    blurb: 'Knee-high and 40% faster on the trigger for 20 seconds.',
    
    visualScale: 0.2,
    
    
    fireRateMul: 1.4,
  }),
});

export const POWER_UP_IDS = Object.freeze(Object.keys(POWER_UPS));
























export function capsuleFor(scale) {
  const radius = Math.max(MIN_CAPSULE_RADIUS, CAPSULE_RADIUS * scale);
  const roomForHalf = (PLAYER_HEIGHT_M - 2 * radius) / 2;
  const halfHeight = Math.max(
    MIN_CAPSULE_HALF_HEIGHT,
    Math.min(CAPSULE_HALF_HEIGHT * scale, roomForHalf),
  );
  return { halfHeight, radius, total: 2 * (halfHeight + radius) };
}




export function centreKeepingFeet(centreY, oldTotal, newTotal) {
  return centreY - oldTotal / 2 + newTotal / 2;
}









export function eyeHeightFor(scale, headroom = Infinity) {
  const want = EYE_HEIGHT_M * scale;
  if (!Number.isFinite(headroom)) return want;
  const cap = Math.max(EYE_HEIGHT_M * 0.35, headroom - EYE_CEILING_GAP);
  return Math.min(want, cap);
}



export function hitRadiusFor(scale) {
  return BASE_HIT_RADIUS * Math.max(scale, MIN_HIT_SCALE);
}




export function emptyPowerUpState() {
  return { id: null, endsAt: 0 };
}






export function applyPowerUp(state, id, nowMs) {
  if (!POWER_UPS[id]) return state;
  return { id, endsAt: nowMs + POWER_UP_MS };
}


export function expirePowerUp(state, nowMs) {
  if (state.id && nowMs >= state.endsAt) {
    return { state: emptyPowerUpState(), expired: state.id };
  }
  return { state, expired: null };
}




export function clearOnDeath() {
  return emptyPowerUpState();
}

export function remainingMs(state, nowMs) {
  return state.id ? Math.max(0, state.endsAt - nowMs) : 0;
}


export function remainingSeconds(state, nowMs) {
  return Math.ceil(remainingMs(state, nowMs) / 1000);
}

export function activeDef(state) {
  return state && state.id ? POWER_UPS[state.id] : null;
}

export function scaleFor(state) {
  return activeDef(state)?.visualScale ?? 1;
}

export function fireRateMulFor(state) {
  return activeDef(state)?.fireRateMul ?? 1;
}


export function cooldownScaleFor(state) {
  return 1 / fireRateMulFor(state);
}
