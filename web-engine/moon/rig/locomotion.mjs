




























import { createPose } from './skeleton.mjs';
import { sampleClip, blendPose } from './pose.mjs';
import { smoothstep, lerp, frac, clamp } from './math.mjs';
import { idleLifeAt, applyIdleLife } from './idleLife.mjs';
import { applyCarryHeft, pickUpHopAt } from './heftPose.mjs';

export const LOCOMOTION = Object.freeze({
  idleBelow: 0.04, 
  walkAbove: 0.4, 
  carryEase: 0.15, 
  oneShotIn: 0.12, 
  oneShotOut: 0.22, 
  maxStep: 0.5, 
  useEase: 0.18, 
});









export function animPhase(seed) {
  return Number.isFinite(seed) ? frac(Math.abs(seed) * 0.6180339887498949) : 0;
}










export function createLocomotion(skeleton, clips, { phase = 0, life = null } = {}) {
  const { idle, walk, run, carry } = clips;
  const lifeSeed = Number.isFinite(life) ? life : null;
  const scratch = { walk: createPose(skeleton), run: createPose(skeleton), carry: createPose(skeleton), shot: createPose(skeleton), use: createPose(skeleton) };
  const pose = createPose(skeleton);
  const speeds = Object.freeze({ walk: walk.speed, run: run.speed });
  const p = frac(Number.isFinite(phase) ? phase : 0);
  const state = { time: p * idle.duration, cycles: p, phase: p, speed: 0, move: 0, run: 0, carry: 0, carryTime: p * carry.duration, oneShot: null, life: null, use: null };

  
  
  
  
  const hop = { lift: 0, squash: 1 };

  function update(dt, { speed = 0, carrying = false, faceYaw = 0, heft = 0 } = {}) {
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

    
    
    
    
    
    
    
    const gaitOnly = state.move >= 1;
    if (state.move > 0) {
      const into = gaitOnly ? pose : scratch.walk;
      if (state.run >= 1) {
        sampleClip(skeleton, run, state.phase, into);
      } else {
        sampleClip(skeleton, walk, state.phase, into);
        if (state.run > 0) blendPose(skeleton, into, into, sampleClip(skeleton, run, state.phase, scratch.run), state.run);
      }
      if (!gaitOnly) {
        sampleClip(skeleton, idle, state.time / idle.duration, pose);
        blendPose(skeleton, pose, pose, into, state.move);
      }
    } else {
      sampleClip(skeleton, idle, state.time / idle.duration, pose);
    }
    
    
    
    
    if (lifeSeed !== null && state.move < 1) {
      state.life = idleLifeAt(lifeSeed, state.time, { faceYaw });
      applyIdleLife(skeleton, pose, state.life, 1 - state.move);
    } else {
      state.life = null;
    }
    if (state.carry > 1e-4) {
      sampleClip(skeleton, carry, state.carryTime / carry.duration, scratch.carry);
      blendPose(skeleton, pose, pose, scratch.carry, state.carry, carry.mask);
      
      
      
      applyCarryHeft(skeleton, pose, heft, state.carry);
    }
    
    
    
    const u = state.use;
    if (u) {
      u.time += dt;
      u.w += ((u.on ? 1 : 0) - u.w) * (1 - Math.exp(-dt / LOCOMOTION.useEase));
      if (!u.on && u.w < 1e-3) {
        state.use = null;
      } else {
        const clip = clips[u.name];
        blendPose(skeleton, pose, pose, sampleClip(skeleton, clip, u.time / clip.duration, scratch.use), u.w);
      }
    }
    const shot = state.oneShot;
    hop.lift = 0;
    hop.squash = 1;
    if (shot) {
      shot.time += dt;
      const clip = clips[shot.name];
      const d = clip.duration;
      if (shot.time >= d) {
        state.oneShot = null;
      } else {
        const w = smoothstep(0, LOCOMOTION.oneShotIn, shot.time) * (1 - smoothstep(d - LOCOMOTION.oneShotOut, d, shot.time));
        blendPose(skeleton, pose, pose, sampleClip(skeleton, clip, shot.time / d, scratch.shot), w);
        
        
        if (shot.name === 'pickUp') {
          const h = pickUpHopAt(shot.time / d, heft);
          hop.lift = h.lift;
          hop.squash = h.squash;
        }
      }
    }
    return pose;
  }

  
  
  function act(name) {
    const clip = clips[name];
    if (!clip || clip.loop) throw new Error(`locomotion: '${name}' is not a one-shot clip`);
    state.oneShot = { name, time: 0 };
  }

  
  
  
  
  
  
  
  function adopt(from) {
    if (!from) return state;
    for (const k of ['time', 'cycles', 'phase', 'speed', 'move', 'run', 'carry', 'carryTime']) {
      if (Number.isFinite(from[k])) state[k] = from[k];
    }
    state.oneShot = from.oneShot ? { name: from.oneShot.name, time: from.oneShot.time } : null;
    state.use = from.use ? { ...from.use } : null;
    return state;
  }

  
  
  
  function use(name) {
    if (name == null) { if (state.use) state.use.on = false; return; }
    const clip = clips[name];
    if (!clip || !clip.loop) throw new Error(`locomotion: '${name}' is not a looping use clip`);
    if (state.use && state.use.name === name) { state.use.on = true; return; }
    state.use = { name, time: 0, w: state.use ? state.use.w : 0, on: true };
  }

  return {
    state,
    pose,
    speeds,
    
    
    hop,
    update,
    act,
    adopt,
    use,
    
    get using() { return state.use && state.use.on ? state.use.name : null; },
    
    get useWeight() { return state.use ? state.use.w : 0; },
    pickUp() { act('pickUp'); },
    get busy() { return state.oneShot !== null; },
    
    get action() { return state.oneShot ? state.oneShot.name : null; },
  };
}
