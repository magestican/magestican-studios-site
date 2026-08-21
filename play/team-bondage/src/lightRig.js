// Builds the scene's lights from lightRigSpec.js.
//
// This exists so the game and every art/preview page hang the SAME rig from
// the SAME numbers. They used to hold six hand-copied duplicates of it, which
// meant a preview page could silently drift from the game it exists to
// preview — and every "measured through the game's own rig" note in this
// codebase depends on it not drifting.
import * as THREE from 'three';
import { LIGHT_RIG } from './lightRigSpec.js';

// Returns a Group so a caller adds one thing and can remove one thing. The
// DirectionalLight's target stays at the world origin, which is where the
// untouched rig pointed it.
export function buildLightRig(rig = LIGHT_RIG) {
  const g = new THREE.Group();
  g.name = 'lightRig';

  const sun = new THREE.DirectionalLight(rig.sun.color, rig.sun.intensity);
  sun.position.set(rig.sun.dir[0], rig.sun.dir[1], rig.sun.dir[2]);
  g.add(sun);

  // Flat fill, deliberately small: see the note in lightRigSpec.js about why
  // ambient is the light that cannot describe form.
  g.add(new THREE.AmbientLight(rig.ambient.color, rig.ambient.intensity));

  // The one that does the modelling — sky overhead, snow-bounce underneath.
  g.add(new THREE.HemisphereLight(rig.hemi.sky, rig.hemi.ground, rig.hemi.intensity));

  return g;
}
