






























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











export function waterDepthAt(zones, { frac, lateral, width }) {
  if (!zones || !zones.length) return null;
  const out = outwardness(lateral, width);
  const side = sideOf(lateral);
  for (const zone of zones) {
    if (zone.kind !== 'water') continue;
    if (!inSpan(frac, zone.from, zone.to)) continue;
    if (zone.side && zone.side !== 'both' && zone.side !== side) continue;
    const edge = zone.beyond ?? 1.18;
    if (out < edge) return null;
    const depth = zone.depth ?? 4.5;
    
    
    const bank = zone.bank ?? 0.55;
    const u = Math.min(1, (out - edge) / bank);
    return depth * (u * u * (3 - 2 * u));
  }
  return null;
}














export function hazardEffect(zone, kart) {
  if (!zone) return null;
  if ((kart.invuln ?? 0) > 0) return null;
  if (zone.kind === 'water') return { action: 'respawn', zone };
  if (zone.kind === 'fire') {
    
    if ((kart.spinTime ?? 0) > 0) return null;
    return { action: 'spin', zone };
  }
  return null;
}











export function hazardMarkers(zone, spacing = 0.006) {
  const out = [];
  if (!zone) return out;
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
