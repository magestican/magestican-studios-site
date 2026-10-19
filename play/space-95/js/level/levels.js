
import { CHALLENGES, gymWorld } from './gym.js';
import { buildL01 } from './L01.js';
import { buildL02 } from './L02.js';
import { buildL03 } from './L03.js';

const SHIFTS = { 1: buildL01, 2: buildL02, 3: buildL03 };


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
