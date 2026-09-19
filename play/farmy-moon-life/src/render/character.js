


























import * as THREE from 'three';
import { generate } from 'moon/art/player.mjs';
import { buildClips, gripBasis } from 'moon/rig/clips.mjs';
import { createLocomotion } from 'moon/rig/locomotion.mjs';
import { toObject3D, applyPose } from './toMesh.js';



export async function createCharacter({ seed = 1, season = 'summer', lod = 0, species = 'pig', build, phase = 0 } = {}) {
  const data = generate({ seed, season, lod, species, ...(species === 'human' && build ? { build } : {}) });
  return bindCharacter(data, await toObject3D(data), { phase });
}



export function placeInGrip(object, { at, axis, face }) {
  const z = new THREE.Vector3(...axis).normalize();
  const y = new THREE.Vector3(...face).negate();
  y.addScaledVector(z, -y.dot(z)).normalize();
  const x = new THREE.Vector3().crossVectors(y, z);
  const m = new THREE.Matrix4().makeBasis(x, y, z).transpose();
  object.quaternion.setFromRotationMatrix(m);
  object.position.set(...at).applyMatrix4(m).negate();
  return object;
}







export function bindCharacter(data, object, { phase = 0 } = {}) {
  const skin = object.userData.rig;
  if (!skin || !data.rig) throw new Error('bindCharacter: the mesh has no rig');
  const clips = buildClips(data.rig);
  const locomotion = createLocomotion(data.rig, clips, { phase });

  const hold = new THREE.Object3D();
  hold.name = 'hold';
  const chest = data.rig.bones.findIndex((b) => b.name === 'chest');
  if (data.rig.hold) {
    const [hx, hy, hz] = data.rig.hold, [cx, cy, cz] = data.rig.bones[chest].head;
    hold.position.set(hx - cx, hy - cy, hz - cz);
  }
  skin.bones[chest].add(hold);

  
  
  const tool = new THREE.Object3D();
  tool.name = 'tool';
  const handR = data.rig.bones.findIndex((b) => b.name === 'handR');
  const grip = data.rig.contacts?.gripR;
  const [hx0, hy0, hz0] = data.rig.bones[handR].head;
  if (grip) tool.position.set(grip.at[0] - hx0, grip.at[1] - hy0, grip.at[2] - hz0);
  const g = gripBasis(grip ? grip.axis : [0, -0.2, 1]);
  tool.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...g.X), new THREE.Vector3(...g.Y), new THREE.Vector3(...g.Z)));
  skin.bones[handR].add(tool);
  applyPose(skin, locomotion.update(0));

  return {
    object,
    height: data.bounds().max[1],
    speeds: locomotion.speeds,
    hold,
    rig: data.rig,
    clips,
    locomotion,
    get busy() { return locomotion.busy; },
    update(dt, { speed = 0, carrying = false } = {}) {
      applyPose(skin, locomotion.update(dt, { speed, carrying }));
    },
    pickUp() { locomotion.pickUp(); },
    tool,
    get action() { return locomotion.action; },
    act(name) { locomotion.act(name); },
    holdTool(object, grip = null) {
      tool.clear();
      if (!object) return null;
      if (grip) placeInGrip(object, grip);
      tool.add(object);
      return object;
    },
    dispose() {
      object.removeFromParent();
      object.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
      skin.skeleton.dispose();
    },
  };
}
