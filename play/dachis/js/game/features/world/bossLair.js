








import { U } from '../../../engine/core/util.js';
import { G, S } from '../../state.js';
import { fromUV } from './sections.js';
import { dachiBillboard, setDachiLook } from '../../art/billboards.js';
import { bossSpecies, speciesById } from '../../data/species.js';
import { startBossBattle } from '../battle/battle.js';
import { LAIRS, MEET, lairOpen, nextLair, meetLines } from './lairs.js';



export { LAIRS };


let lairs = null;
function spot(uv) { 
  const [x0, y0] = fromUV(...uv);
  for (let r = 0; r < 4; r += 0.25) for (let a = 0; a < 6.28; a += 0.5) {
    const x = x0 + Math.cos(a) * r, y = y0 + Math.sin(a) * r;
    if (S.W.walkable(x, y, 0.6)) return { x, y };
  }
  return { x: x0, y: y0 };
}
const open = (l) => lairOpen(l, G.flags);

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
    S.dialog.say(meetLines(l, l.sp.blurb).map(([who, text]) => ({ who: who === 'kid' ? G.name || 'You' : name, text, boss: who !== 'kid' })), () => { l.met = true; if (startBossBattle(l.boss, { x: l.at.x, y: l.at.y })) S.sfx.play('rage'); });
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


export function lairBodies() {
  const out = [];
  if (lairs) for (const l of lairs) if (l.bb && l.at && open(l)) out.push({ id: 'boss-' + l.boss, x: l.at.x, y: l.at.y, bb: l.bb });
  return out;
}


export function nextBoss() {
  const l = nextLair(G.flags);
  return l ? speciesById(bossSpecies(l.boss).id) : null;
}
