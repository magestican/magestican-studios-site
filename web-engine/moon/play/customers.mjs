

























import { MS } from '../economy/math.mjs';
import { toWorld } from '../world/collision.mjs';

export const CUSTOMER = Object.freeze({
  
  walkMps: 1.1,
  
  payS: 1.6,
  
  sameSlotGapS: 2.2,
  maxWalkers: 3,
  
  fadeS: 0.45,
});





export function collectSales(visits, events, route, cfg = CUSTOMER) {
  const out = visits.slice();
  for (const e of events) {
    if (e.type !== 'sale') continue;
    const n = out.filter((s) => s.at === e.at).length;
    const v = visitOf({ id: `${e.at}:${n}`, at: e.at, slotIndex: n, good: e.good, coins: e.coins }, route, cfg);
    v.walker = out.filter((w) => w.walker && w.startMs <= v.startMs && w.endMs > v.startMs).length < cfg.maxWalkers;
    out.push(v);
  }
  return out;
}

const segLen = (a, b) => Math.hypot(b.x - a.x, b.z - a.z);






export function customerRoute(p, anchors, { entry = [], exit = [] } = {}) {
  const path = anchors.customerPath.map((q) => toWorld(p, q.x, q.z));
  const counter = toWorld(p, anchors.counter.x, anchors.counter.z);
  let payLocal = 0;
  path.forEach((q, i) => { if (segLen(q, counter) < segLen(path[payLocal], counter)) payLocal = i; });
  const points = [...entry, ...path, ...exit];
  const cum = [0];
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + segLen(points[i - 1], points[i]));
  return { points, cum, payAtM: cum[entry.length + payLocal], totalM: cum[cum.length - 1], counter };
}


export function visitOf(sale, route, cfg = CUSTOMER) {
  const startMs = sale.at + Math.round(sale.slotIndex * cfg.sameSlotGapS * MS);
  const payMs = startMs + Math.round((route.payAtM / cfg.walkMps) * MS);
  const leaveMs = payMs + Math.round(cfg.payS * MS);
  const endMs = leaveMs + Math.round(((route.totalM - route.payAtM) / cfg.walkMps) * MS);
  return { ...sale, startMs, payMs, leaveMs, endMs };
}


export const live = (visits, now) => visits.filter((v) => v.walker && v.startMs <= now && now < v.endMs);

function pointAt(route, d) {
  const { points, cum } = route;
  if (d <= 0) return { x: points[0].x, z: points[0].z, i: 0 };
  for (let i = 1; i < points.length; i++) {
    if (d <= cum[i]) {
      const u = (d - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
      return { x: points[i - 1].x + (points[i].x - points[i - 1].x) * u, z: points[i - 1].z + (points[i].z - points[i - 1].z) * u, i };
    }
  }
  const last = points[points.length - 1];
  return { x: last.x, z: last.z, i: points.length - 1 };
}


export function walkerPose(v, route, now, cfg = CUSTOMER) {
  let d, phase, speed = cfg.walkMps;
  if (now < v.payMs) { phase = 'in'; d = ((now - v.startMs) / MS) * cfg.walkMps; }
  else if (now < v.leaveMs) { phase = 'paying'; d = route.payAtM; speed = 0; }
  else { phase = 'out'; d = route.payAtM + ((now - v.leaveMs) / MS) * cfg.walkMps; }
  d = Math.max(0, Math.min(route.totalM, d));
  const at = pointAt(route, d);
  let heading;
  if (phase === 'paying') {
    heading = Math.atan2(route.counter.x - at.x, route.counter.z - at.z);
  } else {
    const i = Math.max(1, at.i);
    const a = route.points[i - 1], b = route.points[i];
    heading = Math.atan2(b.x - a.x, b.z - a.z);
  }
  const edge = Math.min(now - v.startMs, v.endMs - now) / MS;
  const scale = Math.max(0, Math.min(1, edge / cfg.fadeS));
  return { x: at.x, z: at.z, heading, speed, phase, scale };
}


export const VISIT_TAIL_MS = 5000;


export const pruneVisits = (visits, now) => visits.filter((v) => v.endMs + VISIT_TAIL_MS > now);
