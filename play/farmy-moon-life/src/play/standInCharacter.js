














import * as THREE from 'three';
import { generate } from 'moon/art/cat.mjs';
import { toObject3D } from '../render/toMesh.js';

export const STAND_IN = Object.freeze({
  strideM: 0.5, 
  hopHeightM: 0.06,
  leanRadPerMps: 0.05,
  maxLeanRad: 0.2,
  landSquash: 0.07, 
  carryLeanRad: -0.07, 
  carryHop: 0.55, 
  breatheHz: 0.5,
  breatheAmp: 0.012,
  pickUpS: 0.45,
  pickUpDipRad: 0.45,
  pickUpSquash: 0.12,
  settlePerS: 12, 
});

export async function createCharacter({ seed = 2, season = 'summer', lod = 0 } = {}) {
  const data = generate({ seed, season, lod });
  const mesh = await toObject3D(data);
  const bounds = data.bounds();
  const object = new THREE.Group();
  object.name = 'player';
  const body = new THREE.Group();
  body.add(mesh);
  object.add(body);

  let phase = 0, lean = 0, clock = 0, pick = -1;

  return {
    object,
    height: bounds.max[1] - bounds.min[1],
    triangles: data.triangleCount,
    update(dt, { speed = 0, carrying = false } = {}) {
      clock += dt;
      phase += ((speed * dt) / STAND_IN.strideM) * Math.PI;
      const moving = Math.min(1, speed / 0.35);
      const bump = Math.abs(Math.sin(phase));
      const hop = bump * STAND_IN.hopHeightM * moving * (carrying ? STAND_IN.carryHop : 1);
      const wantLean = Math.min(STAND_IN.maxLeanRad, speed * STAND_IN.leanRadPerMps) + (carrying ? STAND_IN.carryLeanRad : 0);
      lean += (wantLean - lean) * (1 - Math.exp(-dt * STAND_IN.settlePerS));
      let dip = 0;
      if (pick >= 0) {
        pick += dt;
        const u = pick / STAND_IN.pickUpS;
        if (u >= 1) pick = -1; else dip = Math.sin(Math.PI * u);
      }
      const breathe = Math.sin(clock * Math.PI * 2 * STAND_IN.breatheHz) * STAND_IN.breatheAmp * (1 - moving);
      const squashY = 1 - STAND_IN.landSquash * moving * (1 - bump) - STAND_IN.pickUpSquash * dip + breathe;
      body.position.y = hop;
      body.rotation.x = lean + dip * STAND_IN.pickUpDipRad;
      
      const girth = 1 + (1 - squashY) * 0.5;
      body.scale.set(girth, squashY, girth);
    },
    pickUp() { pick = 0; },
    dispose() {
      mesh.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
      object.removeFromParent();
    },
  };
}
