


import { createSaveSlot } from '../engine/core/save.js';
import { statsOf, SPECIES } from './data/species.js';
import { SPAWN, RESPAWN } from './features/world/mapgen.js';
import { mainStep } from './features/quest/quests.js';
import { newClock, fixClock } from './features/clock/clock.js';
import { HOME, saveRegion, regionById } from './features/world/regions.js';
import { sectionById } from './features/world/sections.js';
import { newGamePlus, plusReady } from './features/story/newGamePlus.js';
import { noteForm } from './data/forms.js';

export const G = {
  mode: 'title',        
  cycle: 1,             
  name: 'Ace', gender: 'boy', t: 0,
  region: 'kazan-isle', 
  clock: newClock(),    
  player: { x: SPAWN.x, y: SPAWN.y, vx: 0, vy: 1, walk: 0, moving: false },
  follower: { x: SPAWN.x, y: SPAWN.y - 0.8, walk: 0, moving: false, face: 1 },
  party: [],            
  box: [],              
  items: { seal: 3, tonic: 5, candy: 0 },
  dex: { seen: {}, caught: {} },
  flags: { taken: {} },
  npcs: [], wilds: [], safeTimer: 0,
};


export const S = {};



export function migrateSave(s) {
  if (!s || typeof s !== 'object') return null;
  if (!s.v || s.v < 2) {
    const home = s.flags && s.flags.initiated ? RESPAWN.shrine : RESPAWN.kazan;
    s = { ...s, x: home.x, y: home.y, v: 2 };
  }
  
  if (s.v < 3) {
    s = { ...s, box: (s.box || []).map(d => (typeof d.bond === 'number' ? d : { ...d, bond: 50 })), v: 3 };
  }
  
  if (s.v < 4) s = { ...s, clock: fixClock(s.clock), v: 4 };
  
  if (s.v < 5) s = { ...s, region: HOME, v: 5 };
  return s;
}
const slot = createSaveSlot('dachis.v1', 5, migrateSave);
export const hasSave = () => slot.exists();
export function saveGame() {
  if (!G.flags.started || G.flags.cheat) return; 
  slot.save(runSave());
}

export const runSave = () => ({
  name: G.name, gender: G.gender, cycle: G.cycle, x: G.player.x, y: G.player.y,
  box: G.box, party: G.party.map(d => d.uid), items: G.items, dex: G.dex, flags: G.flags, clock: G.clock, region: G.region,
});

export function savedBox() { const s = slot.load(); return (s && s.box) || []; }
export function loadGame() {
  const s = slot.load();
  if (!s) return false;
  Object.assign(G, { name: s.name, gender: s.gender, cycle: s.cycle || 1, box: s.box, items: { candy: 0, ...s.items }, dex: s.dex, flags: { taken: {}, ...s.flags }, clock: fixClock(s.clock), region: saveRegion(s) });
  for (const d of G.box) d.hp = Math.max(0, Math.min(d.hp, statsOf(d).maxHp));
  G.party = s.party.map(uid => G.box.find(d => d.uid === uid)).filter(Boolean);
  G.player.x = s.x; G.player.y = s.y;
  G.follower.x = s.x; G.follower.y = s.y - 0.6;
  return true;
}
export const deleteSave = () => slot.clear();



export const plusOffered = () => plusReady(slot.load());
export function startNewGamePlus(s = slot.load()) {
  if (!plusReady(s)) return false;
  Object.assign(G, newGamePlus(s), { party: [], clock: newClock(), region: HOME });
  if (s.flags.cheat) G.flags.cheat = true; 
  return true;
}

export function healParty() { for (const d of G.box) d.hp = statsOf(d).maxHp; }
export function addDachi(d) {
  if (typeof d.bond !== 'number') d.bond = 50;   
  G.box.push(d); G.dex.seen[d.sp] = G.dex.caught[d.sp] = 1;
  if (d.alpha) G.dex.alphas = (G.dex.alphas || 0) + 1; 
  noteForm(G.dex, d); 
  if (G.party.length < 3) { G.party.push(d); return true; }
  return false;
}
export const caughtCount = () => Object.keys(G.dex.caught).length;
export function objective() {
  
  const r = G.region && G.region !== HOME ? regionById(G.region) : null;
  
  
  const sec = r && S.W && S.W.sectionAt ? S.W.sectionAt(G.player.x, G.player.y) : null;
  if (sec && r.objectives && r.objectives[sec]) return r.objectives[sec];
  
  if (sec && sectionById(sec) && sectionById(sec).train) return 'The wild ones here are tougher - train up';
  if (r && r.objective) return r.objective;
  
  return mainStep(G.flags, { caught: caughtCount(), total: SPECIES.length }).text;
}
