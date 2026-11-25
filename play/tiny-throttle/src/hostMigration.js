






















import { RACER_SEATS } from './room.js';


export const RECLAIM_MS = 20000;





export function successorOf(room, goneHostId) {
  const seats = room?.seats ?? [];
  for (const s of seats) if (s && !s.left && s.peerId !== goneHostId) return s.peerId;
  const watchers = [...(room?.watchers ?? [])].filter((w) => w.peerId !== goneHostId)
    .sort((a, b) => (a.since ?? 0) - (b.since ?? 0));
  return watchers[0]?.peerId ?? null;
}






export function takeOverRoom(room, { goneHostId, me, newHostId }) {
  const next = {
    hostId: newHostId,
    size: room.size ?? RACER_SEATS,
    racing: !!room.racing,
    joinSeq: room.joinSeq ?? room.watchers.length,
    seats: room.seats.map((s) => (s ? { ...s } : null)),
    watchers: room.watchers.filter((w) => w.peerId !== goneHostId).map((w) => ({ ...w })),
  };
  next.seats = next.seats.map((s) => {
    if (!s || s.left || s.peerId !== goneHostId) return s;
    return next.racing ? { ...s, left: true } : null;
  });
  const awaiting = new Set();
  for (const s of next.seats) {
    if (!s || s.left) continue;
    if (s.peerId === me) s.peerId = newHostId;
    else awaiting.add(s.peerId);
  }
  for (const w of next.watchers) {
    if (w.peerId === me) w.peerId = newHostId;
    else awaiting.add(w.peerId);
  }
  return { room: next, awaiting };
}








export function reclaimSeat(room, awaiting, { was, peerId }) {
  if (!was || !peerId || !awaiting.has(was)) return false;
  awaiting.delete(was);
  const seat = room.seats.find((s) => s && !s.left && s.peerId === was);
  if (seat) { seat.peerId = peerId; return true; }
  const w = room.watchers.find((x) => x.peerId === was);
  if (w) { w.peerId = peerId; return true; }
  return false;
}






export function dropUnclaimed(room, awaiting) {
  const bots = [];
  for (const id of awaiting) {
    room.watchers = room.watchers.filter((w) => w.peerId !== id);
    const seat = room.seats.findIndex((s) => s && !s.left && s.peerId === id);
    if (seat < 0) continue;
    if (room.racing) { room.seats[seat].left = true; bots.push(`p${seat}`); } else room.seats[seat] = null;
  }
  awaiting.clear();
  return bots;
}
