
import { START } from './data.js';
import { generateOrder, levelFor } from './logic.js';

const KEY = 'silkseam.v1';

function fresh() {
  return {
    v: 1,
    money: START.money,
    xp: 0,
    fabrics: { ...START.fabrics },
    trims: { ...START.trims },
    orders: [],
    gallery: [],
    job: null,
    muted: false,
    made: 0,
    seenIntro: false,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 1) return { ...fresh(), ...s };
    }
  } catch (e) {  }
  return fresh();
}

export const state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {  }
}

export function resetGame() {
  const f = fresh();
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, f);
  fillOrders();
  save();
}

export const level = () => levelFor(state.xp);

export function fillOrders() {
  while (state.orders.length < 3) {
    state.orders.push(generateOrder(level(), Math.random, state.orders.map((o) => o.client)));
  }
}
