




































export const RAIL = Object.freeze({
  
  
  
  segment: 10,
  
  
  
  
  
  height: 3.15,
  
  
  
  
  
  ahead: 4.2,
  
  
  
  
  
  
  
  
  lateral: 0.58,
  
  targetHeight: 1.30,
  
  
  
  
  hysteresis: 1.4,
  
  
  
  
  pan: 0.18,
  fov: 62,
});







export function railNodes(length, opt = {}) {
  const cfg = { ...RAIL, ...opt };
  const nodes = [];
  const count = Math.max(1, Math.ceil(length / cfg.segment));
  for (let i = 0; i < count; i += 1) {
    const from = i * cfg.segment;
    const to = Math.min(length, from + cfg.segment);
    const side = i % 2 === 0 ? 1 : -1;
    nodes.push({
      from,
      to,
      eye: { x: side * cfg.lateral, y: cfg.height, z: to + cfg.ahead },
      
      target: { x: 0, y: cfg.targetHeight, z: (from + to) / 2 },
    });
  }
  return nodes;
}







export function nodeAt(nodes, z, prev = -1, hysteresis = RAIL.hysteresis) {
  if (!nodes.length) return -1;
  if (prev >= 0 && prev < nodes.length) {
    const n = nodes[prev];
    if (z >= n.from - hysteresis && z < n.to + hysteresis) return prev;
  }
  for (let i = 0; i < nodes.length; i += 1) {
    if (z < nodes[i].to) return i;
  }
  return nodes.length - 1;
}









export function railPlacement(nodes, i, player, opt = {}) {
  const cfg = { ...RAIL, ...opt };
  const n = nodes[Math.max(0, Math.min(nodes.length - 1, i))];
  return {
    eye: { ...n.eye },
    target: {
      x: n.target.x + (player.x - n.target.x) * cfg.pan,
      y: n.target.y,
      z: n.target.z + (player.z - n.target.z) * cfg.pan,
    },
    fov: cfg.fov,
  };
}
