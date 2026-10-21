



import { CHALLENGES, gymWorld } from './gym.js';
import { buildChillGym } from './gymChill.js';
import { buildDrillGym } from './gymDrill.js';
import { buildPlaneGym } from './gymPlane.js';
import { buildTrainGym } from './gymTrain.js';
import { buildWebGym } from './gymWebs.js';
import { buildL01 } from './L01.js';
import { buildL02 } from './L02.js';
import { buildL03 } from './L03.js';
import { buildL04 } from './L04.js';
import { buildL05 } from './L05.js';
import { buildL06 } from './L06.js';
import { buildL07 } from './L07.js';
import { buildL08 } from './L08.js';
import { buildL09 } from './L09.js';
import { buildL10 } from './L10.js';
import { buildL11 } from './L11.js';
import { buildL12 } from './L12.js';
import { buildL13 } from './L13.js';
import { buildL14 } from './L14.js';
import { buildL15 } from './L15.js';
import { buildL16 } from './L16.js';
import { buildL17 } from './L17.js';
import { buildL18 } from './L18.js';
import { buildL19 } from './L19.js';
import { buildL20 } from './L20.js';
import { describeLevel, isShiftKey } from './shiftList.js';

export { ALL_SHIFT_IDS, GREYBOX, SHIFT_IDS, SHIFT_NAMES, UNRENDERED } from './shiftList.js';


export const SHIFTS = {
  1: buildL01,
  2: buildL02,
  3: buildL03,
  4: buildL04,
  5: buildL05,
  6: buildL06,
  7: buildL07,
  8: buildL08,
  9: buildL09,
  10: buildL10,
  11: buildL11,
  12: buildL12,
  13: buildL13,
  14: buildL14,
  15: buildL15,
  16: buildL16,
  17: buildL17,
  18: buildL18,
  19: buildL19,
  20: buildL20,
};


export const GYMS = {
  'gym-train': buildTrainGym,
  'gym-webs': buildWebGym,
  'gym-drill': buildDrillGym,
  'gym-chill': buildChillGym,
  'gym-plane': buildPlaneGym,
};


export function loadLevel(key) {
  if (isShiftKey(key)) return describeLevel(key, SHIFTS[key](), CHALLENGES);
  if (Object.hasOwn(GYMS, key)) return describeLevel(key, GYMS[key](), CHALLENGES);
  return describeLevel(key, { ...gymWorld(), pitCost: 'none' }, CHALLENGES);
}

export const buildShift = (id) => SHIFTS[id]();
