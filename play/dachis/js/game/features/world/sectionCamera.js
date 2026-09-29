





import { G, S } from '../../state.js';
import { sectionById, nextSection, viewFor, clampView, targetFor, toUV, screenS } from './sections.js';
import { VIEW_ZOOM, CHAR_SCALE } from './crowd.js';
import { setSeeTargets } from '../../../engine/iso/seeThrough.js';
import { KID_WORLD_H, ELDER_WORLD_H } from '../../art/humanRig.js';

const FADE = 0.16;   
export const cam = {
  sec: null, u: 0, s: 0, fade: 0, pending: null, snap: true,
  free: false,       
  onSection: null,   
};


export function resetCamera() { cam.sec = null; cam.pending = null; cam.fade = 0; cam.snap = true; }

function enter(id) {
  cam.sec = id; cam.snap = true;
  if (cam.onSection) cam.onSection(id);
}

export function updateCamera(dt, focus) {
  if (cam.free) return;
  const W = S.W, stage = S.stage, p = G.player;
  const want = nextSection(cam.sec, p.x, p.y);
  if (!cam.sec) enter(want);
  else if (want !== cam.sec && !cam.pending) cam.pending = want;
  if (cam.pending) {
    cam.fade = Math.min(1, cam.fade + dt / FADE);
    if (cam.fade >= 1) { const id = cam.pending; cam.pending = null; enter(nextSection(cam.sec, p.x, p.y) === id ? id : cam.sec); }
  } else cam.fade = Math.max(0, cam.fade - dt / FADE);

  const sec = sectionById(cam.sec), win = W.windows[cam.sec], aspect = stage.w / stage.h;
  const base = viewFor(win, sec.zoom * VIEW_ZOOM, aspect); 
  
  let view = base, wu, ws;
  if (focus.vh) {
    const vh = Math.min(focus.vh, win.s[1] - win.s[0], (win.u[1] - win.u[0]) / aspect);
    view = { vh, vw: vh * aspect }; wu = focus.u; ws = focus.s;
  } else {
    const [fu, fv] = toUV(focus.x, focus.y);
    
    wu = fu; ws = screenS(fv, W.groundAt(focus.x, focus.y)) - 0.4;
  }
  
  if (cam.snap || !cam.vh) cam.vh = view.vh;
  else cam.vh += (view.vh - cam.vh) * Math.min(1, dt * (focus.vh ? 5 : 3));
  if (Math.abs(cam.vh - stage.viewHeight) > 1e-4) stage.setViewHeight(cam.vh);
  const eased = { vh: cam.vh, vw: cam.vh * aspect };
  const [cu, cs] = clampView(win, eased, wu, ws);
  if (cam.snap) { cam.u = cu; cam.s = cs; cam.snap = false; }
  else { const k = Math.min(1, dt * 6); cam.u += (cu - cam.u) * k; cam.s += (cs - cam.s) * k; }
  
  [cam.u, cam.s] = clampView(win, eased, cam.u, cam.s);
  const focusH = focus.vh ? focus.h : W.groundAt(focus.x, focus.y);
  const t = targetFor(cam.u, cam.s, focusH);
  stage.lookAt(t.x, t.y, t.h);
}




export function updateSeeThrough(dt, battle = null, talking = null) {
  const W = S.W, p = G.player, T = [];
  const body = (id, x, y, tall) => T.push({ id, x, y, h: W.groundAt(x, y) + tall * 0.5, r: tall * 0.62 + 0.18 });
  if (G.mode !== 'title' && G.mode !== 'cutscene') {
    body('kid', p.x, p.y, KID_WORLD_H * CHAR_SCALE);
    if (battle) { body('ally', battle.ally.x, battle.ally.y, 1.1 * CHAR_SCALE); body('enemy', battle.enemy.x, battle.enemy.y, 1.1 * CHAR_SCALE); }
    else if (G.party[0]) body('pet', G.follower.x, G.follower.y, 1.0 * CHAR_SCALE);
    if (talking) body('talk', talking.x, talking.y, (talking.kind === 'elder' ? ELDER_WORLD_H : 1.0) * CHAR_SCALE);
  }
  setSeeTargets(S.stage, T, dt);
}


export function drawFade(ctx, w, h) {
  if (cam.fade <= 0) return;
  ctx.fillStyle = `rgba(12,8,20,${cam.fade})`;
  ctx.fillRect(0, 0, w, h);
}
