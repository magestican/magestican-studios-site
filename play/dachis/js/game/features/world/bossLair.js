






import { U } from '../../../engine/core/util.js';
import { G, S } from '../../state.js';
import { fromUV } from './sections.js';
import { dachiBillboard, setDachiLook } from '../../art/billboards.js';
import { bossSpecies, speciesById } from '../../data/species.js';
import { startBossBattle } from '../battle/battle.js';



export const LAIRS = [{ boss: 'ashlo', uv: [13, 78], after: 'kumabo' }]; 
const MEET = 2.3; 

let lairs = null;
function spot(uv) { 
  const [x0, y0] = fromUV(...uv);
  for (let r = 0; r < 4; r += 0.25) for (let a = 0; a < 6.28; a += 0.5) {
    const x = x0 + Math.cos(a) * r, y = y0 + Math.sin(a) * r;
    if (S.W.walkable(x, y, 0.6)) return { x, y };
  }
  return { x: x0, y: y0 };
}
const open = (l) => G.flags[l.after] && !G.flags['boss_' + l.boss];

export function updateBossLairs() {
  if (!S.W) return;
  lairs ||= LAIRS.map((l) => ({ ...l, sp: bossSpecies(l.boss), bb: null, met: false }));
  if (S.dialog.active || G.mode !== 'world') return;
  const p = G.player;
  for (const l of lairs) {
    if (!open(l)) continue;
    l.at ||= spot(l.uv);
    if (U.dist(p.x, p.y, l.at.x, l.at.y) > MEET) { l.met = false; continue; }
    if (l.met) continue;
    l.met = true;
    const name = l.sp.name;
    S.dialog.say([
      { who: name, text: `So the Bridge child walks the ash. Listen, little one: "${l.sp.blurb}"` },
      { who: name, text: 'The god opens the way to the promised land. You will not close it.' },
      { who: G.name || 'You', text: 'Nobody is burning this island. Not while we are here!' },
    ], () => { l.met = true; if (startBossBattle(l.boss, { x: l.at.x, y: l.at.y })) S.sfx.play('rage'); });
  }
}


export function drawBossLairs(t, battle) {
  if (!lairs) return;
  for (const l of lairs) {
    const show = open(l) && !(battle && battle.boss === l.boss) && l.at;
    if (!show) { if (l.bb) { l.bb.dispose(S.stage.scene); l.bb = null; } continue; }
    if (!l.bb) l.bb = dachiBillboard(S.stage.scene, 3);
    const p = G.player;
    setDachiLook(l.bb, l.sp.id, { corrupt: true, flip: p.x - p.y < l.at.x - l.at.y });
    l.bb.place(l.at.x, l.at.y, S.W.groundAt(l.at.x, l.at.y), Math.sin(t * 1.6) * 0.03);
  }
}


export function nextBoss() {
  const l = LAIRS.find((x) => G.flags[x.after] && !G.flags['boss_' + x.boss]);
  return l ? speciesById(bossSpecies(l.boss).id) : null;
}
