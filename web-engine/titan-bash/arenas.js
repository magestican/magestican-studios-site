




function ring8(rx, ry) {
  const out = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    out.push({ x: Math.round(Math.cos(a) * rx * 10) / 10, y: Math.round(Math.sin(a) * ry * 10) / 10 });
  }
  return out;
}

export const ARENAS = Object.freeze({
  bellRing: {
    name: 'The Bell Ring',
    w: 56, h: 32,
    openEdges: true,
    circles: [{ x: 0, y: 0, r: 3.2 }],
    boxes: [
      { x: -14, y: -7, w: 5, h: 1.2 }, { x: 14, y: -7, w: 5, h: 1.2 },
      { x: -14, y: 7, w: 5, h: 1.2 },  { x: 14, y: 7, w: 5, h: 1.2 },
    ],
    spawns: ring8(20, 10.5),
    
    
    sleeper: { x: 0, y: -8.4, dir: Math.PI / 2 },
  },
});
