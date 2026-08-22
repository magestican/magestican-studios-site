












export function hitBearingDeg(attackerPos, victimPos, victimYaw) {
  const dx = attackerPos.x - victimPos.x;
  const dz = attackerPos.z - victimPos.z;
  
  
  const worldBearing = Math.atan2(dx, dz);
  
  const rel = worldBearing - victimYaw;
  
  
  let deg = -rel * 180 / Math.PI;
  deg = ((deg + 540) % 360) - 180;   
  return deg;
}
