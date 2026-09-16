


















import { CRAFTABLES, GOODS, RESOURCES } from './tables.mjs';


export const RESOURCE_KINDS = Object.freeze(['wood', 'stone', 'food']);

export const isCraftable = (item) => Object.prototype.hasOwnProperty.call(CRAFTABLES, item);


export function costOf(item) {
  const spec = CRAFTABLES[item];
  if (!spec) throw new Error(`there is no '${item}' to craft`);
  return spec.cost;
}


export function goodsFor(resource) {
  const list = RESOURCES[resource];
  if (!list) throw new Error(`there is no resource '${resource}'`);
  return [...list].sort((a, b) => GOODS[a].sell_coins - GOODS[b].sell_coins || (a < b ? -1 : a > b ? 1 : 0));
}

const held = (world, good) => world.pockets[good] || 0;


export function resourceHeld(world, resource) {
  let n = 0;
  for (const good of goodsFor(resource)) n += held(world, good);
  return n;
}





export function payment(world, resource, n) {
  if (!Number.isInteger(n) || n < 0) throw new Error(`a cost is a whole number, got ${n}`);
  const out = [];
  let left = n;
  for (const good of goodsFor(resource)) {
    if (left <= 0) break;
    const take = Math.min(left, held(world, good));
    if (take > 0) {
      out.push({ good, n: take });
      left -= take;
    }
  }
  return left > 0 ? null : out;
}


export const foodPayment = (world, n) => payment(world, 'food', n);






export function craftPlan(world, item, count = 1) {
  if (!isCraftable(item)) return { why: `There is no '${item}' to make.` };
  if (!Number.isInteger(count) || count < 1) return { why: 'Make at least one.' };
  const cost = costOf(item);
  const goods = [];
  for (const resource of RESOURCE_KINDS) {
    const want = (cost[resource] || 0) * count;
    if (want <= 0) continue;
    const pay = payment(world, resource, want);
    if (!pay) return { why: shortOf(world, resource, want) };
    for (const part of pay) goods.push(part);
  }
  const coins = (cost.coins || 0) * count;
  if (coins > 0 && world.coins < coins) return { why: `That costs ${coins} coins - you have ${world.coins}.` };
  return { item, count, goods, coins };
}


function shortOf(world, resource, want) {
  const have = resourceHeld(world, resource);
  if (resource === 'food') return `That needs ${want} food - you have ${have} (forage, dig or pick some).`;
  return `That needs ${want} ${resource} - you have ${have}.`;
}


export function whyCannotCraft(world, item, count = 1) {
  return craftPlan(world, item, count).why || null;
}


export function costText(item, count = 1) {
  const cost = costOf(item);
  const parts = [];
  for (const resource of RESOURCE_KINDS) if (cost[resource]) parts.push(`${cost[resource] * count} ${resource}`);
  if (cost.coins) parts.push(`${cost.coins * count} coins`);
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}


export function craftedName(item, count) {
  const spec = CRAFTABLES[item];
  if (!spec) return item;
  if (count === undefined) return spec.name;
  if (count === 1) return /^[aeiou]/.test(spec.name) ? `an ${spec.name}` : `a ${spec.name}`;
  return `${count} ${plural(spec.name)}`;
}



function plural(name) {
  const at = name.indexOf(' with ');
  const head = at === -1 ? name : name.slice(0, at);
  const tail = at === -1 ? '' : name.slice(at);
  const words = head.split(' ');
  const last = words.at(-1);
  words[words.length - 1] = /(s|x|z|ch|sh)$/.test(last) ? `${last}es` : `${last}s`;
  return words.join(' ') + tail;
}
