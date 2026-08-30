










































import { VOX } from '../voxel/voxelGrid.js';












export const BREAK_HP = Object.freeze({
  [VOX.WOOD]: 26,
});


export function isBreakable(vox) {
  return BREAK_HP[vox] !== undefined;
}


export function keyOf(x, y, z) {
  return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
}


export function createBreakState() {
  return new Map();   
}












export function voxelAtImpact(point, dir, nudge = 0.25) {
  if (!point) return null;
  const d = dir || { x: 0, y: 0, z: 0 };
  return {
    x: Math.floor(point.x + d.x * nudge),
    y: Math.floor(point.y + d.y * nudge),
    z: Math.floor(point.z + d.z * nudge),
  };
}









export function damageVoxel(state, vox, x, y, z, amount) {
  const max = BREAK_HP[vox];
  if (max === undefined) return { broken: false, damage: 0, hp: Infinity };
  const key = keyOf(x, y, z);
  const prev = state.get(key) ?? 0;
  if (prev >= max) return { broken: false, damage: prev, hp: 0 };
  const next = prev + Math.max(0, amount || 0);
  state.set(key, next);
  const hp = Math.max(0, max - next);
  return { broken: next >= max, damage: next, hp };
}


export function wearOf(state, vox, x, y, z) {
  const max = BREAK_HP[vox];
  if (max === undefined) return 0;
  const d = state.get(keyOf(x, y, z)) ?? 0;
  return Math.max(0, Math.min(1, d / max));
}
