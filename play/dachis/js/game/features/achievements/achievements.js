












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
];
export const achievementById = (id) => ACHIEVEMENTS.find((a) => a.id === id) || null;
export const unlocked = (flags, id) => !!(flags && flags.ach && flags.ach[id]);

export const earned = (flags = {}) => ACHIEVEMENTS.filter((a) => !unlocked(flags, a.id) && a.test(flags)).map((a) => a.id);

export function unlock(flags, id, at) {
  const a = achievementById(id);
  if (!a || unlocked(flags, id)) return null;
  (flags.ach || (flags.ach = {}))[id] = at;
  return a;
}
