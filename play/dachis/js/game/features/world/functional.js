















export const FLIGHT_MIN_DROP = 1.0, FLIGHT_MIN_GRADE = 0.3;

export const FENCE_REACH = 1.4, FENCE_MIN_DROP = 0.35;
const LAVA = 7; 



export function flightDrop(W, flight) {
  let hi = -Infinity, lo = Infinity;
  for (const o of flight) {
    const dx = Math.sin(o.rot || 0), dy = Math.cos(o.rot || 0);
    hi = Math.max(hi, W.groundAt(o.x - dx * 0.3, o.y - dy * 0.3));
    lo = Math.min(lo, W.groundAt(o.x + dx * 0.3, o.y + dy * 0.3));
  }
  return hi - lo;
}



export function flightsOf(objects) {
  
  const flights = [];
  for (const s of objects.filter((o) => o.kind === 'step')) {
    const f = flights.find((q) => Math.hypot(q[q.length - 1].x - s.x, q[q.length - 1].y - s.y) < 0.75);
    if (f) f.push(s); else flights.push([s]);
  }
  return flights;
}




export function bridgeSpans(W, o) {
  const dx = Math.sin(o.rot || 0), dy = Math.cos(o.rot || 0), px = dy, py = -dx;
  const banks = [-1.2, 1.2].every((t) => W.walkable(o.x + dx * t, o.y + dy * t, 0.2));
  const gap = [-0.3, 0, 0.3].some((t) => [-0.9, 0.9].some((s) => !W.walkable(o.x + dx * t + px * s, o.y + dy * t + py * s, 0)));
  return banks && gap;
}



export const flightRun = (flight) => Math.hypot(flight[flight.length - 1].x - flight[0].x, flight[flight.length - 1].y - flight[0].y) + 0.6;



export function fenceGuards(W, o) {
  const h = W.groundAt(o.x, o.y);
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    const x = o.x + Math.cos(a) * FENCE_REACH, y = o.y + Math.sin(a) * FENCE_REACH;
    if (h - W.groundAt(x, y) >= FENCE_MIN_DROP || W.tileType(x, y) === LAVA) return true;
  }
  return false;
}




export const MAN_MADE = {
  step: null, 
  bridge: bridgeSpans,
  fence: fenceGuards,
};



export function whyNot(W, only = () => true) {
  const out = [];
  const objs = W.objects.filter(only);
  for (const f of flightsOf(objs)) {
    const d = flightDrop(W, f), g = d / flightRun(f);
    if (d < FLIGHT_MIN_DROP || g < FLIGHT_MIN_GRADE) out.push(`a flight of ${f.length} steps at ${f[0].x.toFixed(1)},${f[0].y.toFixed(1)} drops ${d.toFixed(2)} at grade ${g.toFixed(2)} (needs ${FLIGHT_MIN_DROP} at ${FLIGHT_MIN_GRADE}): stairs to nowhere`);
  }
  for (const o of objs) {
    const rule = MAN_MADE[o.kind];
    if (rule && !rule(W, o)) out.push(`${o.kind} at ${o.x.toFixed(1)},${o.y.toFixed(1)} has no job (${o.kind === 'fence' ? 'no edge to guard' : 'nothing to span'})`);
  }
  return out;
}




export const DECK = { half: 0.92, wide: 0.66, thick: 0.2, foot: 0.85 }; 

export function bridgeFrame(W, o) {
  const dx = Math.sin(o.rot || 0), dy = Math.cos(o.rot || 0), px = dy, py = -dx, L = DECK.half;
  const hm = W.groundAt(o.x - dx * L, o.y - dy * L), hp = W.groundAt(o.x + dx * L, o.y + dy * L);
  const line = (t) => (hm + hp) / 2 + (hp - hm) / 2 * (t / L);
  let lift = 0;
  for (let t = -L; t <= L + 1e-6; t += L / 6) for (const s of [-DECK.wide, 0, DECK.wide]) lift = Math.max(lift, W.groundAt(o.x + dx * t + px * s, o.y + dy * t + py * s) - line(t));
  const h = (hm + hp) / 2 + lift + 0.04;
  return { h, pitch: Math.atan2(hm - hp, 2 * L), topAt: (t) => h + (hp - hm) / 2 * (t / L) };
}


export function bridgeClips(W, o) {
  const f = bridgeFrame(W, o), dx = Math.sin(o.rot || 0), dy = Math.cos(o.rot || 0), px = dy, py = -dx, out = [];
  for (let t = -DECK.half; t <= DECK.half + 1e-6; t += DECK.half / 8) for (const s of [-DECK.wide, -DECK.wide / 2, 0, DECK.wide / 2, DECK.wide]) {
    const g = W.groundAt(o.x + dx * t + px * s, o.y + dy * t + py * s);
    if (g > f.topAt(t) - 0.01) out.push(`bridge deck cut by the ground at ${t.toFixed(2)},${s.toFixed(2)} (ground ${g.toFixed(2)} > deck ${f.topAt(t).toFixed(2)})`);
  }
  
  for (let t = -DECK.half; t <= DECK.half + 1e-6; t += DECK.half / 4) {
    const g = W.groundAt(o.x + dx * t, o.y + dy * t);
    if (f.topAt(t) - g > 0.12) out.push(`bridge deck ${(f.topAt(t) - g).toFixed(2)} above the walking ground at ${t.toFixed(2)}: the kid would walk inside it`);
  }
  for (const t of [-DECK.half, DECK.half]) for (const s of [-DECK.wide, DECK.wide]) {
    const g = W.groundAt(o.x + dx * t + px * s, o.y + dy * t + py * s);
    if (f.topAt(t) - DECK.foot > g) out.push(`bridge foot hangs ${(f.topAt(t) - DECK.foot - g).toFixed(2)} above the ground at ${t.toFixed(2)},${s.toFixed(2)}`);
  }
  return out;
}





export const ROAD_PAD = 0.1;
const segDist = (ax, ay, bx, by, x, y) => {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L));
  return Math.hypot(ax + dx * t - x, ay + dy * t - y);
};


export function onRoad(W, x, y) {
  return (W.paths || []).findIndex((p) => p.pts.some((q, k) => k > 0 && segDist(p.pts[k - 1][0], p.pts[k - 1][1], q[0], q[1], x, y) < p.half + ROAD_PAD));
}


export function acrossRoad(W, only = () => true) {
  const rings = new Map(), out = [];
  for (const o of W.objects) if (o.kind === 'fence' && only(o)) (rings.get(o.ring) || rings.set(o.ring, []).get(o.ring)).push(o);
  for (const [id, list] of rings) {
    list.sort((a, b) => (a.k || 0) - (b.k || 0));
    const n = list.some((o) => o.open) || list.length < 3 ? list.length - 1 : list.length;
    for (let i = 0; i < n; i++) {
      const a = list[i], b = list[(i + 1) % list.length];
      for (let t = 0; t <= 1.0001; t += 0.125) {
        const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t, p = onRoad(W, x, y);
        if (p >= 0) { out.push(`fence ${id} ${t === 0 ? 'post' : 'rail'} at ${x.toFixed(1)},${y.toFixed(1)} stands on path ${p} (half ${W.paths[p].half}): it blocks the road`); break; }
      }
    }
  }
  return out;
}



export const ON_LAVA_OK = new Set(['bridge', 'flow']); 

export function onLava(W, only = () => true) {
  return W.objects.filter((o) => only(o) && !ON_LAVA_OK.has(o.kind) && !(o.kind in MAN_MADE) && W.tileType(o.x, o.y) === LAVA).map((o) => `${o.kind} at ${o.x.toFixed(1)},${o.y.toFixed(1)} stands in the lava`);
}
