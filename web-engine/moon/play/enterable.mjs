






















import { HAPPINESS } from '../economy/tables.mjs';
import { anchors as roomAnchors } from '../art/houseRoom.mjs';
import { HOME_DOOR_M, PLAYER_RADIUS_M, toWorld } from '../world/collision.mjs';
import { BADGE, HOUSE_STAGES, badgeState, homeOf, homeStage } from './village.mjs';




const badgeHearts = (villager) => badgeState(villager, {}, BADGE).hearts;


export function mayEnter(villager, home, cfg = HAPPINESS) {
  return Boolean(home) && HOUSE_STAGES.includes(home.stage) && badgeHearts(villager) >= cfg.enterHearts;
}





const DOOR_GAP_M = 0.35;










export function villagerHomePlaces(world, village, t) {
  const out = [];
  for (const v of world.villagers || []) {
    const home = homeOf(village, v);
    if (!home) continue;
    const open = mayEnter(v, homeStage(v, t));
    const front = toWorld(home, 0, HOME_DOOR_M + PLAYER_RADIUS_M + DOOR_GAP_M);
    const entry = {
      type: 'villagerDoor', id: v.id,
      x: home.door.x, z: home.door.z, front,
      open, species: v.species, seed: home.seed,
    };
    if (open) entry.room = roomAnchors({ seed: home.seed, species: v.species });
    out.push(Object.freeze(entry));
  }
  return out;
}
