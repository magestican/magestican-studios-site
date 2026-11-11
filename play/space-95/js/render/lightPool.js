








export const LANTERN_GLOW = {
  RADIUS_K: 1, 
  OPACITY: 0.2, 
  DAZZLED_OPACITY: 0.14, 
  FALLOFF: 2, 
};


export const lanternGlowAlpha = (t) => (t >= 1 ? 0 : (1 - Math.max(0, t)) ** LANTERN_GLOW.FALLOFF);

export const LAMP_DISC = {
  EDGE_K: 1.15, 
  OPACITY: 0.4, 
  FALLOFF: 3,
  RING: 0.3, 
  RING_W: 0.05,
};


export function lampDiscAlpha(t) {
  if (t >= 1) return 0;
  const fill = (1 - Math.max(0, t)) ** LAMP_DISC.FALLOFF;
  const rim = LAMP_DISC.RING * Math.max(0, 1 - Math.abs(t - 1 / LAMP_DISC.EDGE_K) / LAMP_DISC.RING_W);
  return Math.max(fill, rim);
}
