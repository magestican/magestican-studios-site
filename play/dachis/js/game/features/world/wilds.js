

import { U } from '../../../engine/core/util.js';
import { G, S, caughtCount } from '../../state.js';
import { VOLC, npcStepClear } from './mapgen.js';
import { CHAR_SCALE, GAP, BODY_R } from './crowd.js';
import { makeDachi, speciesById, capsFor } from '../../data/species.js';
import { dachiBillboard, setDachiLook } from '../../art/billboards.js';



const MAX_WILDS = 8;
let respawn = 0;


const secTiles = new Map();
const tilesHere = () => {
  const id = S.cam && S.cam.sec;
  if (!secTiles.has(id)) secTiles.set(id, S.W.wildTiles.filter(([x, y]) => !id || S.W.sectionAt(x, y) === id));
  return secTiles.get(id);
};

export function spawnWild(near = null) {
  const W = S.W, p = G.player, tiles = tilesHere();
  if (!near && !tiles.length) return null;
  for (let tries = 0; tries < 25; tries++) {
    const [x, y] = near ? [near.x, near.y] : tiles[Math.floor(Math.random() * tiles.length)];
    if (!near && (U.dist(x, y, p.x, p.y) < 7 || !W.walkable(x, y))) continue;
    const far = U.dist(x, y, VOLC.x, VOLC.y);
    
    const top = G.party.reduce((m, d) => Math.max(m, d.lvl), 1);
    const floor = capsFor(G.cycle).enemyFloor;   
    const lvl = floor || U.clamp(Math.floor(2 + far / 6.75 + caughtCount() * 0.15 + Math.random() * 2.5), 2, top + (G.flags.initiated ? 2 : 0));
    
    const fam = Math.random() < 0.05 ? 1 + Math.floor(Math.random() * 3) : [0, ...Array.from({ length: 37 }, (_, i) => i + 4)][Math.floor(Math.random() * 38)];
    const stage = lvl > 9 && Math.random() < 0.15 ? 2 : lvl > 30 && Math.random() < 0.1 ? 3 : 1;
    const d = makeDachi(fam * 3 + stage, lvl);
    if (Math.random() < U.clamp((far - 15) / 90, 0.05, 0.35)) d.corrupt = true;
    const w = { x, y, d, home: { x, y }, tx: x, ty: y, wait: Math.random() * 2, face: 1, walk: 0, stun: 0, chase: false };
    w.bb = dachiBillboard(S.stage.scene, speciesById(d.sp).stage);
    G.wilds.push(w);
    return w;
  }
  return null;
}
export function removeWild(w) {
  const i = G.wilds.indexOf(w);
  if (i >= 0) G.wilds.splice(i, 1);
  w.bb?.dispose(S.stage.scene);
}


export function updateWilds(dt, { active }) {
  const W = S.W, p = G.player;
  G.safeTimer -= dt;
  if (active) {
    respawn -= dt;
    if (G.wilds.length < MAX_WILDS && respawn <= 0) { spawnWild(); respawn = 1.2; }
  }
  
  for (const w of G.wilds.slice()) if (!w.scripted && !w.chase && S.cam && S.cam.sec && W.sectionAt(w.x, w.y) !== S.cam.sec) removeWild(w);
  let touched = null;
  for (const w of G.wilds) {
    if (w.scripted) continue;   
    w.stun -= dt;
    const d = U.dist(w.x, w.y, p.x, p.y);
    w.chase = active && d < 3.2 && G.safeTimer <= 0 && w.stun <= 0 && G.party.some(x => x.hp > 0);
    let tx = w.tx, ty = w.ty, sp = 1.1;
    if (w.chase) { tx = p.x; ty = p.y; sp = w.d.corrupt ? 2.9 : 2.5; }
    else {
      w.wait -= dt;
      if (w.wait > 0) { w.moving = false; continue; }
    }
    const dx = tx - w.x, dy = ty - w.y, dl = Math.hypot(dx, dy);
    if (dl < 0.08) { w.wait = 0.5 + Math.random() * 2.5; w.tx = w.home.x + (Math.random() - 0.5) * 5; w.ty = w.home.y + (Math.random() - 0.5) * 5; w.moving = false; }
    else {
      const s = Math.min(dl, sp * dt), nx = w.x + dx / dl * s, ny = w.y + dy / dl * s;
      
      const others = [...(G.party[0] && !w.chase ? [G.follower] : []), ...G.npcs, ...G.wilds.filter((o) => o !== w)];
      if (npcStepClear(w.x, w.y, nx, ny, others, GAP)) { if (W.walkable(nx, w.y, BODY_R.dachi)) w.x = nx; if (W.walkable(w.x, ny, BODY_R.dachi)) w.y = ny; }
      else if (!w.chase) w.wait = 0.4 + Math.random(), w.tx = w.x, w.ty = w.y;
      if (Math.abs(dx - dy) > 0.05) w.face = dx - dy > 0 ? 1 : -1;
      w.walk += dt * 10; w.moving = true;
    }
    if (w.chase && d < 0.75 && !touched) touched = w;
  }
  return touched;
}

export function drawWilds(t, hideWild = null) {
  const W = S.W;
  for (const w of G.wilds) {
    w.bb.setVisible(typeof hideWild === 'function' ? !hideWild(w) : w !== hideWild);   
    setDachiLook(w.bb, w.d.sp, { corrupt: w.d.corrupt, flip: w.face < 0 });
    const bob = w.moving ? Math.abs(Math.sin(w.walk)) * 0.12 : Math.sin(t * 3 + w.x) * 0.02;
    w.bb.place(w.x, w.y, W.groundAt(w.x, w.y), bob);
  }
}


export function drawWildAlerts(ctx) {
  for (const w of G.wilds) {
    if (!w.chase) continue;
    const [x, y] = S.stage.toScreen(w.x, w.y, S.W.groundAt(w.x, w.y) + 1.4 * CHAR_SCALE);
    ctx.font = '900 22px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.strokeText('!', x, y); ctx.fillStyle = w.d.corrupt ? '#ff2a3a' : '#ff8a2a'; ctx.fillText('!', x, y);
    ctx.textAlign = 'left';
  }
}
