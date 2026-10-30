




import { applyRemoteHits } from '../sim.js';
import { addHit, createConfetti, liveLabels } from '../ui/confetti.js';
import { board } from '../ui/scoreboard.js';
import { createBots, stepBots } from './bots.js';
import { createLedger, createOutbox, flush, mergeReport, record, setScore, takeNew } from './hitsync.js';

export const ME = 'me';
const LABEL_LIFE_MS = 1200;





export function createRoom({ me = ME, name = 'You', bots = null } = {}) {
  return {
    me,
    bots,
    ledger: createLedger(),
    
    seen: {},
    outbox: createOutbox(name),
    confetti: createConfetti(),
    remoteKills: 0,
    remoteHits: 0,
  };
}


export const createLocalRoom = (players, seed, myName = 'You') => createRoom({ name: myName, bots: createBots(players, seed) });






export function stepRoom(room, game, dt, nowMs) {
  const at = (id) => game.enemies.find((e) => e.id === id);
  for (const ev of game.events) {
    if (ev.type !== 'shot' || !ev.hit) continue;
    record(room.outbox, ev.hit, ev.n);
    const e = at(ev.hit);
    if (e) addHit(room.confetti, { player: room.me, name: room.outbox.name, id: ev.hit, n: ev.n, own: true, pos: e.pos }, nowMs);
  }
  setScore(room.outbox, game.score.points);
  const mine = flush(room.outbox, nowMs);
  if (mine) mergeReport(room.ledger, room.me, mine);
  if (room.bots) stepBots(room.bots, game, dt, room.ledger, nowMs);
  const from = game.events.length;
  applyRemoteHits(
    game,
    takeNew(room.ledger, room.seen, room.me, (id) => !!at(id)),
  );
  for (const ev of game.events.slice(from)) {
    if (ev.type === 'remote_hit') {
      room.remoteHits++;
      addHit(room.confetti, { player: ev.player, name: ev.name, id: ev.id, n: ev.n, own: false, pos: ev.pos }, nowMs);
    }
    if (ev.type === 'kill' && ev.by) room.remoteKills++;
  }
  return mine;
}







export function roomView(room, nowMs, project) {
  const rows = Object.entries(room.ledger).map(([id, r]) => ({ id, name: r.name, score: r.score }));
  if (!room.ledger[room.me]) rows.push({ id: room.me, name: room.outbox.name, score: room.outbox.score });
  const labels = [];
  for (const l of liveLabels(room.confetti, nowMs)) {
    const p = project({ x: l.pos.x, y: l.pos.y + 0.6, z: l.pos.z });
    if (p.z >= 1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1) continue;
    labels.push({
      text: l.text,
      own: l.own,
      x: (p.x + 1) / 2,
      y: (1 - p.y) / 2,
      fade: Math.max(0.05, 1 - (nowMs - l.last) / LABEL_LIFE_MS),
    });
  }
  return { board: board(rows, room.me), labels };
}
