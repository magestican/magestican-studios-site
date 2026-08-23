






import * as THREE from 'three';
import { LIGHT_RIG } from './lightRigSpec.js';




export function buildLightRig(rig = LIGHT_RIG) {
  const g = new THREE.Group();
  g.name = 'lightRig';

  const sun = new THREE.DirectionalLight(rig.sun.color, rig.sun.intensity);
  sun.position.set(rig.sun.dir[0], rig.sun.dir[1], rig.sun.dir[2]);
  g.add(sun);

  
  
  g.add(new THREE.AmbientLight(rig.ambient.color, rig.ambient.intensity));

  
  g.add(new THREE.HemisphereLight(rig.hemi.sky, rig.hemi.ground, rig.hemi.intensity));

  return g;
}
