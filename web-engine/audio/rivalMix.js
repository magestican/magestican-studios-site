





































export const MAX_VOICES = 3;









export const HEAR_RANGE = 55;










export const SWAP_MARGIN = 6;









export function falloff(distance, range = HEAR_RANGE) {
  if (!(distance >= 0)) return 0;
  if (distance >= range) return 0;
  const t = 1 - distance / range;
  return t * t;
}













export function panOf(dx, dz, heading) {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const rx = -Math.cos(heading);
  const rz = Math.sin(heading);
  const lateral = dx * rx + dz * rz;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.001) return 0;
  const p = lateral / dist;
  return Math.max(-1, Math.min(1, p));
}












export function rivalMix(listener, rivals, previous = [], opts = {}) {
  const max = opts.maxVoices ?? MAX_VOICES;
  const range = opts.range ?? HEAR_RANGE;
  const margin = opts.swapMargin ?? SWAP_MARGIN;
  if (!listener || !listener.pos || !Array.isArray(rivals)) return [];

  const scored = [];
  for (const r of rivals) {
    if (!r || !r.pos || r.id === undefined) continue;
    const dx = r.pos.x - listener.pos.x;
    const dz = r.pos.z - listener.pos.z;
    const distance = Math.hypot(dx, dz);
    if (distance >= range) continue;
    const top = (r.tuning && r.tuning.topSpeed) || 30;
    scored.push({
      id: r.id,
      distance,
      gain: falloff(distance, range),
      pan: panOf(dx, dz, listener.heading ?? 0),
      frac: Math.min(1.35, Math.abs(r.speed ?? 0) / top),
    });
  }
  scored.sort((a, b) => a.distance - b.distance);
  if (scored.length <= max) return scored;

  
  
  
  const held = new Set(previous);
  const chosen = [];
  const rest = [];
  for (const s of scored) (held.has(s.id) ? chosen : rest).push(s);

  
  chosen.sort((a, b) => a.distance - b.distance);
  const keep = chosen.slice(0, max);
  for (const c of rest) {
    if (keep.length >= max) {
      
      
      const worst = keep[keep.length - 1];
      if (worst && !held.has(c.id) && c.distance + margin < worst.distance) {
        keep[keep.length - 1] = c;
        keep.sort((a, b) => a.distance - b.distance);
      }
      continue;
    }
    keep.push(c);
    keep.sort((a, b) => a.distance - b.distance);
  }
  return keep.slice(0, max);
}
