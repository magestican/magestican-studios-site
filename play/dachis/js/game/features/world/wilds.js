

import { U } from '../../../engine/core/util.js';
import { G, S, caughtCount } from '../../state.js';
import { VOLC, npcStepClear } from './mapgen.js';
import { CHAR_SCALE, GAP, BODY_R } from './crowd.js';
import { makeDachi, speciesById, capsFor, wildFamiliesOf, rollShiny, statsOf } from '../../data/species.js';
import { sizeMult } from '../../data/sizes.js';
import { rollForm } from '../../data/forms.js';
import { temperOf } from '../../data/temper.js';
import { KIN_SHARE, KIN_RADIUS, kinSpecies } from '../../data/kin.js';
import { sectionById } from './sections.js';
import { wildLevel } from './wildLevel.js';
import { TOWNS } from '../../musicCues.js';



export const isSafe = (sec) => TOWNS.includes(sec);
import { dachiBillboard, setDachiLook } from '../../art/billboards.js';



const MAX_WILDS = 8;
let respawn = 0, filledW = null, filledSec = null;









export const PER_PATCH = 2, ROAM_MIN = 6;
export function grassPatches(W, id) {
  const keys = new Map();
  for (const [x, y] of W.wildTiles) if (!id || W.sectionAt(x, y) === id) keys.set(Math.floor(x) + ',' + Math.floor(y), [x, y]);
  const patchOf = new Map(), tiles = [];
  let roamable = 0;
  for (const k of keys.keys()) {
    if (patchOf.has(k)) continue;
    const st = [k], found = [k]; patchOf.set(k, -1);
    while (st.length) {
      const [i, j] = st.pop().split(',').map(Number);
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = (i + a) + ',' + (j + b); if (keys.has(q) && !patchOf.has(q)) { patchOf.set(q, -1); st.push(q); found.push(q); } }
    }
    const pid = found.length >= ROAM_MIN ? roamable++ : -1;
    for (const q of found) { patchOf.set(q, pid); if (pid >= 0) tiles.push([...keys.get(q), pid]); }
  }
  return { tiles, roamable, cap: Math.min(MAX_WILDS, PER_PATCH * roamable) };
}
const secTiles = new WeakMap();
const patchesHere = () => {
  const id = S.cam && S.cam.sec, W = S.W;
  if (!secTiles.has(W)) secTiles.set(W, new Map());
  const m = secTiles.get(W);
  if (!m.has(id)) m.set(id, grassPatches(W, id));
  return m.get(id);
};
const inPatch = (pid) => { const sec = S.cam && S.cam.sec; return G.wilds.filter((w) => w.patch === pid && w.sec === sec).length; };

const tables = new Map();
const WILD_TABLE_SHARE = 0.75; 
const tableHere = () => {
  const sec = sectionById(S.cam && S.cam.sec);
  if (!tables.has(sec)) tables.set(sec, sec && sec.wildTypes ? wildFamiliesOf(sec.wildTypes) : []);
  return tables.get(sec);
};



export function spawnWild(near = null, minD = 7, where = null) {
  const W = S.W, p = G.player, here = patchesHere();
  
  const tiles = near ? [] : here.tiles.filter((t) => inPatch(t[2]) < PER_PATCH);
  if (!near && (!tiles.length || isSafe(S.cam && S.cam.sec))) return null;
  for (let tries = 0; tries < (where ? 80 : 25); tries++) {
    const [x, y, pid] = near ? [near.x, near.y, -1] : tiles[Math.floor(Math.random() * tiles.length)];
    if (!near && (U.dist(x, y, p.x, p.y) < minD || (where && !where(x, y)) || !W.walkable(x, y) || isSafe(W.sectionAt(x, y)))) continue;
    const far = U.dist(x, y, VOLC.x, VOLC.y);
    
    const top = G.party.reduce((m, d) => Math.max(m, d.lvl), 1);
    const sec = sectionById(S.cam && S.cam.sec);
    const lvl = wildLevel({ far, caught: caughtCount(), rand: Math.random(), top, initiated: !!G.flags.initiated,
      floor: capsFor(G.cycle).enemyFloor, chapter: (sec && sec.chapter) || 1, train: !!(sec && sec.train) }); 
    
    let fam = Math.random() < 0.05 ? 1 + Math.floor(Math.random() * 3) : [0, ...Array.from({ length: 37 }, (_, i) => i + 4)][Math.floor(Math.random() * 38)];
    
    const table = tableHere();
    if (table.length && (fam === 0 || fam > 3) && Math.random() < WILD_TABLE_SHARE) fam = table[Math.floor(Math.random() * table.length)];
    const stage = lvl > 9 && Math.random() < 0.15 ? 2 : lvl > 30 && Math.random() < 0.1 ? 3 : 1;
    
    const mate = !near && pid >= 0 && Math.random() < KIN_SHARE ? G.wilds.find((o) => o.patch === pid && o.sec === (S.cam && S.cam.sec) && !o.kin && !o.scripted) : null;
    const kinSp = mate ? kinSpecies(speciesById(mate.d.sp)) : null;
    const d = makeDachi(kinSp || fam * 3 + stage, lvl);
    if (Math.random() < U.clamp((far - 15) / 90, 0.05, 0.35)) d.corrupt = true;
    const form = kinSp ? mate.d.form : rollForm(G.region, Math.random); if (form) d.form = form; 
    d.shiny = rollShiny(Math.random()) || undefined; if (d.shiny) { d.corrupt = false; d.hp = statsOf(d).maxHp; } 
    const w = { x, y, d, home: { x, y }, patch: pid, sec: S.cam && S.cam.sec, tx: x, ty: y, wait: Math.random() * 2, face: 1, walk: 0, stun: 0, chase: false };
    if (kinSp && mate) w.kin = mate; 
    w.bb = dachiBillboard(S.stage.scene, speciesById(d.sp).stage, sizeMult(speciesById(d.sp), d));
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
  
  
  
  
  const here = S.cam && S.cam.sec;
  if (active && (W !== filledW || here !== filledSec)) {
    filledW = W; filledSec = here;
    let have = G.wilds.filter((w) => W.sectionAt(w.x, w.y) === here).length, n = 0; 
    
    
    const inSight = (x, y) => { const [sx, sy] = S.stage.toScreen(x, y, W.groundAt(x, y)); return sx > innerWidth * 0.12 && sx < innerWidth * 0.88 && sy > innerHeight * 0.18 && sy < innerHeight * 0.75; };
    const cap = patchesHere().cap; 
    for (let k = 0; k < 2 && have < cap; k++) if (spawnWild(null, 4, inSight)) have++, n++;
    while (have < cap && spawnWild(null, 4)) have++, n++;
    if (n) G.safeTimer = Math.max(G.safeTimer, 1.5);
  }
  if (active) {
    respawn -= dt;
    if (G.wilds.length < patchesHere().cap && respawn <= 0) { spawnWild(); respawn = 1.2; }
  }
  
  for (const w of G.wilds.slice()) if (!w.scripted && !w.chase && S.cam && S.cam.sec && W.sectionAt(w.x, w.y) !== S.cam.sec) removeWild(w);
  const safe = isSafe(W.sectionAt(p.x, p.y)) || isSafe(S.cam && S.cam.sec);
  if (safe) for (const w of G.wilds.slice()) if (!w.scripted && isSafe(W.sectionAt(w.x, w.y))) removeWild(w);
  let touched = null;
  for (const w of G.wilds) {
    if (w.scripted) continue;   
    w.stun -= dt;
    const d = U.dist(w.x, w.y, p.x, p.y);
    const T = temperOf(w.d); 
    w.chase = active && !safe && d < 3.2 * T.notice && G.safeTimer <= 0 && w.stun <= 0 && G.party.some(x => x.hp > 0);
    let tx = w.tx, ty = w.ty, sp = 1.1 * T.wander;
    if (w.chase) { tx = p.x; ty = p.y; sp = (w.d.corrupt ? 2.9 : 2.5) * T.chase; }
    else {
      w.wait -= dt;
      if (w.wait > 0) { w.moving = false; continue; }
    }
    const dx = tx - w.x, dy = ty - w.y, dl = Math.hypot(dx, dy);
    if (w.kin && !G.wilds.includes(w.kin)) w.kin = null; 
    const roam = w.kin ? KIN_RADIUS * 2 : 5, cx = w.kin ? w.kin.x : w.home.x, cy = w.kin ? w.kin.y : w.home.y;
    if (dl < 0.08) { w.wait = (0.5 + Math.random() * 2.5) * T.wait * (w.kin ? 0.5 : 1); w.tx = cx + (Math.random() - 0.5) * roam; w.ty = cy + (Math.random() - 0.5) * roam; w.moving = false; }
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
    setDachiLook(w.bb, w.d.sp, { corrupt: w.d.corrupt, shiny: w.d.shiny, form: w.d.form, flip: w.face < 0 });
    const T = temperOf(w.d); 
    const bob = w.moving ? Math.abs(Math.sin(w.walk)) * 0.12 * T.hop : Math.sin(t * (T.hop < 1 ? 1.4 : 3) + w.x) * 0.02;
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
