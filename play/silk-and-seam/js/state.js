
import { START } from './data.js';
import { freshTown } from './town.js';
import { generateOrder, levelFor, seasonFor, DEFAULT_SETTINGS, TUTORIAL_STEPS, repFromGallery, statsFromGallery, freshStats, achievementsEarned } from './logic.js';

const KEY = 'silkseam.v1';

function fresh() {
  return {
    v: 4,
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
    notes: {},                       
    settings: { ...DEFAULT_SETTINGS }, 
    clients: {},                     
    rep: 0,                          
    window: null,                    
    upgrades: [],                    
    scraps: {},                      
    stats: freshStats(),             
    achievements: {},                
    scene: { night: null, open: false, body: null }, 
    town: freshTown(),               
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      
      
      
      
      
      if (s && (s.v === 1 || s.v === 2 || s.v === 3 || s.v === 4)) {
        const out = { ...fresh(), ...s, v: 4, town: { ...freshTown(), ...(s.town || {}) }, clients: { ...(s.clients || {}) }, settings: { ...DEFAULT_SETTINGS, ...(s.settings || {}) } };
        
        if (!s.notes && s.made > 0) out.notes = Object.fromEntries(TUTORIAL_STEPS.map((k) => [k, true]));
        if (s.v < 3) {
          out.rep = repFromGallery(s.gallery);
          out.stats = statsFromGallery(s.gallery);
          out.achievements = Object.fromEntries(achievementsEarned(out).map((id) => [id, true]));
        }
        out.stats = { ...freshStats(), ...(out.stats || {}) };
        return out;
      }
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
  
  while (state.orders.filter((o) => !o.town).length < 3) {
    state.orders.push(generateOrder(level(), Math.random, state.orders.map((o) => o.client), { season: seasonFor(state.made).id, history: state.clients, rep: state.rep }));
  }
}
