











import { STEP } from './constants.js';
import { lightAt } from './light.js';

export const BLOOM = Object.freeze({
  OPEN: 0.4, 
  LINGER: 0.8, 
  CLOSE: 0.4, 
});
const FLOOR_TOL = 0.06; 


export function createBlooms(level) {
  if (!level.blooms?.length) return null;
  return level.blooms.map((b) => ({ id: b.id, x: b.x, y: b.y, w: b.w ?? 4, stub: b.stub ?? 1, u: 0, dark: 0, state: 'closed' }));
}


const padWidth = (pad) => pad.stub + (pad.w - pad.stub) * pad.u;


export function stepBlooms(s) {
  for (const pad of s.blooms) {
    const lit = lightAt(s, pad.x, pad.y);
    const before = pad.state;
    if (lit) {
      pad.dark = 0;
      pad.u = Math.min(1, pad.u + STEP / BLOOM.OPEN);
      pad.state = pad.u >= 1 ? 'open' : 'opening';
    } else {
      pad.dark += STEP;
      if (pad.dark > BLOOM.LINGER + 1e-9 && pad.u > 0) {
        pad.u = Math.max(0, pad.u - STEP / BLOOM.CLOSE);
        pad.state = pad.u <= 0 ? 'closed' : 'closing';
      }
    }
    if (pad.state !== before && (pad.state === 'opening' || pad.state === 'closing'))
      s.events.push({ type: pad.state === 'opening' ? 'padOpen' : 'padClose', id: pad.id, x: pad.x, y: pad.y });
  }
}


function bloomFloorAt(list, b, x = b.x) {
  if (!list) return null;
  let best = null;
  for (const pad of list) {
    const half = padWidth(pad) / 2;
    if (x + b.w / 2 <= pad.x - half || x - b.w / 2 >= pad.x + half) continue;
    if (pad.y > b.y + FLOOR_TOL) continue;
    if (!best || pad.y > best.y) best = pad;
  }
  return best ? { y: best.y, vs: 0, vx: 0, id: best.id, bloom: true, up: FLOOR_TOL, noWall: true } : null;
}


export function attachBlooms(world) {
  const prev = world.floorAt;
  world.floorAt = (b, x = b.x) => {
    const f = bloomFloorAt(world.bloomState, b, x);
    const o = prev ? prev(b, x) : null;
    if (!o) return f;
    if (!f) return o;
    return f.y >= o.y ? f : o;
  };
  return world;
}


export function padUnder(list, p) {
  for (const pad of list ?? []) if (Math.abs(p.y - pad.y) < 1e-6 && Math.abs(p.x - pad.x) < padWidth(pad) / 2 + p.w / 2) return pad;
  return null;
}
