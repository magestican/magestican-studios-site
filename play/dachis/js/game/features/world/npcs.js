

import { U } from '../../../engine/core/util.js';
import { G, S } from '../../state.js';
import { NPC_POSTS, NPC_HOMES, pickNpcSpot, npcSpotOk, npcStepClear } from './mapgen.js';
import { dachiBillboard, setDachiLook, elderBillboard } from '../../art/billboards.js';
import { speciesById, KUMABO } from '../../data/species.js';
import { pushApart, GAP, BODY_R, lairBody, bossBody } from './crowd.js';
import { HOME } from './regions.js';
import * as village from './regionMaps/kazanVillage.js';
import * as ember from './regionMaps/emberTube.js';
import * as shrine from './regionMaps/shrineVillage.js';
import * as shell from './regionMaps/shellhaven.js';
import * as hollow from './regionMaps/hollowroot.js';
import * as vine from './regionMaps/vinegate.js';
import * as court from './regionMaps/obsidianCourt.js';
import { SPECIES } from '../../data/species.js';

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
  
  
  
  const inVillage = G.region === village.ID, inShrine = G.region === shrine.ID, K = inVillage ? village.HOME_DISC : NPC_HOMES.kazan;
  const P = inShrine ? { ...NPC_POSTS, ...shrine.POSTS } : NPC_POSTS, SH = inShrine ? shrine.HOME_DISC : NPC_HOMES.shrine;
  const kazanPeople = inVillage, shrinePeople = inShrine;
  const keep = (n, ok) => { if (!ok) { G.npcs.pop(); n.bb?.dispose(S.stage.scene); } };
  keep(add({ kind: 'elder', ...(inVillage ? village.POSTS.elder : P.elder), still: true }), kazanPeople);
  keep(add({ kind: 'kumabo', sp: KUMABO, bandage: !G.flags.initiated, ...(inVillage ? village.POSTS.kumabo : P.kumabo), still: true }), kazanPeople);
  
  
  const spot = (home) => pickNpcSpot(S.W, r, home, home.r, 1.2, [...G.npcs, G.player]) || pickNpcSpot(S.W, r, home, home.r) || { x: home.x, y: home.y };
  for (let i = 0; i < 6; i++) {
    const fam = 4 + Math.floor(r() * 37), sp = fam * 3 + 1 + (r() < 0.3 ? 1 : 0), bandage = r() < 0.6, { x, y } = spot(K);
    keep(add({ kind: 'villager', id: 'kazan-v' + i, sp, bandage, x, y, home: K, radius: K.r, lines: VILLAGER_LINES[i], tx: x, ty: y, wait: r() * 3 }), kazanPeople);
  }
  G.priestSp = 3 * (4 + Math.floor(r() * 37)) + 2;
  keep(add({ kind: 'priest', head: true, sp: G.priestSp, hat: true, ...P.priest, still: true }), shrinePeople);
  for (const a of P.acolytes) keep(add({ kind: 'priest', sp: 3 * (4 + Math.floor(r() * 37)) + 1, hat: true, ...a, still: true }), shrinePeople);
  
  if (G.region === ember.ID) {
    const kinds = SPECIES.filter((s) => s.stage === 1 && (s.types[0] === 'Ember' || s.types[0] === 'Stone')), re = U.rng(77);
    for (const d of ember.DWELLERS) {
      const sp = kinds[Math.floor(re() * kinds.length)].id, { x, y } = pickNpcSpot(S.W, re, d.home, d.home.r, 1.2, [...G.npcs, G.player]) || d.home;
      add({ kind: 'villager', id: d.id, sp, x, y, home: d.home, radius: d.home.r, lines: d.lines, tx: x, ty: y, wait: re() * 3 });
    }
  }
  
  
  if (G.region === shell.ID) {
    const kinds = SPECIES.filter((s) => s.stage === 1 && (s.types[0] === 'Tide' || s.types[0] === 'Frost')), rs = U.rng(78);
    const old = SPECIES.find((s) => s.stage === 3 && s.types[0] === 'Tide');
    add({ kind: 'villager', id: 'shell-elder', name: shell.ELDER.name, sp: old.id, ...shell.ELDER.at, still: true, lines: G.flags.boss_leviathrum ? shell.ELDER_LINES.after : shell.ELDER_LINES.before });
    for (const d of shell.DWELLERS) {
      const sp = kinds[Math.floor(rs() * kinds.length)].id, { x, y } = pickNpcSpot(S.W, rs, d.home, d.home.r, 1.2, [...G.npcs, G.player]) || d.home;
      add({ kind: 'villager', id: d.id, sp, x, y, home: d.home, radius: d.home.r, lines: d.lines, tx: x, ty: y, wait: rs() * 3 });
    }
  }
  
  if (G.region === vine.ID) {
    const kinds = SPECIES.filter((s) => s.stage === 1 && (s.types[0] === 'Beast' || s.types[0] === 'Leaf')), rv = U.rng(80);
    const old = SPECIES.find((s) => s.stage === 3 && s.types[0] === 'Beast') || SPECIES.find((s) => s.stage === 3);
    add({ kind: 'villager', id: 'vine-elder', name: vine.ELDER.name, sp: old.id, ...vine.ELDER.at, still: true, lines: G.flags.boss_kingshade ? vine.ELDER_LINES.after : vine.ELDER_LINES.before });
    for (const d of vine.DWELLERS) {
      const sp = kinds[Math.floor(rv() * kinds.length)].id, { x, y } = pickNpcSpot(S.W, rv, d.home, d.home.r, 1.0, [...G.npcs, G.player]) || d.home;
      add({ kind: 'villager', id: d.id, sp, x, y, home: d.home, radius: d.home.r, lines: d.lines, tx: x, ty: y, wait: rv() * 3 });
    }
  }
  
  
  if (G.region === court.ID) {
    const kinds = SPECIES.filter((s) => s.stage === 2 && s.types[0] === 'Beast'), rc = U.rng(81);
    for (const d of court.GUARDS) add({ kind: 'villager', id: d.id, sp: kinds[Math.floor(rc() * kinds.length)].id, ...d.home, still: true, lines: d.lines });
  }
  
  
  if (G.region === hollow.ID) {
    const kinds = SPECIES.filter((s) => s.stage === 1 && (s.types[0] === 'Leaf' || s.types[0] === 'Spirit')), rh = U.rng(79);
    const old = SPECIES.find((s) => s.stage === 3 && s.types[0] === 'Leaf');
    add({ kind: 'villager', id: 'hollow-elder', name: hollow.ELDER.name, sp: old.id, ...hollow.ELDER.at, still: true, lines: G.flags.boss_bramble ? hollow.ELDER_LINES.after : hollow.ELDER_LINES.before });
    for (const d of hollow.DWELLERS) {
      const sp = kinds[Math.floor(rh() * kinds.length)].id, { x, y } = pickNpcSpot(S.W, rh, d.home, d.home.r, 1.2, [...G.npcs, G.player]) || d.home;
      add({ kind: 'villager', id: d.id, sp, x, y, home: d.home, radius: d.home.r, lines: d.lines, tx: x, ty: y, wait: rh() * 3 });
    }
  }
  for (let i = 0; i < 3; i++) {
    const sp = 3 * (4 + Math.floor(r() * 37)) + 1, { x, y } = spot(SH);
    keep(add({ kind: 'villager', id: 'shrine-v' + i, sp, x, y, home: SH, radius: SH.r, lines: [SHRINE_LINES[i]], tx: x, ty: y, wait: r() * 3 }), shrinePeople);
  }
}


export function clearNpcs() {
  for (const n of G.npcs) n.bb?.dispose(S.stage.scene);
  G.npcs = [];
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
