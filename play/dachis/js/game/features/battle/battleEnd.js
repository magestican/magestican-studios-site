

import { eggLine } from '../story/egg.js';
import { G, S, saveGame, healParty, addDachi } from '../../state.js';
import { speciesById, statsOf, capsFor } from '../../data/species.js';
import { giveXp, xpReward, bondAfter, BOND_NEW_FRIEND, battleReport } from './rules.js';
import { removeWild } from '../world/wilds.js';
import { checkEvolutions } from '../party/evolution.js';
import { respawnPoint } from '../world/travel.js';
import { lairOf, fallLine, lastWords } from '../world/lairs.js';
import { patternOf } from './bossPattern.js';
import { questEvent, bossStoneLines } from '../quest/questRuntime.js';
import { xpRun, statGain, rollDrops } from './spoils.js';
import { showSpoils } from './spoilsCard.js';

export function onBattleFinished(b) {
  
  
  
  
  const report = battleReport(b.result, b.t);
  if (report) {
    import('/web-engine/progress/report.js')
      .then((m) => m.reportMatch({ game: 'dachis', outcome: report.outcome, mode: report.mode, seconds: report.seconds }))
      .catch(() => {});
  }
  if (b.opts.onEnd) { b.opts.onEnd(b.result, b); return; }
  const res = b.result, enemy = b.enemy.d, wild = b.wild, msgs = [], rows = [];
  let drops = [];
  if (res === 'win' || res === 'capture') {
    const gain = xpReward(enemy);
    for (const d of G.party) {
      if (d.hp <= 0 && d !== b.ally.d) continue;
      
      const lvl0 = d.lvl, xp0 = d.xp, amt = d === b.ally.d ? gain : Math.floor(gain / 2), gains = [];
      let st = statsOf(d);
      const lv = giveXp(d, amt, G.cycle);
      for (let L = lvl0 + 1; L <= d.lvl; L++) { const nx = statsOf({ ...d, lvl: L }); gains.push(statGain(st, nx)); st = nx; }
      d.bond = bondAfter(d, d === b.ally.d ? 3 : 1);   
      rows.push({ d, gain: amt, run: xpRun(lvl0, xp0, d.lvl, d.xp, capsFor(G.cycle).maxLevel), gains, lv });
    }
    if (res === 'capture') {
      const es = speciesById(enemy.sp);
      if (enemy.corrupt) { enemy.corrupt = false; msgs.push(`The red fractures shatter into white light... ${es.name}'s corruption is washed away!`); }
      enemy.hp = statsOf(enemy).maxHp;   
      delete enemy.maxHpOverride;
      enemy.bond = BOND_NEW_FRIEND;        
      if (enemy.shiny) msgs.push(enemy.shiny === 'gold' ? `A GOLD ${es.name}! One in five hundred - and stronger than any other.` : `A WHITE ${es.name}! One in a hundred - and stronger than the rest.`);
      const joined = addDachi(enemy);
      msgs.push(joined ? `${es.name} joined your companions!` : `${es.name} went to your Dachi Den. (Friends: ${G.box.length})`);
      msgs.push(...questEvent({ kind: 'befriend', sp: enemy.sp, types: es.types })); 
    }
    if (b.boss && res === 'win') { 
      G.flags['boss_' + b.boss] = true;
      
      const bossName = speciesById(enemy.sp).name, last = lastWords(lairOf(b.boss));
      msgs.unshift(...(last ? [{ text: last, who: bossName, boss: true }] : []), fallLine(lairOf(b.boss), bossName)); 
      msgs.push(...bossStoneLines(b.boss)); 
      G.flags.egg = (G.flags.egg || 0) + 1; 
      msgs.push({ text: eggLine(G.flags.egg) });
    }
    if (res === 'win') msgs.push(...questEvent({ kind: 'beat', boss: b.boss || null, sp: enemy.sp }));
    drops = rollDrops(Math.random, { boss: !!(b.boss && res === 'win') }); 
    for (const { item, n } of drops) G.items[item] = (G.items[item] || 0) + n;
    rows.sort((p, q) => (q.d === b.ally.d) - (p.d === b.ally.d)); 
    removeWild(wild);
  } else if (res === 'lose') {
    msgs.push('Your companions are exhausted... You carry them back to the nearest hot spring.');
    const pat = b.boss && patternOf(b.boss); 
    if (pat) {
      const first = !(G.flags.tells || {})[b.boss];
      G.flags.tells = { ...(G.flags.tells || {}), [b.boss]: true };
      msgs.push({ text: '(Okay. Okay. I saw what comes before the big one. I SAW it.)' });
      if (first) msgs.push({ text: 'Written in your journal: ' + pat.note });
    }
    const p = G.player;
    const home = respawnPoint(G.region, G.flags, p.x, p.y); 
    p.x = home.x; p.y = home.y; G.follower.x = p.x; G.follower.y = p.y - 0.6;
    healParty();
  } else if (res === 'run') wild.stun = 3;
  saveGame();
  const lines = () => { if (msgs.length) S.dialog.say(msgs.map(m => (typeof m === 'string' ? { text: m } : m)), () => checkEvolutions()); else checkEvolutions(); };
  if (rows.length || drops.length) { showSpoils({ rows, drops, title: res === 'capture' ? 'NEW FRIEND!' : b.boss ? 'BOSS DOWN!' : 'VICTORY!' }, lines); return; }
  if (msgs.length) S.dialog.say(msgs.map(m => (typeof m === 'string' ? { text: m } : m)), () => checkEvolutions());
  else checkEvolutions();
}
