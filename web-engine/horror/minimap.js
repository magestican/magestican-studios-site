







































export const MAP = Object.freeze({
  pitch: 0.58,      
  eye: 26,          
  focal: 260,       
  range: 40,        
  behind: 9,        
  deckGap: 7.5,     
  eyeHeight: 1.2,   
});







export function mapAxes(bearing) {
  const s = Math.sin(bearing); const c = Math.cos(bearing);
  return { forward: { x: -s, z: c }, right: { x: -c, z: -s } };
}









export function mapProject(wx, wy, wz, player, cx, cy, bearing) {
  const dx = wx - player.x;
  const dy = wy - MAP.eyeHeight;
  const dz = wz - player.z;

  
  
  
  
  
  
  
  const s = Math.sin(bearing); const c = Math.cos(bearing);
  
  const rx = -(dx * c) - (dz * s);
  
  const rz = -(dx * s) + (dz * c);

  
  
  const cp = Math.cos(MAP.pitch); const sp = Math.sin(MAP.pitch);
  const ry = (dy * cp) + (rz * sp);
  const rzz = (rz * cp) - (dy * sp);

  const depth = rzz + MAP.eye;
  if (depth < 1.2) return null;
  const f = MAP.focal / depth;
  return [cx + rx * f, cy - ry * f];
}
