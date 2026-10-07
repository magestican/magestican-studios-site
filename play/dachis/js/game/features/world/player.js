
import { U } from '../../../engine/core/util.js';
import { G, S } from '../../state.js';
import { kidBillboard, setKidFrame, dachiBillboard, setDachiLook, dachiSize } from '../../art/billboards.js';
import { speciesById } from '../../data/species.js';
import { sizeMult } from '../../data/sizes.js';
import { hatGeoOf } from '../../data/collectibles.js';
import { FOLLOW, BODY_R } from './crowd.js';
import { stepSound } from './mapgen.js';
import { toast } from '../../../engine/ui/dialog.js';
import { stepTo, deckLift } from './deckRules.js';
import { slideFrom, snapDir } from './slide.js';
import { thinBlocked } from './thinIce.js';
import { magmaWalk } from './magma.js';
import { toUV, fromUV } from './sections.js';




export const SLIDE_SPEED = 8;
function onIce(W, p, dt, push) {
  const F = W.slide, [u, v] = toUV(p.x, p.y);
  if (p.slide) {
    const [tx, ty] = p.slide.to, d = Math.hypot(tx - p.x, ty - p.y), step = SLIDE_SPEED * dt;
    if (d <= step) { p.x = tx; p.y = ty; p.slide = null; S.sfx.play('landThud'); } else { p.x += (tx - p.x) / d * step; p.y += (ty - p.y) / d * step; }
    return true;
  }
  const c = Math.floor((u - F.u0) / F.cell), r = Math.floor((v - F.v0) / F.cell);
  const k = r < 0 || r >= F.grid.length || c < 0 || c >= F.grid[0].length ? null : F.grid[r][c];
  if (k !== '.' && k !== '#') return false; 
  if (!push) return true;
  const [du, dv] = snapDir(push[0], push[1]), end = slideFrom(F.grid, c, r, du, dv);
  const cu = F.u0 + (end.c + 0.5) * F.cell, cv = end.off === 'north' ? F.v0 + F.grid.length * F.cell + 1.2 : end.off === 'south' ? F.v0 - 1.2 : F.v0 + (end.r + 0.5) * F.cell;
  
  const su = du ? u : F.u0 + (c + 0.5) * F.cell, sv = dv ? v : F.v0 + (r + 0.5) * F.cell;
  [p.x, p.y] = fromUV(su, sv);
  const to = fromUV(du ? cu : su, dv ? cv : sv);
  if (Math.hypot(to[0] - p.x, to[1] - p.y) < 0.05) return true; 
  p.slide = { to };
  S.sfx.play('swoop');
  return true;
}

let kid = null, pet = null, petSp = 0;


export function createPlayerView() {
  kid = kidBillboard(S.stage.scene, G.gender);
}

export function updatePlayer(dt, canMove) {
  const p = G.player, W = S.W;
  
  const go = (who, x, y, r) => {
    const hz = W.hazard ? magmaWalk(W, x, y) : null; 
    if (hz !== null) return hz;
    return W.thin && thinBlocked(W, x, y) ? false : W.decks ? stepTo(W, who, x, y, r, G.flags) : W.walkable(x, y, r); 
  };
  const a = canMove ? S.input.axis() : { x: 0, y: 0, mag: 0 };
  p.moving = a.mag > 0.12;
  if (W.slide) {
    let push = null;
    if (p.moving) { const [wx, wy] = S.stage.screenDirToWorld(a.x, a.y); push = [wx - wy, wx + wy]; }
    if (canMove && onIce(W, p, dt, push)) p.moving = false; else if (p.slide) p.slide = null;
  } else p.slide = null;
  if (p.moving) {
    p.vx = a.x; p.vy = a.y;
    const [wx, wy] = S.stage.screenDirToWorld(a.x, a.y);
    const run = S.input.down('run') || a.mag > 0.92 && S.input.mode !== 'keys';
    const speed = (run ? 5.4 : 3.3) * Math.max(0.35, a.mag) * dt * (W.slowAt ? W.slowAt(p.x, p.y) : 1); 
    const nx = p.x + wx * speed, ny = p.y + wy * speed;
    if (go(p, nx, p.y, BODY_R.kid)) p.x = nx;
    if (go(p, p.x, ny, BODY_R.kid)) p.y = ny;
    const before = Math.floor(p.walk / Math.PI);
    p.walk += dt * (run ? 16 : 11);
    
    
    if (Math.floor(p.walk / Math.PI) !== before) S.sfx.play(stepSound(W.type[W.idx(Math.floor(p.x), Math.floor(p.y))]));
  }
  
  if (!W.wind && document.body.dataset.gust) delete document.body.dataset.gust;
  if (!W.wind) p.braced = false;
  if (W.wind) {
    p.windT = (p.windT || 0) + dt;
    const ph = W.gustAt ? W.gustAt(p.windT).phase : null; 
    if (ph === 'warn' && p.windPhase !== 'warn') toast('The grass flattens - a gust is coming!', 1300);
    p.windPhase = ph;
    
    if (ph && ph !== 'calm') {
      const g = W.gustAt(p.windT + (ph === 'warn' ? 1 : 0));
      const a = S.stage.toScreen(p.x, p.y), [dx, dy] = W.windDir ? W.windDir(g.dir) : [g.dir, 0], b = S.stage.toScreen(p.x + dx, p.y + dy);
      document.body.dataset.gust = ph + (b[0] >= a[0] ? '-r' : '-l');
    } else delete document.body.dataset.gust;
    const [px, py] = W.wind(p.windT, p.x, p.y);
    p.braced = !!(px || py); 
    if (px || py) { if (W.walkable(p.x + px * dt, p.y, BODY_R.kid)) p.x += px * dt; if (W.walkable(p.x, p.y + py * dt, BODY_R.kid)) p.y += py * dt; }
  }
  
  
  const f = G.follower, lead = G.party[0];
  if (lead) {
    const d = U.dist(f.x, f.y, p.x, p.y);
    f.moving = d > FOLLOW + 0.1;
    if (f.moving) {
      const sp = d > 3 ? 7 : 4.2, k = Math.min(d - FOLLOW, sp * dt) / d;
      const dx = p.x - f.x, dy = p.y - f.y;
      if (Math.abs(dx - dy) > 0.05) f.face = dx - dy > 0 ? 1 : -1;
      
      if (go(f, f.x + dx * k, f.y, BODY_R.dachi)) f.x += dx * k;
      if (go(f, f.x, f.y + dy * k, BODY_R.dachi)) f.y += dy * k;
      f.walk += dt * 10;
    }
    if (d > 6) { f.x = p.x; f.y = p.y; f.deck = p.deck || null; } 
  }
}


export function drawPlayer(t, { hidden = false, shout = false, cheer = false, land = 0, hidePet = false, lookAt = null } = {}) {
  const p = G.player, W = S.W;
  kid.setVisible(!hidden);
  const dir = p.moving ? S.stage.screenDirToWorld(p.vx, p.vy) : lookAt ? [lookAt.x - p.x, lookAt.y - p.y] : null;
  setKidFrame(kid, { gender: G.gender, walk: p.walk, moving: p.moving, shout: shout && !cheer, cheer: cheer && !p.moving, land: Math.max(land, p.braced ? 0.55 : 0), dir });
  kid.place(p.x, p.y, W.groundAt(p.x, p.y) + (p.lift || 0) + (W.decks ? deckLift(W, p) : 0)); 
  const lead = G.party[0];
  if (lead && !pet) pet = dachiBillboard(S.stage.scene, speciesById(lead.sp).stage, sizeMult(speciesById(lead.sp), lead));
  if (pet) {
    pet.setVisible(!!lead && !hidden && !hidePet);
    if (lead) {
      if (lead.uid + lead.sp !== petSp) { petSp = lead.uid + lead.sp; pet.setSize(dachiSize(speciesById(lead.sp).stage) * sizeMult(speciesById(lead.sp), lead)); } 
      const f = G.follower;
      setDachiLook(pet, lead.sp, { shiny: lead.shiny, form: lead.form, flip: f.face < 0, hat: hatGeoOf(lead.hat) });
      
      if (f.hop > 0) f.hop = Math.max(0, f.hop - 1 / 60);
      const bob = f.moving ? Math.abs(Math.sin(f.walk)) * 0.12 : f.hop > 0 ? Math.abs(Math.sin(f.hop * 11.4)) * 0.35 : Math.sin(t * 3) * 0.02;
      pet.place(f.x, f.y, W.groundAt(f.x, f.y) + (f.lift || 0) + (W.decks ? deckLift(W, f) : 0), bob);
    }
  }
}
