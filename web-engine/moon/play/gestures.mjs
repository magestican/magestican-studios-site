




































import { animPhase } from '../rig/locomotion.mjs';

export const GESTURE = Object.freeze({
  everyS: 7.5,
  
  
  
  
  byDoing: Object.freeze({ orchard: 'water', firepit: 'pickUp', shop: 'pickUp' }),
  
  
  
  
  byWorkplace: Object.freeze({ pressYard: 'pickUp', emporium: 'pickUp', market: 'pickUp', townHall: 'pickUp' }),
  
  
  quietWorkplaces: Object.freeze(['landOffice']),
});


export function workplaceOf(place) {
  return typeof place === 'string' && place.startsWith('work:') ? place.slice(5) : null;
}






export function gestureClip(pose, { cfg = GESTURE } = {}) {
  if (!pose || pose.inside || (pose.speed || 0) > 0.05) return null;
  if (pose.doing === 'working') return cfg.byWorkplace[workplaceOf(pose.place)] || null;
  return cfg.byDoing[pose.doing] || null;
}











export function villagerGesture(villager, pose, nowS, { cfg = GESTURE } = {}) {
  const clip = gestureClip(pose, { cfg });
  if (!clip || !Number.isFinite(nowS)) return null;
  const offsetS = animPhase(villager && villager.id) * cfg.everyS;
  const slot = Math.floor((nowS - offsetS) / cfg.everyS);
  if (slot < 0) return null;
  return { clip, slot, key: `${clip}:${slot}` };
}
