




import { G, S } from '../../state.js';
import { KnightActor } from '../../art/knightActor.js';
import { CHAR_SCALE } from '../world/crowd.js';
import { WATCH, watchAt, watchSpots, watchDue, markWatched } from './watcherRules.js';

let run = null;
export const watching = () => !!run;

export const watchDebug = { hold: null, get t() { return run ? run.t : -1; } };


export function startWatcher(boss, done = () => {}, { force = false } = {}) {
  if (run || !S.stage || !S.W || (!force && !watchDue(G.flags, boss))) { done(); return false; }
  if (!G.flags.cheat) G.flags.watched = markWatched(G.flags, boss);
  const p = G.player, spots = watchSpots(p.x, p.y);
  const [x, y] = spots.find(([sx, sy]) => S.W.walkable(sx, sy, 0.5)) || spots[0];
  const knight = new KnightActor(S.stage.scene, { world: CHAR_SCALE });
  knight.face(p.x - x, p.y - y);
  run = { boss, t: 0, x, y, knight, done, laughed: false, wait: 0 };
  return true;
}

export function updateWatcher(dt) {
  if (!run) return;
  const r = run;
  if (!r.knight.ready() && r.wait < 4) { r.wait += dt; return; } 
  r.t = watchDebug.hold ?? r.t + dt;
  const st = watchAt(r.t), W = S.W;
  if (!r.laughed && r.t >= WATCH.laugh) { r.laughed = true; S.sfx.play('knightLaugh'); }
  
  const ax = r.x - st.away * 0.7, ay = r.y - st.away * 0.7, g = W.groundAt(r.x, r.y);
  r.knight.place(ax, ay, g + st.rise, { wing: st.wing, bob: st.bob, shown: st.shown });
  if (st.done) { r.knight.dispose(); run = null; r.done(); }
}


export function watchPass(octx) {
  if (!run) return;
  const d = watchAt(run.t).dark;
  if (d <= 0) return;
  octx.fillStyle = `rgba(8,0,6,${d})`;
  octx.fillRect(0, 0, innerWidth, innerHeight);
}
