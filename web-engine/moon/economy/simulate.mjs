






import { act, advance, jobSlotsOf, netWorth, newWorld } from './world.mjs';
import { ACTION_TIME_s, areaOf, decide, walkTime_s } from './bot.mjs';
import { MS } from './math.mjs';
import { isDark } from './clock.mjs';
import { footfallAt, isLit, shopOf, stockCount } from './shop.mjs';
import { stageAt } from './trees.mjs';


export const LEAVING_S = 180;

export const PATTERNS = Object.freeze({
  
  continuous: (hours) => [{ at_s: 0, minutes: hours * 60 }],
  
  daily: (days) => {
    const sittings = [];
    for (let d = 0; d < days; d++) {
      sittings.push({ at_s: d * 86400, minutes: 20 }, { at_s: d * 86400 + 5 * 3600, minutes: 15 }, { at_s: d * 86400 + 12 * 3600, minutes: 40 });
    }
    return sittings;
  },
});

const MILESTONES = [
  ['first sale', (w) => w.stats.customers > 0],
  ['juice press', (w) => w.buildings.some((b) => b.type === 'processor')],
  ['shop lit for the night', (w) => isLit(w)],
  ['jam (press level 2)', (w) => w.buildings.some((b) => b.type === 'processor' && b.level >= 2)],
  ['first tree planted', (w) => w.trees.some((tree) => !tree.wild)],
  ['first planted tree fruiting', (w, t) => w.trees.some((tree) => !tree.wild && stageAt(tree, t) === 'fruiting')],
  ['first parcel bought', (w) => w.parcels >= 2],
  ['shop level 2', (w) => shopOf(w).level >= 2],
  ['first villager house (L1)', (w) => w.villagers.some((v) => v.levels.length >= 1)],
  ['parcel 3', (w) => w.parcels >= 3],
  ['orchard juice (press level 3)', (w) => w.buildings.some((b) => b.type === 'processor' && b.level >= 3)],
  ['parcel 5', (w) => w.parcels >= 5],
  ['first villager decorates (L2)', (w) => w.villagers.some((v) => v.levels.length >= 2)],
  ['first villager garden (L3)', (w) => w.villagers.some((v) => v.levels.length >= 3)],
  ['parcel 8', (w) => w.parcels >= 8],
  ['parcel 10', (w) => w.parcels >= 10],
];

export function simulate({ seed = 1, start = Date.UTC(2026, 8, 15, 8, 0, 0), sittings, moon = {}, sampleEvery_s = 60 }) {
  const world = newWorld({ seed, now: start, ...moon });
  const milestones = {};
  const samples = [];
  const log = [];
  const memory = {};
  let active_ms = 0;
  let nextSample_ms = 0;

  const check = (t) => {
    for (const [name, reached] of MILESTONES) {
      if (!(name in milestones) && reached(world, t)) {
        milestones[name] = { active_s: Math.round(active_ms / MS), wall_s: Math.round((t - start) / MS) };
      }
    }
  };
  const sample = (t, at_s) => {
    const standing = world.trees.filter((tree) => stageAt(tree, t) !== 'stump');
    const presses = world.buildings.filter((b) => b.type === 'processor');
    samples.push({
      at_s,
      active_s: Math.round(active_ms / MS),
      presses: presses.length,
      jobSlots: presses.reduce((n, b) => n + jobSlotsOf(b), 0),
      shopLevel: shopOf(world).level,
      onShelves: stockCount(world),
      wall_s: Math.round((t - start) / MS),
      coins: world.coins,
      netWorth: netWorth(world),
      earned_coins: world.stats.earned_coins,
      parcels: world.parcels,
      trees: standing.length,
      fruiting: standing.filter((tree) => stageAt(tree, t) === 'fruiting').length,
      footfall_bp: footfallAt(world, t),
      dark: isDark(world, t),
    });
  };

  for (const sitting of sittings) {
    let t = start + sitting.at_s * MS;
    const earnedBefore = world.stats.earned_coins;
    const away = advance(world, t);
    const entry = {
      at_s: sitting.at_s,
      minutes: sitting.minutes,
      awayEarned_coins: world.stats.earned_coins - earnedBefore,
      awaySales: away.filter((e) => e.type === 'sale').length,
      coinsAtStart: world.coins,
    };
    const end = t + sitting.minutes * 60 * MS;
    memory.leavingAt = end - LEAVING_S * MS;
    let area = null;
    while (t < end) {
      memory.area = area;
      const action = decide(world, t, memory);
      let cost_s = ACTION_TIME_s.wait;
      if (action) {
        
        const to = areaOf(action, world);
        cost_s = ACTION_TIME_s[action.type] + walkTime_s(area, to);
        area = to;
      }
      t += cost_s * MS;
      active_ms += cost_s * MS;
      
      
      
      
      if (action) {
        act(world, action, t);
        if (action.type === 'stock') memory.lastStockAt = t;
        if (action.type === 'gift' && action.coins) memory.giftedCoins = (memory.giftedCoins || 0) + action.coins;
      } else {
        advance(world, t);
      }
      check(t);
      while (active_ms >= nextSample_ms) {
        sample(t, nextSample_ms / MS);
        nextSample_ms += sampleEvery_s * MS;
      }
    }
    entry.coinsAtEnd = world.coins;
    entry.parcels = world.parcels;
    entry.netWorth = netWorth(world);
    log.push(entry);
  }
  return { world, milestones, samples, sittings: log, active_s: Math.round(active_ms / MS) };
}
