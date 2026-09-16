















import { createPose, copyPose } from './skeleton.mjs';
import { sampleClip, blendPose } from './pose.mjs';
import { smoothstep, lerp, frac, clamp } from './math.mjs';

export const LOCOMOTION = Object.freeze({
  idleBelow: 0.04, 
  walkAbove: 0.4, 
  carryEase: 0.15, 
  oneShotIn: 0.12, 
  oneShotOut: 0.22, 
  maxStep: 0.5, 
});

export function createLocomotion(skeleton, clips) {
  const { idle, walk, run, carry } = clips;
  const scratch = { idle: createPose(skeleton), walk: createPose(skeleton), run: createPose(skeleton), carry: createPose(skeleton), shot: createPose(skeleton) };
  const pose = createPose(skeleton);
  const speeds = Object.freeze({ walk: walk.speed, run: run.speed });
  const state = { time: 0, cycles: 0, phase: 0, speed: 0, move: 0, run: 0, carry: 0, carryTime: 0, oneShot: null };

  function update(dt, { speed = 0, carrying = false } = {}) {
    dt = Number.isFinite(dt) ? clamp(dt, 0, LOCOMOTION.maxStep) : 0;
    speed = Number.isFinite(speed) ? Math.max(0, speed) : 0;
    state.time += dt;
    state.speed = speed;
    state.move = smoothstep(LOCOMOTION.idleBelow, LOCOMOTION.walkAbove, speed);
    state.run = smoothstep(speeds.walk, speeds.run, speed);
    state.cycles += (speed * dt) / lerp(walk.stride, run.stride, state.run);
    state.phase = frac(state.cycles);
    state.carry += ((carrying ? 1 : 0) - state.carry) * (1 - Math.exp(-dt / LOCOMOTION.carryEase));
    state.carryTime += dt;

    copyPose(sampleClip(skeleton, idle, state.time / idle.duration, scratch.idle), pose);
    if (state.move > 0) {
      sampleClip(skeleton, walk, state.phase, scratch.walk);
      if (state.run > 0) blendPose(skeleton, scratch.walk, scratch.walk, sampleClip(skeleton, run, state.phase, scratch.run), state.run);
      blendPose(skeleton, pose, pose, scratch.walk, state.move);
    }
    if (state.carry > 1e-4) {
      sampleClip(skeleton, carry, state.carryTime / carry.duration, scratch.carry);
      blendPose(skeleton, pose, pose, scratch.carry, state.carry, carry.mask);
    }
    const shot = state.oneShot;
    if (shot) {
      shot.time += dt;
      const clip = clips[shot.name];
      const d = clip.duration;
      if (shot.time >= d) {
        state.oneShot = null;
      } else {
        const w = smoothstep(0, LOCOMOTION.oneShotIn, shot.time) * (1 - smoothstep(d - LOCOMOTION.oneShotOut, d, shot.time));
        blendPose(skeleton, pose, pose, sampleClip(skeleton, clip, shot.time / d, scratch.shot), w);
      }
    }
    return pose;
  }

  
  
  function act(name) {
    const clip = clips[name];
    if (!clip || clip.loop) throw new Error(`locomotion: '${name}' is not a one-shot clip`);
    state.oneShot = { name, time: 0 };
  }

  return {
    state,
    pose,
    speeds,
    update,
    act,
    pickUp() { act('pickUp'); },
    get busy() { return state.oneShot !== null; },
    
    get action() { return state.oneShot ? state.oneShot.name : null; },
  };
}
