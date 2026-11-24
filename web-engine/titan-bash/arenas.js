




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

  
  
  
  shatterfield: {
    name: 'Shatterfield',
    w: 60, h: 34,
    openEdges: false,
    circles: [],
    boxes: [],
    crystals: [
      
      { x: 9, y: 0, r: 1.3 }, { x: 4.5, y: 6.2, r: 1.3 }, { x: -4.5, y: 6.2, r: 1.3 },
      { x: -9, y: 0, r: 1.3 }, { x: -4.5, y: -6.2, r: 1.3 }, { x: 4.5, y: -6.2, r: 1.3 },
      
      { x: 14, y: 12, r: 1.3 }, { x: -14, y: 12, r: 1.3 }, { x: 14, y: -12, r: 1.3 }, { x: -14, y: -12, r: 1.3 },
      { x: 26, y: 10, r: 1.3 }, { x: -26, y: 10, r: 1.3 }, { x: 26, y: -10, r: 1.3 }, { x: -26, y: -10, r: 1.3 },
    ],
    spawns: ring8(20, 10.5),
    
    sleeper: { x: 0, y: 8.4, dir: -Math.PI / 2 },
  },

  
  
  
  
  tidewall: {
    name: 'Tidewall Causeway',
    w: 60, h: 34,
    openEdges: true,
    floor: [
      { x: -24, y: 0, w: 12, h: 34 }, { x: 24, y: 0, w: 12, h: 34 },
      { x: 0, y: -10, w: 36, h: 6 }, { x: 0, y: 0, w: 36, h: 6 }, { x: 0, y: 10, w: 36, h: 6 },
    ],
    circles: [],
    boxes: [-10, 0, 10].flatMap((by) => [-1, 1].flatMap((side) => [-9, 9].map((x) => (
      { x, y: by + side * 2.9, w: 6, h: 0.5 })))),
    tide: { bridges: [2, 4, 3], knockY: 1 },
    
    
    stormWallMin: 0.75,
    
    
    spawns: [
      { x: 23.66, y: 4 }, { x: 20.78, y: 12 }, { x: -20.78, y: 12 }, { x: -23.66, y: 4 },
      { x: -23.66, y: -4 }, { x: -20.78, y: -12 }, { x: 20.78, y: -12 }, { x: 23.66, y: -4 },
    ],
    
    sleeper: { x: 0, y: -5, dir: Math.PI / 2 },
  },
});


export const ARENA_ORDER = Object.freeze(['bellRing', 'shatterfield', 'tidewall']);



export function onFloor(arena, x, y, pad = 0) {
  if (Math.abs(x) > arena.w / 2 - pad || Math.abs(y) > arena.h / 2 - pad) return false;
  if (!arena.floor) return true;
  const on = (px, py) => arena.floor.some((f) => Math.abs(px - f.x) <= f.w / 2 && Math.abs(py - f.y) <= f.h / 2);
  if (!pad) return on(x, y);
  return on(x - pad, y) && on(x + pad, y) && on(x, y - pad) && on(x, y + pad);
}


export function coverOf(arena, crystals = []) {
  const up = crystals.filter((c) => c.down <= 0);
  return { circles: up.length ? [...arena.circles, ...up] : arena.circles, boxes: arena.boxes };
}
