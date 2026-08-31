





























import { emptyMesh, pushQuadOut } from '../ps1Mesh.mjs';











const L = 0.52;









function box(m, c, h) {
  const [cx, cy, cz] = c;
  const [hx, hy, hz] = h;
  const v = (sx, sy, sz) => [cx + sx * hx, cy + sy * hy, cz + sz * hz];
  const uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const q = (a, b, d, e) => pushQuadOut(m, c, a, b, d, e, ...uv);
  q(v(1, -1, -1), v(1, 1, -1), v(1, 1, 1), v(1, -1, 1));      
  q(v(-1, -1, -1), v(-1, 1, -1), v(-1, 1, 1), v(-1, -1, 1));  
  q(v(-1, 1, -1), v(1, 1, -1), v(1, 1, 1), v(-1, 1, 1));      
  q(v(-1, -1, -1), v(1, -1, -1), v(1, -1, 1), v(-1, -1, 1));  
  q(v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1));      
  q(v(-1, -1, -1), v(1, -1, -1), v(1, 1, -1), v(-1, 1, -1));  
  return m;
}








function tiltedBox(m, c, h, angle) {
  const [cx, cy, cz] = c;
  const [hx, hy, hz] = h;
  const s = Math.sin(angle); const co = Math.cos(angle);
  const v = (sx, sy, sz) => {
    const x = sx * hx; const z = sz * hz;
    return [cx + x * co - z * s, cy + sy * hy, cz + x * s + z * co];
  };
  const uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const q = (a, b, d, e) => pushQuadOut(m, c, a, b, d, e, ...uv);
  q(v(1, -1, -1), v(1, 1, -1), v(1, 1, 1), v(1, -1, 1));
  q(v(-1, -1, -1), v(-1, 1, -1), v(-1, 1, 1), v(-1, -1, 1));
  q(v(-1, 1, -1), v(1, 1, -1), v(1, 1, 1), v(-1, 1, 1));
  q(v(-1, -1, -1), v(1, -1, -1), v(1, -1, 1), v(-1, -1, 1));
  q(v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1));
  q(v(-1, -1, -1), v(1, -1, -1), v(1, 1, -1), v(-1, 1, -1));
  return m;
}








export function buildBoltDriver() {
  const parts = [
    
    { name: 'receiver', mesh: box(emptyMesh(), [L * 0.06, 0, 0], [L * 0.30, 0.032, 0.036]) },
    
    
    
    { name: 'nose', mesh: box(emptyMesh(), [L * 0.46, 0, -0.004], [L * 0.115, 0.017, 0.019]) },
    
    
    { name: 'guard', mesh: box(emptyMesh(), [L * 0.575, 0, -0.006], [L * 0.02, 0.030, 0.032]) },
    
    
    { name: 'bottle', mesh: box(emptyMesh(), [L * -0.02, 0, 0.052], [L * 0.24, 0.026, 0.026]) },
    
    
    { name: 'magazine', mesh: tiltedBox(emptyMesh(), [L * 0.26, 0, -0.062], [0.052, 0.016, 0.030], -0.38) },
    
    
    { name: 'grip', mesh: tiltedBox(emptyMesh(), [L * -0.10, 0, -0.078], [0.030, 0.022, 0.056], 1.27) },
    
    
    { name: 'trigger', mesh: box(emptyMesh(), [L * -0.03, 0, -0.044], [0.022, 0.012, 0.014]) },
  ].filter((p) => p.mesh && p.mesh.indices && p.mesh.indices.length);

  return { parts, tris: parts.reduce((n, p) => n + p.mesh.tris, 0) };
}


export function muzzlePoint() {
  return [L * 0.595, 0, -0.006];
}








export const BOLT_DRIVER_LENGTH_M = (() => {
  let lo = Infinity; let hi = -Infinity;
  for (const p of buildBoltDriver().parts) {
    for (let i = 0; i < p.mesh.positions.length; i += 3) {
      if (p.mesh.positions[i] < lo) lo = p.mesh.positions[i];
      if (p.mesh.positions[i] > hi) hi = p.mesh.positions[i];
    }
  }
  return hi - lo;
})();


export function partBounds(mesh) {
  const b = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  for (let i = 0; i < mesh.positions.length; i += 3) {
    for (let a = 0; a < 3; a += 1) {
      b.min[a] = Math.min(b.min[a], mesh.positions[i + a]);
      b.max[a] = Math.max(b.max[a], mesh.positions[i + a]);
    }
  }
  return b;
}
