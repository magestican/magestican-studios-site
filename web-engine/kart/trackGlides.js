
























































































const wrap01 = (f) => ((f % 1) + 1) % 1;





export function inSpan(f, from, to) {
  const u = wrap01(f);
  if (from <= to) return u >= from && u <= to;
  return u >= from || u <= to;
}


export function glideAt(glides, frac) {
  if (!glides || !glides.length) return null;
  for (const g of glides) if (inSpan(frac, g.from, g.to)) return g;
  return null;
}


export const inGlide = (glides, frac) => glideAt(glides, frac) !== null;





























export function flightOver({ launch, speed, lipY, floorY, faceRun, gravity = 26 }) {
  const g = gravity;
  const dt = 1 / 240;
  
  
  
  const roadAt = (d) => (d >= faceRun ? floorY : lipY + (floorY - lipY) * (d / Math.max(1e-6, faceRun)));
  let t = 0;
  let y = lipY;
  let vy = launch;
  let d = 0;
  let apexY = lipY;
  
  
  while (t < 10) {
    const ny = y + vy * dt;
    const nd = d + speed * dt;
    if (ny <= roadAt(nd) && t > dt) {
      
      return { airTime: t, distance: d, apexY, landY: roadAt(d), minY: roadAt(d) };
    }
    y = ny; d = nd; vy -= g * dt; t += dt;
    if (y > apexY) apexY = y;
  }
  return { airTime: t, distance: d, apexY, landY: y, minY: y };
}









export function lungeApexY(zone, roadY) {
  if (!zone?.creatures) return null;
  const level = zone.level != null ? zone.level : (zone.depth ?? 4.5) * 0.28;
  return roadY - level + (zone.creatures.lungeHeight ?? 0);
}












export function lungePhase(t, { period = 4.4, up = 1.1, phase = 0 } = {}) {
  const p = Math.max(0.2, period);
  const local = (((t + phase) % p) + p) % p;
  if (local > up) return 0;
  
  
  return Math.sin((local / up) * Math.PI);
}
