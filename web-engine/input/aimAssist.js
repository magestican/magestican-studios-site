

























export const AIM_ASSIST = Object.freeze({
  
  
  
  maxAngle: 0.056,
  
  
  
  
  
  
  
  
  
  maxRate: 2.2,
  
  
  maxDistance: 42,
  
  
  
  
  
  
  
  
  deadZone: 0.0015,
});


export function angleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}




export function aimAnglesTo(eye, target) {
  const dx = target.x - eye.x;
  const dy = target.y - eye.y;
  const dz = target.z - eye.z;
  const flat = Math.hypot(dx, dz);
  return { yaw: Math.atan2(dx, dz), pitch: Math.atan2(dy, flat), dist: Math.hypot(flat, dy) };
}













export function computeAimAssist({ eye, yaw, pitch, targets, dt, enabled = true,
                                   cfg = AIM_ASSIST }) {
  const none = { yaw: 0, pitch: 0 };
  if (!enabled || !targets || !targets.length || !dt) return none;

  
  
  
  
  let best = null, bestErr = Infinity;
  for (const t of targets) {
    const a = aimAnglesTo(eye, t);
    if (a.dist > cfg.maxDistance) continue;
    const dYaw = angleDelta(yaw, a.yaw);
    const dPitch = angleDelta(pitch, a.pitch);
    
    
    const err = Math.hypot(dYaw * Math.cos(pitch), dPitch);
    if (err < bestErr) { bestErr = err; best = { dYaw, dPitch }; }
  }
  if (!best || bestErr > cfg.maxAngle || bestErr < cfg.deadZone) return none;

  
  
  const f = 1 - (bestErr / cfg.maxAngle);
  const strength = f * f;               
  const maxStep = cfg.maxRate * strength * dt;
  const scale = Math.min(1, maxStep / bestErr);
  return { yaw: best.dYaw * scale, pitch: best.dPitch * scale };
}
