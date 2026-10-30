


import { createOutbox, flush, mergeReport, record, setScore } from './hitsync.js';
import { clampPlayers } from './scaling.js';

const NAMES = [
  'Rexy',
  'Mia',
  'Leo',
  'Kai',
  'Zoe',
  'Ivy',
  'Max',
  'Ana',
  'Theo',
  'Nova',
  'Finn',
  'Lulu',
  'Hugo',
  'Ruby',
  'Otto',
  'Sky',
  'Jojo',
  'Pip',
  'Remy',
];
const SHOTS_PER_S = 2;
const HIT_CHANCE = 0.55;
const RANGE_M = 35;

const REACT_S = 0.8;
const POINTS_PER_HIT = 10;


function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


export function createBots(players, seed) {
  const rand = rng(seed);
  const n = Math.max(0, clampPlayers(players) - 1);
  return {
    rand,
    t: 0,
    
    seen: {},
    list: NAMES.slice(0, n).map((name, i) => ({ id: `bot${i + 1}`, name, outbox: createOutbox(name), cool: rand() / SHOTS_PER_S })),
  };
}





export function stepBots(bots, game, dt, ledger, nowMs) {
  if (!bots.list.length) return;
  bots.t += dt;
  const live = game.enemies.filter((e) => {
    if (e.dead || e.target === 'hostage') return false;
    if (bots.seen[e.id] === undefined) bots.seen[e.id] = bots.t;
    return bots.t - bots.seen[e.id] >= REACT_S && Math.hypot(e.pos.x - game.cam.pos.x, e.pos.z - game.cam.pos.z) <= RANGE_M;
  });
  for (const b of bots.list) {
    b.cool -= dt;
    while (b.cool <= 0) {
      b.cool += (0.5 + bots.rand()) / SHOTS_PER_S;
      if (!live.length) continue;
      const e = live[Math.floor(bots.rand() * live.length)];
      if (bots.rand() < HIT_CHANCE) {
        record(b.outbox, e.id, 1);
        setScore(b.outbox, b.outbox.score + POINTS_PER_HIT);
      }
    }
    const r = flush(b.outbox, nowMs);
    if (r) mergeReport(ledger, b.id, r);
  }
}
