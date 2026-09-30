


import { DachiActor } from './dachiActor.js';
import { CastActor } from './castActor.js';
import { CHAR_SCALE } from '../features/world/crowd.js'; 

export function kidBillboard(scene, gender = 'boy') { return new CastActor(scene, 'kid', { gender, world: CHAR_SCALE }); }

export function setKidFrame(actor, { gender, moving, walk, shout, dir = null, faceCamera = false }) {
  actor.setLook({ gender });
  if (faceCamera) actor.faceCamera(); else if (dir) actor.faceDir(dir[0], dir[1]);
  actor.pose({ moving, walk, shout });
}

export function elderBillboard(scene) { return new CastActor(scene, 'elder', { world: CHAR_SCALE, see: true }); }



export const dachiSize = stage => 1.25 + stage * 0.22;
export function dachiBillboard(scene, stage = 1) { return new DachiActor(scene, { size: dachiSize(stage), world: CHAR_SCALE, see: true }); }
export function setDachiLook(actor, spId, opts = {}) { actor.setLook(spId, opts); }
