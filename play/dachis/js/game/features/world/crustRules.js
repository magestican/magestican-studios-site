








export const CELL = 2, WARN = 0.8;
export const period = (s) => s.black + s.hot;
export function crustAt(s, t) {
  const P = period(s), k = (((t + s.phase) % P) + P) % P;
  return k < s.black - WARN ? 'black' : k < s.black ? 'warn' : 'molten';
}
export const solidAt = (s, t) => crustAt(s, t) !== 'molten';



export function crossing(strips, { speed = 3.3, t0 = 0, horizon = 40, dt = 0.05, margin = 0.1 } = {}) {
  const step = speed * dt, depth = strips.length * CELL, M = Math.ceil(depth / step) + 1;
  const ok = (i, t) => { const p = i * step; if (i <= 0 || p >= depth) return true; const s = strips[Math.min(strips.length - 1, Math.floor(p / CELL))]; return solidAt(s, t) && solidAt(s, t + margin); };
  let at = new Uint8Array(M + 1); at[0] = 1;
  for (let n = 1, t = t0 + dt; t <= t0 + horizon; n++, t = t0 + n * dt) {
    const next = new Uint8Array(M + 1);
    for (let i = 0; i <= M; i++) {
      if (!at[i]) continue;
      if (ok(i, t)) next[i] = 1;
      if (i < M && ok(i + 1, t)) next[i + 1] = 1;
    }
    if (next[M]) return t;
    at = next;
  }
  return null;
}

export function straight(strips, { speed = 3.3, t0 = 0, margin = 0.1 } = {}) {
  const depth = strips.length * CELL;
  for (let p = 0.05; p < depth; p += 0.1) { const s = strips[Math.floor(p / CELL)], t = t0 + p / speed; if (!solidAt(s, t) || !solidAt(s, t + margin)) return false; }
  return true;
}
