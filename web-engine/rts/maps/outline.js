



























































export const DECIMATE_MM = 900;


export const SMOOTH_PASSES = 2;



















export function traceLoops(cells, n, sector) {
  const at = (cx, cy) => (cx < 0 || cy < 0 || cx >= n || cy >= n ? -1 : cells[cy * n + cx]);
  const key = (px, py) => py * (n + 1) + px;

  
  const outgoing = new Map();
  const push = (ax, ay, bx, by) => {
    const k = key(ax, ay);
    const list = outgoing.get(k);
    if (list) list.push([bx, by]); else outgoing.set(k, [[bx, by]]);
  };

  let edgeCount = 0;
  for (let cy = 0; cy < n; cy += 1) {
    for (let cx = 0; cx < n; cx += 1) {
      if (cells[cy * n + cx] !== sector) continue;
      
      if (at(cx, cy - 1) !== sector) { push(cx, cy, cx + 1, cy); edgeCount += 1; }
      if (at(cx + 1, cy) !== sector) { push(cx + 1, cy, cx + 1, cy + 1); edgeCount += 1; }
      if (at(cx, cy + 1) !== sector) { push(cx + 1, cy + 1, cx, cy + 1); edgeCount += 1; }
      if (at(cx - 1, cy) !== sector) { push(cx, cy + 1, cx, cy); edgeCount += 1; }
    }
  }

  const loops = [];
  
  
  
  const starts = [...outgoing.keys()].sort((a, b) => a - b);
  let used = 0;
  for (const s of starts) {
    while ((outgoing.get(s) || []).length > 0) {
      const loop = [];
      let px = s % (n + 1);
      let py = Math.trunc(s / (n + 1));
      for (;;) {
        const list = outgoing.get(key(px, py));
        if (!list || list.length === 0) break;
        const [nx, ny] = list.shift();
        used += 1;
        loop.push([px, py]);
        px = nx;
        py = ny;
        if (px === s % (n + 1) && py === Math.trunc(s / (n + 1))) break;
        if (used > edgeCount) throw new Error('traceLoops: walk did not terminate');
      }
      if (loop.length >= 4) loops.push(loop);
    }
  }
  return loops;
}












export function chaikinClosed(loop) {
  const out = [];
  for (let i = 0; i < loop.length; i += 1) {
    const [ax, ay] = loop[i];
    const [bx, by] = loop[(i + 1) % loop.length];
    out.push([Math.trunc((3 * ax + bx) / 4), Math.trunc((3 * ay + by) / 4)]);
    out.push([Math.trunc((ax + 3 * bx) / 4), Math.trunc((ay + 3 * by) / 4)]);
  }
  return out;
}









export function decimate(loop, tolMm) {
  if (loop.length < 5) return loop;
  const out = [loop[0]];
  let anchor = loop[0];
  for (let i = 1; i < loop.length - 1; i += 1) {
    const p = loop[i];
    const q = loop[i + 1];
    const dx = q[0] - anchor[0];
    const dy = q[1] - anchor[1];
    const cross = dx * (p[1] - anchor[1]) - dy * (p[0] - anchor[0]);
    const span2 = dx * dx + dy * dy;
    if (cross * cross <= tolMm * tolMm * span2) continue;   
    out.push(p);
    anchor = p;
  }
  out.push(loop[loop.length - 1]);
  return out;
}

















export function sectorOutlines(cells, n, cellMm, sectorCount) {
  const out = [];
  for (let s = 0; s < sectorCount; s += 1) {
    const loops = [];
    for (const raw of traceLoops(cells, n, s)) {
      let loop = raw.map(([px, py]) => [px * cellMm, py * cellMm]);
      for (let p = 0; p < SMOOTH_PASSES; p += 1) loop = chaikinClosed(loop);
      loop = decimate(loop, DECIMATE_MM);
      const flat = new Int32Array(loop.length * 2);
      for (let i = 0; i < loop.length; i += 1) {
        flat[i * 2] = loop[i][0];
        flat[i * 2 + 1] = loop[i][1];
      }
      loops.push(flat);
    }
    out.push(loops);
  }
  return out;
}








export function loopArea2(flat) {
  let a = 0;
  const n = flat.length / 2;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    a += flat[i * 2] * flat[j * 2 + 1] - flat[j * 2] * flat[i * 2 + 1];
  }
  return a;
}
