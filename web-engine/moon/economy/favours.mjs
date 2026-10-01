




















import { giftBasePoints } from './happiness.mjs';
import { draw } from './math.mjs';
import { GOODS } from './tables.mjs';
import { townDay } from './town.mjs';

export const FAVOURS = Object.freeze({
  kinds: Object.freeze(['fetch']),
  
  
  goods: Object.freeze(['apple', 'peach', 'cherry', 'mushroom', 'berries', 'carrot', 'potato', 'wood', 'stone', 'appleJuice', 'peachJuice', 'appleJam']),
  count: Object.freeze([2, 5]),
  coins: 40,
  photoAt: 3,
  photo: 'framedPhoto',
});

const EMPTY = Object.freeze({ open: Object.freeze({}), asked: Object.freeze({}), done: Object.freeze({}), photo: Object.freeze({}) });
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);


export function favoursOf(world) {
  const f = world && isObj(world.favours) ? world.favours : {};
  return {
    open: isObj(f.open) ? f.open : EMPTY.open,
    asked: isObj(f.asked) ? f.asked : EMPTY.asked,
    done: isObj(f.done) ? f.done : EMPTY.done,
    photo: isObj(f.photo) ? f.photo : EMPTY.photo,
  };
}


function writable(world) {
  const f = favoursOf(world);
  world.favours = { open: { ...f.open }, asked: { ...f.asked }, done: { ...f.done }, photo: { ...f.photo } };
  return world.favours;
}


export const openFavour = (world, villager) => favoursOf(world).open[villager.id] || null;






export function favourOffer(world, villager, t) {
  const f = favoursOf(world);
  const day = townDay(world, t);
  if (f.open[villager.id] || f.asked[villager.id] === day) return null;
  const kind = FAVOURS.kinds[draw(world.seed, 'favour', villager.id, day, 'kind') % FAVOURS.kinds.length];
  const good = FAVOURS.goods[draw(world.seed, 'favour', villager.id, day, 'good') % FAVOURS.goods.length];
  const [lo, hi] = FAVOURS.count;
  const count = lo + (draw(world.seed, 'favour', villager.id, day, 'count') % (hi - lo + 1));
  return Object.freeze({ day, kind, good, count });
}


export const FAVOUR_MET = Object.freeze({
  fetch: (world, favour) => (world.pockets[favour.good] || 0) >= favour.count,
});
export function favourMet(world, favour) {
  const met = favour && FAVOUR_MET[favour.kind];
  return Boolean(met && met(world, favour));
}


export function favourPoints(villager) {
  return GOODS[villager.favourite] ? giftBasePoints(villager, { good: villager.favourite, count: 1 }) : 0;
}


export function whyNotAccept(world, villager, t) {
  if (!villager) return 'Nobody like that lives here.';
  if (openFavour(world, villager)) return 'You are already doing something for them.';
  return favourOffer(world, villager, t) ? null : 'They have nothing to ask of you today.';
}


export function whyNotComplete(world, villager) {
  if (!villager) return 'Nobody like that lives here.';
  const f = openFavour(world, villager);
  if (!f) return 'There is no favour to hand in.';
  if (!favourMet(world, f)) return `You have ${world.pockets[f.good] || 0} of the ${f.count} they asked for.`;
  return null;
}


export function acceptFavour(world, villager, t) {
  const offer = favourOffer(world, villager, t);
  const f = writable(world);
  f.open[villager.id] = { day: offer.day, kind: offer.kind, good: offer.good, count: offer.count };
  f.asked[villager.id] = offer.day;
  return offer;
}







export function completeFavour(world, villager) {
  const f = writable(world);
  const favour = f.open[villager.id];
  delete f.open[villager.id];
  const done = (f.done[villager.id] || 0) + 1;
  f.done[villager.id] = done;
  let photo = false;
  if (done >= FAVOURS.photoAt && !f.photo[villager.id]) {
    f.photo[villager.id] = true;
    photo = true;
  }
  return { favour, done, photo };
}
