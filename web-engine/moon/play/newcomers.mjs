






























import { draw } from '../economy/math.mjs';
import { moveIn } from '../economy/world.mjs';
import { standingOf, townOf } from '../economy/town.mjs';
import { econStartAt } from './localClock.mjs';
import { BUILDS_OF, ITALIAN_NAMES, NAMES_OF_BUILD, villagerName } from './people.mjs';

export const NEWCOMERS = Object.freeze({
  
  
  
  cap: 6,
  
  morningHour: 8,
  
  species: Object.freeze(['elephant', 'giraffe', 'panda', 'human', 'pig']),
  
  favourites: Object.freeze(['peachJuice', 'cherryJuice', 'peach', 'cherry', 'appleJuice', 'peachJam', 'apple', 'orchardJuice', 'appleJam']),
});

const REAL_DAY_MS = 86_400_000;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const int = (v, d = 0) => (Number.isInteger(v) ? v : d);


export const standingLevel = (world) => standingOf(townOf(world).points).level;






export function newcomersOf(world) {
  if (!isObj(world.newcomers)) world.newcomers = { seen: standingLevel(world), due: [] };
  const n = world.newcomers;
  n.seen = int(n.seen);
  if (!Array.isArray(n.due)) n.due = [];
  return n;
}


export function roomFor(world, cfg = NEWCOMERS) {
  const n = newcomersOf(world);
  return Math.max(0, cfg.cap - (world.villagers || []).length - n.due.length);
}


export function nextMorning(world, t, cfg = NEWCOMERS) {
  return econStartAt(t + REAL_DAY_MS, int(world.tzOffsetMin), cfg.morningHour);
}


function takenNames(world) {
  const vs = world.villagers || [];
  const out = new Set(vs.map((v) => villagerName(v, vs)));
  for (const d of newcomersOf(world).due) if (d.name) out.add(d.name);
  return out;
}






export function newcomerFor(world, name = null, cfg = NEWCOMERS) {
  const key = (what) => draw(int(world.seed, 1), 'newcomer', int(world.nextId), what);
  const taken = takenNames(world);
  const vs = world.villagers || [];
  const species = cfg.species[key('species') % cfg.species.length];
  const builds = BUILDS_OF[species] || null;
  let build = builds ? builds[key('build') % builds.length] : null;
  let chosen = null;
  if (name && ITALIAN_NAMES.includes(name) && !vs.some((v) => villagerName(v, vs) === name)) {
    if (!builds) chosen = name;
    else {
      const b = builds.find((x) => (NAMES_OF_BUILD[x] || []).includes(name));
      if (b) { chosen = name; build = b; }
    }
  }
  if (!chosen) {
    const pool = (build && NAMES_OF_BUILD[build]) || ITALIAN_NAMES;
    const free = pool.filter((n) => !taken.has(n));
    const list = free.length ? free : pool;
    chosen = list[key('name') % list.length];
  }
  const held = new Set(vs.map((v) => v.favourite));
  const fresh = cfg.favourites.filter((g) => !held.has(g));
  const favs = fresh.length ? fresh : cfg.favourites;
  const favourite = favs[key('favourite') % favs.length];
  return { species, favourite, name: chosen, build };
}

function queue(world, t, why, name, cfg) {
  if (roomFor(world, cfg) <= 0) return null;
  const n = newcomersOf(world);
  const entry = { at: nextMorning(world, t, cfg), why, name: name || null };
  n.due.push(entry);
  return entry;
}







export function noteStanding(world, t, cfg = NEWCOMERS) {
  const n = newcomersOf(world);
  const level = standingLevel(world);
  const due = [];
  let full = 0;
  while (n.seen < level) {
    n.seen += 1;
    const e = queue(world, t, 'standing', null, cfg);
    if (e) due.push(e); else full += 1;
  }
  return { due, full };
}


export function inviteNewcomer(world, t, name, cfg = NEWCOMERS) {
  return queue(world, t, 'vote', name, cfg);
}


export function arriveDue(world, t, cfg = NEWCOMERS) {
  const n = newcomersOf(world);
  const out = [];
  const keep = [];
  for (const d of [...n.due].sort((a, b) => a.at - b.at)) {
    if (d.at > t) { keep.push(d); continue; }
    if ((world.villagers || []).length >= cfg.cap) continue;
    n.due = n.due.filter((x) => x !== d);
    out.push(moveIn(world, newcomerFor(world, d.name, cfg), d.at));
  }
  n.due = keep;
  return out;
}


export function settleNewcomers(world, t, cfg = NEWCOMERS) {
  const noted = noteStanding(world, t, cfg);
  const arrived = arriveDue(world, t, cfg);
  return { due: noted.due, full: noted.full, arrived };
}
