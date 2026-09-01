
















































export const PREVIEW = Object.freeze({
  fovDeg: 24,
  elevationDeg: 36,
  
  
  
  
  
  
  
  
  
  padFrac: 0.025,
});

const rad = (deg) => (deg * Math.PI) / 180;








function basis(position, target) {
  const fx = target.x - position.x;
  const fy = target.y - position.y;
  const fz = target.z - position.z;
  const fl = Math.hypot(fx, fy, fz) || 1;
  const f = { x: fx / fl, y: fy / fl, z: fz / fl };
  
  
  
  
  
  
  
  
  
  
  let rx = -f.z;
  let ry = 0;
  let rz = f.x;
  let rl = Math.hypot(rx, ry, rz);
  
  if (rl < 1e-9) { rx = 1; ry = 0; rz = 0; rl = 1; }
  const r = { x: rx / rl, y: ry / rl, z: rz / rl };
  
  const u = {
    x: r.y * f.z - r.z * f.y,
    y: r.z * f.x - r.x * f.z,
    z: r.x * f.y - r.y * f.x,
  };
  return { f, r, u };
}









export function projectPreview(cam, x, y, z) {
  const { f, r, u } = cam.basis;
  const vx = x - cam.position.x;
  const vy = y - cam.position.y;
  const vz = z - cam.position.z;
  const depth = vx * f.x + vy * f.y + vz * f.z;
  if (depth <= 1e-6) return { x: 0, y: 0, depth, behind: true };
  const ax = vx * r.x + vy * r.y + vz * r.z;
  const ay = vx * u.x + vy * u.y + vz * u.z;
  const k = 1 / Math.tan(rad(cam.fovDeg) / 2);
  const aspect = cam.w / cam.h;
  const ndcX = (ax / depth) * (k / aspect);
  const ndcY = (ay / depth) * k;
  return {
    x: (ndcX * 0.5 + 0.5) * cam.w,
    y: (1 - (ndcY * 0.5 + 0.5)) * cam.h,
    depth,
    behind: false,
  };
}


function allInside(cam, points, pad) {
  for (const p of points) {
    const q = projectPreview(cam, p.x, p.y ?? 0, p.z);
    if (q.behind) return false;
    if (q.x < pad || q.x > cam.w - pad || q.y < pad || q.y > cam.h - pad) return false;
  }
  return true;
}

function makeCam(centre, distance, elevationDeg, fovDeg, w, h) {
  const e = rad(elevationDeg);
  
  
  
  
  const position = {
    x: centre.x,
    y: centre.y + distance * Math.sin(e),
    z: centre.z - distance * Math.cos(e),
  };
  const cam = {
    position, target: { ...centre }, fovDeg, w, h, distance, elevationDeg,
    basis: basis(position, centre),
    
    
    
    pxPerMetre: h / (2 * distance * Math.tan(rad(fovDeg) / 2)),
  };
  return cam;
}


















export function fitPreviewCamera(points, {
  w, h, fovDeg = PREVIEW.fovDeg, elevationDeg = PREVIEW.elevationDeg,
  padFrac = PREVIEW.padFrac,
} = {}) {
  const padPx = Math.min(w, h) * padFrac;
  if (!Array.isArray(points) || points.length === 0) {
    throw new Error('fitPreviewCamera: needs at least one point to frame');
  }
  let minX = Infinity; let maxX = -Infinity;
  let minY = Infinity; let maxY = -Infinity;
  let minZ = Infinity; let maxZ = -Infinity;
  for (const p of points) {
    const y = p.y ?? 0;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }
  const centre = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 };
  const span = Math.max(maxX - minX, maxZ - minZ, maxY - minY, 1);

  
  
  
  
  let lo = span * 0.05;
  let hi = span * 0.5;
  let guard = 0;
  while (!allInside(makeCam(centre, hi, elevationDeg, fovDeg, w, h), points, padPx)) {
    hi *= 1.6;
    guard += 1;
    if (guard > 60) throw new Error('fitPreviewCamera: no distance frames these points');
  }
  
  
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (allInside(makeCam(centre, mid, elevationDeg, fovDeg, w, h), points, padPx)) hi = mid;
    else lo = mid;
  }
  let cam = makeCam(centre, hi, elevationDeg, fovDeg, w, h);
  const recentreTolPx = Math.min(w, h) * 0.0025;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  for (let pass = 0; pass < 8; pass += 1) {
    let pMinX = Infinity; let pMaxX = -Infinity;
    let pMinY = Infinity; let pMaxY = -Infinity;
    let behind = false;
    for (const p of points) {
      const q = projectPreview(cam, p.x, p.y ?? 0, p.z);
      if (q.behind) { behind = true; break; }
      if (q.x < pMinX) pMinX = q.x;
      if (q.x > pMaxX) pMaxX = q.x;
      if (q.y < pMinY) pMinY = q.y;
      if (q.y > pMaxY) pMaxY = q.y;
    }
    if (behind) break;
    const dxPx = w / 2 - (pMinX + pMaxX) / 2;
    const dyPx = h / 2 - (pMinY + pMaxY) / 2;
    
    
    
    
    
    
    
    
    if (Math.abs(dxPx) < recentreTolPx && Math.abs(dyPx) < recentreTolPx) break;
    
    
    const { r, u } = cam.basis;
    const mx = dxPx / cam.pxPerMetre;
    const my = dyPx / cam.pxPerMetre;
    centre.x += -r.x * mx + u.x * my;
    centre.y += -r.y * mx + u.y * my;
    centre.z += -r.z * mx + u.z * my;
    
    
    let lo2 = span * 0.05;
    let hi2 = Math.max(cam.distance, span * 0.5);
    let g2 = 0;
    while (!allInside(makeCam(centre, hi2, elevationDeg, fovDeg, w, h), points, padPx)) {
      hi2 *= 1.6;
      g2 += 1;
      if (g2 > 60) throw new Error('fitPreviewCamera: no distance frames these points');
    }
    for (let i = 0; i < 40; i += 1) {
      const mid = (lo2 + hi2) / 2;
      if (allInside(makeCam(centre, mid, elevationDeg, fovDeg, w, h), points, padPx)) hi2 = mid;
      else lo2 = mid;
    }
    cam = makeCam(centre, hi2, elevationDeg, fovDeg, w, h);
  }

  cam.bounds = { minX, maxX, minY, maxY, minZ, maxZ };
  cam.padPx = padPx;
  cam.padFrac = padFrac;
  return cam;
}

















export function roadPixels(metres, cam) {
  const wide = metres * cam.pxPerMetre;
  return {
    max: wide,
    min: wide * Math.sin(rad(cam.elevationDeg)),
  };
}








export function northIsUp(cam) {
  const a = projectPreview(cam, cam.target.x, cam.target.y, cam.target.z);
  const b = projectPreview(cam, cam.target.x, cam.target.y, cam.target.z + 10);
  return !a.behind && !b.behind && b.y < a.y;
}
