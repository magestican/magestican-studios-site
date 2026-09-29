

import { U } from '../../../engine/core/util.js';
import { G, S, saveGame, healParty, addDachi } from '../../state.js';
import { speciesById, statsOf } from '../../data/species.js';
import { giveXp, xpReward, bondAfter, BOND_NEW_FRIEND } from './rules.js';
import { removeWild } from '../world/wilds.js';
import { checkEvolutions } from '../party/evolution.js';
import { VOLC, SHRINE, RESPAWN } from '../world/mapgen.js';

export function onBattleFinished(b) {
  if (b.opts.onEnd) { b.opts.onEnd(b.result, b); return; }
  const res = b.result, enemy = b.enemy.d, wild = b.wild, msgs = [];
  if (res === 'win' || res === 'capture') {
    const gain = xpReward(enemy);
    for (const d of G.party) {
      if (d.hp <= 0 && d !== b.ally.d) continue;
      const lv = giveXp(d, d === b.ally.d ? gain : Math.floor(gain / 2), G.cycle);
      d.bond = bondAfter(d, d === b.ally.d ? 3 : 1);   
      if (lv) msgs.push(`${speciesById(d.sp).name} grew to level ${d.lvl}!`);
    }
    if (res === 'capture') {
      const es = speciesById(enemy.sp);
      if (enemy.corrupt) { enemy.corrupt = false; msgs.push(`The red fractures shatter into white light... ${es.name}'s corruption is washed away!`); }
      enemy.hp = statsOf(enemy).maxHp;   
      delete enemy.maxHpOverride;
      enemy.bond = BOND_NEW_FRIEND;        
      const joined = addDachi(enemy);
      msgs.push(joined ? `${es.name} joined your companions!` : `${es.name} went to your Dachi Den. (Friends: ${G.box.length})`);
    }
    if (Math.random() < 0.25) { G.items.tonic++; msgs.push('Found a Berry Tonic!'); }
    removeWild(wild);
  } else if (res === 'lose') {
    msgs.push('Your companions are exhausted... You carry them back to the nearest hot spring.');
    const p = G.player;
    const home = G.flags.initiated && U.dist(p.x, p.y, SHRINE.x, SHRINE.y) < U.dist(p.x, p.y, VOLC.x, VOLC.y) ? RESPAWN.shrine : RESPAWN.kazan;
    p.x = home.x; p.y = home.y; G.follower.x = p.x; G.follower.y = p.y - 0.6;
    healParty();
  } else if (res === 'run') wild.stun = 3;
  saveGame();
  if (msgs.length) S.dialog.say(msgs.map(text => ({ text })), () => checkEvolutions());
  else checkEvolutions();
}
