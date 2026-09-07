




















import { ANIM } from './animTable.js';


export const ATTACK_TICKS = 6;

export const DIE_TICKS = 12;

export const WALK_FPS = 12;
const TICKS_PER_SECOND = 20;











export function animFrame(u) {
  if (u.dyingSince !== undefined && u.dyingSince >= 0) {
    const age = u.tick - u.dyingSince;
    if (age < 0 || age >= DIE_TICKS) return null;
    return { kind: 'die', frame: Math.min(ANIM.die - 1, Math.floor((age * ANIM.die) / DIE_TICKS)) };
  }
  if (u.attackTicks > 0 && u.cooldown > 0) {
    const since = u.attackTicks - u.cooldown;
    if (since >= 0 && since < ATTACK_TICKS) {
      return { kind: 'attack', frame: since < ATTACK_TICKS / 2 ? 1 : 0 };
    }
  }
  if (u.moving) {
    const step = Math.floor(((u.tick * WALK_FPS) / TICKS_PER_SECOND) + (u.phase || 0) * ANIM.walk);
    return { kind: 'walk', frame: ((step % ANIM.walk) + ANIM.walk) % ANIM.walk };
  }
  return null;
}






export function animTile(manifest, id, facing, af) {
  const r = manifest && manifest.rows[id];
  const k = manifest && manifest.kinds[af.kind];
  if (!r || !k) return { col: -1, row: -1 };
  return { col: facing * manifest.slots + af.frame, row: r.row + k.offset };
}
