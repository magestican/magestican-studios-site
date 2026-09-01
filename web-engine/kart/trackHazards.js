












































function wrapFrac(d) {
  let x = d;
  while (x > 0.5) x -= 1;
  while (x < -0.5) x += 1;
  return x;
}







export function inSpan(f, from, to) {
  if (from <= to) return f >= from && f <= to;
  return f >= from || f <= to;
}








export function outwardness(lateral, width) {
  return Math.abs(lateral ?? 0) / Math.max(1e-3, (width ?? 20) / 2);
}






const sideOf = (lateral) => ((lateral ?? 0) > 0 ? 'left' : 'right');









export function hazardAt(zones, { frac, lateral, width }) {
  if (!zones || !zones.length) return null;
  const out = outwardness(lateral, width);
  const side = sideOf(lateral);
  for (const zone of zones) {
    if (!inSpan(frac, zone.from, zone.to)) continue;
    if (zone.side && zone.side !== 'both' && zone.side !== side) continue;
    
    
    
    
    if (out < (zone.beyond ?? 1.18)) continue;
    
    
    
    if (zone.until != null && out > zone.until) continue;
    return zone;
  }
  return null;
}








export const RESPAWNS = new Set(['water', 'lava']);









export function surfaceLevelOf(zone) {
  if (!zone) return 0;
  if (zone.level != null) return zone.level;
  return (zone.depth ?? 4.5) * 0.28;
}

















export const CLIMB_MAX = 6;















export const CHASM_DEPTH = 12;

















export function isChasmWater(zone) {
  if (!zone) return false;
  if (surfaceLevelOf(zone) > CLIMB_MAX) return true;
  return (zone.depth ?? 4.5) >= CHASM_DEPTH;
}

























export function drivableWater(zone) {
  if (!zone || !RESPAWNS.has(zone.kind)) return false;
  if (zone.kind === 'lava') return false;
  return zone.drivable ?? !isChasmWater(zone);
}
















export function waterPlaneY(zone, roadY) {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (zone && zone.plane != null) return zone.plane;
  return (roadY ?? 0) - surfaceLevelOf(zone);
}

























export function crossesRoad(zone) {
  return !!zone && (zone.beyond ?? 1.18) < 1;
}

































export function bankAt(zone, frac, { shoreBank = SHORE_BANK } = {}) {
  const base = zone.bank ?? 0.55;
  if (!zone.shores || !zone.shores.length) return base;
  let widest = base;
  for (const sh of zone.shores) {
    if (!inSpan(frac, sh.from, sh.to)) continue;
    const span = sh.from <= sh.to ? (sh.to - sh.from) : ((1 - sh.from) + sh.to);
    if (!(span > 0)) continue;
    const into = sh.from <= frac ? (frac - sh.from) : ((1 - sh.from) + frac);
    const u = Math.min(1, Math.max(0, into / span));
    
    
    const t = 1 - Math.abs(u * 2 - 1);
    const ease = t * t * (3 - 2 * t);
    widest = Math.max(widest, base + (( sh.bank ?? shoreBank) - base) * ease);
  }
  return widest;
}











export const SHORE_BANK = 3.5;















export function chasmDepthAt(zones, { frac, lateral, width }) {
  if (!zones || !zones.length) return null;
  const out = outwardness(lateral, width);
  const side = sideOf(lateral);
  for (const zone of zones) {
    if (!RESPAWNS.has(zone.kind)) continue;
    if (!inSpan(frac, zone.from, zone.to)) continue;
    if (zone.side && zone.side !== 'both' && zone.side !== side) continue;
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (crossesRoad(zone)) continue;
    const edge = zone.beyond ?? 1.18;
    if (out < edge) return null;
    const depth = zone.depth ?? 4.5;
    
    
    
    
    
    
    
    
    
    const bank = bankAt(zone, frac);
    const u = Math.min(1, (out - edge) / bank);
    return depth * (u * u * (3 - 2 * u));
  }
  return null;
}














export function hazardEffect(zone, kart) {
  if (!zone) return null;
  if ((kart.invuln ?? 0) > 0) return null;
  
  
  
  
  
  if (drivableWater(zone)) return null;
  
  
  
  if (RESPAWNS.has(zone.kind)) return { action: 'respawn', zone };
  if (zone.kind === 'fire') {
    
    if ((kart.spinTime ?? 0) > 0) return null;
    return { action: 'spin', zone };
  }
  return null;
}











export function hazardMarkers(zone, spacing = 0.006) {
  const out = [];
  if (!zone) return out;
  
  
  
  
  
  
  
  if (crossesRoad(zone)) return out;
  const span = zone.from <= zone.to ? zone.to - zone.from : (1 - zone.from) + zone.to;
  const n = Math.max(1, Math.round(span / spacing));
  const at = zone.beyond ?? 1.18;
  
  
  const place = at + 0.14;
  for (let i = 0; i <= n; i += 1) {
    const frac = (zone.from + (span * i) / n) % 1;
    if (!zone.side || zone.side === 'both') {
      out.push({ frac, out: place });
      out.push({ frac, out: -place });
    } else {
      out.push({ frac, out: zone.side === 'left' ? place : -place });
    }
  }
  return out;
}
