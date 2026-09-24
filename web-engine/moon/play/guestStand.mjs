










import { GUEST_RULES } from './guests.mjs';

export const GUEST_STAND = Object.freeze({ STAND_M: 3.2, FAN_RAD: 0.34, BEAT_M: 1.4, WALK_MPS: 0.55, IDLE_S: 4.5 });


export function guestStand(at, spot = 0) {
  const { STAND_M, FAN_RAD, BEAT_M } = GUEST_STAND;
  const s = ((spot % GUEST_RULES.spots) + GUEST_RULES.spots) % GUEST_RULES.spots;
  
  
  const a = at.heading + Math.PI + (s - (GUEST_RULES.spots - 1) / 2) * FAN_RAD;
  const x = at.x + Math.sin(a) * STAND_M, z = at.z + Math.cos(a) * STAND_M;
  const face = Math.atan2(at.x - x, at.z - z);                 
  const side = face + Math.PI / 2;                              
  const h = BEAT_M / 2;
  return Object.freeze({
    x, z, face,
    a: Object.freeze({ x: x - Math.sin(side) * h, z: z - Math.cos(side) * h }),
    b: Object.freeze({ x: x + Math.sin(side) * h, z: z + Math.cos(side) * h }),
  });
}


export function guestBeat(stand, t) {
  const { BEAT_M, WALK_MPS, IDLE_S } = GUEST_STAND;
  const walkS = BEAT_M / WALK_MPS;
  const cycle = 2 * (IDLE_S + walkS);
  const u = ((t % cycle) + cycle) % cycle;
  const legs = [[stand.a, stand.b], [stand.b, stand.a]];
  const leg = u < IDLE_S + walkS ? 0 : 1;
  const k = u - leg * (IDLE_S + walkS);
  const [from, to] = legs[leg];
  if (k < IDLE_S) return { x: from.x, z: from.z, heading: stand.face, speed: 0 };
  const f = (k - IDLE_S) / walkS;
  return {
    x: from.x + (to.x - from.x) * f,
    z: from.z + (to.z - from.z) * f,
    heading: Math.atan2(to.x - from.x, to.z - from.z),
    speed: WALK_MPS,
  };
}





export const HOVER = Object.freeze({ fairy: Object.freeze({ liftM: 0.12, bobM: 0.035, periodS: 2.6 }) });
export function guestLift(kind, t) {
  const h = HOVER[kind];
  return h ? h.liftM + h.bobM * Math.sin((2 * Math.PI * t) / h.periodS) : 0;
}




export const FADE_S = 0.6;
export const fadeAt = (sinceS) => Math.max(0, Math.min(1, 1 - sinceS / FADE_S));
