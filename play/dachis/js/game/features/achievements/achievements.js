












import { LAIRS } from '../world/lairs.js';
import { COLLECTIBLES, PER_REGION } from '../../data/collectibles.js';
import { SIDE } from '../quest/quests.js';
import { REGIONS } from '../world/regions.js';

export const TIERS = ['common', 'uncommon', 'rare', 'legendary']; 
const A = (id, name, tier, desc, test) => ({ id: 'dachis-' + id, name, game: 'dachis', tier, desc, test });
const doneQuests = (f) => SIDE.filter((q) => f.quests && f.quests[q.id] >= q.steps.length).length;
const foundIn = (f, region) => COLLECTIBLES.filter((c) => c.region === region && f.found && f.found[c.id]).length;

const regionsWithFinds = REGIONS.filter((r) => COLLECTIBLES.some((c) => c.region === r.id));
export const ACHIEVEMENTS = [
  A('first-quest', 'Good Neighbour', 'common', 'Finish a side quest.', (f) => doneQuests(f) >= 1),
  A('first-find', 'Sharp Eyes', 'common', 'Find your first collectible.', (f) => Object.keys(f.found || {}).length >= 1),
  ...regionsWithFinds.map((r) => A('all-' + r.id, r.name + ' Complete', 'rare',
    `Find all ${PER_REGION} collectibles on ${r.name}.`, (f) => foundIn(f, r.id) >= PER_REGION)),
  ...LAIRS.map((l) => A('boss-' + l.boss, 'Beat ' + l.boss[0].toUpperCase() + l.boss.slice(1), 'uncommon',
    'Free a corrupted guardian from the red fractures.', (f) => !!f['boss_' + l.boss])),
  
  
  A('first-friend', 'Hello, Friend', 'common', 'Befriend your first wild dachi.', (f, c) => (c.caught || 0) >= 2),
  A('dex-25', 'Pen Pals', 'uncommon', 'Befriend 25 kinds of dachi.', (f, c) => (c.caught || 0) >= 25),
  A('dex-50', 'Pocket Full of Friends', 'rare', 'Befriend 50 kinds of dachi.', (f, c) => (c.caught || 0) >= 50),
  A('dex-100', 'Everybody Knows Your Name', 'rare', 'Befriend 100 kinds of dachi.', (f, c) => (c.caught || 0) >= 100),
  A('dex-all', 'Friends with Everyone', 'legendary', 'Befriend every kind of dachi there is.', (f, c) => !!c.total && (c.caught || 0) >= c.total),
  A('all-finds', 'Pack Rat', 'legendary', 'Find every collectible on the island.', (f) => COLLECTIBLES.every((x) => f.found && f.found[x.id])),
  A('all-quests', 'The Whole Island Owes You', 'legendary', 'Finish every side quest.', (f) => doneQuests(f) >= SIDE.length),
  A('perfect-ritual', 'Right on the Beat', 'uncommon', 'Befriend a dachi with every beat of the ritual perfect.', (f) => !!f.ritualPerfect),
  A('new-game-plus', 'Again, Again', 'rare', 'Start a New Game+.', (f, c) => (c.cycle || 1) >= 2),
];
export const achievementById = (id) => ACHIEVEMENTS.find((a) => a.id === id) || null;
export const unlocked = (flags, id) => !!(flags && flags.ach && flags.ach[id]);

export const earned = (flags = {}, ctx = {}) => ACHIEVEMENTS.filter((a) => !unlocked(flags, a.id) && a.test(flags, ctx)).map((a) => a.id);

export function unlock(flags, id, at) {
  const a = achievementById(id);
  if (!a || unlocked(flags, id)) return null;
  (flags.ach || (flags.ach = {}))[id] = at;
  return a;
}
