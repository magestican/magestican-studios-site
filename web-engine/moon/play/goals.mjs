





























































import { LAND } from '../economy/tables.mjs';
import { CRAFTABLES } from '../economy/craftables.mjs';
import { costOf, resourceHeld } from '../economy/crafting.mjs';
import { nextParcelPrice } from '../economy/land.mjs';
import { ownsHome } from './playerHome.mjs';
import { meetingsHeld } from './assembly.mjs';
import { CAT_NAME } from './people.mjs';


export const coinsText = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const isObj = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const num = (v) => (Number.isFinite(v) ? v : 0);









export function cheapestHouse(catalogue = CRAFTABLES) {
  const houses = Object.keys(catalogue).filter((id) => catalogue[id].category === 'houses');
  const total = (id) => Object.entries(catalogue[id].cost).reduce((a, [, n]) => a + num(n), 0);
  return houses.slice().sort((a, b) => total(a) - total(b))[0] || null;
}


const startingParcels = () => LAND.startingParcels;

const ownedCount = (world) => (Array.isArray(world.land) ? world.land.length : num(world.parcels));
















export const GOALS = Object.freeze([
  Object.freeze({
    id: 'parcel',
    short: 'Parcel',
    title: 'Buy your first parcel',
    done: 'Bought a parcel of land',
    offer: (world) => [
      'A patch of your own is the first thing, I always say.',
      `The next one is ${coinsText(nextParcelPrice(world))} coins. Shall I keep it aside for you?`,
    ],
    taken: ['Good. I will hold one for you, and you can watch the coins add up.'],
    ready: `See ${CAT_NAME} about the land`,
    rows: (world) => [{ key: 'coins', label: 'coins', have: Math.floor(num(world.coins)), need: Math.ceil(nextParcelPrice(world)) }],
    isDone: (world) => ownedCount(world) > startingParcels(),
  }),
  Object.freeze({
    id: 'house',
    short: 'House',
    title: 'Build a house of your own',
    done: 'Built a house of your own',
    offer: () => [
      'Now, a roof. Wood and stone, and a bench to build it on.',
      'Put it up on your own land and it is your home - door, room and all.',
    ],
    taken: ['Lovely. Chop, mine, and I will see you at the housewarming.'],
    ready: 'Make it in the workshop',
    rows: (world) => {
      const item = cheapestHouse();
      if (!item) return [];
      const cost = costOf(item);
      return Object.keys(cost)
        .filter((k) => k !== 'coins' && num(cost[k]) > 0)
        .map((k) => ({ key: k, label: k, have: Math.floor(resourceHeld(world, k)), need: Math.ceil(num(cost[k])) }));
    },
    isDone: (world) => ownsHome(world),
  }),
  Object.freeze({
    id: 'assembly',
    short: 'Assembly',
    title: 'Call the town to assembly',
    done: 'Called the town to assembly',
    offer: () => [
      'You have a house, so you have a say. Ring the bell at the Municipio.',
      'Everyone comes, and the town votes on whatever you put to it.',
    ],
    taken: ['Ring it whenever you are ready. I will be at the back, as usual.'],
    ready: 'Ring the bell at the Municipio',
    
    
    rows: () => [],
    isDone: (world) => meetingsHeld(world) > 0,
  }),
]);

export const GOAL_IDS = Object.freeze(GOALS.map((g) => g.id));


export const goalSpec = (id) => GOALS.find((g) => g.id === id) || null;




export function newGoals() {
  return { active: null, done: [] };
}






export function goalsOf(world) {
  const g = isObj(world) && isObj(world.goals) ? world.goals : {};
  const active = GOAL_IDS.includes(g.active) ? g.active : null;
  const done = (Array.isArray(g.done) ? g.done : [])
    .filter((row) => isObj(row) && GOAL_IDS.includes(row.id))
    .map((row) => ({ id: row.id, at: num(row.at) }));
  return { active, done };
}


function own(world) {
  world.goals = goalsOf(world);
  return world.goals;
}


export const isFinished = (world, id) => goalsOf(world).done.some((row) => row.id === id);













export function nextOffer(world) {
  const { active, done } = goalsOf(world);
  if (active) return null;
  return GOALS.find((g) => !done.some((row) => row.id === g.id) && !g.isDone(world)) || null;
}





export function accept(world, id) {
  const spec = goalSpec(id);
  if (!spec) return false;
  const g = own(world);
  if (g.active === id) return false;
  if (g.done.some((row) => row.id === id)) return false;
  g.active = id;
  return true;
}


export function abandon(world) {
  const g = own(world);
  if (!g.active) return false;
  g.active = null;
  return true;
}
















export function goalView(world, t = null) {
  const { active } = goalsOf(world);
  const spec = goalSpec(active);
  if (!spec) return null;
  const rows = (spec.rows(world, t) || []).map((r) => ({
    ...r,
    have: Math.max(0, num(r.have)),
    need: Math.max(0, num(r.need)),
  }));
  const short = rows.filter((r) => r.have < r.need);
  const worst = short.slice().sort((a, b) => (a.have / (a.need || 1)) - (b.have / (b.need || 1)))[0] || null;
  const total = rows.reduce((a, r) => a + r.need, 0);
  const got = rows.reduce((a, r) => a + Math.min(r.have, r.need), 0);
  const ready = short.length === 0;
  return {
    id: spec.id,
    short: spec.short,
    title: spec.title,
    rows,
    ready,
    have: worst ? worst.have : got,
    need: worst ? worst.need : total,
    unit: worst ? worst.label : null,
    fraction: total > 0 ? Math.min(1, got / total) : (ready ? 1 : 0),
    text: worst ? `${spec.short}: ${coinsText(worst.have)} / ${coinsText(worst.need)} ${worst.label}` : `${spec.short}: ready`,
    hint: ready ? spec.ready : null,
  };
}















export function settle(world, t = 0) {
  const g = own(world);
  const spec = goalSpec(g.active);
  if (!spec || !spec.isDone(world)) return [];
  g.active = null;
  const at = num(t);
  g.done.push({ id: spec.id, at });
  return [{ id: spec.id, title: spec.title, done: spec.done, at }];
}






export function doneLines(world) {
  const { done, active } = goalsOf(world);
  return GOALS.map((g) => {
    const row = done.find((d) => d.id === g.id) || null;
    return { id: g.id, title: g.title, done: g.done, at: row ? row.at : null, finished: Boolean(row), active: active === g.id };
  });
}


export const goalsDone = (world) => goalsOf(world).done.length;
