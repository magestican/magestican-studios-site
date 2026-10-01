

import { U } from '../../../engine/core/util.js';
import { G, S } from '../../state.js';
import { NPC_POSTS, NPC_HOMES, pickNpcSpot, npcSpotOk, npcStepClear } from './mapgen.js';
import { dachiBillboard, setDachiLook, elderBillboard } from '../../art/billboards.js';
import { speciesById, KUMABO } from '../../data/species.js';
import { pushApart, GAP, BODY_R, lairBody, bossBody } from './crowd.js';

const VILLAGER_LINES = [
  ['The red hand came through the spiral again last night. It took three of us.', 'We used to believe the spirals were doors for friends. Now they only bring pain.'],
  ['My paw still hurts... but the hot spring helps. Stand next to it and rest — it heals your companions too!'],
  ['Wild dachis aren’t evil. The sickness makes some of them forget they’re friends. The corrupted ones glow red.'],
  ['Did you know? A dachi can grow all the way to level 66. They say heroes who return can push past even that...'],
  ['Our Elder was half-machine long before any of us were born. They say he fought the very first spiral.'],
  ['Weaken a wild dachi below a quarter of its health, then tap it to start the befriending ritual!'],
];
const SHRINE_LINES = [
  'Welcome to the Shrine Village. The priests have waited a long time for you.',
  'Our temple spring heals any tired companion. Just stand beside it.',
  'They say there are other lands beyond the horizon — ice, jungles, even a city under the sea.',
];

export function spawnNpcs() {
  for (const n of G.npcs) n.bb?.dispose(S.stage.scene);
  G.npcs = [];
  const r = U.rng(31);
  const add = n => { n.bb = n.kind === 'elder' ? elderBillboard(S.stage.scene) : dachiBillboard(S.stage.scene, speciesById(n.sp).stage); n.face = 1; n.walk = 0; G.npcs.push(n); return n; };
  const P = NPC_POSTS, K = NPC_HOMES.kazan, SH = NPC_HOMES.shrine;
  add({ kind: 'elder', ...P.elder, still: true });
  add({ kind: 'kumabo', sp: KUMABO, bandage: !G.flags.initiated, ...P.kumabo, still: true });
  
  
  const spot = (home) => pickNpcSpot(S.W, r, home, home.r, 1.2, [...G.npcs, G.player]) || pickNpcSpot(S.W, r, home, home.r) || { x: home.x, y: home.y };
  for (let i = 0; i < 6; i++) {
    const fam = 4 + Math.floor(r() * 37), sp = fam * 3 + 1 + (r() < 0.3 ? 1 : 0), bandage = r() < 0.6, { x, y } = spot(K);
    add({ kind: 'villager', sp, bandage, x, y, home: K, radius: K.r, lines: VILLAGER_LINES[i], tx: x, ty: y, wait: r() * 3 });
  }
  G.priestSp = 3 * (4 + Math.floor(r() * 37)) + 2;
  add({ kind: 'priest', head: true, sp: G.priestSp, hat: true, ...P.priest, still: true });
  for (const a of P.acolytes) add({ kind: 'priest', sp: 3 * (4 + Math.floor(r() * 37)) + 1, hat: true, ...a, still: true });
  for (let i = 0; i < 3; i++) {
    const sp = 3 * (4 + Math.floor(r() * 37)) + 1, { x, y } = spot(SH);
    add({ kind: 'villager', sp, x, y, home: SH, radius: SH.r, lines: [SHRINE_LINES[i]], tx: x, ty: y, wait: r() * 3 });
  }
}

export function removeNpc(kind) {
  const n = G.npcs.find(x => x.kind === kind);
  if (n) { n.bb.dispose(S.stage.scene); G.npcs.splice(G.npcs.indexOf(n), 1); }
}

export function updateNpcs(dt) {
  const W = S.W;
  
  
  const people = [G.player, G.follower].filter(Boolean);
  for (const n of G.npcs) {
    if (n.still) continue;
    n.wait -= dt;
    if (n.wait > 0) { n.moving = false; continue; }
    const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
    if (d < 0.1) { n.wait = 1 + Math.random() * 3; const avoid = people.concat(G.npcs.filter((o) => o !== n).map((o) => ({ x: o.tx ?? o.x, y: o.ty ?? o.y })));
      const t = pickNpcSpot(W, Math.random, n.home, n.radius, 0.6, avoid); if (t) { n.tx = t.x; n.ty = t.y; } continue; }
    const s = Math.min(d, 0.9 * dt), nx = n.x + dx / d * s, ny = n.y + dy / d * s;
    
    if (npcSpotOk(W, nx, ny, 0.3) && npcStepClear(n.x, n.y, nx, ny, people) && npcStepClear(n.x, n.y, nx, ny, G.npcs.filter((o) => o !== n), GAP)) { n.x = nx; n.y = ny; n.moving = true; n.walk += dt * 10; if (Math.abs(dx - dy) > 0.05) n.face = dx - dy > 0 ? 1 : -1; }
    else n.wait = 0.5, n.tx = n.x, n.ty = n.y;
  }
}







export function separateCrowd(dt, bosses = []) {
  const W = S.W, p = G.player, bodies = [{ ref: p, kind: 'kid', m: 8, x: p.x, y: p.y, r: BODY_R.kid }];
  for (const b of bosses) if (Math.abs(b.x - p.x) + Math.abs(b.y - p.y) < 12) bodies.push(lairBody(b.x, b.y, (b.bb.extent() || bossBody(b.bb.bossScale)).half));
  if (G.party[0]) bodies.push({ ref: G.follower, kind: 'pet', x: G.follower.x, y: G.follower.y, r: BODY_R.dachi });
  for (const n of G.npcs) if (Math.abs(n.x - p.x) + Math.abs(n.y - p.y) < 12) bodies.push({ ref: n, kind: 'npc', fixed: !!n.still, x: n.x, y: n.y, r: n.kind === 'elder' ? BODY_R.elder : BODY_R.dachi });
  for (const w of G.wilds) if (!w.scripted) bodies.push({ ref: w, kind: 'wild', x: w.x, y: w.y, r: BODY_R.dachi });
  const wildKid = (a, b) => (a.kind === 'kid' && b.kind === 'wild') || (a.kind === 'wild' && b.kind === 'kid');
  pushApart(bodies, { k: 1, ok: (x, y) => W.walkable(x, y, BODY_R.dachi), skip: wildKid });
  for (const b of bodies) if (b.ref) { b.ref.x = b.x; b.ref.y = b.y; }
}

export function drawNpcs(t) {
  const W = S.W;
  for (const n of G.npcs) {
    if (n.kind !== 'elder') setDachiLook(n.bb, n.sp, { bandage: n.bandage, hat: n.hat, flip: n.face < 0 });
    else { const p = G.player; if (U.dist(p.x, p.y, n.x, n.y) < 3.2) n.bb.faceDir(p.x - n.x, p.y - n.y); else n.bb.faceCamera(); } 
    const bob = n.moving ? Math.abs(Math.sin(n.walk)) * 0.1 : Math.sin(t * 2.5 + n.x) * 0.02;
    n.bb.place(n.x, n.y, W.groundAt(n.x, n.y), bob);
  }
}

export const nearestNpc = (x, y, within = 1.5) => {
  let best = null, bd = within;
  for (const n of G.npcs) { const d = U.dist(x, y, n.x, n.y); if (d < bd) { bd = d; best = n; } }
  return best;
};
