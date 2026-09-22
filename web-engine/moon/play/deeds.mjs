



























































import { dayOf } from './dayline.mjs';
import { doneLines as goalDoneLines, goalsDone } from './goals.mjs';
import { assemblyOf, meetingsHeld } from './assembly.mjs';
import { CAT_NAME } from './people.mjs';


export const goodName = (id) => String(id).replace(/([A-Z])/g, (m) => ` ${m.toLowerCase()}`);






const MASS = new Set(['wood', 'stone', 'sugar', 'food']);


const SAME = new Set(['berries']);


export function countOf(good, n) {
  const name = goodName(good);
  if (n === 1 || MASS.has(good) || SAME.has(good)) return `${n} ${name}`;
  if (/(?:^|[^aeiou])y$/.test(name)) return `${n} ${name.slice(0, -1)}ies`;
  if (/(?:s|x|z|ch|sh)$/.test(name)) return `${n} ${name}es`;
  return `${n} ${name}s`;
}








export function newDeeds() {
  return {
    picked: {},    
    planted: {},   
    felled: 0,     
    crafted: {},   
    planets: [],   
  };
}

const isObj = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const num = (v) => (Number.isFinite(v) ? v : 0);
const map = (v) => (isObj(v) ? { ...v } : {});
const sum = (m) => Object.values(m).reduce((a, b) => a + num(b), 0);











export function deedsOf(world) {
  const d = isObj(world) && isObj(world.deeds) ? world.deeds : {};
  return {
    picked: map(d.picked),
    planted: map(d.planted),
    felled: num(d.felled),
    crafted: map(d.crafted),
    planets: Array.isArray(d.planets) ? [...d.planets].filter(Number.isInteger).sort((a, b) => a - b) : [],
  };
}


function own(world) {
  world.deeds = deedsOf(world);
  return world.deeds;
}

const add = (into, key, n) => { if (key !== undefined && key !== null && n > 0) into[key] = num(into[key]) + n; };










const PICKED = new Set(['harvest', 'fell', 'forage', 'dig', 'pickUpFind', 'mine']);





















export function tally(world, events) {
  const d = own(world);
  const moved = { picked: 0, planted: 0, felled: 0, crafted: 0 };
  const picked = (good, n) => { if (n > 0) { add(d.picked, good, n); moved.picked += n; } };
  const made = (item, n) => { if (n > 0) { add(d.crafted, item, n); moved.crafted += n; } };
  for (const e of events || []) {
    if (!isObj(e)) continue;
    if (PICKED.has(e.type)) {
      if (e.good) picked(e.good, num(e.count));
      if (e.rare) picked(e.rare, 1);
      if (num(e.moonRock) > 0) picked('moonRock', num(e.moonRock));
    }
    if (e.type === 'plant' && e.kind) { add(d.planted, e.kind, 1); moved.planted += 1; }
    if (e.type === 'fell') { d.felled = num(d.felled) + 1; moved.felled += 1; }
    if (e.type === 'craft' && e.item) made(e.item, Math.max(1, num(e.count)));
    if (e.type === 'collect' && isObj(e.goods)) {
      for (const [good, n] of Object.entries(e.goods)) made(good, num(n));
    }
  }
  return moved;
}











export function visitPlanet(world, id) {
  if (!Number.isInteger(id) || id < 0) return false;
  const d = own(world);
  if (d.planets.includes(id)) return false;
  d.planets.push(id);
  d.planets.sort((a, b) => a - b);
  return true;
}


function builtDetail(world) {
  const works = assemblyOf(world).works;
  if (works.length === 0) return null;
  const done = works.filter((w) => w.doneAt).length;
  const names = works.slice(0, 3).map((w) => w.name).join(', ');
  return done === works.length ? `built: ${names}` : `${done} of ${works.length} built: ${names}`;
}


function top(m, n) {
  return Object.entries(m)
    .filter(([, v]) => num(v) > 0)
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .slice(0, n);
}


export const PLANET_COUNT = 7;

















export function deedLines({ world, firstPlayed = null, now = null, planetCount = PLANET_COUNT } = {}) {
  const d = deedsOf(world);
  const stats = isObj(world) && isObj(world.stats) ? world.stats : {};
  const picked = sum(d.picked);
  const planted = sum(d.planted);
  const crafted = sum(d.crafted);
  const sold = sum(isObj(stats.sold) ? stats.sold : {});
  const day = dayOf(num(now), num(firstPlayed), isObj(world) ? world.tzOffsetMin : 0);
  const lines = [
    {
      key: 'picked',
      label: 'Picked',
      value: picked,
      text: `${picked}`,
      detail: top(d.picked, 4).map(([good, n]) => countOf(good, n)).join(', ') || null,
    },
    {
      key: 'planted',
      label: 'Trees planted',
      value: planted,
      text: `${planted}`,
      detail: top(d.planted, 4).map(([kind, n]) => countOf(kind, n)).join(', ') || null,
    },
    { key: 'felled', label: 'Trees chopped down', value: d.felled, text: `${d.felled}`, detail: null },
    {
      key: 'crafted',
      label: 'Made',
      value: crafted,
      text: `${crafted}`,
      detail: top(d.crafted, 4).map(([item, n]) => `${n} ${goodName(item)}`).join(', ') || null,
    },
    {
      key: 'sold',
      label: 'Sold',
      value: sold,
      text: `${sold}`,
      detail: num(stats.customers) > 0 ? `to ${num(stats.customers)} customers` : null,
    },
    { key: 'coins', label: 'Coins now', value: num(isObj(world) ? world.coins : 0), text: `${num(isObj(world) ? world.coins : 0)}`, detail: null },
    { key: 'earned', label: 'Coins earned', value: num(stats.earned_coins), text: `${num(stats.earned_coins)}`, detail: null },
    { key: 'days', label: 'Days played', value: day, text: `${day}`, detail: null },
    {
      key: 'planets',
      label: 'Planets visited',
      value: d.planets.length,
      text: `${d.planets.length}`,
      detail: planetCount > 0 ? `of ${planetCount}` : null,
    },
    
    
    
    {
      key: 'goals',
      label: `Goals from ${CAT_NAME}`,
      value: goalsDone(world),
      text: `${goalsDone(world)}`,
      detail: goalDoneLines(world).filter((g) => g.finished).map((g) => g.done).join(', ') || null,
    },
    
    
    
    
    {
      key: 'assembly',
      label: 'Town assemblies called',
      value: meetingsHeld(world),
      text: `${meetingsHeld(world)}`,
      detail: builtDetail(world),
    },
  ];
  return lines;
}
