
import { CHALLENGES, gymWorld } from './gym.js';
import { buildDrillGym } from './gymDrill.js';
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

const SHIFTS = {
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
};


export function loadLevel(key) {
  if (key !== 'gym' && SHIFTS[key]) {
    const level = SHIFTS[key]();
    return {
      level,
      labels: level.checkpoints.map((c) => ({ id: c.id, label: 'Clock-in', proves: '' })),
      title: `Shift ${level.id}: ${level.name}`,
    };
  }
  if (key === 'gym-train') {
    
    const level = buildTrainGym();
    return { level, labels: level.checkpoints.map((c) => ({ id: c.id, label: c.name, proves: '' })), title: 'Train gym' };
  }
  if (key === 'gym-webs') {
    
    const level = buildWebGym();
    return { level, labels: level.checkpoints.map((c) => ({ id: c.id, label: 'Clock-in', proves: '' })), title: 'Web gym' };
  }
  if (key === 'gym-drill') {
    
    const level = buildDrillGym();
    return { level, labels: level.checkpoints.map((c) => ({ id: c.id, label: 'Clock-in', proves: '' })), title: 'Drill gym' };
  }
  return { level: { ...gymWorld(), pitCost: 'none' }, labels: CHALLENGES, title: 'Metrics gym' };
}

export const SHIFT_IDS = Object.keys(SHIFTS).map(Number);
export const buildShift = (id) => SHIFTS[id]();
