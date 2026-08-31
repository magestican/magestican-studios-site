











































export const NEAR_W = 1e-4;









export const CULL_NDC = Object.freeze({ x: 0, y: 0, z: 2 });









export function snapNdc(x, y, resX, resY) {
  
  
  
  const px = Math.floor((x * 0.5 + 0.5) * resX + 0.5);
  const py = Math.floor((y * 0.5 + 0.5) * resY + 0.5);
  return { x: (px / resX) * 2 - 1, y: (py / resY) * 2 - 1 };
}












export function ps1Project(clip, snapRes = null) {
  const w = clip.w;

  
  
  
  if (!(w > NEAR_W)) {
    
    
    
    return { ...CULL_NDC, culled: true };
  }

  const x = clip.x / w;
  const y = clip.y / w;
  const z = clip.z / w;

  if (!snapRes) return { x, y, z, culled: false };

  const s = snapNdc(x, y, snapRes.x, snapRes.y);
  return { x: s.x, y: s.y, z, culled: false };
}










export function snapDisplacementPx(clip, snapRes) {
  const raw = ps1Project(clip, null);
  if (raw.culled) return 0;
  const snapped = ps1Project(clip, snapRes);
  const dx = (snapped.x - raw.x) * 0.5 * snapRes.x;
  const dy = (snapped.y - raw.y) * 0.5 * snapRes.y;
  return Math.hypot(dx, dy);
}
