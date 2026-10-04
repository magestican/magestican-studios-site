




import { G, S } from '../../state.js';
import { toast } from '../../../engine/ui/dialog.js';
import { Batch } from '../../art/scenery/kit.js';
import { raftForm } from '../../art/scenery/life.js';
import { applyLook } from '../../../engine/iso/cozyStage.js';
import { fromUV } from './sections.js';

export const BOARD_R = 1.5, SPEED = 2.6, DECK = 0.13;
let built = null; 

export function raftsOf() { const W = S.W, R = W && W.rafts; return R && G.region === W.region ? R : null; }
export const riding = () => !!G.ride;
export function dockNear(x, y) {
  const R = raftsOf(); if (!R || G.ride) return null;
  let best = null, bd = BOARD_R;
  for (const d of R.docks) { const e = Math.hypot(d.land.x - x, d.land.y - y); if (e < bd) { bd = e; best = d; } }
  return best;
}

function pathOf(R, d) {
  const r = R.rafts.find((q) => q.id === d.raft), route = r.route.map(([u, v]) => fromUV(u, v));
  const pts = d.end ? route.slice().reverse() : route, land = r.land.map(([u, v]) => fromUV(u, v));
  return { r, pts: [d.end ? land[1] : land[0], ...pts, d.end ? land[0] : land[1]], water: [1, pts.length] };
}
export function startRide(d) {
  const R = raftsOf(); if (!R) return;
  const { r, pts, water } = pathOf(R, d), segs = [];
  let len = 0; for (let k = 1; k < pts.length; k++) { const L = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); segs.push(L); len += L; }
  G.ride = { raft: r.id, from: d.end, pts, segs, len, water, s: 0 };
  S.sfx.play('raftPole'); 
  if (!G.flags.rafted) { G.flags.rafted = true; toast('You push off. The water is so still the raft hardly ripples.', 2400); }
}

function along(ride, s) {
  let k = 0; while (k < ride.segs.length - 1 && s > ride.segs[k]) { s -= ride.segs[k]; k++; }
  const t = Math.min(1, s / ride.segs[k]), a = ride.pts[k], b = ride.pts[k + 1];
  return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, k, dx: b[0] - a[0], dy: b[1] - a[1] };
}

function build(R) {
  dispose();
  const mk = () => { const b = new Batch('raft'); b.add(raftForm(), { x: 0, h: 0, y: 0, rot: 0 }); const g = b.toGroup(); if (S.stage.look) applyLook(g, S.stage.look); S.stage.scene.add(g); return g; };
  built = { W: S.W, docks: R.docks.map((d) => { const g = mk(), r = R.rafts.find((q) => q.id === d.raft), p = r.route[d.end ? r.route.length - 1 : 0], q = r.route[d.end ? r.route.length - 2 : 1];
    const [x, y] = fromUV(...p), [qx, qy] = fromUV(...q); g.position.set(x, DECK - 0.12, y); g.rotation.y = Math.atan2(qx - x, qy - y); return g; }), ride: mk() };
  built.ride.visible = false;
}
function dispose() {
  if (!built) return;
  for (const g of [...built.docks, built.ride]) { S.stage.scene.remove(g); g.traverse((o) => o.geometry && o.geometry.dispose()); }
  built = null;
}


export function updateRafts(dt) {
  const R = raftsOf();
  if (!R) { if (built) dispose(); if (G.ride) G.ride = null; G.player.lift = 0; return; }
  if (!built || built.W !== S.W) build(R);
  const ride = G.ride, p = G.player;
  built.docks.forEach((g, i) => { const d = R.docks[i]; g.visible = !(ride && ride.raft === d.raft && ride.from === d.end && ride.s > 0.3); });
  if (!ride) { built.ride.visible = false; p.lift = 0; return; }
  ride.s = Math.min(ride.len, ride.s + dt * SPEED);
  const q = along(ride, ride.s), onWater = q.k >= ride.water[0] - 1 && q.k < ride.water[1];
  p.x = q.x; p.y = q.y; p.moving = false; p.lift = onWater ? DECK : 0;
  
  const first = ride.pts[ride.water[0]], last = ride.pts[ride.water[1]];
  const rp = q.k < ride.water[0] ? { x: first[0], y: first[1] } : q.k >= ride.water[1] ? { x: last[0], y: last[1] } : q;
  built.ride.visible = true; built.ride.position.set(rp.x, DECK - 0.12, rp.y); if (onWater) built.ride.rotation.y = Math.atan2(q.dx, q.dy);
  const f = G.follower;
  if (f) { f.x = rp.x - Math.sin(built.ride.rotation.y) * 0.5; f.y = rp.y - Math.cos(built.ride.rotation.y) * 0.5; f.lift = onWater ? DECK : 0; f.moving = false; }
  if (ride.s >= ride.len) { G.ride = null; p.lift = 0; if (f) f.lift = 0; built.ride.visible = false; }
}
