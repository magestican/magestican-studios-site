




















import { GOODS } from '../economy/tables.mjs';
import { STORES, TOWN_HALL, COUNTERS, marketPrice, noticeBoard, standingOf, storeOpen, storePrice, townOf } from '../economy/town.mjs';
import { hourAt } from '../economy/clock.mjs';
import { TOWN_SPOTS } from '../world/moonLayout.mjs';
import { toWorld } from '../world/collision.mjs';
import { anchors as townAnchors } from '../art/townBuilding.mjs';
import { nameOf } from './names.mjs';
import { villagerName } from './people.mjs';
import { calendarDay, calendarNotice } from './calendar.mjs';

const askerName = (world, id) => {
  const v = (world.villagers || []).find((x) => x.id === id);
  return v ? villagerName(v, world.villagers) : null;
};

const cache = new Map();





export function counterAt(id) {
  if (cache.has(id)) return cache.get(id);
  const spec = STORES[id] || (id === TOWN_HALL.id ? TOWN_HALL : null);
  const spot = TOWN_SPOTS[id];
  if (!spec || !spot) throw new Error(`there is no '${id}' in the town`);
  const a = townAnchors({ seed: spot.seed, stage: id });
  const out = Object.freeze({
    id,
    spec,
    spot,
    footprint: a.footprint,
    front: toWorld(spot, a.front.x, a.front.z),
    counter: toWorld(spot, a.counter.x, a.counter.z),
    keeper: { ...toWorld(spot, a.keeper.x, a.keeper.z), heading: spot.rotY + a.keeper.heading },
    notice: a.notice ? { ...toWorld(spot, a.notice.x, a.notice.z), y: a.notice.y } : null,
    
    doorLocal: a.door,
  });
  cache.set(id, out);
  return out;
}

export const TOWN_COUNTERS = Object.freeze(COUNTERS.map((c) => c.id));







export function townPlaces() {
  return TOWN_COUNTERS.map((id) => {
    const c = counterAt(id);
    const place = { x: c.spot.x, z: c.spot.z, front: { x: c.front.x, z: c.front.z } };
    return id === TOWN_HALL.id ? { type: 'townHall', ...place } : { type: 'store', id, ...place };
  });
}


export const shutSentence = (spec) => `${spec.label.replace(/^the /, 'The ')} opens at ${spec.openHour} and shuts at ${spec.closeHour}.`;

const keeperName = (world, index) => villagerName(world.villagers[index], world.villagers);








export function storeView(world, t, id) {
  const spec = STORES[id];
  if (!spec) throw new Error(`there is no store '${id}'`);
  const hour = hourAt(world, t);
  const open = storeOpen(hour, spec);
  const keeper = keeperName(world, spec.keeper);
  const rows = [];
  if (spec.buys) {
    for (const good of Object.keys(world.pockets)) {
      const have = world.pockets[good] || 0;
      const price = marketPrice(good);
      if (have < 1 || price < 1) continue;
      rows.push({ good, name: nameOf(good), price, have, max: have });
    }
    rows.sort((a, b) => b.price * b.have - a.price * a.have || a.good.localeCompare(b.good));
  } else {
    for (const good of Object.keys(spec.sells)) {
      const price = storePrice(id, good);
      rows.push({ good, name: nameOf(good), price, have: world.pockets[good] || 0, max: Math.floor(world.coins / price) });
    }
  }
  return {
    id, name: spec.name, label: spec.label, buying: Boolean(spec.buys), open, keeper, rows,
    why: open ? null : shutSentence(spec),
    empty: rows.length === 0 ? (spec.buys ? `${keeper} would buy anything you have grown - your pockets are empty.` : 'The shelves are bare today.') : null,
  };
}





export function noticeView(world, t) {
  const hour = hourAt(world, t);
  const open = storeOpen(hour, TOWN_HALL);
  const board = noticeBoard(world, t, hour);
  const town = townOf(world);
  return {
    id: TOWN_HALL.id,
    name: TOWN_HALL.name,
    label: TOWN_HALL.label,
    open,
    why: open ? null : shutSentence(TOWN_HALL),
    keeper: keeperName(world, TOWN_HALL.keeper),
    up: board.up,
    filled: board.filled,
    request: {
      good: board.good,
      name: nameOf(board.good, board.count),
      plain: nameOf(board.good),
      count: board.count,
      coins: board.coins,
      points: board.points,
      held: board.held,
      short: Math.max(0, board.count - board.held),
      kind: GOODS[board.good].kind,
      
      asker: board.villager === null ? null : askerName(world, board.villager),
    },
    
    calendar: calendarNotice(world, calendarDay(world, t), villagerName),
    standing: standingOf(town.points),
    filledCount: town.filled,
  };
}


export function noticeSentence(view) {
  if (!view.open) return view.why;
  if (!view.up) return 'The board is bare - the notice goes up later this morning.';
  if (view.filled) return `Today's notice is filled. ${view.standing.label[0].toUpperCase()}${view.standing.label.slice(1)}, and growing.`;
  const r = view.request;
  if (r.short > 0) return `Wanted: ${r.name}, ${r.coins} coins. You have ${r.held}.`;
  return `Wanted: ${r.name}, ${r.coins} coins. You have them.`;
}
