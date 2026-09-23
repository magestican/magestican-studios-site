















import { CRAFTABLES } from './craftables.mjs';

export const FRONT_ROT_Y = 0;


export const isHouseItem = (item) => Boolean(CRAFTABLES[item]) && CRAFTABLES[item].category === 'houses';


export function placingRotY(item, playerHeading) {
  return isHouseItem(item) ? FRONT_ROT_Y : playerHeading + Math.PI;
}





export function faceHousesFront(world) {
  let turned = 0;
  for (const p of world.placed || []) {
    if (!isHouseItem(p.item) || !p.spot) continue;
    if ((p.spot.rotY || 0) !== FRONT_ROT_Y) {
      p.spot = { ...p.spot, rotY: FRONT_ROT_Y };
      turned++;
    }
  }
  return turned;
}
