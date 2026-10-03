

import { eggLine } from '../story/egg.js';
import { G, S, saveGame, healParty, addDachi } from '../../state.js';
import { speciesById, statsOf } from '../../data/species.js';
import { giveXp, xpReward, bondAfter, BOND_NEW_FRIEND, battleReport } from './rules.js';
import { removeWild } from '../world/wilds.js';
import { checkEvolutions } from '../party/evolution.js';
import { respawnPoint } from '../world/travel.js';
import { lairOf, fallLine } from '../world/lairs.js';
import { questEvent, bossStoneLines } from '../quest/questRuntime.js';

export function onBattleFinished(b) {
  
  
  
  
  const report = battleReport(b.result, b.t);
  if (report) {
    import('/web-engine/progress/report.js')
      .then((m) => m.reportMatch({ game: 'dachis', outcome: report.outcome, mode: report.mode, seconds: report.seconds }))
      .catch(() => {});
  }
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
      msgs.push(...questEvent({ kind: 'befriend', sp: enemy.sp, types: es.types })); 
    }
    if (b.boss && res === 'win') { 
      G.flags['boss_' + b.boss] = true;
      msgs.unshift({ text: `"${speciesById(enemy.sp).blurb}"`, who: speciesById(enemy.sp).name }, fallLine(lairOf(b.boss), speciesById(enemy.sp).name)); 
      msgs.push(...bossStoneLines(b.boss)); 
      G.flags.egg = (G.flags.egg || 0) + 1; 
      msgs.push({ text: eggLine(G.flags.egg) });
    }
    if (res === 'win') msgs.push(...questEvent({ kind: 'beat', boss: b.boss || null, sp: enemy.sp }));
    if (Math.random() < 0.25) { G.items.tonic++; msgs.push('Found a Berry Tonic!'); }
    removeWild(wild);
  } else if (res === 'lose') {
    msgs.push('Your companions are exhausted... You carry them back to the nearest hot spring.');
    const p = G.player;
    const home = respawnPoint(G.region, G.flags, p.x, p.y); 
    p.x = home.x; p.y = home.y; G.follower.x = p.x; G.follower.y = p.y - 0.6;
    healParty();
  } else if (res === 'run') wild.stun = 3;
  saveGame();
  if (msgs.length) S.dialog.say(msgs.map(m => (typeof m === 'string' ? { text: m } : m)), () => checkEvolutions());
  else checkEvolutions();
}
