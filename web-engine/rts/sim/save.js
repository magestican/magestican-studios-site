


































































import { Rng } from '../rng.js';
import { Bank } from '../economy.js';
import { MAPS } from '../maps/index.js';
import {
  createWorld, checksum, mixValue, digest, MAX_UNITS, MAX_BUILDINGS,
  U_COLS, B_COLS, S_COLS,
} from './world.js';
import { createPresenceBuffers } from './presence.js';
import { createAuraBuffers } from './auras.js';
import { createQueues } from './production.js';














export const SAVE_VERSION = 2;








const col = (arr, n) => Array.from(arr.subarray(0, n));




















export function matchState(m) {
  return {
    banks: m.banks.map((k) => k.save()),
    queues: m.queues.map((q) => q.map((e) => ({ ...e }))),
    score: Array.from(m.score),
    routTicks: Array.from(m.routTicks),
    stats: m.stats.map((s) => ({ ...s })),
    automation: m.automation.map((a) => ({ ...a })),
    
    
    
    scheduled: [...m.scheduled.entries()]
      .map(([tick, cmds]) => [
        tick,
        [...cmds].sort((a, b) => (a.p - b.p) || (a.seq - b.seq)).map((c) => ({ ...c })),
      ])
      .sort((a, b) => a[0] - b[0]),
    botRound: m.botRound || 0,
    over: !!m.over,
    winner: m.winner,
    endReason: m.endReason || '',
  };
}







export function saveMatch(m) {
  const w = m.w;
  const u = {};
  for (const c of U_COLS) u[c] = col(w.u[c], w.u.count);
  const b = {};
  for (const c of B_COLS) b[c] = col(w.b[c], w.b.count);

  const sectors = [];
  for (const s of w.sectors) {
    const row = {};
    for (const c of S_COLS) row[c] = s[c];
    sectors.push(row);
  }

  return {
    v: SAVE_VERSION,
    mapId: w.map.id,
    seed: w.seed === undefined ? null : w.seed,
    tick: w.tick,
    
    
    
    
    rng: w.rng.state,
    nextId: w.nextId,
    
    
    
    
    
    
    spawnSeq: Array.from(w.spawnSeq),
    seats: w.seats.map((s) => ({ faction: s.faction, bot: s.bot ? { ...s.bot } : null })),
    uCount: w.u.count,
    bCount: w.b.count,
    u,
    b,
    sectors,
    ...matchState(m),
    
    
    
    
    
    
    
    
    
    barks: m.barks ? JSON.parse(JSON.stringify(m.barks)) : null,
  };
}








export function restoreMatch(data) {
  if (!data || typeof data !== 'object') throw new Error('not a save');
  if (data.v !== SAVE_VERSION) {
    throw new Error(`save is version ${data.v}, this build reads ${SAVE_VERSION}`);
  }
  const map = MAPS[data.mapId];
  if (!map) throw new Error(`save names map '${data.mapId}', which this build does not have`);

  const seats = data.seats.map((s) => ({ faction: s.faction, bot: s.bot || undefined }));
  
  
  
  
  
  
  
  
  
  const w = createWorld({ map, seats, seed: data.seed == null ? 1 : data.seed });
  w.tick = data.tick;
  w.rng = new Rng(1);
  w.rng.state = data.rng | 0;
  w.nextId = data.nextId;
  
  
  w.spawnSeq.set(data.spawnSeq);

  w.u.count = data.uCount;
  for (const c of U_COLS) {
    const src = data.u[c];
    w.u[c].fill(0);
    for (let i = 0; i < src.length; i += 1) w.u[c][i] = src[i];
  }
  w.b.count = data.bCount;
  for (const c of B_COLS) {
    const src = data.b[c];
    w.b[c].fill(0);
    for (let i = 0; i < src.length; i += 1) w.b[c][i] = src[i];
  }

  for (let i = 0; i < w.sectors.length; i += 1) {
    const row = data.sectors[i];
    if (!row) continue;
    for (const c of S_COLS) w.sectors[i][c] = row[c];
  }

  const playerCount = seats.length;
  const m = {
    w,
    playerCount,
    factions: Object.fromEntries(seats.map((s, i) => [i, s.faction])),
    banks: data.banks.map((k) => Bank.restore(k)),
    queues: createQueues(playerCount),
    presence: createPresenceBuffers(w.sectors.length, playerCount),
    auras: createAuraBuffers(MAX_UNITS),
    score: Int32Array.from(data.score),
    routTicks: Int32Array.from(data.routTicks),
    stats: data.stats.map((s) => ({ ...s })),
    automation: data.automation.map((a) => ({ ...a })),
    scheduled: new Map(data.scheduled.map(([tick, cmds]) => [tick, cmds])),
    events: [],
    botRound: data.botRound || 0,
    over: !!data.over,
    winner: data.winner,
    endReason: data.endReason || '',
    _scored: new Int32Array(playerCount),
    _rally: new Array(playerCount).fill(null),
  };
  for (let p = 0; p < playerCount; p += 1) {
    m.queues[p].length = 0;
    for (const e of (data.queues[p] || [])) m.queues[p].push(e);
  }
  if (data.barks) m.barks = data.barks;
  return m;
}





















export function matchChecksum(m) {
  return mixValue(checksum(m.w) | 0, matchState(m)) >>> 0;
}




















export function checksumFields(m) {
  const w = m.w;
  const out = {
    tick: digest(w.tick),
    nextId: digest(w.nextId),
    seed: digest(w.seed),
    mapId: digest((w.map && w.map.id) || ''),
    rng: digest(w.rng.save()),
    seats: digest(w.seats),
    spawnSeq: digest(w.spawnSeq),
    'u.count': digest(w.u.count),
    'b.count': digest(w.b.count),
  };
  for (const c of U_COLS) out[`u.${c}`] = digest(col(w.u[c], w.u.count));
  for (const c of B_COLS) out[`b.${c}`] = digest(col(w.b[c], w.b.count));
  for (const c of S_COLS) out[`s.${c}`] = digest(w.sectors.map((s) => s[c]));
  const ms = matchState(m);
  for (const k of Object.keys(ms)) out[`m.${k}`] = digest(ms[k]);
  return out;
}









export function saveChecksum(m) {
  return matchChecksum(m);
}
