






























import { SeededRng } from '../../rng/seededRng.js';
import { roomPlan } from './villagerHome.mjs';
import { INTERIOR, FIXTURE_SIZE, against, free, rect } from './interiorPlan.mjs';

export const WORK_KINDS = Object.freeze(['shop', 'press', 'emporium', 'market', 'townHall']);


export const WORK_ROOM = Object.freeze({ shop: 'backroom', press: 'pressing', emporium: 'shopfloor', market: 'stalls', townHall: 'hall' });


const WALL_H = Object.freeze({ shop: 2.6, press: 2.8, emporium: 2.72, market: 2.6, townHall: 3.0 });



const STYLE_SEED = Object.freeze({ shop: 11, press: 23, emporium: 37, market: 41, townHall: 53 });

const r3 = (v) => Math.round(v * 1000) / 1000;
const S = FIXTURE_SIZE;








export function stockAnchors(plan) {
  return plan.fixtures.filter((f) => f.kind === 'shelf' && f.stock).map((f) => Object.freeze({
    x: f.x, y: r3(f.y + 0.02), z: f.z, rotY: f.rotY, width: r3(f.w - 0.08), depth: f.d,
  }));
}



export const INDOOR_DISPLAY_SCALE = 1.4;





export function workPlan({ kind, seed = 1, level = 1 } = {}) {
  if (!WORK_KINDS.includes(kind)) throw new Error(`unknown work room '${kind}' (kinds: ${WORK_KINDS.join(', ')})`);
  const rng = new SeededRng(seed).child(`workRoom-${kind}`);
  const style = roomPlan({ seed: seed * 7 + STYLE_SEED[kind], species: 'human' }).style;
  const H = WALL_H[kind];
  const hx = r3((INTERIOR.minW + 0.4 + rng.rangeF(0, 0.5)) / 2);
  const hz = r3((INTERIOR.minD + 0.3 + rng.rangeF(0, 0.4)) / 2);
  
  const side = rng.next() < 0.5 ? -1 : 1;
  const door = Object.freeze({ x: r3(side * rng.rangeF(1.5, 2.1)), w: 1.1, h: 2.1, porthole: false });
  const name = WORK_ROOM[kind];
  const fx = [];
  const back = -side;                        
  const wallBack = back * hx, nBack = [side, 0];   
  const wallDoor = side * hx, nDoor = [-side, 0];
  
  
  let counter, keeper = null;

  if (kind === 'shop' || kind === 'emporium') {
    
    
    const cw = { ...S.counter, w: 2.3, h: kind === 'shop' ? 0.95 : 0.78 };
    const cx = r3(back * (hx - 2.35)), cz = r3(-hz + 2.0 + rng.rangeF(0, 0.3));
    
    
    
    
    
    const near = { x: cx, z: r3(cz + cw.d / 2 + 0.55) }, far = { x: cx, z: r3(cz - cw.d / 2 - 0.55) };
    fx.push(free('counter', name, cx, cz, cw, kind === 'shop' ? Math.PI : 0));
    counter = near;
    if (kind === 'emporium') keeper = { ...far, heading: 0 };
    
    const bays = kind === 'shop' ? Math.max(1, Math.min(3, level | 0)) : 3;
    for (let b = 0; b < bays; b++) {
      const along = r3(-hz + 1.0 + b * 1.35 + rng.rangeF(-0.05, 0.05));
      for (const y of [0.95, 1.5]) fx.push(against('shelf', name, nBack, wallBack, along, { ...S.shelf, w: 1.15 }, { onWall: true, y: r3(Math.min(y, H - 0.5)), ...(kind === 'shop' ? { stock: true } : {}) }));
    }
    if (kind === 'emporium') {
      for (let b = 0; b < 2; b++) {
        const along = r3(0.2 + b * 1.35);
        for (const y of [0.95, 1.5]) fx.push(against('shelf', name, nDoor, wallDoor, along, { ...S.shelf, w: 1.15 }, { onWall: true, y }));
      }
    } else {
      
      fx.push(against('wardrobe', name, nDoor, wallDoor, r3(-hz + 2.2 + rng.rangeF(0, 0.3)), { ...S.wardrobe, h: Math.min(S.wardrobe.h, H - 0.2) }));
    }
    
    const tx = r3(side * (hx - 2.0)), tz = r3(hz - 1.3 - rng.rangeF(0, 0.2));
    fx.push(free('table', name, tx, tz, S.table, rng.rangeF(-0.06, 0.06)));
    fx.push(free('stool', name, r3(tx - side * (S.table.w / 2 + 0.3)), tz, S.stool, 0, { spin: rng.rangeF(0, 1) }));
  } else if (kind === 'press') {
    
    
    const kz = r3(-hz + 0.5 + S.stove.w / 2);
    fx.push(against('stove', name, nBack, wallBack, kz, S.stove));
    const bench = { ...S.counter, w: 1.8 };
    const bz = r3(kz + S.stove.w / 2 + 0.08 + bench.w / 2);
    fx.push(against('counter', name, nBack, wallBack, bz, bench, { sinkAt: 0 }));
    fx.push(against('sink', name, nBack, wallBack, bz, { w: 0.5, d: 0.4, h: bench.h }, { part: 'counter' }));
    
    counter = { x: r3(wallBack + side * (bench.d + 0.55)), z: bz };
    
    const oz = r3(-hz + 2.0 + rng.rangeF(0, 0.3));
    for (const y of [0.8, 1.25, 1.7]) fx.push(against('shelf', name, nDoor, wallDoor, oz, { ...S.shelf, w: 1.3 }, { onWall: true, y, stock: true }));
    const tx = r3(rng.rangeF(-0.3, 0.3)), tz = r3(hz - 1.3);
    fx.push(free('table', name, tx, tz, S.table, rng.rangeF(-0.06, 0.06)));
    for (const s of [-1, 1]) fx.push(free('stool', name, r3(tx + s * (S.table.w / 2 + 0.28)), tz, S.stool, 0, { spin: rng.rangeF(0, 1) }));
  } else if (kind === 'market') {
    
    
    const stall = { ...S.counter, w: 1.7, h: 0.92 };
    const sz = r3(-0.1 + rng.rangeF(-0.1, 0.1));
    const step = r3(Math.min(2.6, (hx * 2 - stall.w - 0.8) / 2));
    for (const i of [-1, 0, 1]) {
      fx.push(free('counter', name, r3(i * step), sz, stall, 0));
      fx.push(free('stool', name, r3(i * step + 0.4), r3(sz - stall.d / 2 - 0.55), S.stool, 0, { spin: rng.rangeF(0, 1) }));
    }
    
    
    counter = { x: 0, z: r3(sz + stall.d / 2 + 0.5) };
    keeper = { x: r3(-0.35), z: r3(sz - stall.d / 2 - 0.5), heading: 0 };
    for (const y of [1.0, 1.5]) fx.push(against('shelf', name, nBack, wallBack, r3(-0.5), { ...S.shelf, w: 1.2 }, { onWall: true, y }));
  } else {
    
    
    for (const along of [-1.2, 0.1]) for (const y of [1.1, 1.65]) fx.push(against('shelf', name, nBack, wallBack, r3(along), { ...S.shelf, w: 1.1 }, { onWall: true, y }));
    const cw = { ...S.counter, w: 2.6, h: 1.0 };
    const cx = r3(back * (hx - 2.0)), cz = r3(-hz + 1.8);
    fx.push(free('counter', name, cx, cz, cw, Math.PI / 2 * side));
    counter = { x: r3(cx + side * (cw.d / 2 + 0.55)), z: cz };
    
    keeper = { x: r3(cx - side * (cw.d / 2 + 0.5)), z: cz, heading: r3(side * Math.PI / 2) };
    const tx = r3(side * (hx - 2.2)), tz = r3(hz - 1.4);
    fx.push(free('table', name, tx, tz, { ...S.table, w: 1.3 }, rng.rangeF(-0.05, 0.05)));
    fx.push(free('stool', name, tx, r3(tz + S.table.d / 2 + 0.3), S.stool, 0, { spin: rng.rangeF(0, 1) }));
  }

  
  
  const winX = r3(door.x - side * (door.w / 2 + 0.7));
  fx.push(against('window', name, [0, 1], -hz, winX, S.window, { onWall: true, y: r3(Math.min(0.9, H - 0.9)) }));
  fx.push(against('lamp', name, nDoor, wallDoor, r3(hz - 0.5), S.lamp));
  fx.push(free('rug', name, r3(door.x * 0.4), r3(-0.2 + rng.rangeF(-0.2, 0.2)), { ...S.rug, w: 1.8, d: 1.2 }, rng.rangeF(-0.2, 0.2), { flat: true }));

  
  const JAMB = 0.07, runs = [];
  const run = (k, axis, at, a0, a1, h, n) => { if (a1 - a0 > 0.02) runs.push(Object.freeze({ kind: k, axis, at: r3(at), a0: r3(a0), a1: r3(a1), h: r3(h), n })); };
  run('outer', 'z', -hz, -hx, door.x - door.w / 2 - JAMB, H, [0, 1]);
  run('outer', 'z', -hz, door.x + door.w / 2 + JAMB, hx, H, [0, 1]);
  run('cut', 'z', hz, -hx, hx, INTERIOR.cutH, [0, -1]);
  run('outer', 'x', -hx, -hz, hz, H, [1, 0]);
  run('outer', 'x', hx, -hz, hz, H, [-1, 0]);

  const room = rect(name, -hx, hx, -hz, hz);
  const inset = INTERIOR.floorInset;
  return Object.freeze({
    work: kind, species: 'human', seed, level, W: r3(hx * 2), D: r3(hz * 2), hx, hz, wallH: H,
    door, doorways: Object.freeze([]), rooms: Object.freeze({ [name]: room }), roomNames: Object.freeze([name]),
    runs: Object.freeze(runs), fixtures: Object.freeze(fx),
    floor: Object.freeze([Object.freeze({ room: name, x: 0, z: 0, hx: r3(hx - inset), hz: r3(hz - inset) })]),
    counter: Object.freeze(counter), keeper: keeper ? Object.freeze(keeper) : null, windowSide: side, style,
  });
}
