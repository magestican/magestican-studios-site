







export const HONEY_STUCK = 4.0; 
export const JO_GLOOP = 0.5; 





export function honeyAt(world, x, y, tol = 0.1) {
  if (!world.honey) return null;
  for (const h of world.honey) if (x >= h.x0 && x < h.x1 && Math.abs(y - h.y) <= tol) return h;
  return null;
}


export function honeyStuckEvent(e, h) {
  return { type: 'honeyStuck', id: e.id, kind: e.kind, use: h.use ?? null, x: e.x, y: e.y };
}
