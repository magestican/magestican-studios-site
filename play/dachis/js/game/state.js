

import { createSaveSlot } from '../engine/core/save.js';
import { statsOf, SPECIES } from './data/species.js';
import { SPAWN, RESPAWN } from './features/world/mapgen.js';

export const G = {
  mode: 'title',        
  cycle: 1,             
  name: 'Danny', gender: 'boy', t: 0,
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
  return s;
}
const slot = createSaveSlot('dachis.v1', 3, migrateSave);
export const hasSave = () => slot.exists();
export function saveGame() {
  if (!G.flags.started) return;
  slot.save({
    name: G.name, gender: G.gender, cycle: G.cycle, x: G.player.x, y: G.player.y,
    box: G.box, party: G.party.map(d => d.uid), items: G.items, dex: G.dex, flags: G.flags,
  });
}
export function loadGame() {
  const s = slot.load();
  if (!s) return false;
  Object.assign(G, { name: s.name, gender: s.gender, cycle: s.cycle || 1, box: s.box, items: { candy: 0, ...s.items }, dex: s.dex, flags: { taken: {}, ...s.flags } });
  for (const d of G.box) d.hp = Math.max(0, Math.min(d.hp, statsOf(d).maxHp));
  G.party = s.party.map(uid => G.box.find(d => d.uid === uid)).filter(Boolean);
  G.player.x = s.x; G.player.y = s.y;
  G.follower.x = s.x; G.follower.y = s.y - 0.6;
  return true;
}
export const deleteSave = () => slot.clear();

export function healParty() { for (const d of G.box) d.hp = statsOf(d).maxHp; }
export function addDachi(d) {
  if (typeof d.bond !== 'number') d.bond = 50;   
  G.box.push(d); G.dex.seen[d.sp] = G.dex.caught[d.sp] = 1;
  if (G.party.length < 3) { G.party.push(d); return true; }
  return false;
}
export const caughtCount = () => Object.keys(G.dex.caught).length;
export function objective() {
  if (!G.flags.starter) return 'Run down the road to the priests — the X on your map';
  if (!G.flags.initiated) return 'Run to the Shrine Village — the X on your map';
  if (!G.flags.kumabo) return 'Return to Kazan Village and see Kumabo';
  if (!G.flags.boss_ashlo) return 'Something burns on Tomo Coast... face Cinderwarden Ashlo'; 
  return `Befriend every dachi — ${caughtCount()} / ${SPECIES.length}`;
}
