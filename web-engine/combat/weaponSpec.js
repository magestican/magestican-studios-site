
































export const PLAYER_GROUND_SPEED = 8.5;   
export const PLAYER_AIR_SPEED    = 10.5;  


export const PLAYER_HP = 100;
























export const SIGHTLINE = Object.freeze({ p25: 6.5, median: 13.6, p75: 28.6, p90: 48.6 });




























export const WEAPON_DEFS = [
  { id: 'shovel',  name: 'Shovel',   cooldown: 0.20, damage: 12, pellets: 1, spread: 0.003, kind: 'projectile', projectileSpeed: 62, projectileColor: 0x7a5c3d, tracerColor: 0x7a5c3d },
  { id: 'shotgun', name: 'Shotgun',  cooldown: 0.75, damage: 12, pellets: 5, spread: 0.10,  kind: 'projectile', projectileSpeed: 78, projectileColor: 0xf4c95d, tracerColor: 0xf4c95d },

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  { id: 'rocket',  name: 'Rocket',   cooldown: 1.10, damage: 90, splash: 45, splashRadius: 3.0, projectileSpeed: 40, kind: 'projectile' },
];

export function defById(id) {
  return WEAPON_DEFS.find((d) => d.id === id) || null;
}








export function flightTime(def, range) {
  const v = def?.projectileSpeed;
  if (!Number.isFinite(v) || v <= 0) return 0;    
  return range / v;
}








export function dodgeEscapeRange(def, { strafeSpeed = PLAYER_GROUND_SPEED,
                                        reaction = 0 } = {}) {
  const v = def?.projectileSpeed;
  const r = def?.splashRadius;
  if (!Number.isFinite(v) || v <= 0 || !Number.isFinite(r) || r <= 0) return 0;
  if (!Number.isFinite(strafeSpeed) || strafeSpeed <= 0) return Infinity;
  return v * (r / strafeSpeed + reaction);
}







export function timeToKill(def, { hp = PLAYER_HP, headshot = false } = {}) {
  const per = burstDamage(def) * (headshot ? 1.4 : 1);
  if (per <= 0) return Infinity;
  const triggers = Math.ceil(hp / per);
  return (triggers - 1) * (def.cooldown || 0);
}


export function burstDamage(def) {
  return (def?.damage || 0) * (def?.pellets ?? 1);
}
