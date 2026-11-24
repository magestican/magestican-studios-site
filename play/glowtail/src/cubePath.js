








import { surfacePoint, edgePoint, normalOf, faceOf } from './cube.js';

function segPoint(a, b, f, out) {
  const pa = surfacePoint(a), pb = surfacePoint(b);
  const na = normalOf(a), nb = normalOf(b);
  if (faceOf(a) === faceOf(b)) {
    out.x = pa.x + (pb.x - pa.x) * f; out.y = pa.y + (pb.y - pa.y) * f; out.z = pa.z + (pb.z - pa.z) * f;
    out.nx = na.x; out.ny = na.y; out.nz = na.z;
    return out;
  }
  const e = edgePoint(a, b);
  const [p, q, g] = f < 0.5 ? [pa, e, f * 2] : [e, pb, f * 2 - 1];
  out.x = p.x + (q.x - p.x) * g; out.y = p.y + (q.y - p.y) * g; out.z = p.z + (q.z - p.z) * g;
  const nx = na.x + (nb.x - na.x) * f, ny = na.y + (nb.y - na.y) * f, nz = na.z + (nb.z - na.z) * f;
  const l = Math.hypot(nx, ny, nz) || 1;
  out.nx = nx / l; out.ny = ny / l; out.nz = nz / l;
  return out;
}

const moved = (snake, prev) => prev && prev.length && !(prev[0].x === snake[0].x && prev[0].y === snake[0].y && prev[0].z === snake[0].z);





export function chainAt(chain, s, out = {}) {
  const last = chain.length - 1;
  const t = Math.max(0, Math.min(last, s));
  const k = Math.min(last - 1, Math.floor(t));
  if (k < 0) return segPoint(chain[0], chain[0], 0, out);
  return segPoint(chain[k], chain[k + 1], t - k, out);
}


export function cubeChain(snake, prevSnake, alpha) {
  const go = moved(snake, prevSnake);
  const chain = snake.slice();
  if (go && prevSnake.length === snake.length) chain.push(prevSnake[prevSnake.length - 1]);
  return { chain, offset: go ? 1 - alpha : 0 };
}





export function sampleCubeEel(snake, prevSnake, alpha, sub, pos, nor) {
  const { chain, offset } = cubeChain(snake, prevSnake, alpha);
  const n = Math.min((snake.length - 1) * sub + 1, Math.floor(pos.length / 3)); 
  const p = {};
  for (let i = 0; i < n; i++) {
    chainAt(chain, offset + i / sub, p);
    pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
    nor[i * 3] = p.nx; nor[i * 3 + 1] = p.ny; nor[i * 3 + 2] = p.nz;
  }
  return n;
}
