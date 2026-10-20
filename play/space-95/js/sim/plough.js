










import { defeat } from './combat.js';

const PLOUGHABLE = new Set(['guard', 'wasp', 'pillbug', 'snailknight', 'aphid', 'dustmite', 'weevil', 'ladybot', 'bandit', 'nymph']);
const NOSE_L = 1.2; 
const NOSE_H = 2.5; 
const FLING_VX = 12; 
const FLING_VY = 8;
const REACH = 7; 
const BAND = 4;


export function stepPlough(s) {
  const R = s.rafts;
  if (!R?.packets) return;
  const ploughLanes = new Set(R.packets.filter((l) => l.def.plough).map((l) => l.def.id));
  if (!ploughLanes.size) return;
  const ctx = { session: s, events: s.events, player: s.player, world: s.world };
  for (const r of R.list) {
    if (!r.packet || !ploughLanes.has(r.lane)) continue;
    const dir = Math.sign(r.vx) || 1;
    const nose = r.x + (dir * r.w) / 2;
    const flung = [];
    for (const e of s.entities) {
      
      
      if (!e.alive || !PLOUGHABLE.has(e.kind) || e.state === 'dazed' || e.state === 'scurry' || e.dozing) continue;
      const ahead = (e.x - nose) * dir;
      if (ahead < -e.w / 2 || ahead > NOSE_L + e.w / 2 || e.y + e.h < r.y || e.y > r.y + NOSE_H) continue;
      defeat(e, ctx, 'fling');
      s.ploughN = (s.ploughN ?? 0) + 1;
      flung.push(e.x);
      s.events.push({ type: 'fling', id: e.id, kind: e.kind, n: s.ploughN, x: e.x, y: e.y, vx: dir * FLING_VX, vy: FLING_VY });
    }
    if (!flung.length) continue;
    for (const b of s.entities) {
      if (b.kind !== 'boss' || !b.alive || r.ploughed?.includes(b.id)) continue;
      
      if (!flung.some((fx) => (b.x - fx) * dir >= 0 && (b.x - fx) * dir <= REACH) || Math.abs(b.y - r.y) > BAND) continue;
      r.ploughed = [...(r.ploughed ?? []), b.id];
      s.events.push({ type: 'ploughHit', boss: b.id, x: b.x, y: b.y });
    }
  }
}
