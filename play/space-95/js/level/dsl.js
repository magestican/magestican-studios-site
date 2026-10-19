




import { TILE } from '../sim/constants.js';
import { gridWorld } from '../sim/world.js';

const cells = (u) => Math.round(u / TILE);




export function levelBuilder(meta) {
  const H = cells(meta.height ?? 24);
  const floor0 = meta.floor ?? 2; 
  
  const solid = new Map();
  const oneWay = new Map();
  const entities = [];
  const checkpoints = [];
  const counters = {};
  let x = 0; 
  let ground = floor0; 
  let widthCells = 0;

  const id = (kind) => {
    counters[kind] = (counters[kind] ?? 0) + 1;
    return `L${String(meta.id).padStart(2, '0')}-${kind}-${counters[kind]}`;
  };
  const mark = (map, c0, c1, r0, r1) => {
    for (let c = c0; c < c1; c++) {
      if (!map.has(c)) map.set(c, new Set());
      for (let r = r0; r < r1; r++) map.get(c).add(r);
    }
    widthCells = Math.max(widthCells, c1);
  };
  
  const block = (x0, x1, y0, y1) => mark(solid, cells(x0), cells(x1), cells(y0), cells(y1));

  const api = {
    get x() {
      return x;
    },
    get ground() {
      return ground;
    },
    
    run(len) {
      block(x, x + len, 0, ground);
      x += len;
      return api;
    },
    
    gap(len) {
      x += len;
      return api;
    },
    
    step(dy, len) {
      ground += dy;
      return api.run(len);
    },
    
    platform(dx, y, w, kind = 'solid') {
      if (kind === 'one-way') mark(oneWay, cells(x + dx), cells(x + dx + w), cells(y) - 1, cells(y));
      else block(x + dx, x + dx + w, y - TILE, y);
      return api;
    },
    
    pillar(dx, w, h) {
      block(x + dx, x + dx + w, 0, ground + h);
      return api;
    },
    
    ceiling(dx, w, y, thick = 1) {
      block(x + dx, x + dx + w, y, y + thick);
      return api;
    },
    
    put(kind, dx, props = {}, y = ground) {
      const e = { id: props.id ?? id(kind), kind, x: x + dx, y, ...props };
      entities.push(e);
      return e;
    },
    
    beacon(dx = 1) {
      checkpoints.push({ id: checkpoints.length + 1, x: x + dx, y: ground });
      return api;
    },
    
    secret(kind, dx, props, y = ground) {
      return api.put('intel', dx, { secret: kind, ...props }, y);
    },
    build() {
      const finish = entities.find((e) => e.kind === 'finish');
      const W = widthCells + 4;
      const rows = [];
      for (let r = H - 1; r >= 0; r--) {
        let row = '';
        for (let c = 0; c < W; c++) row += solid.get(c)?.has(r) ? '#' : oneWay.get(c)?.has(r) ? '=' : '.';
        rows.push(row);
      }
      const world = gridWorld(rows);
      return {
        id: meta.id,
        name: meta.name,
        world,
        pitCost: meta.pitCost ?? 'heart',
        spawn: { x: 1.5, y: floor0 },
        checkpoints,
        entities,
        finishX: finish ? finish.x : (W - 4) * TILE,
      };
    },
  };
  return api;
}
