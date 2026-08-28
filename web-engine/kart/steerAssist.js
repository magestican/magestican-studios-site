







































export const MAX_CORRECTION = 0.55;








export const DEAD_ZONE = 0.45;









export function assistSteer({ steer, kart, surface, strength = 1 }) {
  if (!strength || !surface) return steer;
  
  
  
  if (!(kart.speed > 6) || kart.spinTime > 0) return steer;

  const half = Math.max(1e-3, surface.width / 2);
  
  
  const offset = -(surface.lateral ?? 0) / half;
  const magnitude = Math.abs(offset);
  if (magnitude < DEAD_ZONE) return steer;

  
  
  
  const urgency = Math.min(1, (magnitude - DEAD_ZONE) / (1 - DEAD_ZONE));
  const pull = urgency * urgency;

  
  
  const inward = offset > 0 ? -1 : 1;

  
  
  
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
