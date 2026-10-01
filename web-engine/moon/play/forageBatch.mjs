
















import { MeshData } from '../mesh/meshData.mjs';


export const spotYaw = (id) => (id * 2.39996) % (Math.PI * 2);


export function placeMatrix(x, y, z, yaw) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  
  return [c, 0, s, x, 0, 1, 0, y, -s, 0, c, z];
}





export function batchSpots(pieces, name = 'forage-batch') {
  const md = new MeshData(name);
  for (const p of pieces) md.append(p.data, placeMatrix(p.x, p.y, p.z, p.yaw));
  return md;
}
