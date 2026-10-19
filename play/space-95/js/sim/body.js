



const EPS = 1e-7;







function rowsOf(world, y, h) {
  const T = world.tile;
  return [Math.floor((y + EPS) / T), Math.floor((y + h - EPS) / T)];
}


function colsOf(world, x, w) {
  const T = world.tile;
  return [Math.floor((x - w / 2 + EPS) / T), Math.floor((x + w / 2 - EPS) / T)];
}





export function sweepX(world, b, dx) {
  const T = world.tile;
  const [r0, r1] = rowsOf(world, b.y, b.h);
  const half = b.w / 2;
  if (dx > 0) {
    const oldR = b.x + half;
    const newR = oldR + dx;
    for (let c = Math.floor((oldR - EPS) / T) + 1; c <= Math.floor((newR - EPS) / T); c++) {
      for (let r = r0; r <= r1; r++) if (world.solid(c, r)) return { x: c * T - half, hit: true };
    }
    return { x: b.x + dx, hit: false };
  }
  if (dx < 0) {
    const oldL = b.x - half;
    const newL = oldL + dx;
    for (let c = Math.floor((oldL + EPS) / T) - 1; c >= Math.floor((newL + EPS) / T); c--) {
      for (let r = r0; r <= r1; r++) if (world.solid(c, r)) return { x: (c + 1) * T + half, hit: true };
    }
    return { x: b.x + dx, hit: false };
  }
  return { x: b.x, hit: false };
}





export function sweepY(world, b, dy, dropThrough = false) {
  const T = world.tile;
  const [c0, c1] = colsOf(world, b.x, b.w);
  if (dy < 0) {
    const oldB = b.y;
    const newB = oldB + dy;
    for (let r = Math.floor((oldB + EPS) / T) - 1; r >= Math.floor((newB + EPS) / T); r--) {
      const top = (r + 1) * T;
      for (let c = c0; c <= c1; c++) {
        if (world.solid(c, r)) return { y: top, hit: true };
        if (!dropThrough && world.oneWay(c, r) && oldB >= top - EPS) return { y: top, hit: true };
      }
    }
    return { y: newB, hit: false };
  }
  if (dy > 0) {
    const oldT = b.y + b.h;
    const newT = oldT + dy;
    for (let r = Math.floor((oldT - EPS) / T) + 1; r <= Math.floor((newT - EPS) / T); r++) {
      for (let c = c0; c <= c1; c++) if (world.solid(c, r)) return { y: r * T - b.h, hit: true };
    }
    return { y: b.y + dy, hit: false };
  }
  return { y: b.y, hit: false };
}


export function boxFree(world, b) {
  const [r0, r1] = rowsOf(world, b.y, b.h);
  const [c0, c1] = colsOf(world, b.x, b.w);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (world.solid(c, r)) return false;
  return true;
}


export function onGround(world, b) {
  const T = world.tile;
  const r = Math.round(b.y / T) - 1;
  if (Math.abs((r + 1) * T - b.y) > 1e-6) return false;
  const [c0, c1] = colsOf(world, b.x, b.w);
  for (let c = c0; c <= c1; c++) if (world.solid(c, r) || world.oneWay(c, r)) return true;
  return false;
}


export function touchingWall(world, b, dir) {
  const T = world.tile;
  const [r0, r1] = rowsOf(world, b.y, b.h);
  const edge = b.x + (dir * b.w) / 2;
  if (Math.abs(Math.round(edge / T) * T - edge) > 1e-6) return false;
  const c = dir > 0 ? Math.round(edge / T) : Math.round(edge / T) - 1;
  for (let r = r0; r <= r1; r++) if (world.solid(c, r)) return true;
  return false;
}
