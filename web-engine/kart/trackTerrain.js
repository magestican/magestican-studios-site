

































export function terrainOffsetAt(features, x, z) {
  if (!features || !features.length) return 0;
  let sum = 0;
  for (const f of features) {
    if (f.kind === 'volcano') sum += volcanoOffsetAt(f, x, z);
  }
  return sum;
}

















export function volcanoOffsetAt(f, x, z) {
  const d = Math.hypot(x - f.x, z - f.z);
  const R = f.radius ?? 300;
  if (d >= R) return 0;
  const rim = (f.craterRadius ?? 78) * 1.18;
  const H = f.height ?? 46;

  
  let h;
  if (d <= rim) h = H;
  else {
    const u = 1 - (d - rim) / Math.max(1e-6, R - rim);
    h = H * u * u * (3 - 2 * u);
  }

  
  const cr = f.craterRadius ?? 78;
  if (d < cr) {
    const depth = f.craterDepth ?? 30;
    
    
    
    
    
    
    const inner = cr * 0.55;
    let t;
    if (d <= inner) t = 1;
    else {
      const u = 1 - (d - inner) / Math.max(1e-6, cr - inner);
      t = u * u * (3 - 2 * u);
    }
    h -= depth * t;
  }
  return h;
}
















export const lavaRise = (f) => (f.lavaLevel ?? 5);





export const craterFloorY = (f) => (f.height ?? 46) - (f.craterDepth ?? 30);
