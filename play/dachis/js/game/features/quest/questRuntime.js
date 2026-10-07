

import { toast } from '../../../engine/ui/dialog.js';
import { G, S, saveGame, caughtCount } from '../../state.js';
import { speciesById, SPECIES } from '../../data/species.js';
import { advance, reminder } from './quests.js';
import { collect, collectibleById, bossCollectibles, KINDS } from '../../data/collectibles.js';
import { ITEMS } from '../pickups/pickups.js';
import { earned, unlock } from '../achievements/achievements.js';

const NARR = { who: '' }; 




export function syncAchievements(quiet = false) {
  const got = earned(G.flags, { caught: caughtCount(), total: SPECIES.length, cycle: G.cycle }).map((id) => unlock(G.flags, id, Date.now())).filter(Boolean);
  if (!quiet) for (const a of got) toast('Achievement: ' + a.name);
  return got;
}
const found = (c) => `You found ${/^[AEIOU]/.test(KINDS[c.kind].one) ? 'an' : 'a'} ${KINDS[c.kind].one}: ${c.name}!`;


function rewardLines(r) {
  const out = [];
  if (!r) return out;
  if (r.collectible) { const c = collect(G.flags, r.collectible); if (c) out.push(found(c)); }
  for (const [k, n] of Object.entries(r.items || {})) { G.items[k] = (G.items[k] || 0) + n; out.push(`You received ${n} ${ITEMS[k] ? ITEMS[k].name : k}${n > 1 ? 's' : ''}.`); }
  return out;
}

function linesOf(results, who) {
  const out = [];
  for (const r of results) {
    for (const t of r.say) out.push(who ? { ...who, text: t } : { ...NARR, text: t });
    if (r.step.kind === 'talk' && r.quest.steps[0] === r.step) out.push({ ...NARR, text: `New quest: ${r.quest.name}. (Menu > Journal)` });
    if (r.done) { out.push({ ...NARR, text: `Quest done: ${r.quest.name}!` }); out.push(...rewardLines(r.reward).map((text) => ({ ...NARR, text }))); }
  }
  return out;
}



export function questTalk(n) {
  if (!n.id) return null;
  const who = { who: speciesById(n.sp).name, portrait: n.sp };
  const res = advance(G.flags, { kind: 'talk', npc: n.id }, G.items);
  if (res.length) { const lines = linesOf(res, who); syncAchievements(); saveGame(); return lines; }
  const r = reminder(G.flags, n.id);
  return r ? [{ ...who, text: r + '...?' }] : null;
}


export function questEvent(event, show = false) {
  const res = advance(G.flags, event, G.items);
  
  if (!res.length) { syncAchievements(); return []; }
  const lines = linesOf(res);
  syncAchievements();
  if (show && lines.length) S.dialog.say(lines);
  return lines;
}

export function pickCollectible(id) {
  const c = collect(G.flags, id);
  if (!c) return;
  S.sfx.play('pickup');
  toast(found(c));
  questEvent({ kind: 'find', id }, true);
  syncAchievements();
  saveGame();
}

export function bossStoneLines(boss) {
  const lines = bossCollectibles(G.flags, boss).map((c) => { collect(G.flags, c.id); return found(c); });
  syncAchievements();
  return lines;
}
export { collectibleById };
