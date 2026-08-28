


























































export const PITCH_SPREAD = 0.06;




export const GAIN_SPREAD = 0.10;





export const TIME_JITTER = 0.006;












export function shotVariation(weaponId, shotIndex = 0) {
  let h = 2166136261;
  const s = String(weaponId || '');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= (shotIndex | 0) + 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  
  const a = ((h >>> 0) % 1024) / 1024;
  const b = ((h >>> 10) % 1024) / 1024;
  const c = ((h >>> 20) % 1024) / 1024;
  return {
    pitch: 1 + (a - 0.5) * 2 * PITCH_SPREAD,
    gain:  1 + (b - 0.5) * 2 * GAIN_SPREAD,
    time:  (c - 0.5) * 2 * TIME_JITTER,
  };
}








export const HEARING_RANGE = 90;





export function gainAtDistance(distance, range = HEARING_RANGE) {
  if (!Number.isFinite(distance) || distance <= 0) return 1;
  if (distance >= range) return 0;
  const t = 1 - distance / range;
  return t * t;
}











export const NEAR_CUTOFF_HZ = 18000;
export const FAR_CUTOFF_HZ  = 700;
export function cutoffAtDistance(distance, range = HEARING_RANGE) {
  if (!Number.isFinite(distance) || distance <= 0) return NEAR_CUTOFF_HZ;
  const t = Math.min(1, distance / range);
  return NEAR_CUTOFF_HZ * Math.pow(FAR_CUTOFF_HZ / NEAR_CUTOFF_HZ, t);
}





export const NEAR_WET = 0.10;
export const FAR_WET  = 0.55;
export function wetAtDistance(distance, range = HEARING_RANGE) {
  if (!Number.isFinite(distance) || distance <= 0) return NEAR_WET;
  const t = Math.min(1, distance / range);
  return NEAR_WET + (FAR_WET - NEAR_WET) * t;
}







































export const WEAPON_LEVEL = 2.7;






export const OWN_GAIN = 1.0;
export const OTHER_GAIN = 0.62;



export function shotSound(weaponId, { shotIndex = 0, distance = 0, own = false } = {}) {
  const v = shotVariation(weaponId, shotIndex);
  const audible = own || distance < HEARING_RANGE;
  return {
    weaponId,
    audible,
    pitch: v.pitch,
    timeJitter: v.time,
    loudness: own
      ? OWN_GAIN * v.gain
      : OTHER_GAIN * gainAtDistance(distance) * v.gain,
    cutoffHz: own ? NEAR_CUTOFF_HZ : cutoffAtDistance(distance),
    wet: own ? NEAR_WET : wetAtDistance(distance),
  };
}
