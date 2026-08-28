







































function wrapFrac(d) {
  let x = d;
  while (x > 0.5) x -= 1;
  while (x < -0.5) x += 1;
  return x;
}










export function crossedJump(jumps, prev, now, speed) {
  if (!jumps || !jumps.length || prev == null) return null;
  const moved = wrapFrac(now - prev);
  
  
  
  if (moved <= 0) return null;

  for (const jump of jumps) {
    
    
    
    const toMarker = wrapFrac(jump.at - prev);
    if (toMarker < 0 || toMarker > moved) continue;

    const min = jump.minSpeed ?? 12;
    
    
    if (speed < min) return null;

    
    
    
    const ref = jump.refSpeed ?? 45;
    const scale = Math.min(1.25, speed / ref);
    return { jump, vy: jump.launch * scale };
  }
  return null;
}
