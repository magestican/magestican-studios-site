










export const MAX_PARTS = 6;


export const LEGACY = { color: 0xff8a2a, size: 1.5, life: 0.6, grow: 9 };


export const BARGE_R = 6;













export function blastSpec(what, power = 1) {
  if (what !== 'barge') return { staged: false, color: LEGACY.color, size: LEGACY.size * power, life: LEGACY.life, grow: LEGACY.grow };
  const R = BARGE_R * power;
  
  const parts = [
    
    { color: 0xfff2b0, r0: 0.3 * R, r1: 0.75 * R, life: 1.0, delay: 0, opacity: 0.95, side: 0, up: 0.3 * R, rise: 1 },
    
    { color: 0xff8a2a, r0: 0.45 * R, r1: 1.25 * R, life: 3.2, delay: 0, opacity: 0.85, side: 0, up: 0.45 * R, rise: 1.5 },
    
    { color: 0xff5a1a, r0: 0.25 * R, r1: 0.85 * R, life: 2.4, delay: 0.18, opacity: 0.85, side: 0.6 * R, up: 0.3 * R, rise: 2 },
    { color: 0xffb040, r0: 0.25 * R, r1: 0.8 * R, life: 2.2, delay: 0.36, opacity: 0.85, side: -0.55 * R, up: 0.25 * R, rise: 2 },
    
    { color: 0x2a2420, r0: 0.3 * R, r1: 1.3 * R, life: 4.6, delay: 0.9, opacity: 0.5, side: 0.1 * R, up: 1.3 * R, rise: 3.5 },
  ];
  return { staged: true, frame: 'rail', base: 'floor', parts };
}





export function partAt(part, t) {
  const u = (t - part.delay) / part.life;
  if (u < 0 || u >= 1) return null;
  const ease = 1 - (1 - u) * (1 - u);
  return {
    r: part.r0 + (part.r1 - part.r0) * ease,
    
    opacity: part.opacity * Math.min(1, (1 - u) * 2),
    dy: part.rise * (t - part.delay),
  };
}


export const blastLife = (parts) => Math.max(...parts.map((p) => p.delay + p.life));







export function blastAt(from, fwd, place, baseY) {
  const l = Math.hypot(fwd.x, fwd.z) || 1;
  const fx = fwd.x / l;
  const fz = fwd.z / l;
  const ahead = place.ahead ?? 0;
  const side = place.side ?? 0; 
  return { x: from.x + fx * ahead - fz * side, y: baseY + (place.up ?? 0), z: from.z + fz * ahead + fx * side };
}
