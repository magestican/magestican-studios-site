



























import { mergeMeshes, stackMesh, jointBall } from '../ps1Mesh.mjs';

const TAU = Math.PI * 2;








export const HORSE_HEIGHT_M = 2.6;

export const ZONES = Object.freeze({
  legs: { lo: 0.0, hi: 0.50 },
  barrel: { lo: 0.44, hi: 0.76 },
  necks: { lo: 0.70, hi: 1.0 },
});

function ring(z, rx, ry, n, { yaw = 0, cx = 0, cy = 0 } = {}) {
  const pts = []; const uv = [];
  for (let j = 0; j < n; j += 1) {
    const a = yaw - (j / n) * TAU;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, z]);
    uv.push([j / n, z]);
  }
  return { pts, uv };
}








function barrel(n = 8) {
  const { lo, hi } = ZONES.barrel;
  const mid = (lo + hi) / 2;
  const h = (hi - lo) / 2;
  
  const slices = [
    [-0.62, h * 0.86, 0.130, mid - 0.010],   
    [-0.42, h * 1.05, 0.165, mid - 0.004],   
    [-0.14, h * 1.00, 0.150, mid],
    [0.16, h * 0.98, 0.152, mid + 0.008],    
    [0.42, h * 0.92, 0.140, mid + 0.020],    
    [0.60, h * 0.78, 0.115, mid + 0.038],    
    [0.70, h * 0.60, 0.090, mid + 0.056],
  ];
  const rings = slices.map(([x, rz, ry, cz]) => {
    const pts = []; const uv = [];
    for (let j = 0; j < n; j += 1) {
      const a = -(j / n) * TAU;
      pts.push([x, cz + Math.sin(a) * rz > 0 ? Math.cos(a) * ry : Math.cos(a) * ry, 0]);
      uv.push([j / n, 0]);
    }
    return { pts, uv };
  });
  void rings;
  
  
  
  const real = slices.map(([x, rz, ry, cz]) => {
    const pts = []; const uv = [];
    for (let j = 0; j < n; j += 1) {
      const a = -(j / n) * TAU;
      pts.push([x, Math.cos(a) * ry, cz + Math.sin(a) * rz]);
      uv.push([j / n, (x + 1) / 2]);
    }
    return { pts, uv };
  });
  return stackMesh(real, { capFirst: true, capLast: true });
}









function neck(k, n = 6) {
  const centre = k === 0;
  const { lo } = ZONES.necks;
  const len = centre ? 1.00 : 0.82;         
  const spread = k * 0.115;
  const base = { x: 0.66, y: k * 0.055, z: lo - 0.02 };

  const rings = [];
  const N = 6;
  for (let i = 0; i < N; i += 1) {
    const t = i / (N - 1);
    
    const rise = Math.sin(t * Math.PI * 0.55) * (centre ? 0.30 : 0.24) * len;
    const reach = t * (centre ? 0.42 : 0.36) * len;
    const r = (centre ? 0.072 : 0.062) * (1 - t * 0.45);
    rings.push(ring(base.z + rise, r, r * 1.06, n, {
      cx: base.x + reach,
      cy: base.y + spread * t,
    }));
  }

  
  const tipZ = base.z + Math.sin(Math.PI * 0.55) * (centre ? 0.30 : 0.24) * len;
  const tipX = base.x + (centre ? 0.42 : 0.36) * len;
  const tipY = base.y + spread;
  const hr = centre ? 1.0 : 0.88;
  const headRings = [
    ring(tipZ + 0.010, 0.064 * hr, 0.060 * hr, n, { cx: tipX + 0.010, cy: tipY }),
    ring(tipZ - 0.014, 0.058 * hr, 0.052 * hr, n, { cx: tipX + 0.078, cy: tipY + spread * 0.10 }),
    ring(tipZ - 0.048, 0.044 * hr, 0.040 * hr, n, { cx: tipX + 0.140, cy: tipY + spread * 0.16 }),
    ring(tipZ - 0.072, 0.038 * hr, 0.036 * hr, n, { cx: tipX + 0.178, cy: tipY + spread * 0.20 }),
  ];
  return mergeMeshes([
    stackMesh(rings, { capFirst: true }),
    stackMesh(headRings, { capFirst: true, capLast: true }),
  ]);
}


export function headPoint(k) {
  const centre = k === 0;
  const { lo } = ZONES.necks;
  const len = centre ? 1.00 : 0.82;
  const spread = k * 0.115;
  const tipZ = lo - 0.02 + Math.sin(Math.PI * 0.55) * (centre ? 0.30 : 0.24) * len;
  const tipX = 0.66 + (centre ? 0.42 : 0.36) * len;
  return [tipX + 0.055, k * 0.055 + spread * 0.10, tipZ - 0.004];
}







function leg(front, side, n = 5) {
  const { lo, hi } = ZONES.legs;
  const x = front ? 0.50 : -0.44;
  const y = side * (front ? 0.108 : 0.126);
  const rings = front ? [
    ring(hi + 0.04, 0.086, 0.086, n, { cx: x, cy: y }),
    ring(hi - 0.14, 0.058, 0.058, n, { cx: x + 0.020, cy: y }),
    ring(hi - 0.26, 0.040, 0.040, n, { cx: x - 0.012, cy: y }),   
    ring(lo + 0.11, 0.028, 0.030, n, { cx: x + 0.006, cy: y }),   
    ring(lo + 0.03, 0.032, 0.036, n, { cx: x + 0.020, cy: y }),   
  ] : [
    ring(hi + 0.06, 0.104, 0.100, n, { cx: x, cy: y }),           
    ring(hi - 0.13, 0.076, 0.072, n, { cx: x + 0.040, cy: y }),   
    ring(hi - 0.27, 0.044, 0.044, n, { cx: x - 0.048, cy: y }),   
    ring(lo + 0.11, 0.028, 0.030, n, { cx: x - 0.006, cy: y }),
    ring(lo + 0.03, 0.032, 0.036, n, { cx: x + 0.012, cy: y }),
  ];
  const limb = stackMesh(rings, { capFirst: true, capLast: true });
  
  
  const hoof = stackMesh([
    ring(lo + 0.030, 0.040, 0.042, n, { cx: x + (front ? 0.020 : 0.012), cy: y }),
    ring(lo, 0.044, 0.046, n, { cx: x + (front ? 0.024 : 0.016), cy: y }),
  ], { capLast: true });
  return mergeMeshes([limb, hoof]);
}


function tail(n = 4) {
  const { lo, hi } = ZONES.barrel;
  const mid = (lo + hi) / 2;
  return stackMesh([
    ring(mid + 0.06, 0.044, 0.044, n, { cx: -0.68 }),
    ring(mid - 0.06, 0.052, 0.052, n, { cx: -0.80 }),
    ring(mid - 0.24, 0.040, 0.040, n, { cx: -0.86 }),
    ring(mid - 0.38, 0.022, 0.022, n, { cx: -0.84 }),
  ], { capFirst: true, capLast: true });
}


export function buildHorse() {
  const eyes = [];
  for (const k of [-1, 0, 1]) {
    const [hx, hy, hz] = headPoint(k);
    for (const side of [-1, 1]) {
      eyes.push({
        name: `eye${k === 0 ? 'C' : (k < 0 ? 'L' : 'R')}${side < 0 ? 'a' : 'b'}`,
        zone: 'necks',
        mesh: jointBall([hx, hy + side * 0.044, hz + 0.020], 0.020, { sides: 4 }),
      });
    }
  }
  const parts = [
    { name: 'barrel', zone: 'barrel', mesh: barrel() },
    
    { name: 'neckL', zone: 'necks', mesh: neck(-1) },
    { name: 'neckC', zone: 'necks', mesh: neck(0) },
    { name: 'neckR', zone: 'necks', mesh: neck(+1) },
    { name: 'legFL', zone: 'legs', mesh: leg(true, -1) },
    { name: 'legFR', zone: 'legs', mesh: leg(true, +1) },
    { name: 'legHL', zone: 'legs', mesh: leg(false, -1) },
    { name: 'legHR', zone: 'legs', mesh: leg(false, +1) },
    { name: 'tail', zone: 'barrel', mesh: tail() },
    ...eyes,
  ].filter((p) => p.mesh && p.mesh.indices && p.mesh.indices.length);

  return { parts, tris: parts.reduce((n, p) => n + p.mesh.tris, 0) };
}

export function horseTriangles() {
  return buildHorse().tris;
}


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
