










import { defeat } from '../combat.js';
import { STEP } from '../constants.js';
import { glasswingWake } from '../enemies/glasswing.js';
import { overlaps } from '../entities.js';
import { fighting, PLANE, planeBox } from '../plane.js';

const LADDER = 1.5; 


function discMeetsBox(cx, cy, r, b) {
  const nx = Math.max(b.x - b.w / 2, Math.min(cx, b.x + b.w / 2));
  const ny = Math.max(b.y, Math.min(cy, b.y + b.h));
  return Math.hypot(nx - cx, ny - cy) <= r;
}


function wakeTouch(s, e) {
  const pl = s.plane;
  const rolling = pl.rollT > 0;
  if (overlaps(planeBox(pl), e, rolling ? PLANE.ROLL_HALO : PLANE.GRAZE)) return rolling ? 'roll' : 'pass';
  for (const r of pl.rings) if (s.time <= r.until + 1e-9 && discMeetsBox(r.x, r.y, r.r, e)) return 'loop';
  return null;
}


export function stepWingman(s) {
  const pl = s.plane;
  if (pl?.stage !== 'fly') return;
  const ctx = { world: s.world, session: s, player: s.player, events: s.events };
  for (const e of s.entities) {
    if (!e.alive) continue;
    if (e.spun !== undefined) {
      e.spun += STEP;
      if (!e.turret && e.spun >= PLANE.SPUN - 1e-9) {
        e.turret = true;
        s.events.push({ type: 'turret', id: e.id, x: e.x, y: e.y + e.h / 2, seconds: PLANE.TURRET_T });
      }
      if (e.spun >= PLANE.SPUN + PLANE.TURRET_T - 1e-9) {
        e.spun = undefined;
        e.asleep = false;
        defeat(e, ctx, 'wingman');
        s.stats.wingman += 1;
      }
      continue;
    }
    if (e.kind === 'glasswing') {
      const how = s.dead === 0 ? wakeTouch(s, e) : null;
      if (how) glasswingWake(e, ctx, how);
      continue;
    }
    if (e.motif !== 'wingman' || !fighting(e) || s.dead > 0) continue;
    const how = wakeTouch(s, e);
    if (!how) continue;
    e.spun = 0;
    e.turret = false;
    e.vx = 0;
    e.vy = 0;
    s.wingLadder = s.time - (s.wingLast ?? -99) <= LADDER ? (s.wingLadder ?? 0) + 1 : 1;
    s.wingLast = s.time;
    s.events.push({ type: 'graze', id: e.id, kind: e.kind, how, use: e.use ?? null, n: s.wingLadder, x: e.x, y: e.y + e.h / 2 });
  }
}
