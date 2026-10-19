


import { boxFree, sweepY } from './body.js';
import { CORNER_CORRECTION, COYOTE_TIME, JUMP_BUFFER, LEDGE_ASSIST } from './constants.js';

const T_EPS = 1e-9;


export function coyoteOk(sinceGrounded, jumpedThisAir) {
  return !jumpedThisAir && sinceGrounded <= COYOTE_TIME + T_EPS;
}


export function bufferOk(sincePressed) {
  return sincePressed <= JUMP_BUFFER + T_EPS;
}







export function cornerCorrect(world, b, dy) {
  const stepSize = 0.01;
  for (let d = stepSize; d <= CORNER_CORRECTION + T_EPS; d += stepSize) {
    for (const dir of [1, -1]) {
      const moved = { ...b, x: b.x + dir * d };
      if (!boxFree(world, moved)) continue;
      if (!sweepY(world, moved, dy).hit) return dir * d;
    }
  }
  return null;
}






export function ledgeAssist(world, b, dir) {
  const T = world.tile;
  const edge = b.x + (dir * b.w) / 2;
  const col = dir > 0 ? Math.round(edge / T) : Math.round(edge / T) - 1;
  const k = Math.floor((b.y + LEDGE_ASSIST + 1e-7) / T);
  const lip = k * T;
  if (lip <= b.y + 1e-7 || lip - b.y > LEDGE_ASSIST + 1e-7) return null;
  if (!world.solid(col, k - 1)) return null;
  
  const x = dir > 0 ? col * T + b.w / 2 - b.w * 0.25 : (col + 1) * T - b.w / 2 + b.w * 0.25;
  const target = { ...b, x: b.x + dir * Math.min(Math.abs(x - b.x), b.w), y: lip };
  if (!boxFree(world, target)) return null;
  if (!boxFree(world, { ...b, y: lip })) return null; 
  return { x: target.x, y: lip };
}
