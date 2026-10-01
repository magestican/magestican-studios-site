



























export function alphaOf(accMs, msPerTick, snapped = false) {
  if (snapped || msPerTick <= 0) return 1;
  const a = accMs / msPerTick;
  return a < 0 ? 0 : (a > 1 ? 1 : a);
}






export function approach(value, target, dtMs, tauMs) {
  if (tauMs <= 0 || dtMs <= 0) return target;
  return value + (target - value) * (1 - Math.exp(-dtMs / tauMs));
}


export function decay(vel, dtMs, tauMs) {
  if (tauMs <= 0) return 0;
  return vel * Math.exp(-dtMs / tauMs);
}
















export function releaseVelocity(samples, nowMs, windowMs = 160) {
  let dx = 0;
  let dy = 0;
  let from = -1;
  for (let i = samples.length - 1; i >= 0; i -= 1) {
    const s = samples[i];
    if (nowMs - s.t > windowMs) break;
    dx += s.dx;
    dy += s.dy;
    from = s.t;
  }
  if (from < 0) return { vx: 0, vy: 0 };
  const span = Math.max(16, nowMs - from);
  return { vx: dx / span, vy: dy / span };
}










export function createInterp(cap) {
  const prevX = new Int32Array(cap);
  const prevY = new Int32Array(cap);
  const prevId = new Int32Array(cap).fill(-1);

  function snapshot(w) {
    const u = w.u;
    const n = Math.min(u.count, cap);
    for (let i = 0; i < n; i += 1) {
      if (!u.alive[i]) { prevId[i] = -1; continue; }
      prevX[i] = u.x[i];
      prevY[i] = u.y[i];
      prevId[i] = u.id[i];
    }
  }

  function settle(w) {
    snapshot(w);
  }

  
  function hasPrev(w, i) {
    return prevId[i] >= 0 && prevId[i] === w.u.id[i];
  }

  
  function posX(w, i, alpha) {
    if (alpha >= 1 || !hasPrev(w, i)) return w.u.x[i];
    return prevX[i] + (w.u.x[i] - prevX[i]) * alpha;
  }

  function posY(w, i, alpha) {
    if (alpha >= 1 || !hasPrev(w, i)) return w.u.y[i];
    return prevY[i] + (w.u.y[i] - prevY[i]) * alpha;
  }

  return { snapshot, settle, hasPrev, posX, posY };
}
