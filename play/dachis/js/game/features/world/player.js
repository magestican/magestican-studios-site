
import { U } from '../../../engine/core/util.js';
import { G, S } from '../../state.js';
import { kidBillboard, setKidFrame, dachiBillboard, setDachiLook, dachiSize } from '../../art/billboards.js';
import { speciesById } from '../../data/species.js';
import { hatGeoOf } from '../../data/collectibles.js';
import { FOLLOW, BODY_R } from './crowd.js';
import { stepSound } from './mapgen.js';
import { toast } from '../../../engine/ui/dialog.js';

let kid = null, pet = null, petSp = 0;


export function createPlayerView() {
  kid = kidBillboard(S.stage.scene, G.gender);
}

export function updatePlayer(dt, canMove) {
  const p = G.player, W = S.W;
  const a = canMove ? S.input.axis() : { x: 0, y: 0, mag: 0 };
  p.moving = a.mag > 0.12;
  if (p.moving) {
    p.vx = a.x; p.vy = a.y;
    const [wx, wy] = S.stage.screenDirToWorld(a.x, a.y);
    const run = S.input.down('run') || a.mag > 0.92 && S.input.mode !== 'keys';
    const speed = (run ? 5.4 : 3.3) * Math.max(0.35, a.mag) * dt;
    const nx = p.x + wx * speed, ny = p.y + wy * speed;
    if (W.walkable(nx, p.y, BODY_R.kid)) p.x = nx;
    if (W.walkable(p.x, ny, BODY_R.kid)) p.y = ny;
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
      
      if (W.walkable(f.x + dx * k, f.y, BODY_R.dachi)) f.x += dx * k;
      if (W.walkable(f.x, f.y + dy * k, BODY_R.dachi)) f.y += dy * k;
      f.walk += dt * 10;
    }
    if (d > 6) { f.x = p.x; f.y = p.y; } 
  }
}


export function drawPlayer(t, { hidden = false, shout = false, cheer = false, land = 0, hidePet = false, lookAt = null } = {}) {
  const p = G.player, W = S.W;
  kid.setVisible(!hidden);
  const dir = p.moving ? S.stage.screenDirToWorld(p.vx, p.vy) : lookAt ? [lookAt.x - p.x, lookAt.y - p.y] : null;
  setKidFrame(kid, { gender: G.gender, walk: p.walk, moving: p.moving, shout: shout && !cheer, cheer: cheer && !p.moving, land: Math.max(land, p.braced ? 0.55 : 0), dir });
  kid.place(p.x, p.y, W.groundAt(p.x, p.y));
  const lead = G.party[0];
  if (lead && !pet) pet = dachiBillboard(S.stage.scene, speciesById(lead.sp).stage);
  if (pet) {
    pet.setVisible(!!lead && !hidden && !hidePet);
    if (lead) {
      if (lead.sp !== petSp) { petSp = lead.sp; pet.setSize(dachiSize(speciesById(lead.sp).stage)); }
      const f = G.follower;
      setDachiLook(pet, lead.sp, { flip: f.face < 0, hat: hatGeoOf(lead.hat) });
      const bob = f.moving ? Math.abs(Math.sin(f.walk)) * 0.12 : Math.sin(t * 3) * 0.02;
      pet.place(f.x, f.y, W.groundAt(f.x, f.y), bob);
    }
  }
}
