
import { CHALLENGES, gymWorld } from './gym.js';
import { buildL01 } from './L01.js';
import { buildL02 } from './L02.js';
import { buildL03 } from './L03.js';
import { buildL04 } from './L04.js';
import { buildL05 } from './L05.js';
import { buildL06 } from './L06.js';
import { buildL07 } from './L07.js';
import { buildL08 } from './L08.js';
import { buildL09 } from './L09.js';

const SHIFTS = { 1: buildL01, 2: buildL02, 3: buildL03, 4: buildL04, 5: buildL05, 6: buildL06, 7: buildL07, 8: buildL08, 9: buildL09 };


export function loadLevel(key) {
  if (key !== 'gym' && SHIFTS[key]) {
    const level = SHIFTS[key]();
    return {
      level,
      labels: level.checkpoints.map((c) => ({ id: c.id, label: 'Clock-in', proves: '' })),
      title: `Shift ${level.id}: ${level.name}`,
    };
  }
  return { level: { ...gymWorld(), pitCost: 'none' }, labels: CHALLENGES, title: 'Metrics gym' };
}

export const SHIFT_IDS = Object.keys(SHIFTS).map(Number);
export const buildShift = (id) => SHIFTS[id]();
