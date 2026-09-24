







































import { draw, BP } from '../economy/math.mjs';

export const GUESTS = Object.freeze({
  
  fairy: Object.freeze({ personality: 'dreamy', gives: 'wish' }),
  mummy: Object.freeze({ personality: 'grumpy', gives: 'relic' }),
  werewolf: Object.freeze({ personality: 'gentle', gives: 'food' }),
  fox: Object.freeze({ personality: 'curious', gives: 'curio', price: Object.freeze({ apple: 1 }) }),
});
export const GUEST_KINDS = Object.freeze(Object.keys(GUESTS));

export const GUEST_RULES = Object.freeze({
  chanceBp: 1500,   
  perDay: 1,        
  home: 0,          
  spots: 4,         
  drawBudget: 150,  
  maxDraws: 8,      
});


export const guestKey = (kind) => `guest:${kind}`;

const isGuest = (g) => g && GUESTS[g.kind] && Number.isInteger(g.planet) && Number.isInteger(g.day);







export function rollGuest(world, planetId, localDay) {
  if (!Number.isInteger(planetId) || planetId === GUEST_RULES.home || !Number.isInteger(localDay)) return null;
  if (world.guestDay === localDay) return guestOn(world, planetId, localDay);
  world.guestDay = localDay;
  world.guest = null;
  if (draw(world.seed, 'guest', localDay, planetId) % BP < GUEST_RULES.chanceBp) {
    world.guest = {
      kind: GUEST_KINDS[draw(world.seed, 'guestKind', localDay, planetId) % GUEST_KINDS.length],
      planet: planetId,
      day: localDay,
      spot: draw(world.seed, 'guestSpot', localDay, planetId) % GUEST_RULES.spots,
    };
  }
  return world.guest;
}


export function guestOn(world, planetId, localDay) {
  const g = world.guest;
  return isGuest(g) && g.planet === planetId && g.day === localDay ? g : null;
}


export function dismissGuest(world) {
  world.guest = null;
}





export function forceGuest(world, kind, planetId, localDay) {
  if (!GUESTS[kind] || !Number.isInteger(planetId) || planetId === GUEST_RULES.home) return null;
  world.guestDay = localDay;
  world.guest = { kind, planet: planetId, day: localDay, spot: 0 };
  return world.guest;
}





export function guestFits(frameDraws, guestDraws) {
  return guestDraws <= GUEST_RULES.maxDraws && frameDraws + guestDraws <= GUEST_RULES.drawBudget;
}
