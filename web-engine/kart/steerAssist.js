






































import { trackSurface } from './trackPath.js';
import { DEPLOY_HEIGHT } from './glide.js';


export const MAX_CORRECTION = 0.55;








export const DEAD_ZONE = 0.45;




















export const LOOK_AHEAD = 1.1;








const STEPS = 3;

export const PREDICT_GAIN = 0.45;






















function projectAhead(kart, path) {
  const speed = kart.speed ?? 0;
  let dir = Math.atan2(kart.vx ?? 0, kart.vz ?? 0);
  const omega = kart.yawRate ?? 0;
  let x = kart.x ?? 0;
  let z = kart.z ?? 0;
  let hint = kart.pathHint;
  let excess = 0;
  let inward = 0;

  const h = LOOK_AHEAD / STEPS;
  for (let i = 0; i < STEPS; i += 1) {
    
    
    
    
    const mid = dir + omega * h * 0.5;
    x += Math.sin(mid) * speed * h;
    z += Math.cos(mid) * speed * h;
    dir += omega * h;

    const s = trackSurface(path, x, z, hint);
    hint = s.index;
    const half = Math.max(1e-3, (s.width ?? 0) / 2);
    const over = Math.abs(s.lateral ?? 0) / half - 1;
    if (over > excess) {
      excess = over;
      
      
      inward = (s.lateral ?? 0) > 0 ? 1 : -1;
    }
  }
  return { excess, inward };
}

















function rampFrom(magnitude, from, full) {
  if (magnitude < from) return 0;
  const u = Math.min(1, (magnitude - from) / Math.max(1e-3, full - from));
  return u * u;
}











export function assistSteer({ steer, kart, surface, path = null, strength = 1 }) {
  if (!strength || !surface) return steer;
  
  
  
  if (!(kart.speed > 6) || kart.spinTime > 0) return steer;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (kart.gliding || kart.grinding || (kart.airHeight ?? 0) >= DEPLOY_HEIGHT) return steer;

  const half = Math.max(1e-3, surface.width / 2);
  
  
  const offset = -(surface.lateral ?? 0) / half;

  
  const posPull = rampFrom(Math.abs(offset), DEAD_ZONE, 1);
  let pull = posPull;
  
  
  let inward = offset > 0 ? -1 : 1;

  
  
  
  
  if (path) {
    const ahead = projectAhead(kart, path);
    const predPull = Math.min(1, ahead.excess / 0.6) * PREDICT_GAIN;
    
    
    
    
    if (predPull > pull) { pull = predPull; inward = ahead.inward; }
  }
  if (pull <= 0) return steer;

  
  
  
  if (steer * inward > 0.02) return steer;

  const correction = inward * pull * MAX_CORRECTION * strength;
  
  
  
  return Math.max(-1, Math.min(1, steer + correction));
}










export function defaultAssist(progress) {
  if (progress && typeof progress.assist === 'boolean' && progress.assistExplicit) {
    return progress.assist;
  }
  const races = progress?.totalRaces ?? 0;
  return races < 3;
}
