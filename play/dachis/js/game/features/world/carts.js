





import { G, S, saveGame } from '../../state.js';
import { toast } from '../../../engine/ui/dialog.js';
import { Batch } from '../../art/scenery/kit.js';
import { cartForm } from '../../art/scenery/magma.js';
import { applyLook } from '../../../engine/iso/cozyStage.js';
import { fromUV } from './sections.js';
import { ride } from './railRules.js';

export const BOARD_R = 1.4, LEVER_R = 1.4, SPEED = 3.4, RAIL_TOP = 0.64, IN_CART = 0.3;
let built = null; 
const railsOf = () => { const W = S.W, R = W && W.rails; return R && G.region === W.region ? R : null; };
const points = () => G.flags.points || {};
export const carting = () => !!G.cart;
export function cartDockNear(x, y) {
  const R = railsOf(); if (!R || G.cart) return null;
  let best = null, bd = BOARD_R;
  for (const [id, p] of Object.entries(R.land)) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = id; } }
  return best;
}
export function leverNear(x, y) {
  const R = railsOf(); if (!R || G.cart) return null;
  for (const [j, p] of Object.entries(R.levers)) if (Math.hypot(p.x - x, p.y - y) < LEVER_R) return j;
  return null;
}
export function throwLever(j) {
  G.flags.points = { ...points(), [j]: points()[j] ? 0 : 1 };
  S.sfx.play('mirrorTurn');
  if (!G.flags.leverSeen) { G.flags.leverSeen = true; toast('CLUNK. Out over the lava, the points slide across with a screech. That line goes somewhere else now.', 3000); }
  saveGame();
}
export function startCart(dock) {
  const R = railsOf(); if (!R) return;
  const r = ride(R.net, points(), dock); if (!r) return;
  const pts = [[R.land[dock].x, R.land[dock].y], ...r.pts.map(([u, v]) => fromUV(u, v)), [R.land[r.end].x, R.land[r.end].y]], segs = [];
  let len = 0; for (let k = 1; k < pts.length; k++) { const L = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); segs.push(L); len += L; }
  G.cart = { from: dock, end: r.end, pts, segs, len, s: 0, rails: [1, pts.length - 2] };
  S.sfx.play('doorsBang');
  if (!G.flags.carted) { G.flags.carted = true; toast('You climb into the cart. It creaks, and rolls, and then it really rolls.', 2400); }
}
function along(c, s) {
  let k = 0; while (k < c.segs.length - 1 && s > c.segs[k]) { s -= c.segs[k]; k++; }
  const t = Math.min(1, s / c.segs[k]), a = c.pts[k], b = c.pts[k + 1];
  return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, k, dx: b[0] - a[0], dy: b[1] - a[1] };
}
function mk() { const b = new Batch('cart'); b.add(cartForm(), { x: 0, h: 0, y: 0, rot: 0 }); const g = b.toGroup(); if (S.stage.look) applyLook(g, S.stage.look); S.stage.scene.add(g); return g; }
function build(R) {
  dispose();
  const docks = {};
  for (const [id, n] of Object.entries(R.net.nodes)) {
    if (n.kind !== 'dock') continue;
    const rail = R.net.rails.find((r) => r.a === id || r.b === id), pts = rail.a === id ? rail.pts : rail.pts.slice().reverse();
    const [x, y] = fromUV(...pts[0]), [qx, qy] = fromUV(...pts[1]), g = mk();
    g.position.set(x, RAIL_TOP, y); g.rotation.y = Math.atan2(qx - x, qy - y); docks[id] = g;
  }
  built = { W: S.W, docks, ride: mk() };
  built.ride.visible = false;
}
function dispose() {
  if (!built) return;
  for (const g of [...Object.values(built.docks), built.ride]) { S.stage.scene.remove(g); g.traverse((o) => o.geometry && o.geometry.dispose()); }
  built = null;
}

export function updateCarts(dt) {
  const R = railsOf();
  if (!R) { if (built) dispose(); if (G.cart) G.cart = null; return; }
  if (!built || built.W !== S.W) build(R);
  const c = G.cart, p = G.player, W = S.W;
  for (const [id, g] of Object.entries(built.docks)) g.visible = !(c && c.from === id && c.s > 0.3);
  if (!c) { built.ride.visible = false; return; }
  c.s = Math.min(c.len, c.s + dt * SPEED);
  const q = along(c, c.s), onRail = q.k >= c.rails[0] && q.k < c.rails[1];
  p.x = q.x; p.y = q.y; p.moving = false;
  const first = c.pts[c.rails[0]], last = c.pts[c.rails[1]];
  const cp = q.k < c.rails[0] ? { x: first[0], y: first[1] } : q.k >= c.rails[1] ? { x: last[0], y: last[1] } : q;
  p.lift = onRail ? Math.max(0, RAIL_TOP + IN_CART - W.groundAt(p.x, p.y)) : 0;
  built.ride.visible = true; built.ride.position.set(cp.x, RAIL_TOP, cp.y); if (onRail) built.ride.rotation.y = Math.atan2(q.dx, q.dy);
  const f = G.follower;
  if (f) { f.x = cp.x - Math.sin(built.ride.rotation.y) * 0.3; f.y = cp.y - Math.cos(built.ride.rotation.y) * 0.3; f.lift = onRail ? Math.max(0, RAIL_TOP + IN_CART - W.groundAt(f.x, f.y)) : 0; f.moving = false; }
  if (c.s >= c.len) { G.cart = null; p.lift = 0; if (f) f.lift = 0; built.ride.visible = false; S.sfx.play('landThud'); }
}

export function cartPass(ctx) {
  const R = railsOf(); if (!R) return;
  ctx.save(); ctx.fillStyle = '#ffd23d'; ctx.strokeStyle = '#1b1530'; ctx.lineWidth = 2;
  for (const [j, n] of Object.entries(R.net.nodes)) {
    if (n.kind !== 'junction') continue;
    const to = n.branches[points()[j] ? 1 : 0], rail = R.net.rails.find((r) => (r.a === j && r.b === to) || (r.b === j && r.a === to));
    const pts = rail.a === j ? rail.pts : rail.pts.slice().reverse(), [u0, v0] = pts[0], [u1, v1] = pts[1], L = Math.hypot(u1 - u0, v1 - v0);
    for (const t of [0.35, 0.75]) {
      const d = Math.min(1, (t * 2.2) / L), cu = u0 + (u1 - u0) * d, cv = v0 + (v1 - v0) * d, fu = (u1 - u0) / L, fv = (v1 - v0) / L;
      const tip = S.stage.toScreen(...fromUV(cu + fu * 0.45, cv + fv * 0.45), RAIL_TOP + 0.1);
      const l = S.stage.toScreen(...fromUV(cu - fv * 0.4, cv + fu * 0.4), RAIL_TOP + 0.1), r = S.stage.toScreen(...fromUV(cu + fv * 0.4, cv - fu * 0.4), RAIL_TOP + 0.1);
      ctx.beginPath(); ctx.moveTo(...tip); ctx.lineTo(...l); ctx.lineTo(...r); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  ctx.restore();
}
