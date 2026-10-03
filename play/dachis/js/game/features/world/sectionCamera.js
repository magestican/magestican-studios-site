





import { G, S } from '../../state.js';
import { sectionById, nextSection, viewFor, clampView, targetFor, toUV, screenS } from './sections.js';
import { VIEW_ZOOM, CHAR_SCALE, seeWindow, seeOrder, bossBody } from './crowd.js';
import { setSeeTargets, SEE_MAX } from '../../../engine/iso/seeThrough.js';
import { KID_WORLD_H, ELDER_WORLD_H } from '../../art/humanRig.js';

const FADE = 0.16;   
export const cam = {
  sec: null, u: 0, s: 0, fade: 0, pending: null, snap: true,
  free: false,       
  onSection: null,   
};


export function resetCamera() { cam.sec = null; cam.pending = null; cam.fade = 0; cam.snap = true; cam.zoomIn = null; }


export function zoomInFromIntro(k) { cam.zoomIn = { t: 0, k }; }

function enter(id) {
  cam.sec = id; cam.snap = true;
  if (cam.onSection) cam.onSection(id);
}

export function updateCamera(dt, focus) {
  if (cam.free) return;
  const W = S.W, stage = S.stage, p = G.player;
  const want = nextSection(cam.sec, p.x, p.y, W.sections);
  if (!cam.sec) enter(want);
  else if (want !== cam.sec && !cam.pending) cam.pending = want;
  if (cam.pending) {
    cam.fade = Math.min(1, cam.fade + dt / FADE);
    if (cam.fade >= 1) { const id = cam.pending; cam.pending = null; enter(nextSection(cam.sec, p.x, p.y, W.sections) === id ? id : cam.sec); }
  } else cam.fade = Math.max(0, cam.fade - dt / FADE);

  const sec = sectionById(cam.sec), win = W.windows[cam.sec], aspect = stage.w / stage.h;
  const base = viewFor(win, sec.zoom * VIEW_ZOOM, aspect); 
  
  let view = base, wu, ws;
  if (focus.vh) {
    const vh = focus.free ? focus.vh : Math.min(focus.vh, win.s[1] - win.s[0], (win.u[1] - win.u[0]) / aspect); 
    view = { vh, vw: vh * aspect }; wu = focus.u; ws = focus.s;
  } else {
    const [fu, fv] = toUV(focus.x, focus.y);
    
    wu = fu; ws = screenS(fv, W.groundAt(focus.x, focus.y)) - 0.4;
  }
  let follow = false;
  if (cam.zoomIn && !focus.vh) {
    cam.zoomIn.t += dt;
    const k = cam.zoomIn.k(cam.zoomIn.t);
    if (k >= 1) cam.zoomIn = null; else { view = { vh: view.vh * k, vw: view.vw * k }; follow = true; }
  }
  
  if (cam.snap || !cam.vh || follow) cam.vh = view.vh;
  else cam.vh += (view.vh - cam.vh) * Math.min(1, dt * (focus.vh ? 5 : 3));
  if (Math.abs(cam.vh - stage.viewHeight) > 1e-4) stage.setViewHeight(cam.vh);
  const eased = { vh: cam.vh, vw: cam.vh * aspect };
  const [cu, cs] = focus.free ? [wu, ws] : clampView(win, eased, wu, ws);
  if (cam.snap) { cam.u = cu; cam.s = cs; cam.snap = false; }
  else { const k = Math.min(1, dt * 6); cam.u += (cu - cam.u) * k; cam.s += (cs - cam.s) * k; }
  
  if (!focus.free) [cam.u, cam.s] = clampView(win, eased, cam.u, cam.s);
  const focusH = focus.vh ? focus.h : W.groundAt(focus.x, focus.y);
  const t = targetFor(cam.u, cam.s, focusH);
  stage.lookAt(t.x, t.y, t.h);
}










const SEE_BOSS_NEAR = 12; 


const sized = (id, f, tall, half = 0, actor = false) => ({ id, x: f.x, y: f.y, tall, half, actor });
const bossSized = (id, f, bb) => { const e = bb.extent() || bossBody(bb.bossScale); return sized(id, f, e.tall, e.half); };
export function updateSeeThrough(dt, battle = null, bosses = []) {
  const W = S.W, p = G.player, T = [];
  if (G.mode !== 'title' && G.mode !== 'cutscene') {
    const core = [sized('kid', p, KID_WORLD_H * CHAR_SCALE, 0, true)];
    if (battle) for (const [id, f] of [['ally', battle.ally], ['enemy', battle.enemy]]) core.push(f.bb.bossScale ? bossSized(id, f, f.bb) : sized(id, f, 1.1 * CHAR_SCALE));
    else if (G.party[0]) core.push(sized('pet', G.follower, 1.0 * CHAR_SCALE));
    const bs = [];
    for (const b of bosses) if (Math.hypot(b.x - p.x, b.y - p.y) < SEE_BOSS_NEAR) bs.push(bossSized(b.id, b, b.bb));
    for (const o of seeOrder({ core, bosses: bs, npcs: G.npcs }, SEE_MAX, p)) {
      const npc = o.tall === undefined, w = npc ? seeWindow((o.kind === 'elder' ? ELDER_WORLD_H : 1.0) * CHAR_SCALE) : seeWindow(o.tall, o.half);
      T.push({ id: npc ? o : o.id, x: o.x, y: o.y, h: W.groundAt(o.x, o.y) + w.mid, r: w.r, actor: o.actor });
    }
  }
  setSeeTargets(S.stage, T, dt);
}


export function drawFade(ctx, w, h) {
  if (cam.fade <= 0) return;
  ctx.fillStyle = `rgba(12,8,20,${cam.fade})`;
  ctx.fillRect(0, 0, w, h);
}
