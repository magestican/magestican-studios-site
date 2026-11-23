



import { createMatch, step, EVENT } from './sim.js';
import { createBot, botInput } from './bot.js';
import { HOUSES } from './titans.js';
import { TUNING as T } from './tuning.js';

export const FRAMES = Object.freeze(['lancer', 'bulwark', 'wisp', 'mortar']);

export function playTrial(seed, level = 'ace', frames = FRAMES, sleeper = true) {
  const players = HOUSES.map((h, i) => ({ house: h.id, titan: frames[i % frames.length] }));
  const m = createMatch({ seed, arena: 'bellRing', players, sleeper });
  const bots = players.map((_, i) => createBot(i, level, seed));
  const tally = { bells: 0, selfBells: 0, ringOuts: 0, stalls: 0, perfect: 0, clangs: 0, slams: 0, abilities: 0, damage: {} };
  while (!m.over) {
    for (const e of step(m, bots.map((b) => botInput(b, m)))) {
      if (e.type === EVENT.BELL) {
        if (e.by !== null) tally.bells += 1; else tally.selfBells += 1;
        if (e.ringOut) tally.ringOuts += 1;
      }
      if (e.type === EVENT.HIT) tally.damage[e.kind] = (tally.damage[e.kind] || 0) + e.damage;
      if (e.type === EVENT.STALL) tally.stalls += 1;
      if (e.type === EVENT.PERFECT_VENT) tally.perfect += 1;
      if (e.type === EVENT.CLANG) tally.clangs += 1;
      if (e.type === EVENT.SLAM) tally.slams += 1;
      if (e.type === EVENT.ABILITY) tally.abilities += 1;
    }
  }
  
  const top = Math.max(...m.titans.map((t) => t.bells));
  const winners = m.titans.filter((t) => t.bells === top);
  return { m, tally, winners };
}

export function runBalance({ trials = 30, level = 'ace', seed0 = 1, sleeper = true } = {}) {
  const wins = Object.fromEntries(FRAMES.map((f) => [f, 0]));
  const sum = { bells: 0, selfBells: 0, ringOuts: 0, stalls: 0, perfect: 0, clangs: 0, slams: 0, abilities: 0 };
  let seats = 0; const damage = {};
  const per = Object.fromEntries(FRAMES.map((f) => [f, { scored: 0, rung: 0, ringOuts: 0 }]));
  for (let i = 0; i < trials; i++) {
    const { m, tally, winners } = playTrial(seed0 + i * 31, level, FRAMES, sleeper);
    for (const w of winners) wins[w.frame] += 1 / winners.length;
    for (const k of Object.keys(sum)) sum[k] += tally[k];
    for (const [k, v] of Object.entries(tally.damage)) damage[k] = (damage[k] || 0) + v / trials;
    seats += m.titans.length;
    for (const t of m.titans) { per[t.frame].scored += t.bells / trials / 2; per[t.frame].rung += t.rung / trials / 2; per[t.frame].ringOuts += t.ringOuts / trials / 2; }
  }
  const minutes = T.roundTime / 60;
  const share = Object.fromEntries(FRAMES.map((f) => [f, wins[f] / trials]));
  return {
    trials, level, share,
    bellsPerPilotRound: sum.bells / seats,
    bellsPerPilotMinute: sum.bells / seats / minutes,
    selfBellsPerTrial: sum.selfBells / trials,
    ringOutsPerTrial: sum.ringOuts / trials,
    stallsPerPilotMinute: sum.stalls / seats / minutes,
    perfectVentRate: sum.stalls ? sum.perfect / sum.stalls : 0,
    clangsPerTrial: sum.clangs / trials,
    slamsPerTrial: sum.slams / trials,
    abilitiesPerTrial: sum.abilities / trials,
    damagePerTrial: damage,
    perFrameSeat: per,
  };
}
