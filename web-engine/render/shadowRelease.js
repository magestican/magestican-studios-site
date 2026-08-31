
























































export function releaseShadows(root) {
  const out = { lights: 0, shadows: 0, released: 0, errors: 0 };
  if (!root || typeof root.traverse !== 'function') return out;
  root.traverse((node) => {
    if (!node || !node.isLight) return;
    out.lights += 1;
    const shadow = node.shadow;
    if (!shadow) return;
    out.shadows += 1;
    
    
    
    const had = !!shadow.map || !!shadow.mapPass;
    try {
      
      
      
      
      
      
      if (typeof shadow.dispose === 'function') shadow.dispose();
      else {
        if (typeof shadow.map?.dispose === 'function') shadow.map.dispose();
        if (typeof shadow.mapPass?.dispose === 'function') shadow.mapPass.dispose();
      }
    } catch (err) {
      
      
      
      
      out.errors += 1;
    }
    
    
    
    
    
    shadow.map = null;
    shadow.mapPass = null;
    if (had) out.released += 1;
  });
  return out;
}
