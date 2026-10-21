




import { describeLevel, isShiftKey } from './shiftList.js';


const SHIFTS = {
  1: () => import('./L01.js').then((m) => m.buildL01),
  2: () => import('./L02.js').then((m) => m.buildL02),
  3: () => import('./L03.js').then((m) => m.buildL03),
  4: () => import('./L04.js').then((m) => m.buildL04),
  5: () => import('./L05.js').then((m) => m.buildL05),
  6: () => import('./L06.js').then((m) => m.buildL06),
  7: () => import('./L07.js').then((m) => m.buildL07),
  8: () => import('./L08.js').then((m) => m.buildL08),
  9: () => import('./L09.js').then((m) => m.buildL09),
  10: () => import('./L10.js').then((m) => m.buildL10),
  11: () => import('./L11.js').then((m) => m.buildL11),
  12: () => import('./L12.js').then((m) => m.buildL12),
  13: () => import('./L13.js').then((m) => m.buildL13),
  14: () => import('./L14.js').then((m) => m.buildL14),
  15: () => import('./L15.js').then((m) => m.buildL15),
  16: () => import('./L16.js').then((m) => m.buildL16),
  17: () => import('./L17.js').then((m) => m.buildL17),
  18: () => import('./L18.js').then((m) => m.buildL18),
  19: () => import('./L19.js').then((m) => m.buildL19),
  20: () => import('./L20.js').then((m) => m.buildL20),
};


const GYMS = {
  'gym-train': () => import('./gymTrain.js').then((m) => m.buildTrainGym),
  'gym-webs': () => import('./gymWebs.js').then((m) => m.buildWebGym),
  'gym-drill': () => import('./gymDrill.js').then((m) => m.buildDrillGym),
  'gym-chill': () => import('./gymChill.js').then((m) => m.buildChillGym),
  'gym-plane': () => import('./gymPlane.js').then((m) => m.buildPlaneGym),
};


export const SHIFT_MODULES = Object.fromEntries(Object.keys(SHIFTS).map((id) => [id, `js/level/L${String(id).padStart(2, '0')}.js`]));


export async function loadLevel(key) {
  const { CHALLENGES, gymWorld } = await import('./gym.js');
  if (isShiftKey(key)) return describeLevel(key, (await SHIFTS[key]())(), CHALLENGES);
  if (Object.hasOwn(GYMS, key)) return describeLevel(key, (await GYMS[key]())(), CHALLENGES);
  return describeLevel(key, { ...gymWorld(), pitCost: 'none' }, CHALLENGES);
}
