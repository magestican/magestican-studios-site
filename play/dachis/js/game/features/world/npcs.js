

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
import * as mine from './regionMaps/minehead.js';
import * as shaft from './regionMaps/lanternShaft.js';
import * as seam from './regionMaps/deepSeam.js';
import * as geode from './regionMaps/geodeGalleries.js';
import * as echo from './regionMaps/echoLake.js';
import { SPECIES, bossSpecies } from '../../data/species.js';
import { partyRead } from '../battle/bossPattern.js';
import { lairOf, lairOpen } from './lairs.js';
import { HANDS, workSpot } from './hands.js';

export function readOf(boss) {
  const l = lairOf(boss), lead = G.party[0];
  if (!l || !lead || !lairOpen(l, G.flags)) return null;
  const top = Math.max(...G.party.map((d) => d.lvl));
  return partyRead(boss, speciesById(lead.sp).name, bossSpecies(boss).level - top);
}
const withRead = (lines, boss) => { const r = readOf(boss); return r ? [...lines, r] : lines; };

const VILLAGER_LINES = [
  ['The red hand came through again last night. It took my neighbour. I had hold of his arm.', 'I keep his door shut so the ash does not get in. He will want the place clean when he comes back.'],
  ['Do not fuss over my paw, I have three more. If your little ones are hurt, stand them by the hot spring. It fixes everything except a bad temper.'],
  ['The wild ones are not wicked, whatever my brother says. The red ones are sick, and sick is not the same as bad. I tell him that every night at supper.'],
  ['My hatchling says she will be level 66 by the end of the week. Sixty-six is as high as anyone goes, I tell her. Unless you start all over again and go higher, she says. Where does she hear these things?'],
  ['I oil the Elder\'s arm every new moon. He says he lost the old one to the first spiral. He will not say what he traded for this one.'],
  ['You have to knock them down to a quarter first. THEN you tap them. Then they like you. That is how I got my sister to like me.'],
];
const SHRINE_LINES = [
  'The priests had us sweep the steps twice for you. Twice! You could eat your dinner off them.',
  'Our spring is better than the one up at Kazan, whatever they tell you up there. Stand your dachis by it and they perk right up.',
  'My uncle says there is a whole city under the sea. My uncle also says he once ate a rock. A big one. So.',
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
    add({ kind: 'villager', id: 'shell-elder', name: shell.ELDER.name, sp: old.id, ...shell.ELDER.at, still: true, lines: G.flags.boss_leviathrum ? shell.ELDER_LINES.after : withRead(shell.ELDER_LINES.before, 'leviathrum') });
    for (const d of shell.DWELLERS) {
      const sp = kinds[Math.floor(rs() * kinds.length)].id, { x, y } = pickNpcSpot(S.W, rs, d.home, d.home.r, 1.2, [...G.npcs, G.player]) || d.home;
      add({ kind: 'villager', id: d.id, sp, x, y, home: d.home, radius: d.home.r, lines: d.lines, tx: x, ty: y, wait: rs() * 3 });
    }
  }
  
  if (G.region === vine.ID) {
    const kinds = SPECIES.filter((s) => s.stage === 1 && (s.types[0] === 'Beast' || s.types[0] === 'Leaf')), rv = U.rng(80);
    const old = SPECIES.find((s) => s.stage === 3 && s.types[0] === 'Beast') || SPECIES.find((s) => s.stage === 3);
    add({ kind: 'villager', id: 'vine-elder', name: vine.ELDER.name, sp: old.id, ...vine.ELDER.at, still: true, lines: G.flags.boss_kingshade ? vine.ELDER_LINES.after : withRead(vine.ELDER_LINES.before, 'kingshade') });
    for (const d of vine.DWELLERS) {
      const sp = kinds[Math.floor(rv() * kinds.length)].id, { x, y } = pickNpcSpot(S.W, rv, d.home, d.home.r, 1.0, [...G.npcs, G.player]) || d.home;
      add({ kind: 'villager', id: d.id, sp, x, y, home: d.home, radius: d.home.r, lines: d.lines, tx: x, ty: y, wait: rv() * 3 });
    }
  }
  
  
  if (G.region === mine.ID || G.region === shaft.ID || G.region === seam.ID) {
    const inMine = G.region === mine.ID, rm = U.rng(inMine ? 82 : 83), M = inMine ? mine : G.region === shaft.ID ? shaft : seam;
    const kinds = SPECIES.filter((s) => s.stage === 1 && (inMine ? s.types[0] === 'Stone' || s.types[0] === 'Metal' : s.types[0] === 'Shadow'));
    if (inMine) {
      const old = SPECIES.find((s) => s.stage === 3 && s.types[0] === 'Stone') || SPECIES.find((s) => s.stage === 3);
      add({ kind: 'villager', id: 'mine-elder', name: mine.ELDER.name, sp: old.id, ...mine.ELDER.at, still: true, lines: G.flags.boss_quartz ? mine.ELDER_LINES.after : withRead(mine.ELDER_LINES.before, 'quartz') });
    }
    for (const d of M.DWELLERS) {
      const sp = kinds[Math.floor(rm() * kinds.length)].id, { x, y } = pickNpcSpot(S.W, rm, d.home, d.home.r, 1.0, [...G.npcs, G.player]) || d.home;
      add({ kind: 'villager', id: d.id, sp, x, y, home: d.home, radius: d.home.r, lines: d.lines, tx: x, ty: y, wait: rm() * 3, still: !inMine });
    }
  }
  
  
  if (G.region === court.ID) {
    const kinds = SPECIES.filter((s) => s.stage === 2 && s.types[0] === 'Beast'), rc = U.rng(81);
    court.GUARDS.forEach((d, i) => add({ kind: 'villager', id: d.id, sp: kinds[Math.floor(rc() * kinds.length)].id, ...d.home, still: true, lines: G.flags.boss_kingshade ? court.GUARD_AFTER[i] : d.lines }));
    
    if (G.flags.boss_kingshade && !(G.flags.beats || {})['kingshade-gone']) add({ kind: 'villager', id: 'court-king', name: 'Kingshade', sp: bossSpecies('kingshade').id, calm: true, ...court.KING_SEAT, still: true, lines: court.KING_LINES });
  }
  
  
  if (G.region === hollow.ID) {
    const kinds = SPECIES.filter((s) => s.stage === 1 && (s.types[0] === 'Leaf' || s.types[0] === 'Spirit')), rh = U.rng(79);
    const old = SPECIES.find((s) => s.stage === 3 && s.types[0] === 'Leaf');
    add({ kind: 'villager', id: 'hollow-elder', name: hollow.ELDER.name, sp: old.id, ...hollow.ELDER.at, still: true, lines: G.flags.boss_bramble ? hollow.ELDER_LINES.after : withRead(hollow.ELDER_LINES.before, 'bramble') });
    for (const d of hollow.DWELLERS) {
      const sp = kinds[Math.floor(rh() * kinds.length)].id, { x, y } = pickNpcSpot(S.W, rh, d.home, d.home.r, 1.2, [...G.npcs, G.player]) || d.home;
      add({ kind: 'villager', id: d.id, sp, x, y, home: d.home, radius: d.home.r, lines: d.lines, tx: x, ty: y, wait: rh() * 3 });
    }
  }
  for (let i = 0; i < 3; i++) {
    const sp = 3 * (4 + Math.floor(r() * 37)) + 1, { x, y } = spot(SH);
    keep(add({ kind: 'villager', id: 'shrine-v' + i, sp, x, y, home: SH, radius: SH.r, lines: [SHRINE_LINES[i]], tx: x, ty: y, wait: r() * 3 }), shrinePeople);
  }
  
  if (G.region === geode.ID) {
    const kinds = SPECIES.filter((s) => s.stage === 2 && s.types.includes('Light')), rg = U.rng(113);
    for (const d of geode.DWELLERS) {
      const sp = kinds[Math.floor(rg() * kinds.length)].id, p = pickNpcSpot(S.W, rg, d.home, d.home.r, 0.3, [...G.npcs, G.player]) || d.home;
      add({ kind: 'villager', id: d.id, sp, x: p.x, y: p.y, home: d.home, radius: d.home.r, lines: d.lines, tx: p.x, ty: p.y, wait: rg() * 3 });
    }
  }
  
  if (G.region === echo.ID) {
    const kinds = SPECIES.filter((s) => s.stage === 1 && (s.types[0] === 'Tide' || s.types[0] === 'Frost')), re = U.rng(131);
    for (const d of echo.DWELLERS) {
      const sp = kinds[Math.floor(re() * kinds.length)].id, p = pickNpcSpot(S.W, re, d.home, d.home.r, 0.8, [...G.npcs, G.player]) || d.home;
      add({ kind: 'villager', id: d.id, sp, x: p.x, y: p.y, home: d.home, radius: d.home.r, lines: d.lines, tx: p.x, ty: p.y, wait: re() * 3 });
    }
  }
  
  const hands = HANDS[G.region];
  if (hands) {
    const job = workSpot(S.W), rw = U.rng(97), home = job ? { x: job.x, y: job.y, r: 1.6 } : null;
    const p = home && (pickNpcSpot(S.W, rw, home, home.r, 0.9, [...G.npcs, G.player]) || null);
    if (p) add({ kind: 'villager', id: G.region + '-hands', name: hands.name, sp: hands.sp, x: p.x, y: p.y, home, radius: home.r, lines: hands.lines, tx: p.x, ty: p.y, wait: rw() * 3 });
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
    
    if (!n.moving) { const p = G.player, ddx = p.x - n.x, ddy = p.y - n.y; if (ddx * ddx + ddy * ddy < LOOK_R * LOOK_R && Math.abs(ddx - ddy) > 0.05) n.face = ddx - ddy > 0 ? 1 : -1; }
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
  for (const n of G.npcs) if (Math.abs(n.x - p.x) + Math.abs(n.y - p.y) < 12) bodies.push(n.calm ? lairBody(n.x, n.y, (n.bb.extent() || bossBody(n.bb.bossScale)).half) : { ref: n, kind: 'npc', fixed: !!n.still, x: n.x, y: n.y, r: n.kind === 'elder' ? BODY_R.elder : BODY_R.dachi }); 
  for (const w of G.wilds) if (!w.scripted) bodies.push({ ref: w, kind: 'wild', x: w.x, y: w.y, r: BODY_R.dachi });
  const wildKid = (a, b) => (a.kind === 'kid' && b.kind === 'wild') || (a.kind === 'wild' && b.kind === 'kid');
  pushApart(bodies, { k: 1, ok: (x, y) => W.walkable(x, y, BODY_R.dachi), skip: wildKid });
  for (const b of bodies) if (b.ref) { b.ref.x = b.x; b.ref.y = b.y; }
}

export function drawNpcs(t) {
  const W = S.W;
  for (const n of G.npcs) {
    if (n.kind !== 'elder') setDachiLook(n.bb, n.sp, { bandage: n.bandage, hat: n.hat, flip: n.face < 0, calm: n.calm });
    else { const p = G.player; if (U.dist(p.x, p.y, n.x, n.y) < 3.2) n.bb.faceDir(p.x - n.x, p.y - n.y); else n.bb.faceCamera(); } 
    const bob = n.moving ? Math.abs(Math.sin(n.walk)) * 0.1 : Math.sin(t * 2.5 + n.x) * 0.02;
    n.bb.place(n.x, n.y, W.groundAt(n.x, n.y), bob);
  }
}

export const LOOK_R = 3, TALK_R = 2;
export const nearestNpc = (x, y, within = TALK_R) => {
  let best = null, bd = within;
  for (const n of G.npcs) { const d = U.dist(x, y, n.x, n.y); if (d < bd) { bd = d; best = n; } }
  return best;
};
